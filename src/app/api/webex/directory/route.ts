import { NextResponse } from "next/server";
import { fetchWebexDirectory } from "@/lib/webex";
import { requireSession } from "@/lib/route-auth";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const requestUrl = new URL(request.url);
    const shouldSync = requestUrl.searchParams.get("sync") === "1";
    const search = requestUrl.searchParams.get("search")?.trim() ?? "";
    const supabase = getSupabaseServerClient();

    if (shouldSync) {
      const people = await fetchWebexDirectory(session.webexAccessToken);
      const rows = people.map((person) => ({
        person_id: person.id,
        display_name: person.displayName,
        first_name: person.firstName ?? null,
        last_name: person.lastName ?? null,
        email: person.emails?.[0] ?? null,
        avatar_url: person.avatar ?? null,
        title: person.title ?? null,
        synced_at: new Date().toISOString()
      }));
      if (rows.length > 0) {
        const { error } = await supabase
          .from("webex_directory_cache")
          .upsert(rows, { onConflict: "person_id" });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
    }

    let query = supabase
      .from("webex_directory_cache")
      .select("person_id,display_name,email,avatar_url,title")
      .order("display_name", { ascending: true })
      .limit(20);

    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
