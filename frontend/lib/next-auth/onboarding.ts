import type { Account } from "next-auth";
import { capitalCase } from "change-case";
import { getDBModels } from "@/lib/sequelize";
import { IUserInstance } from "@/lib/sequelize/models/user";
import { IOrganizationInstance } from "@/lib/sequelize/models/organization";
import { UserRole } from "@/lib/sequelize/models/users-organizations";

type OrganizationInfo = { domain: string; name: string; isPersonalEmail: boolean };
export function getOrganizationInfoFromEmail(
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
  const domainPart = email.split("@")[1].toLowerCase();
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

// Finds or creates the user, then makes sure they belong to an organization:
// a company email joins the organization that owns its domain as "user" (or
// creates it, as "owner"); a personal email gets a personal organization.
// Returns the organization to land on. The caller sets the lastOrganization cookie.
export async function ensureUserAndOrganization({
  email,
  displayName,
  image,
  account,
  password,
}: {
  email: string;
  displayName: string;
  image?: string | null;
  account?: Account | null;
  password?: string;
}): Promise<{ user: IUserInstance; organization: IOrganizationInstance }> {
  const { User, Organization } = await getDBModels();

  let user = await User.findByEmail(email);
  if (!user) {
    user = await User.create({
      email,
      displayName,
      profileImageURL: image,
      ...(account
        ? {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            providerAccessToken: account.access_token,
            providerAccessTokenPermissions: account.scope,
            providerRefreshToken: account.refresh_token,
            providerAccessTokenExpiredAt: (account.expires_at || 0) * 1000,
          }
        : { provider: "credentials", password }),
    });
  } else if (account) {
    if (!user.profileImageURL && image) {
      await user.update({ profileImageURL: image });
    }
    if (
      user.provider !== account.provider ||
      !user.providerAccessToken ||
      user.providerAccountId !== account.providerAccountId
    ) {
      await user.update({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        providerAccessToken: account.access_token,
        providerAccessTokenPermissions: account.scope,
        providerRefreshToken: account.refresh_token,
        providerAccessTokenExpiredAt: (account.expires_at || 0) * 1000,
      });
    }
  }

  const info = getOrganizationInfoFromEmail(email, displayName);
  const organizations = await user.getOrganizations();

  if (!info.isPersonalEmail) {
    const domainOrganization = await Organization.findByDomain(info.domain);
    if (domainOrganization) {
      if (!organizations.some((o) => o.id === domainOrganization.id)) {
        await Organization.addUserToOrganization(domainOrganization, user, UserRole.User);
      }
      return { user, organization: domainOrganization };
    }
  }

  if (organizations.length > 0) return { user, organization: organizations[0] };

  const organization = await Organization.createWithUser(info.name, info.domain, user);
  return { user, organization };
}
