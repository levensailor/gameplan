import { getSupabaseServerClient } from "@/lib/supabase";

type UpsertUserArgs = {
  webexPersonId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
};

export async function upsertAppUser(args: UpsertUserArgs) {
  const supabase = getSupabaseServerClient();
  const payload = {
    webex_person_id: args.webexPersonId,
    first_name: args.firstName,
    last_name: args.lastName,
    email: args.email,
    avatar_url: args.avatarUrl ?? null,
    last_login_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("app_users")
    .upsert(payload, { onConflict: "webex_person_id" })
    .select("id,first_name,last_name,email,avatar_url")
    .single();

  if (error || !data) {
    throw new Error(`User upsert failed: ${error?.message ?? "unknown error"}`);
  }

  return data;
}

export async function getEngineers() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id,first_name,last_name,email,avatar_url")
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(`Engineer query failed: ${error.message}`);
  }
  return data ?? [];
}
