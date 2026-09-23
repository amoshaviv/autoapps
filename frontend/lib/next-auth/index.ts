import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { type NextAuthOptions, getServerSession } from "next-auth";
import { getDBModels } from "@/lib/sequelize";
import { capitalCase } from "change-case";
import { cookies } from "next/headers";

type OrganizationInfo = { domain: string; name: string; isPersonalEmail: boolean };
function getOrganizationInfoFromEmail(
  email: string,
  fullName: string
): OrganizationInfo {
  const commonProviders = [
    "gmail",
    "yahoo",
    "hotmail",
    "outlook",
    "icloud",
    "aol",
    "protonmail",
    "msn",
    "live",
    "ymail",
    "mail",
    "zoho",
    "gmx",
    "me",
    "comcast",
    "verizon",
    "att",
    "sbcglobal",
    "cox",
    "charter",
    "rocketmail",
    "mail",
    "yandex",
    "qq",
    "naver",
    "163",
    "126",
    "yeah",
    "googlemail",
  ];
  const domainPart = email.split("@")[1];
  const nakedDomain = domainPart.split(".")[0];
  if (commonProviders.includes(nakedDomain)) {
    return {
      name: fullName,
      domain: email.replace("@", "."),
      isPersonalEmail: true,
    };
  } else {
    return {
      name: capitalCase(nakedDomain),
      domain: domainPart,
      isPersonalEmail: false,
    };
  }
}

