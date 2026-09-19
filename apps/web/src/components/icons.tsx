import type { ReactElement, SVGProps } from "react";
import type { Category } from "@nyaypatra/core";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const shared = {
  viewBox: "0 0 48 48",
  fill: "none",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/** Sticker-style icons: thick ink outline, flat Poster Pop fills. Decorative, so hidden from assistive tech. */
export function ParcelIcon(props: IconProps) {
  return (
    <svg {...shared} className="size-12 stroke-ink" {...props}>
      <path d="M6 16 24 8l18 8v20L24 44 6 36Z" className="fill-turmeric" />
      <path d="M6 16l18 8 18-8M24 24v20" />
      <path d="M15 12l18 8" />
    </svg>
  );
}

export function PhonePayIcon(props: IconProps) {
  return (
    <svg {...shared} className="size-12 stroke-ink" {...props}>
      <rect x="12" y="4" width="24" height="40" rx="5" className="fill-white" />
      <circle cx="24" cy="21" r="9" className="fill-wa" />
      <path d="m19.5 21 3.2 3.2 5.8-6.4" />
      <path d="M21 37h6" />
    </svg>
  );
}

export function BowlIcon(props: IconProps) {
  return (
    <svg {...shared} className="size-12 stroke-ink" {...props}>
      <path d="M5 25h38a19 17 0 0 1-38 0Z" className="fill-tomato" />
      <path d="M15 9c-2 3 2 4 0 8M24 6c-2 3 2 5 0 9M33 9c-2 3 2 4 0 8" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...shared} className="size-12 stroke-ink" {...props}>
      <path d="M8 8h17l17 17-17 17L8 25Z" className="fill-butter" />
      <circle cx="17" cy="17" r="3" className="fill-white" />
    </svg>
  );
}

export const CATEGORY_ICON: Record<Category, (props: IconProps) => ReactElement> = {
  ecommerce: ParcelIcon,
  upi: PhonePayIcon,
  food: BowlIcon,
  hidden_fee: TagIcon,
};
