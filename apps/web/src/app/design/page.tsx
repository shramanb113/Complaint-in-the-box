import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDesignPageEnabled } from "@/lib/design-page";
import { Gallery } from "./gallery";

export const metadata: Metadata = {
  title: "Design system — Nyay Patra",
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  if (!isDesignPageEnabled(process.env)) notFound();
  return <Gallery />;
}
