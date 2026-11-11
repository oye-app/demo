import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { t as DEMO_PERSON_IDS } from "./person-presentation-DhLlwfkg.mjs";
import { i as enumType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-CxD4EZ5P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/demo.functions-cLqLv03C.js
/** Three shared demo accounts (no admin rights) so anyone can try each role in one tap. */
var DEMO = {
	familia: {
		email: "familia@demo.oye.app",
		full_name: "Lucía Martín",
		neighborhood: "Chamberí",
		senior_name: "Carmen",
		senior_relation: "Madre"
	},
	voluntario: {
		email: "voluntario@demo.oye.app",
		full_name: "Javier Ruiz",
		neighborhood: "Chamberí",
		senior_name: "",
		senior_relation: ""
	},
	ong: {
		email: "ong@demo.oye.app",
		full_name: "Ana Torres",
		neighborhood: "Asociación Vecinal Chamberí",
		senior_name: "",
		senior_relation: ""
	}
};
var PASSWORD = "oye-demo-2026";
var demoAccess_createServerFn_handler = createServerRpc({
	id: "9bfe62bf7a903ca801f1631fcf677d0fe7514c856c5d0153ccbeeafeab7efb9a",
	name: "demoAccess",
	filename: "src/lib/demo.functions.ts"
}, (opts) => demoAccess.__executeServer(opts));
var demoAccess = createServerFn({ method: "POST" }).inputValidator((d) => objectType({ persona: enumType([
	"familia",
	"voluntario",
	"ong"
]) }).parse(d)).handler(demoAccess_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
	const d = DEMO[data.persona];
	const { data: list } = await supabaseAdmin.auth.admin.listUsers({
		page: 1,
		perPage: 1e3
	});
	let id = list?.users.find((u) => u.email === d.email)?.id;
	if (!id) {
		const { data: c, error } = await supabaseAdmin.auth.admin.createUser({
			email: d.email,
			password: PASSWORD,
			email_confirm: true
		});
		if (error || !c.user) throw new Error("No se pudo preparar la demo.");
		id = c.user.id;
	}
	const { error: memberError } = await supabaseAdmin.from("demo_members").upsert({
		user_id: id,
		kind: data.persona
	});
	if (memberError) throw new Error("No se pudo preparar la demo.");
	await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
	const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
		id,
		persona: data.persona,
		phone: "",
		full_name: d.full_name,
		neighborhood: d.neighborhood,
		senior_name: d.senior_name,
		senior_relation: d.senior_relation
	});
	if (profileError) throw new Error("No se pudo preparar la demo.");
	if (data.persona === "familia") {
		const { data: carmen, error: personError } = await supabaseAdmin.from("seniors").select("id,active").eq("id", DEMO_PERSON_IDS.carmen).eq("is_demo", true).maybeSingle();
		if (personError || !carmen) throw new Error("No se pudo preparar a Carmen.");
		const { error: linkError } = carmen.active ? await supabaseAdmin.from("person_links").upsert({
			user_id: id,
			senior_id: carmen.id,
			requested_name: "Carmen",
			relation: "Madre",
			status: "approved"
		}, {
			onConflict: "user_id,senior_id",
			ignoreDuplicates: true
		}) : { error: null };
		if (linkError) throw new Error("No se pudo vincular a Carmen.");
	}
	return {
		email: d.email,
		password: PASSWORD
	};
});
//#endregion
export { demoAccess_createServerFn_handler };
