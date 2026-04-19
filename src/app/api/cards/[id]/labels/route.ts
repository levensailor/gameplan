import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/route-auth";
import { getSupabaseServerClient } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

const labelAssignmentSchema = z.object({
  labelId: z.string().uuid(),
  action: z.enum(["add", "remove"]).default("add")
});

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireSession();
    const { id: cardId } = await context.params;
    const payload = labelAssignmentSchema.parse(await request.json());
    const supabase = getSupabaseServerClient();

    if (payload.action === "add") {
      const { error } = await supabase.from("card_labels").upsert(
        {
          card_id: cardId,
          label_id: payload.labelId
        },
        { onConflict: "card_id,label_id" }
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      const { error } = await supabase
        .from("card_labels")
        .delete()
        .eq("card_id", cardId)
        .eq("label_id", payload.labelId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
