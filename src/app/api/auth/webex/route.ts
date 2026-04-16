import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createOAuthState, getWebexAuthorizeUrl } from "@/lib/webex";

export async function GET() {
  const state = createOAuthState();
  const cookieStore = await cookies();
  cookieStore.set("webex_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });
  return NextResponse.redirect(getWebexAuthorizeUrl(state));
}
