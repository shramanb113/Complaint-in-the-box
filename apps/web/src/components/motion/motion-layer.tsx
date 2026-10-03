"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PRESSABLE = "button, [role='tab'], a[class*='shadow-hard'], [data-press]";

/**
 * Site-wide micro-motion, mounted once in the layout.
 * - Anything marked data-reveal rises in as it scrolls into view; its <li>/[data-reveal-item] children stagger.
 * - Buttons, tabs and chips compress slightly while pressed and settle back with a small overshoot.
 * Everything is skipped under prefers-reduced-motion, and the page works with none of it.
 */
export function MotionLayer() {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cleanups: Array<() => void> = [];

        Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).forEach((block) => {
          const items = block.querySelectorAll<HTMLElement>(":scope li, :scope [data-reveal-item]");
          const targets = items.length ? [block, ...items] : [block];
          gsap.from(targets, {
            y: 22,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: items.length ? 0.07 : 0,
            scrollTrigger: { trigger: block, start: "top 88%", once: true },
          });
        });

        const press = (down: boolean) => (event: Event) => {
          const el = (event.target as Element | null)?.closest<HTMLElement>(PRESSABLE);
          if (!el || (el instanceof HTMLButtonElement && el.disabled)) return;
          gsap.to(el, down
            ? { scale: 0.96, duration: 0.1, ease: "power2.out", overwrite: "auto" }
            : { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
        };
        const onDown = press(true);
        const onUp = press(false);
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("pointerup", onUp);
        document.addEventListener("pointercancel", onUp);
        document.addEventListener("pointerout", onUp);
        cleanups.push(() => {
          document.removeEventListener("pointerdown", onDown);
          document.removeEventListener("pointerup", onUp);
          document.removeEventListener("pointercancel", onUp);
          document.removeEventListener("pointerout", onUp);
        });

        return () => cleanups.forEach((fn) => fn());
      });
    },
    { scope: root, dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={root} hidden aria-hidden="true" />;
}
