import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/route-auth";
import { getSupabaseServerClient } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

const addLinkSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  url: z.string().url()
});

const removeAttachmentSchema = z.object({
  type: z.enum(["file", "link"]),
  id: z.string().uuid()
});

const ATTACHMENT_BUCKET = "card-files";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureAttachmentBucket() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.storage.getBucket(ATTACHMENT_BUCKET);
  if (data) {
    return;
  }
  await supabase.storage.createBucket(ATTACHMENT_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024
  });
}

async function listAttachments(cardId: string) {
  const supabase = getSupabaseServerClient();
  const [filesRes, linksRes] = await Promise.all([
    supabase
      .from("card_files")
      .select("id,card_id,file_name,storage_path,created_at")
      .eq("card_id", cardId)
      .order("created_at", { ascending: false }),
    supabase
      .from("card_links")
      .select("id,card_id,title,url,created_at")
      .eq("card_id", cardId)
      .order("created_at", { ascending: false })
  ]);

  if (filesRes.error || linksRes.error) {
    throw new Error(filesRes.error?.message ?? linksRes.error?.message);
  }

  const files = (filesRes.data ?? []).map((file) => {
    const { data } = supabase.storage
      .from(ATTACHMENT_BUCKET)
      .getPublicUrl(file.storage_path);
    return {
      ...file,
      url: data.publicUrl
    };
  });

  return {
    files,
    links: linksRes.data ?? []
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSession();
    const { id: cardId } = await context.params;
    await ensureAttachmentBucket();
    const data = await listAttachments(cardId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id: cardId } = await context.params;
    await ensureAttachmentBucket();
    const supabase = getSupabaseServerClient();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file upload" }, { status: 400 });
      }

      const fileName = sanitizeFileName(file.name || "upload.bin");
      const objectPath = `${cardId}/${crypto.randomUUID()}-${fileName}`;
      const bytes = await file.arrayBuffer();
      const uploadRes = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(objectPath, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false
        });

      if (uploadRes.error) {
        return NextResponse.json({ error: uploadRes.error.message }, { status: 400 });
      }

      const { error: insertError } = await supabase.from("card_files").insert({
        card_id: cardId,
        file_name: fileName,
        storage_path: objectPath,
        uploaded_by: session.userId
      });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    } else {
      const parsed = addLinkSchema.parse(await request.json());
      const title = parsed.title?.trim() || parsed.url;
      const { error: insertError } = await supabase.from("card_links").insert({
        card_id: cardId,
        title,
        url: parsed.url
      });
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    }

    const data = await listAttachments(cardId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireSession();
    const { id: cardId } = await context.params;
    const payload = removeAttachmentSchema.parse(await request.json());
    const supabase = getSupabaseServerClient();

    if (payload.type === "file") {
      const { data: existing, error: selectError } = await supabase
        .from("card_files")
        .select("id,storage_path")
        .eq("id", payload.id)
        .eq("card_id", cardId)
        .single();
      if (selectError || !existing) {
        return NextResponse.json(
          { error: selectError?.message ?? "File attachment not found" },
          { status: 400 }
        );
      }
      const { error: removeStorageError } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .remove([existing.storage_path]);
      if (removeStorageError) {
        return NextResponse.json(
          { error: removeStorageError.message },
          { status: 400 }
        );
      }
      const { error: removeDbError } = await supabase
        .from("card_files")
        .delete()
        .eq("id", existing.id);
      if (removeDbError) {
        return NextResponse.json({ error: removeDbError.message }, { status: 400 });
      }
    } else {
      const { error } = await supabase
        .from("card_links")
        .delete()
        .eq("id", payload.id)
        .eq("card_id", cardId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const data = await listAttachments(cardId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed request" },
      { status: 400 }
    );
  }
}
