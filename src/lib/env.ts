import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WEBEX_CLIENT_ID: z.string().min(1),
  WEBEX_CLIENT_SECRET: z.string().min(1),
  WEBEX_REDIRECT_URI: z.url(),
  WEBEX_OAUTH_AUTHORIZE_URL: z.url().default("https://webexapis.com/v1/authorize"),
  WEBEX_OAUTH_TOKEN_URL: z
    .url()
    .default("https://webexapis.com/v1/access_token"),
  APP_BASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32)
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  WEBEX_CLIENT_ID: process.env.WEBEX_CLIENT_ID,
  WEBEX_CLIENT_SECRET: process.env.WEBEX_CLIENT_SECRET,
  WEBEX_REDIRECT_URI: process.env.WEBEX_REDIRECT_URI,
  WEBEX_OAUTH_AUTHORIZE_URL: process.env.WEBEX_OAUTH_AUTHORIZE_URL,
  WEBEX_OAUTH_TOKEN_URL: process.env.WEBEX_OAUTH_TOKEN_URL,
  APP_BASE_URL: process.env.APP_BASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
