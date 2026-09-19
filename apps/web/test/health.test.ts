import { describe, it, expect } from "vitest";
import { GET } from "../src/app/api/health/route";

describe("GET /api/health", () => {
  it("route handler returns ok and a WhatsApp text length from core", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.whatsappChars).toBeGreaterThan(100);
  });
});
