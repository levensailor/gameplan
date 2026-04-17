import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { exchangeCodeForToken, fetchWebexProfile } from "@/lib/webex";
import { upsertAppUser } from "@/lib/users";
import { setSessionCookie } from "@/lib/session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("webex_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    logger.warn("OAuth callback rejected due to state/code mismatch");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const profile = await fetchWebexProfile(tokenData.access_token);
    const user = await upsertAppUser({
      webexPersonId: profile.id,
      firstName: profile.firstName ?? profile.displayName.split(" ")[0] ?? "User",
      lastName: profile.lastName ?? profile.displayName.split(" ").slice(1).join(" "),
      email: profile.emails?.[0] ?? `${profile.id}@webex.local`,
      avatarUrl: profile.avatar ?? null
    });

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      webexAccessToken: tokenData.access_token
    });

    cookieStore.delete("webex_oauth_state");
    logger.info("OAuth login success", { userId: user.id });
    return NextResponse.redirect(new URL("/board", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    logger.error("OAuth callback failed", {
      message
    });
    const loginUrl = new URL("/", request.url);
    if (message.includes("Could not find the table 'public.app_users'")) {
      loginUrl.searchParams.set("error", "db_setup_required");
    } else {
      loginUrl.searchParams.set("error", "oauth_failed");
    }
    return NextResponse.redirect(loginUrl);
  }
}
