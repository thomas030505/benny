import type { Metadata, Viewport } from "next";
import { Bungee, Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const logo = Bungee({ variable: "--font-logo", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Benny - BMs agent",
  description: "Still spørsmål til plandokumentene for Heimdal helse- og velferdssenter. Svar med dokument og side.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#14130f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className={`${inter.variable} ${interTight.variable} ${logo.variable}`}>
      <head>
        <meta name="robots" content="noindex" />
      </head>
      <body>{children}</body>
    </html>
  );
}
