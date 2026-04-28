import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAuthorizedUser } from "@/lib/auth";
import { extractReceiptFields } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

function extensionFor(mime: string): string {
  switch (mime.toLowerCase()) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthorizedUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image too large (max ${MAX_BYTES / 1024 / 1024}MB).` },
      { status: 413 }
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are supported." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const id = randomUUID();
  const photoPath = `${auth.user.id}/${id}.${extensionFor(file.type)}`;

  const { error: uploadError } = await auth.supabase.storage
    .from("receipts")
    .upload(photoPath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  try {
    const { fields, raw } = await extractReceiptFields(bytes, file.type);
    return NextResponse.json({
      id,
      photo_path: photoPath,
      extraction: fields,
      extraction_raw: raw,
    });
  } catch (err) {
    // Photo is already in storage. Per PLAN principle "manual is always a
    // fallback", surface the failure but keep the photo so the user can still
    // review and save manually if they want — they'll need to refresh and
    // re-upload, since the client expects extraction fields. Simpler: clean up.
    await auth.supabase.storage.from("receipts").remove([photoPath]);
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json(
      { error: `Extraction failed: ${message}` },
      { status: 502 }
    );
  }
}
