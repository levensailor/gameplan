import { getSupabaseServerClient } from "@/lib/supabase";
import type { BoardSnapshot } from "@/lib/types";

export async function getBoardSnapshot(): Promise<BoardSnapshot> {
  const supabase = getSupabaseServerClient();

  const [columnsRes, cardsRes, engineersRes, labelsRes, assignmentsRes] =
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
        .select("id,first_name,last_name,email,avatar_url")
        .order("first_name", { ascending: true }),
      supabase.from("labels").select("id,slug,name,color_hex").order("name", {
        ascending: true
      }),
      supabase.from("card_engineers").select("card_id,engineer_id")
    ]);

  if (
    columnsRes.error ||
    cardsRes.error ||
    engineersRes.error ||
    labelsRes.error ||
    assignmentsRes.error
  ) {
    throw new Error(
      [
        columnsRes.error?.message,
        cardsRes.error?.message,
        engineersRes.error?.message,
        labelsRes.error?.message,
        assignmentsRes.error?.message
      ]
        .filter(Boolean)
        .join("; ")
    );
  }

  return {
    columns: columnsRes.data ?? [],
    cards: cardsRes.data ?? [],
    engineers: engineersRes.data ?? [],
    labels: labelsRes.data ?? [],
    assignments: assignmentsRes.data ?? []
  };
}
