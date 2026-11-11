import { z } from "zod";

export const personRequestSchema = z.object({
  requested_name: z.string().trim().min(2, "Escriba el nombre completo").max(100),
  relation: z.string().trim().min(1, "Indique el vínculo").max(60),
  requested_phone: z.string().trim().min(5, "Indique un teléfono válido").max(30).regex(/^[0-9+ ()-]+$/, "Teléfono: solo números, espacios, +, paréntesis o guiones").refine(value => value.replace(/\D/g, "").length >= 5, "Indique un teléfono válido"),
  requested_age: z.preprocess(value => typeof value === "string" && value.trim() !== "" ? Number(value) : value, z.number({ invalid_type_error: "Indique la edad" }).int("Indique una edad entera").min(0).max(120, "Revise la edad")),
});