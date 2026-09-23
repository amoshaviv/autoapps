import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, requireOrgMember } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { getAccessTokenForUser } from "@/lib/google/oauth";
import { readIntoConnection } from "@/lib/connections/read";
import { generateSpec } from "@/lib/ai/generate";
import { IdeaSchema } from "@/lib/ai/suggest";

type Context = { params: Promise<{ organizationSlug: string }> };

export const GET = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug } = await context.params;
  const { organization } = await requireOrgMember(request, organizationSlug);
  const { App } = await getDBModels();
  const apps = await App.findAll({
    where: { organizationId: organization.id },
    include: [
      { association: "connection", attributes: ["id", "title"] },
      { association: "createdBy", attributes: ["email", "displayName", "profileImageURL"] },
    ],
    order: [["updatedAt", "DESC"]],
  });
  return NextResponse.json({ apps });
});

const CreateBody = z
  .object({
    connectionId: z.uuid(),
    idea: IdeaSchema.optional(),
    prompt: z.string().trim().min(1).max(4000).optional(),
  })
  .refine((b) => b.idea || b.prompt, { message: "Pick an idea or describe the app" });

export const POST = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug } = await context.params;
  const { user, organization } = await requireOrgMember(request, organizationSlug);

  const body = CreateBody.safeParse(await request.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0].message, "invalid_body");
  const { connectionId, idea, prompt } = body.data;

  const { Connection, App, AppMessage } = await getDBModels();
  const connection = await Connection.findOne({ where: { id: connectionId, organizationId: organization.id } });
  if (!connection) throw new HttpError(404, "Connection not found", "connection_not_found");

  // PRD §7: re-read the sheet before generating; keep the cached schema if that fails
  try {
    await readIntoConnection(await getAccessTokenForUser(user), connection);
  } catch (err) {
    console.warn("[apps] schema refresh before generation failed; using cached schema", err);
  }

  const { spec, summary } = await generateSpec({
    connection,
    idea,
    prompt,
    organizationName: organization.name,
  });

  const { app, version } = await App.createDraft({
    organization,
    connection,
    user,
    name: spec.title,
    spec,
    summary,
  });

  const request_ = idea ? `${idea.title}: ${idea.pitch}${prompt ? `\n${prompt}` : ""}` : prompt!;
  await AppMessage.create({ appId: app.id, userId: user.id, role: "user", content: request_ });
  const message = await AppMessage.create({
    appId: app.id,
    userId: user.id,
    role: "assistant",
    content: summary,
    versionId: version.id,
  });

  return NextResponse.json({ app, version, message }, { status: 201 });
});
