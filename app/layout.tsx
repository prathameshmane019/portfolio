import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono, Instrument_Serif } from "next/font/google";
import { readPortfolioContent } from "@/lib/content-store";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await readPortfolioContent();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${profile.name} | ${profile.title}`,
      template: `%s | ${profile.name}`,
    },
    description: profile.bio,
    openGraph: {
      title: `${profile.name} | ${profile.title}`,
      description: profile.tagline,
      url: baseUrl,
      siteName: profile.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.name} | ${profile.title}`,
      description: profile.tagline,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile } = await readPortfolioContent();
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.tagline,
    email: profile.email,
    telephone: profile.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location,
      addressCountry: "India",
    },
    sameAs: [profile.github, profile.linkedin],
  };

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${bricolage.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
