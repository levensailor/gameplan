import { getSessionFromCookies } from "@/lib/session";

export async function requireSession() {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
