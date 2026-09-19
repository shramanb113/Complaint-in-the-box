import { Button, Sticker } from "@nyaypatra/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-start justify-center gap-6 px-4 py-12">
      <Sticker>Coming soon</Sticker>
      <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tighter">
        A complaint they can&apos;t ignore.
      </h1>
      <p className="max-w-md text-base font-medium">
        Nyay Patra turns a refund dispute into a clear, dated letter in English and Hindi. We&apos;re building it now.
      </p>
      <Button size="lg" disabled>
        Start my complaint
      </Button>
    </main>
  );
}
