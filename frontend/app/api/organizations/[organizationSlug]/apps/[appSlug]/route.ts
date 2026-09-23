import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { requireAppInOrg } from "@/lib/apps/builder-access";

type Context = { params: Promise<{ organizationSlug: string; appSlug: string }> };

export const GET = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug, appSlug } = await context.params;
  const { app, canEdit } = await requireAppInOrg(request, organizationSlug, appSlug);
  const { AppVersion, AppMessage, Connection } = await getDBModels();

  const [draft, published] = await Promise.all([
    app.draftVersionId && canEdit ? AppVersion.findByPk(app.draftVersionId) : null,
    app.publishedVersionId ? AppVersion.findByPk(app.publishedVersionId) : null,
  ]);

  // Non-editors see the app and its published version only (PRD §8)
  if (!canEdit) {
    return NextResponse.json({ app, draft: null, published, messages: [], versions: [], connection: null, canEdit });
  }

  const [messages, versions, connection] = await Promise.all([
    AppMessage.findAll({ where: { appId: app.id }, order: [["createdAt", "ASC"]] }),
    AppVersion.findAll({
      where: { appId: app.id },
      attributes: ["id", "number", "summary", "createdAt", "createdById"],
      order: [["number", "DESC"]],
    }),
    Connection.findByPk(app.connectionId, {
      attributes: ["id", "title", "spreadsheetId", "sheets", "schema", "schemaFetchedAt"],
    }),
  ]);

  return NextResponse.json({ app, draft, published, messages, versions, connection, canEdit });
});

const PatchBody = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  icon: z.string().trim().max(16).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export const PATCH = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug, appSlug } = await context.params;
  const { app } = await requireAppInOrg(request, organizationSlug, appSlug, { edit: true });

  const body = PatchBody.safeParse(await request.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0].message, "invalid_body");

  await app.update(body.data);
  return NextResponse.json({ app });
});

export const DELETE = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug, appSlug } = await context.params;
  const { app } = await requireAppInOrg(request, organizationSlug, appSlug, { edit: true });
  await app.destroy();
  return new NextResponse(null, { status: 204 });
});
