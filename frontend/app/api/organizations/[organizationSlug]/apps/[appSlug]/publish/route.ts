import { NextRequest, NextResponse } from "next/server";
import { handleRoute, HttpError } from "@/lib/auth/guards";
import { requireAppInOrg } from "@/lib/apps/builder-access";

type Context = { params: Promise<{ organizationSlug: string; appSlug: string }> };

export const POST = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug, appSlug } = await context.params;
  const { app } = await requireAppInOrg(request, organizationSlug, appSlug, { edit: true });
  if (!app.draftVersionId) throw new HttpError(409, "This app has no draft to publish", "no_draft");
  await app.publish();
  return NextResponse.json({ app });
});
