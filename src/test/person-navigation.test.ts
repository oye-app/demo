import { describe, expect, it } from "vitest";
import { personSection } from "@/lib/person-navigation";

describe("Person selection destination", () => {
  it("stays in calls when choosing a person", () => {
    expect(personSection("/llamada")).toBe("/llamada");
  });
  it("stays in history when choosing a person", () => {
    expect(personSection("/historial")).toBe("/historial");
  });
  it("stays in the care record when choosing a person", () => {
    expect(personSection("/persona")).toBe("/persona");
  });
  it("uses home for non-personal sections", () => {
    expect(personSection("/avisos")).toBe("/");
  });
});