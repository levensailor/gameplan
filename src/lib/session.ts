import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type { UserSession } from "@/lib/types";

const SESSION_AGE_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  webexAccessToken: string;
  exp: number;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
}

export function createSessionToken(session: UserSession): string {
  const payload: SessionPayload = {
    ...session,
    exp: Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS
  };
  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string | undefined): UserSession | null {
  if (!token) {
    return null;
  }

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    return null;
  }

  const expected = signPayload(payloadBase64);
  if (signature.length !== expected.length) {
    return null;
  }
  const signatureMatches = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );

  if (!signatureMatches) {
    return null;
  }

  const payload = JSON.parse(fromBase64Url(payloadBase64)) as SessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    avatarUrl: payload.avatarUrl,
    webexAccessToken: payload.webexAccessToken
  };
}

export async function getSessionFromCookies(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function setSessionCookie(session: UserSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_AGE_SECONDS
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
