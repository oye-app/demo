import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dcy-eaQM.mjs";
import { i as enumType, l as stringType, s as objectType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-CxD4EZ5P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/call.functions-Bu6T72kz.js
var inputSchema = objectType({
	seniorId: stringType().uuid(),
	seniorName: stringType().trim().min(1).max(100),
	lines: arrayType(objectType({
		who: enumType(["oye", "mayor"]),
		text: stringType().max(500)
	})).min(1).max(30)
});
var analyzeCall_createServerFn_handler = createServerRpc({
	id: "11e13fc3e19f615027ad4a41b3b9bb9f16045ec6e88c4bf04daa8b7943d55575",
	name: "analyzeCall",
	filename: "src/lib/call.functions.ts"
}, (opts) => analyzeCall.__executeServer(opts));
var analyzeCall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => inputSchema.parse(d)).handler(analyzeCall_createServerFn_handler, async ({ data, context }) => {
	const { runCallAnalysis } = await import("./call.server-CDadVbLm.mjs");
	return runCallAnalysis(context.supabase, context.userId, data);
});
var startCall_createServerFn_handler = createServerRpc({
	id: "dc93c5071676c5c5028fbdbf2ebd3f08aca5997bb350853586704c3d214b6ac0",
	name: "startCall",
	filename: "src/lib/call.functions.ts"
}, (opts) => startCall.__executeServer(opts));
var startCall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ personId: stringType().uuid() }).parse(d)).handler(startCall_createServerFn_handler, async ({ data, context }) => {
	const { personId } = data;
	const { data: canCare } = await context.supabase.rpc("can_care", {
		_sid: personId,
		_uid: context.userId
	});
	if (!canCare) throw new Error("No tiene autorización para llamar a esta persona.");
	const { data: senior, error: seniorError } = await context.supabase.from("seniors").select("id, name, phone, age").eq("id", personId).maybeSingle();
	if (seniorError || !senior) throw new Error("No se encontró la persona seleccionada.");
	const { data: link } = await context.supabase.from("person_links").select("relation").eq("user_id", context.userId).eq("senior_id", personId).maybeSingle();
	const relationship = link?.relation?.trim() || "Familiar";
	let rawPhone = (senior.phone || "").replace(/[^\d+]/g, "");
	if (!rawPhone) throw new Error("La persona no tiene un número de teléfono registrado.");
	if (rawPhone.startsWith("00")) rawPhone = "+" + rawPhone.slice(2);
	else if (!rawPhone.startsWith("+")) if (rawPhone.length === 9) rawPhone = "+34" + rawPhone;
	else rawPhone = "+" + rawPhone;
	const payload = {
		person_id: senior.id,
		name: senior.name,
		phone: rawPhone,
		age: senior.age ?? null,
		relationship
	};
	const makeWebhookUrl = process.env["MAKE_START_CALL_URL"];
	if (!makeWebhookUrl) {
		console.warn("[startCall] MAKE_START_CALL_URL no está configurada en las variables de entorno. Registrando llamada localmente para desarrollo.");
		const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
		const fakeConversationId = `dev-${crypto.randomUUID()}`;
		await supabaseAdmin.from("call_logs").insert({
			conversation_id: fakeConversationId,
			person_id: senior.id,
			nombre: senior.name.split(" ")[0],
			telefono_usuario: rawPhone,
			status: "llamando"
		});
		return {
			ok: true,
			conversation_id: fakeConversationId,
			call_sid: "dev-mock-sid",
			mocked: true
		};
	}
	const response = await fetch(makeWebhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
	if (!response.ok) {
		const errText = await response.text().catch(() => "");
		console.error("[startCall] Make S1 webhook returned error:", response.status, errText);
		throw new Error("No se pudo iniciar la llamada con el servicio de telefonía.");
	}
	const json = await response.json().catch(() => ({}));
	return {
		ok: true,
		conversation_id: json.conversation_id ?? null,
		call_sid: json.call_sid ?? null
	};
});
//#endregion
export { analyzeCall_createServerFn_handler, startCall_createServerFn_handler };
