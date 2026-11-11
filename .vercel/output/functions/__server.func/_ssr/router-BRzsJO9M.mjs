import { r as __toESM } from "../_runtime.mjs";
import { C as useRouter, Wt as redirect, _ as Outlet, b as createRootRouteWithContext, d as Scripts, f as HeadContent, g as createRouter, v as lazyRouteComponent, x as Link, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as enumType, l as stringType, n as booleanType, r as coerce, s as objectType, u as unknownType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-BoBTfay3.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { _ as meQuery, a as OyeLogo, y as personSearch } from "./oye-C9NPyxa_.mjs";
import { t as Route$11 } from "../_authenticated-CYl1FtUl.mjs";
import { t as Toaster$1 } from "./styles-CqtVdYJw.mjs";
import { t as Route$12 } from "./bienvenida-D9wzgFkL.mjs";
import { t as Route$13 } from "./recomendar-CRR-Js4b.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BRzsJO9M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Brief brand splash: only the OYE logo, ~2 s, then it fades away. */
function Splash() {
	const [state, setState] = (0, import_react.useState)("in");
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setState("out"), 2e3);
		return () => clearTimeout(t);
	}, []);
	if (state === "done") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		onTransitionEnd: () => {
			if (state === "out") setState("done");
		},
		className: `fixed inset-0 z-50 grid place-items-center bg-primary text-primary-foreground transition-opacity duration-500 ease-out ${state === "out" ? "pointer-events-none opacity-0" : "opacity-100"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-splash-in",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OyeLogo, {
				big: true,
				heartClassName: "fill-primary"
			})
		})
	});
}
var styles_default = "/assets/styles-CEhGx-ut.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message: describeThrown(error),
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
var MAX_SERIALIZED_LENGTH = 2e3;
function describeThrown(error) {
	if (error instanceof Response) return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	const { message } = error ?? {};
	if (typeof message === "string" && message.length > 0) return message;
	try {
		return JSON.stringify(error)?.slice(0, MAX_SERIALIZED_LENGTH) ?? String(error);
	} catch {
		return String(error);
	}
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$10 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "OYE" },
			{
				name: "theme-color",
				content: "#0C6BC5"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$10.useRouteContext();
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		const { data } = supabase.auth.onAuthStateChange((event) => {
			if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
			if (event === "SIGNED_OUT") queryClient.clear();
			else queryClient.invalidateQueries();
			router.invalidate();
		});
		return () => data.subscription.unsubscribe();
	}, [queryClient, router]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Splash, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" })
		]
	});
}
var $$splitComponentImporter$6 = () => import("./route-Di7iQBCH.mjs");
var Route$9 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async ({ context }) => {
		const me = await context.queryClient.fetchQuery(meQuery);
		if (!me.user) throw redirect({ to: "/bienvenida" });
		if (!me.profile) throw redirect({
			to: "/bienvenida",
			search: { paso: "perfil" }
		});
	},
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./admin-B3-pnG57.mjs");
var Route$8 = createFileRoute("/admin")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "Administración · OYE" },
		{
			name: "description",
			content: "Actualice los datos de las personas, los voluntarios y la organización."
		},
		{
			property: "og:title",
			content: "Administración · OYE"
		},
		{
			property: "og:description",
			content: "Panel de administración de OYE."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./avisos-0clVQXR0.mjs");
var Route$7 = createFileRoute("/_authenticated/avisos")({
	head: () => ({ meta: [
		{ title: "Avisos de mi barrio · OYE" },
		{
			name: "description",
			content: "Los vecinos que necesitan compañía cerca de usted, por orden de espera."
		},
		{
			property: "og:title",
			content: "Avisos de mi barrio · OYE"
		},
		{
			property: "og:description",
			content: "Quién necesita compañía ahora, en tiempo real."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./historial-DbzaDpik.mjs");
var Route$6 = createFileRoute("/_authenticated/historial")({
	validateSearch: personSearch,
	head: () => ({ meta: [
		{ title: "Historial de llamadas · OYE" },
		{
			name: "description",
			content: "Todas las llamadas de OYE, con su duración y lo que la IA entendió en cada una."
		},
		{
			property: "og:title",
			content: "Historial de llamadas · OYE"
		},
		{
			property: "og:description",
			content: "Cada llamada, con su detalle."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./llamada-BCA4lZZV.mjs");
var Route$5 = createFileRoute("/_authenticated/llamada")({
	validateSearch: personSearch,
	head: () => ({ meta: [
		{ title: "La llamada de OYE" },
		{
			name: "description",
			content: "Escuche cómo llama OYE, cómo la IA entiende la conversación y a quién avisa."
		},
		{
			property: "og:title",
			content: "La llamada de OYE"
		},
		{
			property: "og:description",
			content: "La IA llama, entiende y avisa a vecinos y familia."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./perfil-ChfWMJ6y.mjs");
var Route$4 = createFileRoute("/_authenticated/perfil")({
	head: () => ({ meta: [
		{ title: "Mi perfil · OYE" },
		{
			name: "description",
			content: "Sus datos en OYE."
		},
		{
			property: "og:title",
			content: "Mi perfil · OYE"
		},
		{
			property: "og:description",
			content: "Sus datos en OYE."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./persona-DDlEA3nn.mjs");
var Route$3 = createFileRoute("/_authenticated/persona")({
	validateSearch: personSearch,
	head: () => ({ meta: [
		{ title: "Ficha de la persona · OYE" },
		{
			name: "description",
			content: "Agenda, contacto con llave y medida de soledad de cada persona mayor."
		},
		{
			property: "og:title",
			content: "Ficha de la persona · OYE"
		},
		{
			property: "og:description",
			content: "Lo que OYE necesita saber para cuidar mejor."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var requestSchema = objectType({ person_id: stringType().trim().min(1) });
var Route$2 = createFileRoute("/api/start-call")({ server: { handlers: { POST: async ({ request }) => {
	let json;
	try {
		json = await request.json();
	} catch {
		return Response.json({ error: "JSON inválido" }, { status: 400 });
	}
	const parsed = requestSchema.safeParse(json);
	if (!parsed.success) return Response.json({
		error: "person_id es obligatorio",
		issues: parsed.error.issues
	}, { status: 400 });
	const personId = parsed.data.person_id;
	const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
	const { data: senior, error: seniorError } = await supabaseAdmin.from("seniors").select("id, name, phone, age").eq("id", personId).maybeSingle();
	if (seniorError || !senior) return Response.json({ error: "Persona no encontrada" }, { status: 404 });
	const { data: link } = await supabaseAdmin.from("person_links").select("relation").eq("senior_id", personId).maybeSingle();
	const relationship = link?.relation || "Familiar";
	let rawPhone = (senior.phone || "").replace(/[^\d+]/g, "");
	if (!rawPhone) return Response.json({ error: "Teléfono no registrado" }, { status: 400 });
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
	const makeUrl = process.env["MAKE_START_CALL_URL"];
	if (!makeUrl) {
		const fakeConvId = `dev-${crypto.randomUUID()}`;
		await supabaseAdmin.from("call_logs").insert({
			conversation_id: fakeConvId,
			person_id: senior.id,
			nombre: senior.name.split(" ")[0],
			telefono_usuario: rawPhone,
			status: "llamando"
		});
		return Response.json({
			ok: true,
			conversation_id: fakeConvId,
			call_sid: "dev-mock-sid",
			mocked: true
		});
	}
	try {
		const makeRes = await fetch(makeUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		if (!makeRes.ok) {
			const err = await makeRes.text();
			return Response.json({
				error: "Error de Make S1",
				details: err
			}, { status: 502 });
		}
		const makeData = await makeRes.json().catch(() => ({}));
		return Response.json({
			ok: true,
			conversation_id: makeData.conversation_id ?? null,
			call_sid: makeData.call_sid ?? null
		});
	} catch (err) {
		return Response.json({
			error: "No se pudo conectar con Make",
			details: String(err)
		}, { status: 500 });
	}
} } } });
var STATUS = [
	"llamando",
	"urgencia_en_curso",
	"analizando",
	"completada",
	"rechazada",
	"no_contesta",
	"error"
];
var FINAL = [
	"completada",
	"rechazada",
	"no_contesta"
];
var IN_PROGRESS = ["llamando", "analizando"];
var bodySchema = objectType({
	conversation_id: stringType().trim().min(1).max(200),
	call_sid: stringType().max(200).nullish(),
	person_id: stringType().trim().min(1).max(200).optional(),
	nombre: stringType().max(200).nullish(),
	telefono_usuario: stringType().max(50).nullish(),
	status: enumType(STATUS).optional(),
	motivo: stringType().max(2e3).nullish(),
	duracion_seg: coerce.number().int().min(0).max(86400).nullish(),
	llamada_inicio: stringType().datetime({ offset: true }).nullish(),
	nivel_alerta: enumType([
		"VERDE",
		"AMARILLO",
		"ROJO"
	]).nullish(),
	global_pct: coerce.number().int().min(0).max(100).nullish(),
	activar_protocolo_voy_yo: booleanType().nullish(),
	acepta_llamada: booleanType().nullish(),
	acepta_llamadas_diarias: booleanType().nullish(),
	report: unknownType().optional()
});
var querySchema = objectType({
	person_id: stringType().trim().min(1).max(200),
	exclude_conversation_id: stringType().trim().min(1).max(200).optional()
});
function safeEqual(a, b) {
	if (a.length !== b.length) return false;
	let r = 0;
	for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return r === 0;
}
function authorized(request) {
	const secret = process.env["CALL_LOGS_WEBHOOK_SECRET"];
	const given = request.headers.get("x-webhook-secret") ?? "";
	return !!secret && safeEqual(given, secret);
}
var unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
var Route$1 = createFileRoute("/api/public/call-logs")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!authorized(request)) return unauthorized();
		const url = new URL(request.url);
		const parsed = querySchema.safeParse({
			person_id: url.searchParams.get("person_id") ?? void 0,
			exclude_conversation_id: url.searchParams.get("exclude_conversation_id") || void 0
		});
		if (!parsed.success) return Response.json({
			error: "person_id es obligatorio",
			issues: parsed.error.issues
		}, { status: 400 });
		const { supabaseAdmin: sb } = await import("./client.server-KzwUIAkW.mjs");
		let q = sb.from("call_logs").select("*").eq("person_id", parsed.data.person_id);
		if (parsed.data.exclude_conversation_id) q = q.neq("conversation_id", parsed.data.exclude_conversation_id);
		const { data, error } = await q.order("created_at", { ascending: false }).limit(3);
		if (error) return Response.json({ error: "No se pudo leer" }, { status: 500 });
		return Response.json({
			ok: true,
			count: data.length,
			calls: data
		});
	},
	POST: async ({ request }) => {
		if (!authorized(request)) return unauthorized();
		let json;
		try {
			json = await request.json();
		} catch {
			return Response.json({ error: "JSON inválido" }, { status: 400 });
		}
		const parsed = bodySchema.safeParse(json);
		if (!parsed.success) return Response.json({
			error: "Datos inválidos",
			issues: parsed.error.issues
		}, { status: 400 });
		const row = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== void 0));
		const { supabaseAdmin: sb } = await import("./client.server-KzwUIAkW.mjs");
		const { data: existing } = await sb.from("call_logs").select("id, status").eq("conversation_id", parsed.data.conversation_id).maybeSingle();
		if (existing) {
			let statusIgnored = false;
			if (existing.status && FINAL.includes(existing.status) && row["status"] && IN_PROGRESS.includes(row["status"])) {
				delete row["status"];
				statusIgnored = true;
			}
			const { data, error } = await sb.from("call_logs").update(row).eq("id", existing.id).select("*").single();
			if (error) return Response.json({ error: "No se pudo actualizar" }, { status: 500 });
			return Response.json({
				ok: true,
				action: "updated",
				status_ignored: statusIgnored,
				data
			});
		}
		if (!parsed.data.person_id) return Response.json({ error: "person_id es obligatorio para un registro nuevo" }, { status: 400 });
		const { data, error } = await sb.from("call_logs").insert(row).select("*").single();
		if (error) return Response.json({ error: "No se pudo guardar" }, { status: 500 });
		return Response.json({
			ok: true,
			action: "inserted",
			status_ignored: false,
			data
		}, { status: 201 });
	}
} } });
async function authenticateCronRequest(request) {
	const currentSecret = process.env["LOVABLE_CRON_SECRET"];
	const previousSecret = process.env["LOVABLE_CRON_SECRET_PREVIOUS"];
	if (!currentSecret) return new Response("Server configuration error", { status: 500 });
	const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
	if (!token) return new Response("Unauthorized", { status: 401 });
	const { createHash, timingSafeEqual } = await import("node:crypto");
	const digest = (value) => createHash("sha256").update(value, "utf8").digest();
	const providedDigest = digest(token);
	const currentMatches = timingSafeEqual(providedDigest, digest(currentSecret));
	const previousMatches = timingSafeEqual(providedDigest, digest(previousSecret ?? currentSecret));
	if (!currentMatches && !previousMatches) return new Response("Unauthorized", { status: 401 });
	return null;
}
var BATCH = 10;
function madridNow() {
	const f = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Madrid",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hourCycle: "h23",
		weekday: "short"
	});
	const p = Object.fromEntries(f.formatToParts(/* @__PURE__ */ new Date()).map((x) => [x.type, x.value]));
	const dow = [
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
		"Sun"
	].indexOf(p["weekday"] ?? "") + 1;
	return {
		date: `${p["year"]}-${p["month"]}-${p["day"]}`,
		hour: Number(p["hour"]),
		dow
	};
}
var Route = createFileRoute("/api/public/jobs/llamadas")({ server: { handlers: { POST: async ({ request }) => {
	const authFailure = await authenticateCronRequest(request);
	if (authFailure) return authFailure;
	const { supabaseAdmin: sb } = await import("./client.server-KzwUIAkW.mjs");
	const { runCallAnalysis, AiError } = await import("./call.server-CDadVbLm.mjs");
	const { SCENARIOS } = await import("./scenarios-C3I3mbc3.mjs");
	const { data: state } = await sb.from("call_job_state").select("*").eq("id", 1).single();
	const probe = !!state?.paused_reason;
	const until = new Date(Date.now() + 3e5).toISOString();
	const { data: lock } = await sb.from("call_job_state").update({ locked_until: until }).eq("id", 1).or(`locked_until.is.null,locked_until.lt.${(/* @__PURE__ */ new Date()).toISOString()}`).select("id");
	if (!lock?.length) return Response.json({ skipped: "locked" });
	const now = madridNow();
	let done = 0;
	try {
		const { data: due } = await sb.from("call_schedules").select("*").eq("active", true).lte("call_hour", now.hour).contains("days", [now.dow]).or(`last_run_on.is.null,last_run_on.lt.${now.date}`).limit(probe ? 1 : BATCH);
		for (const s of due ?? []) {
			if (!s.senior_id) {
				await sb.from("call_schedules").update({
					active: false,
					last_error: "Pendiente de verificar la persona"
				}).eq("id", s.id);
				continue;
			}
			await sb.from("call_schedules").update({
				last_run_on: now.date,
				last_error: ""
			}).eq("id", s.id);
			const r = Math.random();
			const key = r < .5 ? "bien" : r < .75 ? "compania" : r < .92 ? "bajo" : "no_contesta";
			try {
				await runCallAnalysis(sb, s.created_by, {
					seniorId: s.senior_id,
					seniorName: s.senior_name,
					lines: SCENARIOS[key].lines(s.senior_name)
				});
				done++;
				if (probe) await sb.from("call_job_state").update({ paused_reason: "" }).eq("id", 1);
			} catch (e) {
				const status = e instanceof AiError ? e.status : 500;
				await sb.from("call_schedules").update({
					last_error: e.message,
					last_run_on: status === 429 || status >= 500 ? null : now.date
				}).eq("id", s.id);
				if (status === 402 || status === 403) {
					await sb.from("call_job_state").update({ paused_reason: e.message }).eq("id", 1);
					break;
				}
				if (status === 429) break;
			}
		}
	} finally {
		await sb.from("call_job_state").update({ locked_until: null }).eq("id", 1);
	}
	return Response.json({
		success: true,
		done
	});
} } } });
var AuthenticatedRouteRoute = Route$9.update({
	id: "/_authenticated",
	getParentRoute: () => Route$10
});
var AdminRoute = Route$8.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$10
});
var BienvenidaRoute = Route$12.update({
	id: "/bienvenida",
	path: "/bienvenida",
	getParentRoute: () => Route$10
});
var RecomendarRoute = Route$13.update({
	id: "/recomendar",
	path: "/recomendar",
	getParentRoute: () => Route$10
});
var AuthenticatedIndexRoute = Route$11.update({
	id: "/",
	path: "/",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAvisosRoute = Route$7.update({
	id: "/avisos",
	path: "/avisos",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedHistorialRoute = Route$6.update({
	id: "/historial",
	path: "/historial",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedLlamadaRoute = Route$5.update({
	id: "/llamada",
	path: "/llamada",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedPerfilRoute = Route$4.update({
	id: "/perfil",
	path: "/perfil",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedPersonaRoute = Route$3.update({
	id: "/persona",
	path: "/persona",
	getParentRoute: () => AuthenticatedRouteRoute
});
var ApiStartCallRoute = Route$2.update({
	id: "/api/start-call",
	path: "/api/start-call",
	getParentRoute: () => Route$10
});
var ApiPublicCallLogsRoute = Route$1.update({
	id: "/api/public/call-logs",
	path: "/api/public/call-logs",
	getParentRoute: () => Route$10
});
var ApiPublicJobsLlamadasRoute = Route.update({
	id: "/api/public/jobs/llamadas",
	path: "/api/public/jobs/llamadas",
	getParentRoute: () => Route$10
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAvisosRoute,
	AuthenticatedHistorialRoute,
	AuthenticatedLlamadaRoute,
	AuthenticatedPerfilRoute,
	AuthenticatedPersonaRoute,
	AuthenticatedIndexRoute
};
var rootRouteChildren = {
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AdminRoute,
	BienvenidaRoute,
	RecomendarRoute,
	ApiStartCallRoute,
	ApiPublicCallLogsRoute,
	ApiPublicJobsLlamadasRoute
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
