import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { type NextAuthOptions, getServerSession } from "next-auth";
import { getDBModels } from "@/lib/sequelize";
import { cookies } from "next/headers";
import { ensureUserAndOrganization } from "./onboarding";

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

// The extension side panel embeds the app in an iframe, where only
// SameSite=None cookies are sent. Chrome accepts Secure cookies from
// http://localhost, so these options also work in local development.
// Names match NextAuth's defaults so getToken() finds them.
const useSecureCookies = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const crossSiteCookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
};

export const authOptions = {
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: crossSiteCookieOptions,
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: crossSiteCookieOptions,
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
      options: crossSiteCookieOptions,
    },
  },
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
        const { User } = dbModels;
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Handle invite signup flow
        if (credentials.inviteToken && credentials.displayName) {
          return await handleInviteSignup(credentials, dbModels);
        }

        const existingUser = await User.findByEmail(credentials.email);
        if (!existingUser && !credentials.displayName) {
          throw new Error("Invalid credentials");
        }
        if (existingUser && !existingUser.authenticate(credentials.password)) {
          throw new Error("Invalid credentials");
        }

        let user;
        try {
          const result = await ensureUserAndOrganization({
            email: credentials.email,
            displayName: existingUser?.displayName ?? credentials.displayName,
            password: existingUser ? undefined : credentials.password,
          });
          user = result.user;
          (await cookies()).set("lastOrganization", result.organization.slug);
        } catch (err) {
          console.error(err);
          throw new Error("Invalid credentials");
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
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const { User, Organization, Invite } = await getDBModels();
      const cookieStore = await cookies();
      const email = user.email!;
      const inviteToken = cookieStore.get("inviteToken")?.value;

      // Invite flow takes precedence over domain auto-join
      if (inviteToken) {
        try {
          const invite = await Invite.findByToken(inviteToken);
          if (!invite) throw new Error("Invalid or expired invitation");
          if (invite.isExpired()) throw new Error("This invitation has expired");
          if (invite.email !== email) throw new Error("Email doesn't match invitation");

          let invitedUser = await User.findByEmail(email);
          if (!invitedUser) {
            invitedUser = await User.create({
              email,
              displayName: user.name || email,
              profileImageURL: user.image,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              providerAccessToken: account.access_token,
              providerAccessTokenPermissions: account.scope,
              providerRefreshToken: account.refresh_token,
              providerAccessTokenExpiredAt: (account.expires_at || 0) * 1000,
            });
          }

          const organization = await invite.getOrganization();
          const memberships = await invitedUser.getOrganizations({
            where: { id: organization.id },
          });
          if (memberships.length === 0) {
            await Organization.addUserToOrganization(organization, invitedUser, invite.role);
          }

          await invite.markAsUsed();
          cookieStore.delete("inviteToken");
          cookieStore.set("lastOrganization", organization.slug);
          return true;
        } catch (err) {
          console.log("Invite flow error:", err);
          cookieStore.delete("inviteToken");
          return false;
        }
      }

      try {
        const { organization } = await ensureUserAndOrganization({
          email,
          displayName: user.name || email,
          image: user.image,
          account,
        });
        cookieStore.set("lastOrganization", organization.slug);
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
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
