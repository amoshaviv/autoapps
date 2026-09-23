import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireUser } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";

export const GET = handleRoute(async (request: NextRequest) => {
  const user = await requireUser(request);
  const { UsersOrganizations } = await getDBModels();

  const memberships = await UsersOrganizations.findAll({
    where: { user_id: user.id },
    include: { association: "organization", attributes: ["slug", "name"] },
  });

  return NextResponse.json({
    user: {
      email: user.email,
      displayName: user.displayName,
      profileImageURL: user.profileImageURL,
    },
    organizations: memberships.map((m: any) => ({
      slug: m.organization.slug,
      name: m.organization.name,
      role: m.role,
    })),
    sheetsConnected: user.hasSheetsScope(),
  });
});
