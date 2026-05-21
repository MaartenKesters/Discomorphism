import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@vercel/kv";

const MAX_USES = parseInt(process.env.MAX_USES ?? "300", 10);

const PROMPT =
  "faceted disco ball surface, reflective polygon mirror segments, disco ball geometry, glitter sparkles, specular light flares, iridescent highlights, shimmering reflective facets, dark studio background, original colors and shape preserved, same color palette as input image, photorealistic";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const kv = createClient({
  url: process.env.DISCO_KV_REST_API_URL!,
  token: process.env.DISCO_KV_REST_API_TOKEN!,
});

const TIMEOUT_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body as { image: string };

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Check and atomically increment usage
    const currentUses = (await kv.get<number>("total_uses")) ?? 0;
    if (currentUses >= MAX_USES) {
      return NextResponse.json(
        {
          error:
            "The free tier limit has been reached. Check the GitHub repo to self-host.",
        },
        { status: 429 }
      );
    }
    await kv.incr("total_uses");

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Replicate request timed out")), TIMEOUT_MS)
    );

    const rawOutput = await Promise.race([
      replicate.run("black-forest-labs/flux-2-pro", {
        input: {
          image,
          prompt: PROMPT
        },
      }),
      timeout,
    ]);

    const outputItem = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
    if (!outputItem) {
      throw new Error("No output image returned by Replicate");
    }

    // FileOutput objects stringify to their CDN URL
    const outputUrl = String(outputItem);

    // Fetch and return as base64 so the client doesn't need CORS access to Replicate CDN
    const imageRes = await fetch(outputUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const outputBase64 = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString("base64")}`;

    return NextResponse.json({ image: outputBase64 });
  } catch (err) {
    console.error("[transform]", err);
    return NextResponse.json(
      { error: "Failed to transform image. Please try again." },
      { status: 500 }
    );
  }
}
