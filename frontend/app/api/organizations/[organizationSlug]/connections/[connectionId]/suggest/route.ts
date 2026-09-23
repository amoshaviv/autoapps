import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, requireOrgMember } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { suggestApps } from "@/lib/ai/suggest";

export const POST = handleRoute(
  async (
    request: NextRequest,
    context: { params: Promise<{ organizationSlug: string; connectionId: string }> }
  ) => {
    const { organizationSlug, connectionId } = await context.params;
    const { organization } = await requireOrgMember(request, organizationSlug);

    const { Connection } = await getDBModels();
    const connection = z.uuid().safeParse(connectionId).success
      ? await Connection.findOne({ where: { id: connectionId, organizationId: organization.id } })
      : null;
    if (!connection) throw new HttpError(404, "Connection not found", "connection_not_found");

    const ideas = await suggestApps({ connection, organizationName: organization.name });
    return NextResponse.json({ ideas });
  }
);
