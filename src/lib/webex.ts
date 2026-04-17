import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";

type WebexTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
};

type WebexPerson = {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emails?: string[];
  title?: string;
};

export function getWebexAuthorizeUrl(state: string): string {
  const url = new URL(env.WEBEX_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", env.WEBEX_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", env.WEBEX_REDIRECT_URI);
  url.searchParams.set("scope", "spark:people_read");
  url.searchParams.set("state", state);
  return url.toString();
}

export function createOAuthState(): string {
  return randomUUID();
}

export async function exchangeCodeForToken(code: string): Promise<WebexTokenResponse> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", env.WEBEX_CLIENT_ID);
  body.set("client_secret", env.WEBEX_CLIENT_SECRET);
  body.set("code", code);
  body.set("redirect_uri", env.WEBEX_REDIRECT_URI);

  const response = await fetch(env.WEBEX_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error(`Webex token exchange failed with status ${response.status}`);
  }

  return (await response.json()) as WebexTokenResponse;
}

export async function fetchWebexProfile(accessToken: string): Promise<WebexPerson> {
  const response = await fetch("https://webexapis.com/v1/people/me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Webex profile fetch failed with status ${response.status}`);
  }
  return (await response.json()) as WebexPerson;
}

export async function fetchWebexDirectory(accessToken: string): Promise<WebexPerson[]> {
  const response = await fetch("https://webexapis.com/v1/people?max=1000", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Webex directory fetch failed with status ${response.status}`);
  }

  const data = (await response.json()) as { items?: WebexPerson[] };
  return data.items ?? [];
}

export async function fetchWebexPersonByEmail(
  accessToken: string,
  email: string
): Promise<WebexPerson> {
  const query = new URL("https://webexapis.com/v1/people");
  query.searchParams.set("email", email);
  query.searchParams.set("max", "1");

  const response = await fetch(query.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Webex person lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as { items?: WebexPerson[] };
  const person = data.items?.[0];
  if (!person) {
    throw new Error("No Webex user found for the provided email");
  }
  return person;
}
