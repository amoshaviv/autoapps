import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { requireAppInOrg } from "@/lib/apps/builder-access";
import { editSpec } from "@/lib/ai/generate";

type Context = { params: Promise<{ organizationSlug: string; appSlug: string }> };

const Body = z.object({ content: z.string().trim().min(1).max(4000) });

export const POST = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug, appSlug } = await context.params;
  const { user, app } = await requireAppInOrg(request, organizationSlug, appSlug, { edit: true });

  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Write a message", "invalid_body");

  const { AppVersion, AppMessage, Connection } = await getDBModels();
  const [draft, connection, recent] = await Promise.all([
    app.draftVersionId ? AppVersion.findByPk(app.draftVersionId) : null,
    Connection.findByPk(app.connectionId),
    AppMessage.findAll({ where: { appId: app.id }, order: [["createdAt", "DESC"]], limit: 10 }),
  ]);
  if (!draft || !connection) throw new HttpError(409, "This app has no draft to edit", "no_draft");

  const history = recent.reverse().map((m) => ({ role: m.role, content: m.content }));
  await AppMessage.create({ appId: app.id, userId: user.id, role: "user", content: body.data.content });

  try {
    const { spec, summary } = await editSpec({
      connection,
      currentSpec: draft.spec,
      history,
      message: body.data.content,
    });
    const version = await app.addVersion(spec, summary, user);
    if (spec.title !== app.name || (spec.icon ?? null) !== app.icon) {
      await app.update({ name: spec.title, icon: spec.icon ?? null, description: spec.description ?? null });
    }
    const message = await AppMessage.create({
      appId: app.id,
      userId: user.id,
      role: "assistant",
      content: summary,
      versionId: version.id,
    });
    return NextResponse.json({ version, message });
  } catch (err) {
    // PRD §9: after the retry fails, tell the builder and keep the previous version
    if (!(err instanceof HttpError && err.code === "invalid_spec")) throw err;
    const message = await AppMessage.create({
      appId: app.id,
      userId: user.id,
      role: "assistant",
      content: `I couldn't make that change without breaking the app, so I kept the previous version. Problems:\n${err.message}`,
    });
    return NextResponse.json({ version: null, message });
  }
});
