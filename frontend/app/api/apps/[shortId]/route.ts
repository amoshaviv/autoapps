import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAppAccess } from "@/lib/auth/guards";

type Context = { params: Promise<{ shortId: string }> };

// The spec goes to the client for rendering; the spreadsheet id never does (PRD §12)
export const GET = handleRoute(async (request: NextRequest, context: Context) => {
  const { shortId } = await context.params;
  const draft = request.nextUrl.searchParams.get("draft") === "1";
  const { app, spec, viewer, canEdit } = await requireAppAccess(request, shortId, { draft });
  return NextResponse.json({
    app: { name: app.name, icon: app.icon, description: app.description },
    spec,
    viewer: { ...viewer, canEdit },
  });
});
