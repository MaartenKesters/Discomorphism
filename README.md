# 🪩 Discomorphism

> Transform any logo or image into a glittering disco ball version using AI.

Discomorphism is a one-click AI image transformer built on [OpenAI](https://openai.com)'s gpt-image-1 model.
Upload your image, it comes back wrapped in mirrored facets, specular highlights, and full disco energy.

**Riding the Spotify 20th anniversary "Discomorphism" wave**, the internet-wide trend of reimagining logos and photos as disco ball art.

**Live demo:** [discomorphism.vercel.app/](https://discomorphism.vercel.app/)

---

## How it works

1. You upload a PNG, JPG, or SVG (max 5 MB).
2. The image is sent to OpenAI's `gpt-image-1` model using the images.edit endpoint.
3. gpt-image-1 applies the disco ball style prompt, tiling the surface with mirror segments while preserving the original shape and colours.
4. Vercel KV tracks total free uses; once the free tier cap is hit, visitors are invited to self-host.

---

## Self-hosting

### Prerequisites

| Service | Purpose | Sign-up |
|---------|---------|---------|
| [OpenAI](https://openai.com) | Image generation | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| [Vercel](https://vercel.com) | Hosting + KV store | [vercel.com](https://vercel.com) |

### 1. Clone the repo

```bash
git clone https://github.com/MaartenKesters/Discomorphism.git
cd discomorphism
npm install
```

### 2. Set environment variables

Copy `.env.example` → `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```env
OPENAI_API_KEY=your_openai_api_key_here
KV_REST_API_URL=your_vercel_kv_rest_url
KV_REST_API_TOKEN=your_vercel_kv_rest_token
MAX_USES=300
```

**Getting the Vercel KV credentials:**

1. Go to your Vercel project → Storage → Create Database → KV.
2. In the KV dashboard, click `.env.local` to copy the credentials.

### 3. Run locally

```bash
npm run dev
```

### 4. Deploy to Vercel

```bash
npx vercel --prod
```

Make sure to add the environment variables in the Vercel project settings
(Settings → Environment Variables) before deploying.

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **OpenAI** `gpt-image-1` — images.edit endpoint
- **Vercel KV** — usage counter (Redis)
- **Tailwind CSS** — styling

---

## Project structure

```
app/
  api/
    transform/route.ts   ← img2img pipeline + KV gate
    stats/route.ts       ← usage counter endpoint
  globals.css
  layout.tsx
  page.tsx               ← drag-and-drop UI
.env.example
```

---

## License

MIT

---

Built by [Maarten Kesters](https://www.linkedin.com/in/maarten-kesters/)
