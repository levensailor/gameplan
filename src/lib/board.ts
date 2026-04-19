import { getSupabaseServerClient } from "@/lib/supabase";
import type { BoardSnapshot } from "@/lib/types";
import { logger } from "@/lib/logger";

function isMissingRelationError(message?: string): boolean {
  if (!message) {
    return false;
  }
  return (
    message.includes("Could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

export async function getBoardSnapshot(): Promise<BoardSnapshot> {
  const supabase = getSupabaseServerClient();

  const [columnsRes, cardsRes, engineersRes, labelsRes, assignmentsRes, cardLabelsRes] =
    await Promise.all([
      supabase
        .from("planner_columns")
        .select("id,slug,name,display_order")
        .order("display_order", { ascending: true }),
      supabase
        .from("cards")
        .select(
          "id,column_id,name,description,customer_name,project_manager_name,project_manager_email,project_code,engineering_hours,notes,due_date,position,created_at"
        )
        .order("position", { ascending: true }),
      supabase
        .from("app_users")
        .select("id,first_name,last_name,email,avatar_url,title,skills")
        .order("first_name", { ascending: true }),
      supabase.from("labels").select("id,slug,name,color_hex").order("name", {
        ascending: true
      }),
      supabase.from("card_engineers").select("card_id,engineer_id"),
      supabase.from("card_labels").select("card_id,label_id")
    ]);

  if (
    columnsRes.error ||
    cardsRes.error ||
    engineersRes.error ||
    labelsRes.error ||
    assignmentsRes.error ||
    cardLabelsRes.error
  ) {
    throw new Error(
      [
        columnsRes.error?.message,
        cardsRes.error?.message,
        engineersRes.error?.message,
        labelsRes.error?.message,
        assignmentsRes.error?.message,
        cardLabelsRes.error?.message
      ]
        .filter(Boolean)
        .join("; ")
    );
  }

  const [cardFilesRes, cardLinksRes] = await Promise.all([
    supabase
      .from("card_files")
      .select("id,card_id,file_name,storage_path,created_at"),
    supabase.from("card_links").select("id,card_id,title,url,created_at")
  ]);

  const cardFilesError = cardFilesRes.error?.message;
  const cardLinksError = cardLinksRes.error?.message;
  if (cardFilesRes.error && !isMissingRelationError(cardFilesError)) {
    throw new Error(cardFilesError);
  }
  if (cardLinksRes.error && !isMissingRelationError(cardLinksError)) {
    throw new Error(cardLinksError);
  }
  if (cardFilesRes.error || cardLinksRes.error) {
    logger.warn("Attachment tables unavailable during board snapshot", {
      cardFilesError,
      cardLinksError
    });
  }

  return {
    columns: columnsRes.data ?? [],
    cards: cardsRes.data ?? [],
    engineers: engineersRes.data ?? [],
    labels: labelsRes.data ?? [],
    assignments: assignmentsRes.data ?? [],
    cardLabels: cardLabelsRes.data ?? [],
    cardFiles: cardFilesRes.error ? [] : cardFilesRes.data ?? [],
    cardLinks: cardLinksRes.error ? [] : cardLinksRes.data ?? []
  };
}
