import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const bucket = form.get("bucket") as string | null;
    const prefix = form.get("prefix") as string | null;

    if (!file || !bucket) {
      return NextResponse.json(
        { error: "Missing file or bucket" },
        { status: 400 }
      );
    }

    const r2 = bucket === "catalog" ? env.CATALOG_BUCKET : env.CUSTOMERDATA_BUCKET;
    if (!r2) {
      // No R2 binding (e.g. local preview) — fall back to Supabase storage via client
      return NextResponse.json(
        { error: "R2 not configured — using Supabase fallback", fallback: true },
        { status: 503 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${prefix ? prefix + "/" : ""}${Date.now()}_${safeName}`;

    await r2.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    const publicBase = bucket === "catalog"
      ? "https://pub-10dacbf3c3554aa887bc4b0cc1821fd6.r2.dev"
      : "https://pub-c6a6db3b19c848c49de9d1a9271f13e0.r2.dev";

    const url = `${publicBase}/${key}`;
    return NextResponse.json({ url, key });
  } catch (e) {
    console.error("R2 upload error:", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}