import { NextResponse } from "next/server";
import { createClient  } from "@vercel/kv";

const kv = createClient({
  url: process.env.DISCO_KV_REST_API_URL!,
  token: process.env.DISCO_KV_REST_API_TOKEN!,
});

const MAX_USES = parseInt(process.env.MAX_USES ?? "300", 10);

export async function GET() {
  const used = (await kv.get<number>("total_uses")) ?? 0;
  return NextResponse.json({ used, total: MAX_USES });
}
