import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, HttpError, requireOrgMember } from "@/lib/auth/guards";
import { getDBModels } from "@/lib/sequelize";
import { getAccessTokenForUser } from "@/lib/google/oauth";
import { parseSpreadsheetUrl } from "@/lib/google/sheets";
import { readIntoConnection } from "@/lib/connections/read";

const Body = z.object({
  spreadsheetUrl: z.string().optional(),
  spreadsheetId: z.string().regex(/^[a-zA-Z0-9-_]+$/).optional(),
  gid: z.coerce.number().int().optional(),
});

export const POST = handleRoute(
  async (request: NextRequest, context: { params: Promise<{ organizationSlug: string }> }) => {
    const { organizationSlug } = await context.params;
    const { user, organization } = await requireOrgMember(request, organizationSlug);

    const body = Body.safeParse(await request.json().catch(() => ({})));
    if (!body.success) throw new HttpError(400, "Invalid request body", "invalid_body");

    const fromUrl = body.data.spreadsheetUrl ? parseSpreadsheetUrl(body.data.spreadsheetUrl) : null;
    if (body.data.spreadsheetUrl && !fromUrl) {
      throw new HttpError(400, "That is not a Google Sheets link", "invalid_sheet_url");
    }
    const spreadsheetId = body.data.spreadsheetId ?? fromUrl?.spreadsheetId;
    if (!spreadsheetId) throw new HttpError(400, "Send spreadsheetUrl or spreadsheetId", "missing_sheet");
    const gid = body.data.gid ?? fromUrl?.gid;

    const token = await getAccessTokenForUser(user);
    const { Connection, App } = await getDBModels();
    const connection = await Connection.findOrCreateForSheet(organization, user, spreadsheetId);
    await readIntoConnection(token, connection, { gid });

    const apps = await App.findAll({
      where: { organizationId: organization.id, connectionId: connection.id },
      order: [["updatedAt", "DESC"]],
    });

    return NextResponse.json({ connection, apps });
  }
);
