import { runCleanup } from "@/server/cleanup";
import { logFailure } from "@/server/log-failure";
import { getServices } from "@/server/services";

export const dynamic = "force-dynamic";

/** Protected by CRON_SECRET (spec §5.5). Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 403 });
  }
  try {
    const result = await runCleanup(getServices());
    return Response.json(result);
  } catch (error) {
    logFailure("cleanup failed", error);
    return Response.json({ error: "cleanup failed" }, { status: 500 });
  }
}
