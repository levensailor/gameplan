import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { assignCardSchema } from "@/lib/validation";
import { requireSession } from "@/lib/route-auth";
import { insertHistoryEvent } from "@/lib/history";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const payload = assignCardSchema.parse(await request.json());
    const supabase = getSupabaseServerClient();

    const { data: existingAssignment } = await supabase
      .from("card_engineers")
      .select("engineer_id")
      .eq("card_id", id)
      .maybeSingle();

    if (payload.engineerId) {
      await supabase.from("card_engineers").delete().eq("card_id", id);
      const { error } = await supabase.from("card_engineers").insert({
        card_id: id,
        engineer_id: payload.engineerId,
        assigned_by: session.userId
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      await supabase.from("card_engineers").delete().eq("card_id", id);
    }

    await insertHistoryEvent({
      cardId: id,
      actorUserId: session.userId,
      eventType: payload.engineerId ? "engineer_assigned" : "engineer_removed",
      previousEngineerId: existingAssignment?.engineer_id ?? null,
      newEngineerId: payload.engineerId ?? null
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
