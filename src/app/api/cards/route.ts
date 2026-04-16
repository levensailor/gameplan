import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { createCardSchema } from "@/lib/validation";
import { requireSession } from "@/lib/route-auth";
import { insertHistoryEvent } from "@/lib/history";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const payload = createCardSchema.parse(await request.json());

    const supabase = getSupabaseServerClient();
    const { data: latestCard } = await supabase
      .from("cards")
      .select("position")
      .eq("column_id", payload.columnId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (latestCard?.position ?? 0) + 10;
    const { data: card, error } = await supabase
      .from("cards")
      .insert({
        column_id: payload.columnId,
        name: payload.name,
        position: nextPosition,
        created_by: session.userId
      })
      .select(
        "id,column_id,name,description,customer_name,project_manager_name,project_manager_email,project_code,engineering_hours,notes,due_date,position,created_at"
      )
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create card" },
        { status: 400 }
      );
    }

    await insertHistoryEvent({
      cardId: card.id,
      actorUserId: session.userId,
      eventType: "card_created",
      newColumnId: card.column_id
    });
    logger.info("Card created", { cardId: card.id, userId: session.userId });

    return NextResponse.json({ card });
  } catch (error) {
    logger.error("Create card failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
