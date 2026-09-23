import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const SIGNIN_ROUTE = "/authentication/signin";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.pathname;
  const token = await getToken({ req: request });

  if (token) {
    if (url.startsWith("/authentication/")) {
      return NextResponse.redirect(new URL(`/`, request.url));
    }
  } else if (url.startsWith("/a/") || url.startsWith("/extension/")) {
    const signInURL = new URL(SIGNIN_ROUTE, request.url);
    signInURL.searchParams.set(
      "callbackUrl",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(signInURL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/authentication/:path*", "/a/:path*", "/extension/:path*"],
};
