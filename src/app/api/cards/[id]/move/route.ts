import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { moveCardSchema } from "@/lib/validation";
import { requireSession } from "@/lib/route-auth";
import { insertHistoryEvent } from "@/lib/history";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const payload = moveCardSchema.parse(await request.json());
    const supabase = getSupabaseServerClient();

    const { data: existingCard, error: existingError } = await supabase
      .from("cards")
      .select("id,column_id")
      .eq("id", id)
      .single();

    if (existingError || !existingCard) {
      return NextResponse.json(
        { error: existingError?.message ?? "Card not found" },
        { status: 404 }
      );
    }

    const { data: updatedCard, error } = await supabase
      .from("cards")
      .update({
        column_id: payload.columnId,
        position: payload.position,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(
        "id,column_id,name,description,customer_name,project_manager_name,project_manager_email,project_code,engineering_hours,notes,due_date,position,created_at"
      )
      .single();

    if (error || !updatedCard) {
      return NextResponse.json(
        { error: error?.message ?? "Move failed" },
        { status: 400 }
      );
    }

    await insertHistoryEvent({
      cardId: updatedCard.id,
      actorUserId: session.userId,
      eventType: "card_moved",
      previousColumnId: existingCard.column_id,
      newColumnId: updatedCard.column_id
    });

    return NextResponse.json({ card: updatedCard });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
