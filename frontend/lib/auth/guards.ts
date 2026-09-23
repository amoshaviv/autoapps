import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getDBModels } from "@/lib/sequelize";
import { IUserInstance } from "@/lib/sequelize/models/user";
import { IOrganizationInstance } from "@/lib/sequelize/models/organization";
import { UserRole } from "@/lib/sequelize/models/users-organizations";
import { HttpError } from "@/lib/http-error";

export { HttpError };

type MinRole = "user" | "admin" | "owner";
const ROLE_RANK: Record<string, number> = { user: 0, admin: 1, owner: 2 };

export async function requireUser(request: NextRequest): Promise<IUserInstance> {
  const token = await getToken({ req: request });
  const email = token?.email;
  if (!email) throw new HttpError(401, "Sign in required", "unauthenticated");

  const { User } = await getDBModels();
  const user = await User.findByEmail(email);
  if (!user) throw new HttpError(401, "Sign in required", "unauthenticated");
  return user;
}

export async function requireOrgMember(
  request: NextRequest,
  organizationSlug: string,
  minRole: MinRole = "user"
): Promise<{ user: IUserInstance; organization: IOrganizationInstance; role: UserRole }> {
  const user = await requireUser(request);
  const { Organization } = await getDBModels();

  const exists = await Organization.findOne({ where: { slug: organizationSlug } });
  if (!exists) throw new HttpError(404, "Organization not found", "organization_not_found");

  const membership = await Organization.findBySlugAndUserEmailWithRole(
    organizationSlug,
    user.email
  );
  if (!membership) {
    throw new HttpError(403, "You are not a member of this organization", "not_a_member");
  }

  const role = membership.userRole as UserRole;
  if ((ROLE_RANK[role] ?? -1) < ROLE_RANK[minRole]) {
    throw new HttpError(403, `This requires the ${minRole} role`, "insufficient_role");
  }

  return { user, organization: membership.organization, role };
}

export function handleRoute<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json(
          { error: err.message, ...(err.code ? { code: err.code } : {}) },
          { status: err.status }
        );
      }
      console.error(err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

// Runtime access to an app by its share link (PRD §8, §11). Any member of the
// app's organization may use the published version; draft=true (the builder's
// preview) also requires edit rights.
export async function requireAppAccess(
  request: NextRequest,
  shortId: string,
  { draft = false }: { draft?: boolean } = {}
) {
  const user = await requireUser(request);
  const { App, Organization, AppVersion } = await getDBModels();

  const app = /^[A-Za-z0-9]{10}$/.test(shortId) ? await App.findByShortId(shortId) : null;
  if (!app || !app.organization || !app.connection) throw new HttpError(404, "App not found", "app_not_found");

  const membership = await Organization.findBySlugAndUserEmailWithRole(app.organization.slug, user.email);
  if (!membership) {
    throw new HttpError(
      403,
      `This app belongs to ${app.organization.name}. Ask an admin to invite you.`,
      "not_a_member"
    );
  }

  const canEdit = app.canEdit(user, membership.userRole);
  if (draft && !canEdit) throw new HttpError(403, "Only the app's editors can preview drafts", "cannot_edit");

  const versionId = draft ? app.draftVersionId : app.publishedVersionId;
  const version = versionId ? await AppVersion.findByPk(versionId) : null;
  if (!version) throw new HttpError(404, "This app has not been published yet", "app_not_published");

  return {
    user,
    app,
    connection: app.connection,
    spec: version.spec,
    viewer: { email: user.email, name: user.displayName },
    canEdit,
  };
}
