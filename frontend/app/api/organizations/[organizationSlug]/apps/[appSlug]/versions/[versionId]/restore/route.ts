import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { requireAppInOrg } from "@/lib/apps/builder-access";

type Context = { params: Promise<{ organizationSlug: string; appSlug: string; versionId: string }> };

export const POST = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug, appSlug, versionId } = await context.params;
  const { user, app } = await requireAppInOrg(request, organizationSlug, appSlug, { edit: true });

  const { AppVersion } = await getDBModels();
  const source = z.uuid().safeParse(versionId).success
    ? await AppVersion.findOne({ where: { id: versionId, appId: app.id } })
    : null;
  if (!source) throw new HttpError(404, "Version not found", "version_not_found");

  // Restoring copies the old spec into a new draft version; history is never rewritten
  const version = await app.addVersion(source.spec, `Restored version ${source.number}`, user);
  return NextResponse.json({ version });
});
