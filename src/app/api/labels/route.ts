import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/route-auth";
import { getSupabaseServerClient } from "@/lib/supabase";

const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(40)
});

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    await requireSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("labels")
      .select("id,slug,name,color_hex")
      .order("name", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ labels: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const payload = createLabelSchema.parse(await request.json());
    const slug = toSlug(payload.name);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("labels")
      .upsert(
        {
          name: payload.name,
          slug,
          color_hex: "#3b82f6"
        },
        { onConflict: "slug" }
      )
      .select("id,slug,name,color_hex")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create label" },
        { status: 400 }
      );
    }
    return NextResponse.json({ label: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
