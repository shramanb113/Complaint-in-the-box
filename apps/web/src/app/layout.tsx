import type { Metadata, Viewport } from "next";
import { Baloo_2, Bricolage_Grotesque, Mukta, Space_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const baloo = Baloo_2({
  subsets: ["devanagari", "latin"],
  weight: ["600", "800"],
  variable: "--font-baloo",
  display: "swap",
});
const mukta = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nyay Patra — a complaint they can't ignore",
  description: "Turn a refund dispute into a clear, dated complaint in English and Hindi. Free.",
  // Pre-launch: keep out of search until Milestone 4.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${baloo.variable} ${mukta.variable} ${spaceMono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
