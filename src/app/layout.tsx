import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Claudoscope — see through to what Claude is doing",
  description:
    "A BYOK Anthropic API playground that visualizes prompt caching, tokens, and cost in real time. Bring your own key, stream live, x-ray every request.",
  openGraph: {
    title: "Claudoscope",
    description: "X-ray your Claude API calls. Cache hits, cost, tokens — visualized.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