async function handleInviteSignup(credentials: any, dbModels: any) {
  const { User, Organization, Invite } = dbModels;
  const cookieStore = await cookies();

  // Find and validate the invite
  const invite = await Invite.findByToken(credentials.inviteToken);

  if (!invite) {
    throw new Error("Invalid or expired invitation");
  }

  if (invite.isExpired()) {
    throw new Error("This invitation has expired");
  }

  // Verify email matches invite
  if (invite.email !== credentials.email) {
    throw new Error("Email doesn't match invitation");
  }

  // Check if user already exists
  const existingUser = await User.findByEmail(invite.email);
  if (existingUser) {
    throw new Error("A user with this email address already exists");
  }

  // Create the user (password will be hashed in the model)
  const newUser = await User.create({
    email: invite.email,
    displayName: credentials.displayName,
    password: credentials.password,
    provider: "credentials",
  });

  // Get the organization from the invite
  const organization = await invite.getOrganization();

  // Add user to organization with the invited role
  await Organization.addUserToOrganization(organization, newUser, invite.role);

  // Mark invite as used
  await invite.markAsUsed();

  // Set cookies for redirect
  cookieStore.set("lastOrganization", organization.slug);

  return {
    id: newUser.id.toString(),
    email: newUser.email,
    displayName: newUser.displayName,
    profileImageURL: newUser.profileImageURL,
  };
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        displayName: { label: "Name", type: "displayName" },
        password: { label: "Password", type: "password" },
        inviteToken: { label: "Invite Token", type: "text", optional: true },
      },
      async authorize(credentials, req) {
        const dbModels = await getDBModels();
        const { User, Organization } = dbModels;
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Handle invite signup flow
        if (credentials.inviteToken && credentials.displayName) {
          return await handleInviteSignup(credentials, dbModels);
        }

        const user = await User.findByEmail(credentials.email);
        const cookieStore = await cookies();

        if (!user) {
          if (!credentials?.displayName) throw new Error("Invalid credentials");
          const newUser = await User.create({
            email: credentials.email,
            password: credentials.password,
            displayName: credentials.displayName,
            provider: "credentials",
          });

          try {
            const organizationInformation = getOrganizationInfoFromEmail(
              credentials.email,
              credentials.displayName
            );

            const defaultOrganization = await Organization.createWithUser(
              organizationInformation.name,
              organizationInformation.domain,
              newUser
            );

            // Save redirect URL as a cookie
            cookieStore.set("lastOrganization", defaultOrganization.slug);

            return {
              id: newUser.id.toString(),
              email: newUser.email,
              displayName: newUser.displayName,
              profileImageURL: newUser.profileImageURL,
            };
          } catch (err) {
            throw new Error("Invalid credentials");
          }
        }

        if (!user.authenticate(credentials.password)) {
          throw new Error("Invalid credentials");
        }

        const organizations = await user.getOrganizations();
        if (organizations.length > 0) {
          cookieStore.set("lastOrganization", organizations[0].slug);
        }

        return {
          id: user.id.toString(),
          email: user.email,
          displayName: user.displayName,
          profileImageURL: user.profileImageURL,
        };
      },
    }),
  ],
  pages: {
    signIn: "/authentication/signin",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const dbModels = await getDBModels();
        const { User, Organization, Invite } = dbModels;
        const cookieStore = await cookies();

        // Check for invite token in cookies
        const inviteToken = cookieStore.get("inviteToken")?.value;

        // Check if user already exists
        const existingUser = await User.findByEmail(user.email!);

        if (!existingUser) {
          // Create new user from OAuth profile
          const newUser = await User.create({
            email: user.email!,
            displayName: user.name || user.email!,
            profileImageURL: user.image,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            providerAccessToken: account.access_token,
            providerAccessTokenPermissions: account.scope,
            providerRefreshToken: account.refresh_token,
            providerAccessTokenExpiredAt: (account.expires_at || 0) * 1000,
          });

          // Handle invite flow if invite token exists
          if (inviteToken) {
            try {
              const invite = await Invite.findByToken(inviteToken);

              if (!invite) {
                throw new Error("Invalid or expired invitation");
              }

              if (invite.isExpired()) {
                throw new Error("This invitation has expired");
              }

              // Verify email matches invite
              if (invite.email !== user.email) {
                throw new Error("Email doesn't match invitation");
              }

              // Get the organization from the invite
              const organization = await invite.getOrganization();

              // Add user to organization with the invited role
              await Organization.addUserToOrganization(
                organization,
                newUser,
                invite.role
              );

              // Mark invite as used
              await invite.markAsUsed();

              // Clear invite token cookie
              cookieStore.delete("inviteToken");

              // Set cookies for redirect
              cookieStore.set("lastOrganization", organization.slug);

              return true;
            } catch (err) {
              console.log("Invite flow error:", err);
              // Clear the invalid invite token
              cookieStore.delete("inviteToken");
              return false;
            }
          }

          // Regular signup flow (no invite)
          try {
            const organizationInformation = getOrganizationInfoFromEmail(
              user.email!,
              user.name || user.email!
            );

            const defaultOrganization = await Organization.createWithUser(
              organizationInformation.name,
              organizationInformation.domain,
              newUser
            );

            // Save redirect URL as a cookie
            cookieStore.set("lastOrganization", defaultOrganization.slug);
          } catch (err) {
            console.log(err);
            return false;
          }
        } else {
          // User already exists
          // Handle invite flow if invite token exists
          if (inviteToken) {
            try {
              const invite = await Invite.findByToken(inviteToken);

              if (!invite) {
                throw new Error("Invalid or expired invitation");
              }

              if (invite.isExpired()) {
                throw new Error("This invitation has expired");
              }

              // Verify email matches invite
              if (invite.email !== user.email) {
                throw new Error("Email doesn't match invitation");
              }

              // Get the organization from the invite
              const organization = await invite.getOrganization();

              // Check if user is already in the organization
              const userOrganizations = await existingUser.getOrganizations({
                where: { id: organization.id },
              });

              if (userOrganizations.length === 0) {
                // Add user to organization with the invited role
                await Organization.addUserToOrganization(
                  organization,
                  existingUser,
                  invite.role
                );
              }

              // Mark invite as used
              await invite.markAsUsed();

              // Clear invite token cookie
              cookieStore.delete("inviteToken");

              // Set cookies for redirect
              cookieStore.set("lastOrganization", organization.slug);

              return true;
            } catch (err) {
              console.log("Invite flow error for existing user:", err);
              // Clear the invalid invite token
              cookieStore.delete("inviteToken");
              return false;
            }
          }

          // Regular login flow (no invite)
          // Update existing user with OAuth profile info if missing
          if (!existingUser.profileImageURL && user.image) {
            await existingUser.update({ profileImageURL: user.image });
          }

          // Update OAuth tokens if this is a different provider or newer tokens
          if (
            existingUser.provider !== account.provider ||
            !existingUser.providerAccessToken ||
            existingUser.providerAccountId !== account.providerAccountId
          ) {
            await existingUser.update({
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              providerAccessToken: account.access_token,
              providerAccessTokenPermissions: account.scope,
              providerRefreshToken: account.refresh_token,
              providerAccessTokenExpiredAt: (account.expires_at || 0) * 1000,
            });
          }

          const organizations = await existingUser.getOrganizations();
          if (organizations.length > 0) {
            cookieStore.set("lastOrganization", organizations[0].slug);
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session, account }) {
      console.log("JWT callback triggered with:", {
        trigger,
        user,
        provider: account?.provider,
        hasUser: !!user,
        hasSession: !!session,
      });

      if (user) {
        if (account?.provider === "google") {
          token.email = user.email;
          token.displayName = user.name;
          token.profileImageURL = user.image;
        } else {
          token.email = user.email;
          token.displayName = user.displayName;
          token.profileImageURL = user.profileImageURL;
        }
      }

      // Handle session update triggers
      if (trigger === "update" && session) {
        console.log("Updating JWT token with session data:", session);
        token.email = session.email || token.email;
        token.displayName = session.displayName || token.displayName;
        token.profileImageURL =
          session.profileImageURL || token.profileImageURL;
      }

      return token;
    },
    async session({ session, token, trigger, newSession }) {
      console.log("Session callback triggered with:", {
        trigger,
        hasNewSession: !!newSession,
      });

      // Handle session update triggers (like profile updates)
      if (trigger === "update" && newSession) {
        console.log("Updating session with new data:", newSession);
        // Update token with new session data
        token.email = newSession.email || token.email;
        token.displayName = newSession.displayName || token.displayName;
        token.profileImageURL =
          newSession.profileImageURL || token.profileImageURL;
      }

      return {
        ...session,
        user: {
          email: token.email,
          displayName: token.displayName,
          profileImageURL: token.profileImageURL,
        },
      };
    },
  },
} satisfies NextAuthOptions;

export const getSession = () => getServerSession(authOptions);
