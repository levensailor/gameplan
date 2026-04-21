import { getSupabaseServerClient } from "@/lib/supabase";
import { createFallbackAvatarDataUrl } from "@/lib/avatar";
import { DEFAULT_THEME, type ThemeName } from "@/lib/themes";

type UpsertUserArgs = {
  webexPersonId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  title?: string | null;
};

export async function upsertAppUser(args: UpsertUserArgs) {
  const supabase = getSupabaseServerClient();
  const payload = {
    webex_person_id: args.webexPersonId,
    first_name: args.firstName,
    last_name: args.lastName,
    email: args.email,
    avatar_url:
      args.avatarUrl ??
      createFallbackAvatarDataUrl(args.firstName, args.lastName, args.email),
    title: args.title ?? null,
    last_login_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("app_users")
    .upsert(payload, { onConflict: "webex_person_id" })
    .select("id,first_name,last_name,email,avatar_url,title,skills")
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
    .select("id,first_name,last_name,email,avatar_url,title,skills")
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(`Engineer query failed: ${error.message}`);
  }
  return data ?? [];
}

export async function getUserTheme(userId: string): Promise<ThemeName> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("theme_name")
    .eq("id", userId)
    .single();

  if (error || !data?.theme_name) {
    return DEFAULT_THEME;
  }

  return data.theme_name as ThemeName;
}

export async function updateUserTheme(
  userId: string,
  themeName: ThemeName
): Promise<ThemeName> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_users")
    .update({
      theme_name: themeName,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)
    .select("theme_name")
    .single();

  if (error || !data?.theme_name) {
    throw new Error(error?.message ?? "Failed to update theme");
  }

  return data.theme_name as ThemeName;
}
