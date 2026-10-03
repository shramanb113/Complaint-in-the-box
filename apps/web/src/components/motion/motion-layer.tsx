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
 * - [data-intro] elements and the direct children of [data-stagger] (the intake form) rise in on arrival.
 * - A tab panel fades up when its tab is selected; a field that turns invalid shakes; new error text and
 *   [data-pop] panels (readiness results) spring in as they mount.
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

        const intro = Array.from(document.querySelectorAll<HTMLElement>("[data-intro], [data-stagger] > *"));
        if (intro.length) {
          gsap.from(intro, { y: 20, opacity: 0, duration: 0.55, ease: "power3.out", stagger: 0.06, clearProps: "transform,opacity" });
        }

        const observer = new MutationObserver((records) => {
          for (const r of records) {
            if (r.type === "attributes") {
              const el = r.target as HTMLElement;
              if (r.attributeName === "data-state" && el.getAttribute("role") === "tabpanel" && el.dataset.state === "active") {
                gsap.fromTo(el, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", clearProps: "transform,opacity" });
              } else if (r.attributeName === "aria-invalid" && el.getAttribute("aria-invalid") === "true") {
                gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-6, 6, -4, 4, 0], easeEach: "power1.inOut" }, duration: 0.4, clearProps: "x" });
              }
            } else {
              r.addedNodes.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches("[data-pop]")) {
                  gsap.from(node, { y: 16, scale: 0.97, opacity: 0, duration: 0.5, ease: "back.out(1.6)", clearProps: "transform,opacity" });
                } else if (node.id.endsWith("-error")) {
                  gsap.from(node, { y: -6, opacity: 0, duration: 0.3, ease: "power2.out", clearProps: "transform,opacity" });
                }
              });
            }
          }
        });
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ["data-state", "aria-invalid"],
        });
        cleanups.push(() => observer.disconnect());

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
