import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { requireAppInOrg } from "@/lib/apps/builder-access";

type Context = { params: Promise<{ organizationSlug: string; appSlug: string }> };

export const GET = handleRoute(async (request: NextRequest, context: Context) => {
  const { organizationSlug, appSlug } = await context.params;
  const { app } = await requireAppInOrg(request, organizationSlug, appSlug, { edit: true });
  const { AppActivity } = await getDBModels();
  const activities = await AppActivity.findAll({
    where: { appId: app.id },
    include: [{ association: "user", attributes: ["email", "displayName", "profileImageURL"] }],
    order: [["createdAt", "DESC"]],
    limit: 200,
  });
  return NextResponse.json({ activities });
});
