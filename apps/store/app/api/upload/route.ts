import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 12 * 1024 * 1024;
const PUBLIC_BASE = "https://pub-c6a6db3b19c848c49de9d1a9271f13e0.r2.dev"; // customerdata bucket

/** Only signed-in customers may upload, and only images. */
async function signedIn(token: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !token) return false;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  return res.ok;
}

export async function POST(request: NextRequest) {
  try {
    const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!(await signedIn(token))) {
      return NextResponse.json({ error: "Please sign in to add photos." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const prefix = String(form.get("prefix") ?? "uploads").replace(/[^a-zA-Z0-9/_-]/g, "");
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only photos can be uploaded." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large (12 MB max)." }, { status: 413 });

    const { env } = getCloudflareContext();
    const r2 = env.CUSTOMERDATA_BUCKET;
    if (!r2) return NextResponse.json({ error: "Photo storage isn't connected." }, { status: 503 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${prefix}/${Date.now()}_${safeName}`;
    await r2.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return NextResponse.json({ url: `${PUBLIC_BASE}/${key}`, key });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
