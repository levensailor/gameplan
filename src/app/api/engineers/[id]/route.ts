import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/route-auth";
import { getSupabaseServerClient } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

const updateEngineerSchema = z.object({
  title: z.string().nullable(),
  skills: z.string().nullable()
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("app_users")
      .select("id,first_name,last_name,email,avatar_url,title,skills")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Engineer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ engineer: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;
    const payload = updateEngineerSchema.parse(await request.json());
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("app_users")
      .update({
        title: payload.title,
        skills: payload.skills,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("id,first_name,last_name,email,avatar_url,title,skills")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update engineer" },
        { status: 400 }
      );
    }
    return NextResponse.json({ engineer: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
