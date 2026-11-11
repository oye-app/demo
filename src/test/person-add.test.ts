import { describe, expect, it, vi } from "vitest";
import { addDemoPersonRecord } from "../lib/person-add";

const details = { requested_name: "Elena", requested_phone: "+34 612 345 678", requested_age: "80", relation: "Madre" };
describe("Immediate demo addition", () => {
  it("returns the new identity immediately with all submitted details", async () => {
    const create = vi.fn().mockResolvedValue("new-person-id");
    expect(await addDemoPersonRecord(details, "familia", create)).toBe("new-person-id");
    expect(create).toHaveBeenCalledWith({ ...details, requested_age: 80 });
  });
  it("does not grant immediate addition to real accounts or volunteers", async () => {
    const create = vi.fn();
    for (const kind of [null, "voluntario", "admin"]) await expect(addDemoPersonRecord(details, kind, create)).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
  it("requires phone and age before creating a person", async () => {
    const create = vi.fn();
    await expect(addDemoPersonRecord({ ...details, requested_phone: "" }, "familia", create)).rejects.toThrow();
    await expect(addDemoPersonRecord({ ...details, requested_age: "" }, "familia", create)).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
});