// Loads an app for the builder-side routes and applies PRD §8's edit rule.
import { NextRequest } from "next/server";
import { HttpError, requireOrgMember } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";

export async function requireAppInOrg(
  request: NextRequest,
  organizationSlug: string,
  appSlug: string,
  { edit = false }: { edit?: boolean } = {}
) {
  const membership = await requireOrgMember(request, organizationSlug);
  const { App } = await getDBModels();
  const app = await App.findBySlugInOrg(organizationSlug, appSlug);
  if (!app) throw new HttpError(404, "App not found", "app_not_found");

  const canEdit = app.canEdit(membership.user, membership.role);
  if (edit && !canEdit) throw new HttpError(403, "Only the app's creator or an admin can do this", "cannot_edit");
  return { ...membership, app, canEdit };
}
