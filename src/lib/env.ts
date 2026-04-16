import { z } from "zod";

function requireString(name: string, minLength = 1): string {
  const value = process.env[name];
  const parsed = z.string().min(minLength).safeParse(value);
  if (!parsed.success) {
    throw new Error(`Missing or invalid environment variable: ${name}`);
  }
  return parsed.data;
}

function requireUrl(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  const parsed = z.url().safeParse(value);
  if (!parsed.success) {
    throw new Error(`Missing or invalid URL environment variable: ${name}`);
  }
  return parsed.data;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return requireUrl("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return requireString("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return requireString("SUPABASE_SERVICE_ROLE_KEY");
  },
  get WEBEX_CLIENT_ID() {
    return requireString("WEBEX_CLIENT_ID");
  },
  get WEBEX_CLIENT_SECRET() {
    return requireString("WEBEX_CLIENT_SECRET");
  },
  get WEBEX_REDIRECT_URI() {
    return requireUrl("WEBEX_REDIRECT_URI");
  },
  get WEBEX_OAUTH_AUTHORIZE_URL() {
    return requireUrl(
      "WEBEX_OAUTH_AUTHORIZE_URL",
      "https://webexapis.com/v1/authorize"
    );
  },
  get WEBEX_OAUTH_TOKEN_URL() {
    return requireUrl(
      "WEBEX_OAUTH_TOKEN_URL",
      "https://webexapis.com/v1/access_token"
    );
  },
  get APP_BASE_URL() {
    return requireUrl("APP_BASE_URL");
  },
  get SESSION_SECRET() {
    return requireString("SESSION_SECRET", 32);
  }
};
