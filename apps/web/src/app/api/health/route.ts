import { generatePacket, loadCompanyCatalog } from "@nyaypatra/core";

export const dynamic = "force-dynamic";

/** Liveness check and bundling canary: proves core's templates, catalog and dates work inside the server bundle. */
export function GET() {
  const packet = generatePacket(
    {
      category: "ecommerce",
      templateId: "ecom_wrong_item",
      locale: "en",
      platform: "flipkart",
      amountInr: 1,
      paidOn: "2026-01-01",
      whatHappened: "Health check sample text for the bundle.",
      desiredRemedy: "full_refund_original_mode",
      deadlineDays: 7,
    },
    loadCompanyCatalog()
  );
  return Response.json({ status: "ok", whatsappChars: packet.artifacts.whatsapp.en.length });
}
