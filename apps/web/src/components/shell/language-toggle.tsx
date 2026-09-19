import { cn } from "@nyaypatra/ui";
import { setLocale } from "@/lib/i18n/actions";
import type { UiLocale } from "@/lib/i18n/locale";

const OPTIONS: { value: UiLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

/**
 * A plain form: each button posts its language to a Server Action that sets the cookie, so the
 * toggle works before JavaScript loads. Each button carries its own lang so "English" keeps the
 * Latin font on a Hindi page.
 */
export function LanguageToggle({ locale, label }: { locale: UiLocale; label: string }) {
  return (
    <form action={setLocale}>
      <div role="group" aria-label={label} className="flex rounded-xl border-[2.5px] border-ink bg-white">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="submit"
            name="locale"
            value={option.value}
            lang={option.value}
            aria-pressed={locale === option.value}
            className={cn(
              "min-h-11 min-w-11 cursor-pointer border-r-[2.5px] border-ink px-3 font-display text-sm font-extrabold last:border-r-0",
              "first:rounded-l-[9.5px] last:rounded-r-[9.5px] transition-colors duration-[120ms]",
              locale === option.value ? "bg-ink text-cream" : "hover:bg-turmeric"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </form>
  );
}
