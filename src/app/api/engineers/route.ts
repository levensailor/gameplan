import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { requireSession } from "@/lib/route-auth";
import { upsertAppUser } from "@/lib/users";
import { fetchWebexPersonByEmail } from "@/lib/webex";

const addEngineerSchema = z.object({
  email: z.string().trim().email()
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const payload = addEngineerSchema.parse(await request.json());
    const person = await fetchWebexPersonByEmail(
      session.webexAccessToken,
      payload.email
    );

    const engineer = await upsertAppUser({
      webexPersonId: person.id,
      firstName: person.firstName ?? person.displayName.split(" ")[0] ?? "User",
      lastName: person.lastName ?? person.displayName.split(" ").slice(1).join(" "),
      email: person.emails?.[0] ?? payload.email,
      avatarUrl: person.avatar ?? null
    });

    return NextResponse.json({ engineer });
  } catch (error) {
    logger.error("Engineer add failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
