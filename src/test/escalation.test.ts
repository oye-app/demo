import { describe, expect, it } from "vitest";
import { escalation, lonelyLabel } from "@/lib/alerts";
const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();
describe("escalation", () => {
  it("no escalation before 30 min", () => expect(escalation({ status: "open", mood: "bajo", created_at: ago(10) }).level).toBe(0));
  it("ONG at 30 min", () => expect(escalation({ status: "open", mood: "bajo", created_at: ago(31) }).level).toBe(1));
  it("family at 60 min", () => expect(escalation({ status: "open", mood: "bajo", created_at: ago(61) }).level).toBe(2));
  it("no answer asks retry after 15 min", () => expect(escalation({ status: "open", mood: "no_contesta", created_at: ago(16) }).label).toBe("Volver a llamar ahora"));
  it("no answer at 60 min goes to key contact", () => expect(escalation({ status: "open", mood: "no_contesta", created_at: ago(61) }).label).toMatch(/llave/));
  it("taken alerts never escalate", () => expect(escalation({ status: "accepted", mood: "bajo", created_at: ago(90) }).level).toBe(0));
  it("loneliness threshold 6", () => { expect(lonelyLabel(6)).toBe("Se siente sola"); expect(lonelyLabel(5)).toBe("No se siente sola"); });
});
