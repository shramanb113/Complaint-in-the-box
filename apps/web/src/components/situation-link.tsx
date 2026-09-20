import Link from "next/link";

/** One situation to pick, as a plain link: works without JavaScript. */
export function SituationLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border-[2.5px] border-ink bg-white px-4 py-3 font-bold shadow-hard-sm transition-[translate,box-shadow] duration-[120ms] motion-safe:hover:-translate-x-px motion-safe:hover:-translate-y-px hover:shadow-hard"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="font-display text-lg font-extrabold">
        →
      </span>
    </Link>
  );
}
