import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dcy-eaQM.mjs";
import { l as stringType, o as numberType, s as objectType } from "../_libs/zod.mjs";
import { n as personRequestSchema, r as personUpdateSchema, t as personDeleteSchema } from "./person-manage-BGjb_D_C.mjs";
import { t as createServerRpc } from "./createServerRpc-CxD4EZ5P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/person.functions-Dms-XBGf.js
async function addDemoPersonRecord(input, kind, create) {
	if (kind !== "familia" && kind !== "ong") throw new Error("El alta inmediata solo está disponible en la demo.");
	return create(personRequestSchema.parse(input));
}
var getPersonDetails_createServerFn_handler = createServerRpc({
	id: "111aa28319e7dcf0aa3324426015f2bac10c12e06a151f15cd01f23cdb3de674",
	name: "getPersonDetails",
	filename: "src/lib/person.functions.ts"
}, (opts) => getPersonDetails.__executeServer(opts));
var getPersonDetails = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(getPersonDetails_createServerFn_handler, async ({ data, context }) => {
	const { data: details, error } = await context.supabase.rpc("person_edit_details", { _sid: data.id });
	if (error) throw new Error("No se pudieron cargar los datos.");
	if (!details) return null;
	return objectType({
		id: stringType(),
		requested_name: stringType(),
		requested_phone: stringType(),
		requested_age: numberType().nullable(),
		relation: stringType()
	}).parse(details);
});
var updatePerson_createServerFn_handler = createServerRpc({
	id: "12f054b6642a197bbc5f9ecef1fe4988bba9e37a8003628a38f1de321fbd07ce",
	name: "updatePerson",
	filename: "src/lib/person.functions.ts"
}, (opts) => updatePerson.__executeServer(opts));
var updatePerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => personUpdateSchema.parse(input)).handler(updatePerson_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.rpc("manage_person", {
		_sid: data.id,
		_delete: false,
		_name: data.requested_name,
		_phone: data.requested_phone,
		_age: data.requested_age,
		_relation: data.relation
	});
	if (error) throw new Error("No se pudieron guardar los cambios.");
	return { ok: true };
});
var deletePerson_createServerFn_handler = createServerRpc({
	id: "7e3c2e2abcd279961a6582c3bd33c6c07c6d223a066ad48a96c005c76c668d7c",
	name: "deletePerson",
	filename: "src/lib/person.functions.ts"
}, (opts) => deletePerson.__executeServer(opts));
var deletePerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => personDeleteSchema.parse(input)).handler(deletePerson_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.rpc("manage_person", {
		_sid: data.id,
		_delete: true
	});
	if (error) throw new Error(error.message === "Active visit" ? "Finalice la visita activa antes de eliminar a esta persona." : "No se pudo eliminar la persona.");
	return { ok: true };
});
var addPerson_createServerFn_handler = createServerRpc({
	id: "efa089d96d5b102e5dc407072893a47f952085ab2500e2150c9fca22d37d81fe",
	name: "addPerson",
	filename: "src/lib/person.functions.ts"
}, (opts) => addPerson.__executeServer(opts));
var addPerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => personRequestSchema.parse(input)).handler(addPerson_createServerFn_handler, async ({ data, context }) => {
	const { data: membership, error } = await context.supabase.from("demo_members").select("kind").eq("user_id", context.userId).maybeSingle();
	if (error) throw new Error("No se pudo comprobar el acceso.");
	return { id: await addDemoPersonRecord(data, membership?.kind ?? null, async (details) => {
		const { data: id, error } = await context.supabase.rpc("add_demo_person", {
			_name: details.requested_name,
			_phone: details.requested_phone,
			_age: details.requested_age,
			_relation: details.relation
		});
		if (error || !id) throw new Error("No se pudo añadir la persona.");
		return id;
	}) };
});
//#endregion
export { addPerson_createServerFn_handler, deletePerson_createServerFn_handler, getPersonDetails_createServerFn_handler, updatePerson_createServerFn_handler };
