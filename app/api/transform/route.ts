import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { createClient  } from "@vercel/kv";

const MAX_USES = parseInt(process.env.MAX_USES ?? "300", 10);

const PROMPT =
  "disco ball style, mirrored facets, glitter reflections, specular highlights, shiny, photorealistic disco ball texture overlaid on the image, original image content clearly recognizable, dark background, studio lighting";

fal.config({ credentials: process.env.FAL_API_KEY });
const kv = createClient({
  url: process.env.DISCO_KV_REST_API_URL!,
  token: process.env.DISCO_KV_REST_API_TOKEN!,
});

const TIMEOUT_MS = 60_000;

interface FluxGeneralOutput {
  images: Array<{ url: string; width: number; height: number; content_type: string }>;
  seed: number;
}

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

    // Parse base64 payload
    const mimeMatch = image.match(/^data:(image\/[\w+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const ext = mimeType.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "png");
    const base64Data = image.replace(/^data:image\/[\w+]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Upload source image to fal storage
    const file = new File([buffer], `input.${ext}`, { type: mimeType });
    const imageUrl = await fal.storage.upload(file);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("fal.ai request timed out")), TIMEOUT_MS)
    );

    const result = await Promise.race([
      fal.subscribe("fal-ai/flux-general", {
        input: {
          image_url: imageUrl,
          prompt: PROMPT,
          strength: 0.75,
          num_inference_steps: 28,
        } as any,
      }),
      timeout,
    ]);

    const output = (result as any).data as FluxGeneralOutput;
    const outputUrl = output.images?.[0]?.url;
    if (!outputUrl) {
      throw new Error("No output image returned by fal.ai");
    }

    // Fetch and return as base64 so the client doesn't need CORS access to fal CDN
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
