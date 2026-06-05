import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = "https://claudoscope-labs.vercel.app";
const TITLE = "claudoscope — x-ray your Claude API calls";
const DESCRIPTION =
  "A bring-your-own-key Anthropic API playground that visualizes prompt caching, token composition, latency and cost — live as the response streams. No backend, no SDK.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
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
    "claude pricing",
    "context window",
    "developer tool",
    "BYOK",
    "LLM streaming",
    "Anthropic SDK",
    "Server-Sent Events",
    "Ferhat Atagun",
  ],
  authors: [{ name: "Ferhat Atagün", url: "https://ferhatatagun.com" }],
  creator: "Ferhat Atagün",
  publisher: "Ferhat Atagün",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "claudoscope",
    title: TITLE,
    description:
      "Prompt caching, tokens and cost, visualized live as the response streams. BYOK, no backend.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ferhatatagun",
    creator: "@ferhatatagun",
    title: TITLE,
    description: "Prompt caching, tokens and cost, visualized live. BYOK, no backend.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "developer tools",
};

/** Single connected JSON-LD graph. The Person node is canonical (same `@id`
 *  used across the entire dev-tool suite) so Google can entity-link the five
 *  tools as products of the same creator. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://ferhatatagun.com/#person",
      name: "Ferhat Atagün",
      url: "https://ferhatatagun.com",
      jobTitle: "Frontend Team Lead",
      worksFor: { "@type": "Organization", name: "HangiKredi", url: "https://www.hangikredi.com" },
      sameAs: [
        "https://github.com/ferhatatagun",
        "https://www.linkedin.com/in/ferhatatagun/",
        "https://twitter.com/ferhatatagun",
        "https://medium.com/@ferhatatagun",
        "https://stackoverflow.com/users/20566734/",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#app`,
      name: "claudoscope",
      alternateName: "Claudoscope",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      description: DESCRIPTION,
      url: SITE,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@id": "https://ferhatatagun.com/#person" },
      creator: { "@id": "https://ferhatatagun.com/#person" },
      isPartOf: {
        "@type": "CollectionPage",
        "@id": "https://ferhatatagun.com/tools#suite",
        name: "Open-source Claude dev-tools",
        url: "https://ferhatatagun.com/tools",
      },
      softwareHelp: { "@type": "WebPage", url: "https://ferhatatagun.com/blog/browser-only-claude-streaming" },
      keywords: "Claude API, Anthropic, prompt caching, LLM cost, BYOK",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="author" href="https://ferhatatagun.com" />
        <link rel="me" href="https://ferhatatagun.com" />
        <link rel="me" href="https://github.com/ferhatatagun" />
      </head>
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
