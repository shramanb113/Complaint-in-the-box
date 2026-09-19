import { describe, it, expect } from "vitest";
import { GET } from "../src/app/api/health/route";

describe("GET /api/health", () => {
  it("returns ok and proves core (templates, catalog, dates) works inside the server bundle", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.whatsappChars).toBeGreaterThan(100);
  });
});
