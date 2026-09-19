import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";
import { vi } from "vitest";

// next/link needs the App Router; in tests a plain anchor is enough and keeps them independent of it.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children?: ReactNode; [prop: string]: unknown }) =>
    createElement("a", { href, ...(rest as object) }, children),
}));
