import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const MAX_USES = parseInt(process.env.MAX_USES ?? "300", 10);

export async function GET() {
  const used = (await kv.get<number>("total_uses")) ?? 0;
  return NextResponse.json({ used, total: MAX_USES });
}
