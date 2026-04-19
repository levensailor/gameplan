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

    const { data: existingAssignments } = await supabase
      .from("card_engineers")
      .select("engineer_id")
      .eq("card_id", id);

    if (payload.action === "replace") {
      await supabase.from("card_engineers").delete().eq("card_id", id);
    }

    if (payload.action === "remove") {
      const { error } = await supabase
        .from("card_engineers")
        .delete()
        .eq("card_id", id)
        .eq("engineer_id", payload.engineerId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      const { error } = await supabase.from("card_engineers").upsert(
        {
          card_id: id,
          engineer_id: payload.engineerId,
          assigned_by: session.userId
        },
        { onConflict: "card_id,engineer_id" }
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    await insertHistoryEvent({
      cardId: id,
      actorUserId: session.userId,
      eventType: payload.action === "remove" ? "engineer_removed" : "engineer_assigned",
      previousEngineerId:
        existingAssignments?.find((item) => item.engineer_id === payload.engineerId)
          ?.engineer_id ?? null,
      newEngineerId: payload.action === "remove" ? null : payload.engineerId
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
