import { getSupabaseServerClient } from "@/lib/supabase";

type HistoryEvent = {
  cardId: string;
  actorUserId: string;
  eventType: string;
  previousColumnId?: string | null;
  newColumnId?: string | null;
  previousEngineerId?: string | null;
  newEngineerId?: string | null;
  noteText?: string | null;
  metadata?: Record<string, unknown>;
};

export async function insertHistoryEvent(event: HistoryEvent): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("history_log").insert({
    card_id: event.cardId,
    actor_user_id: event.actorUserId,
    event_type: event.eventType,
    previous_column_id: event.previousColumnId ?? null,
    new_column_id: event.newColumnId ?? null,
    previous_engineer_id: event.previousEngineerId ?? null,
    new_engineer_id: event.newEngineerId ?? null,
    note_text: event.noteText ?? null,
    metadata: event.metadata ?? {}
  });

  if (error) {
    throw new Error(`History insert failed: ${error.message}`);
  }
}
