import { expect, it } from "vitest";
import { personDeleteSchema, personUpdateSchema } from "../lib/person-manage";
const id = "c199b149-7401-4b5e-ad46-69c42888eb5f";
it("requires explicit confirmation before deletion", () => {
  expect(personDeleteSchema.safeParse({ id }).success).toBe(false);
  expect(personDeleteSchema.safeParse({ id, confirmed: false }).success).toBe(false);
  expect(personDeleteSchema.parse({ id, confirmed: true }).confirmed).toBe(true);
});
it("preserves edited phone age name and relationship", () => {
  expect(personUpdateSchema.parse({ id, requested_name: "Elena", requested_phone: "+34 000 000 000", requested_age: "81", relation: "Abuela" })).toEqual({ id, requested_name: "Elena", requested_phone: "+34 000 000 000", requested_age: 81, relation: "Abuela" });
});