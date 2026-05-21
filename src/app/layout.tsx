import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://claudoscope-labs.vercel.app";
const DESCRIPTION =
  "A bring-your-own-key Anthropic API playground that visualizes prompt caching, token composition, latency and cost — live as the response streams. No backend, no SDK.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "claudoscope — x-ray your Claude API calls",
    template: "%s · claudoscope",
  },
  description: DESCRIPTION,
  applicationName: "claudoscope",
  keywords: [
    "Claude API",
    "Anthropic API",
    "prompt caching",
    "LLM tokens",
    "token cost",
    "Claude",
    "Anthropic",
    "developer tool",
    "BYOK",
    "LLM streaming",
  ],
  authors: [{ name: "Ferhat Atagün", url: "https://ferhatatagun.com" }],
  creator: "Ferhat Atagün",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "claudoscope",
    title: "claudoscope — x-ray your Claude API calls",
    description:
      "Prompt caching, tokens and cost, visualized live as the response streams. BYOK, no backend.",
  },
  twitter: {
    card: "summary_large_image",
    title: "claudoscope — x-ray your Claude API calls",
    description: "Prompt caching, tokens and cost, visualized live. BYOK, no backend.",
    creator: "@ferhatatagun",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "claudoscope",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web browser)",
  description: DESCRIPTION,
  url: SITE,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Ferhat Atagün", url: "https://ferhatatagun.com" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
