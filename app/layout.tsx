import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://discomorphism.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Discomorphism — Spotify Disco Ball AI Image Generator",
  description:
    "Turn any logo, photo, or image into a glittering disco ball with AI — free, instant, no sign-up. Join the viral Spotify 20th anniversary Discomorphism trend.",
  keywords: [
    "discomorphism",
    "disco ball generator",
    "disco ball image",
    "AI image transformer",
    "spotify disco ball",
    "disco ball logo",
    "image to disco ball",
    "disco ball maker",
    "free AI image editor",
    "spotify 20th anniversary",
  ],
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "Discomorphism — Spotify Disco Ball AI Image Generator",
    description:
      "Upload any image and watch it transform into a glittering disco ball version — free and instant.",
    url: BASE_URL,
    siteName: "Discomorphism",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Discomorphism — Spotify disco ball image generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discomorphism — Spotify Disco Ball AI Image Generator",
    description: "Upload any image and watch it transform into a glittering disco ball version — free and instant.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Discomorphism",
  url: BASE_URL,
  description:
    "Free AI-powered tool that transforms any image into a disco ball version. Powered by OpenAI gpt-image-1.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "All",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
