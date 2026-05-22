import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { createClient } from "@vercel/kv";

const MAX_USES = parseInt(process.env.MAX_USES ?? "300", 10);

const PROMPT =
  "Cover the surface of the input image with small square reflective mirror tiles, preserving the exact shape, silhouette, exact colors and composition of the original subject. The color areas stay exactly the same but with mirror tiles. The subject must look identical to the input but with a tiled mirror surface and a little bloated into a 3D ball, just like a disco ball. Add subtle specular highlights and glitter sparkles. Dark background. Do not introduce any new shapes or objects. Photorealistic.";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const imageFile = await toFile(imageBuffer, "input.png", { type: "image/png" });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("OpenAI request timed out")), TIMEOUT_MS)
    );

    const response = await Promise.race([
      openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: PROMPT,
        n: 1,
        size: "1024x1024",
      }),
      timeout,
    ]);

    const b64Json = response.data?.[0]?.b64_json;
    if (!b64Json) throw new Error("No output image returned by OpenAI");

    return NextResponse.json({ image: `data:image/png;base64,${b64Json}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[transform]", message);
    return NextResponse.json(
      { error: `Failed to transform image: ${message}` },
      { status: 500 }
    );
  }
}
