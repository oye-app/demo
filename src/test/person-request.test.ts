import { describe, expect, it } from "vitest";
import { personRequestSchema } from "../lib/person-request";

const request = { requested_name: "Carmen", relation: "Madre", requested_phone: "+34 612 345 678", requested_age: "76" };
describe("Person requests", () => {
  it("collects and preserves the person's phone", () => {
    expect(personRequestSchema.parse(request).requested_phone).toBe("+34 612 345 678");
    expect(personRequestSchema.safeParse({ ...request, requested_phone: "" }).success).toBe(false);
    expect(personRequestSchema.safeParse({ ...request, requested_phone: "abc<script>" }).success).toBe(false);
  });
  it("collects the person's age without treating a blank as zero", () => {
    expect(personRequestSchema.parse(request).requested_age).toBe(76);
    for (const requested_age of ["", "-1", "121", "76.5"]) {
      expect(personRequestSchema.safeParse({ ...request, requested_age }).success).toBe(false);
    }
  });
});