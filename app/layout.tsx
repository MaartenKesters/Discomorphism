import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Discomorphism — Disco Ball Your Logo",
  description:
    "Transform any logo or image into a glittering disco ball masterpiece. Riding the Spotify 20th anniversary wave.",
  openGraph: {
    title: "Discomorphism",
    description: "Transform any image into a disco ball masterpiece with AI.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
