import { describe, expect, it } from "vitest";
import { overallLabel, wellbeing } from "@/lib/wellbeing";
import type { Alert } from "@/lib/alerts";

const mk = (over: Partial<Alert>): Alert =>
  ({
    id: crypto.randomUUID(),
    senior_name: "Carmen",
    senior_id: "carmen-id",
    mood: "bien",
    need: "ninguna",
    status: "closed",
    created_at: new Date().toISOString(),
    loneliness_score: 4,
    ...over,
  }) as unknown as Alert;

describe("wellbeing", () => {
  it("ánimo = % de llamadas contestadas con mood bien", () => {
    const { items } = wellbeing([mk({}), mk({}), mk({ mood: "bajo" }), mk({ mood: "no_contesta" })], "Carmen", "carmen-id");
    expect(items.find((i) => i.key === "animo")?.pct).toBe(67); // 2 de 3 contestadas
  });

  it("contacto = % de llamadas contestadas", () => {
    const { items } = wellbeing([mk({}), mk({ mood: "no_contesta" })], "Carmen", "carmen-id");
    expect(items.find((i) => i.key === "contacto")?.pct).toBe(50);
  });

  it("soledad: score 3 = 100%, score 9 = 0%", () => {
    expect(wellbeing([mk({ loneliness_score: 3 })], "Carmen", "carmen-id").items.find((i) => i.key === "soledad")?.pct).toBe(100);
    expect(wellbeing([mk({ loneliness_score: 9 })], "Carmen", "carmen-id").items.find((i) => i.key === "soledad")?.pct).toBe(0);
  });

  it("ignora llamadas de más de 14 días", () => {
    const old = mk({ created_at: new Date(Date.now() - 20 * 86400000).toISOString() });
    expect(wellbeing([old], "Carmen", "carmen-id").overall).toBeNull();
  });

  it("etiquetas del resumen global", () => {
    expect(overallLabel(80)).toBe("Va bien");
    expect(overallLabel(50)).toBe("Hay que vigilar");
    expect(overallLabel(20)).toBe("Necesita atención");
  });
});

 it("does not mix equal names with different identifiers", () => { const a=mk({senior_id:"a",mood:"bien"}); const b=mk({senior_id:"b",mood:"bajo"}); expect(wellbeing([a,b],"Carmen","b").items.find(i=>i.key==="animo")?.pct).toBe(0); });
 it("missing loneliness does not become zero",()=> { expect(wellbeing([mk({loneliness_score:null})],"Carmen","carmen-id").items.find(i=>i.key==="soledad")?.pct).toBeNull(); });
 it("a matching name without verified identity supplies no wellbeing",()=> { expect(wellbeing([mk({})],"Carmen").overall).toBeNull(); });
