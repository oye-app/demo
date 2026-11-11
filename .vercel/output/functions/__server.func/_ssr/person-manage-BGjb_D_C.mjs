import { a as literalType, c as preprocessType, l as stringType, o as numberType, s as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/person-manage-BGjb_D_C.js
var personRequestSchema = objectType({
	requested_name: stringType().trim().min(2, "Escriba el nombre completo").max(100),
	relation: stringType().trim().min(1, "Indique el vínculo").max(60),
	requested_phone: stringType().trim().min(5, "Indique un teléfono válido").max(30).regex(/^[0-9+ ()-]+$/, "Teléfono: solo números, espacios, +, paréntesis o guiones").refine((value) => value.replace(/\D/g, "").length >= 5, "Indique un teléfono válido"),
	requested_age: preprocessType((value) => typeof value === "string" && value.trim() !== "" ? Number(value) : value, numberType({ invalid_type_error: "Indique la edad" }).int("Indique una edad entera").min(0).max(120, "Revise la edad"))
});
var personUpdateSchema = personRequestSchema.extend({ id: stringType().uuid() });
var personDeleteSchema = objectType({
	id: stringType().uuid(),
	confirmed: literalType(true)
});
//#endregion
export { personRequestSchema as n, personUpdateSchema as r, personDeleteSchema as t };
