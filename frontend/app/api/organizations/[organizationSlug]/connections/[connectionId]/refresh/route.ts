import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, requireOrgMember } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { getAccessTokenForUser } from "@/lib/google/oauth";
import { readIntoConnection } from "@/lib/connections/read";

const Body = z.object({
  sheetTitle: z.string().min(1).optional(),
  headerRow: z.coerce.number().int().min(1).optional(),
});

export const POST = handleRoute(
  async (
    request: NextRequest,
    context: { params: Promise<{ organizationSlug: string; connectionId: string }> }
  ) => {
    const { organizationSlug, connectionId } = await context.params;
    const { user, organization } = await requireOrgMember(request, organizationSlug);

    const body = Body.safeParse(await request.json().catch(() => ({})));
    if (!body.success) throw new HttpError(400, "Invalid request body", "invalid_body");

    const { Connection } = await getDBModels();
    const connection = z.uuid().safeParse(connectionId).success
      ? await Connection.findOne({ where: { id: connectionId, organizationId: organization.id } })
      : null;
    if (!connection) throw new HttpError(404, "Connection not found", "connection_not_found");

    const token = await getAccessTokenForUser(user);
    await readIntoConnection(token, connection, body.data);
    return NextResponse.json({ connection });
  }
);
