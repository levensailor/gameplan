import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { updateCardSchema } from "@/lib/validation";
import { requireSession } from "@/lib/route-auth";
import { insertHistoryEvent } from "@/lib/history";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const payload = updateCardSchema.parse(await request.json());
    const supabase = getSupabaseServerClient();

    const updateData = {
      name: payload.name,
      description: payload.description,
      customer_name: payload.customerName,
      project_manager_name: payload.projectManagerName,
      project_manager_email: payload.projectManagerEmail,
      project_code: payload.projectCode,
      engineering_hours: payload.engineeringHours,
      notes: payload.notes,
      due_date: payload.dueDate,
      updated_at: new Date().toISOString()
    };

    const { data: card, error } = await supabase
      .from("cards")
      .update(updateData)
      .eq("id", id)
      .select(
        "id,column_id,name,description,customer_name,project_manager_name,project_manager_email,project_code,engineering_hours,notes,due_date,position,created_at"
      )
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update card" },
        { status: 400 }
      );
    }

    await insertHistoryEvent({
      cardId: card.id,
      actorUserId: session.userId,
      eventType: "card_updated",
      noteText: payload.notes ?? null
    });

    return NextResponse.json({ card });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { data: existing } = await supabase
      .from("cards")
      .select("id,column_id")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (existing) {
      await insertHistoryEvent({
        cardId: existing.id,
        actorUserId: session.userId,
        eventType: "card_deleted",
        previousColumnId: existing.column_id
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
