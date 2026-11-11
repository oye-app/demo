import { r as __toESM } from "../_runtime.mjs";
import { S as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as stringType, o as numberType, s as objectType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-CxM3OIUX.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { D as Copy, P as Check, _ as MessageCircle } from "../_libs/lucide-react.mjs";
import { f as btn, l as Screen, t as BigButton } from "./oye-aRCGgmP7.mjs";
import { t as Route } from "./recomendar-DbESguv8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/recomendar-CsQfGPNK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RELATIONS = [
	"Mi madre o padre",
	"Mi abuela o abuelo",
	"Un vecino o vecina"
];
var seniorSchema = objectType({
	person_name: stringType().trim().min(2, "Escriba su nombre").max(100),
	person_age: numberType().int().min(50).max(120).nullable(),
	person_phone: stringType().trim().min(6, "Escriba un teléfono").max(30).regex(/^[0-9+\s()-]+$/, "Solo números"),
	referrer_name: stringType().trim().min(2, "Escriba su nombre").max(100),
	referrer_phone: stringType().trim().max(30).regex(/^[0-9+\s()-]*$/, "Solo números")
});
var volunteerSchema = objectType({
	person_name: stringType().trim().min(2, "Escriba su nombre").max(100),
	person_phone: stringType().trim().min(6, "Escriba un teléfono").max(30).regex(/^[0-9+\s()-]+$/, "Solo números"),
	neighborhood: stringType().trim().min(2, "¿En qué barrio vive?").max(100)
});
function myCode() {
	let c = localStorage.getItem("oye-ref");
	if (!c) {
		c = Math.random().toString(36).slice(2, 8).toUpperCase();
		localStorage.setItem("oye-ref", c);
	}
	return c;
}
var field = "h-12 w-full rounded-xl border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
function Recommend() {
	const { tipo = "mayor", ref = "" } = Route.useSearch();
	const navigate = useNavigate({ from: "/recomendar" });
	const [done, setDone] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [relation, setRelation] = (0, import_react.useState)(RELATIONS[0]);
	const [consent, setConsent] = (0, import_react.useState)(false);
	const [v, setV] = (0, import_react.useState)({
		person_name: "",
		person_age: "",
		person_phone: "",
		referrer_name: "",
		referrer_phone: "",
		neighborhood: ""
	});
	const set = (k) => (e) => setV({
		...v,
		[k]: e.target.value
	});
	(0, import_react.useEffect)(() => {
		setDone(false);
		setError("");
	}, [tipo]);
	async function submit(e) {
		e.preventDefault();
		setError("");
		if (!consent) return setError(tipo === "mayor" ? "Confirme que la persona está de acuerdo." : "Acepte para continuar.");
		const parsed = tipo === "mayor" ? seniorSchema.safeParse({
			...v,
			person_age: v.person_age ? Number(v.person_age) : null
		}) : volunteerSchema.safeParse(v);
		if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Revise los datos");
		setBusy(true);
		const { error: err } = await supabase.from("referrals").insert({
			...parsed.data,
			kind: tipo === "mayor" ? "senior" : "volunteer",
			relation: tipo === "mayor" ? relation : "",
			referrer_code: myCode(),
			via_code: ref,
			consent: true
		});
		setBusy(false);
		if (err) return setError("No se pudo enviar. Inténtelo de nuevo.");
		setDone(true);
	}
	if (done) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thanks, {
		tipo,
		name: v.person_name.split(" ")[0] ?? ""
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Screen, {
		title: tipo === "mayor" ? "Recomendar" : "Ser voluntario",
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-center text-sm font-semibold text-destructive",
				children: error
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				onClick: () => document.getElementById("rec-form")?.requestSubmit(),
				disabled: busy,
				children: busy ? "Enviando…" : "Enviar"
			})]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "tablist",
			className: "grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1",
			children: ["mayor", "voluntario"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				role: "tab",
				"aria-selected": tipo === t,
				onClick: () => navigate({ search: (p) => ({
					...p,
					tipo: t
				}) }),
				className: `h-10 rounded-xl text-sm font-bold transition ${tipo === t ? "bg-card text-primary shadow-card" : "text-secondary-foreground"}`,
				children: t === "mayor" ? "Recomendar a un mayor" : "Quiero ayudar"
			}, t))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			id: "rec-form",
			onSubmit: submit,
			className: "mt-4 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto",
			children: [
				tipo === "mayor" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						role: "radiogroup",
						"aria-label": "¿Quién es?",
						children: RELATIONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "radio",
							"aria-checked": relation === r,
							onClick: () => setRelation(r),
							className: `tap rounded-full px-3.5 py-2 text-sm font-semibold ${relation === r ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`,
							children: r
						}, r))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[1fr_5.5rem] gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: field,
							placeholder: "Nombre de la persona mayor",
							"aria-label": "Nombre de la persona mayor",
							value: v.person_name,
							onChange: set("person_name"),
							maxLength: 100
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: field,
							placeholder: "Edad",
							"aria-label": "Edad",
							inputMode: "numeric",
							value: v.person_age,
							onChange: set("person_age"),
							maxLength: 3
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Teléfono de la persona mayor",
						"aria-label": "Teléfono de la persona mayor",
						inputMode: "tel",
						value: v.person_phone,
						onChange: set("person_phone"),
						maxLength: 30
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
						children: "Sus datos"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Su nombre",
						"aria-label": "Su nombre",
						value: v.referrer_name,
						onChange: set("referrer_name"),
						maxLength: 100
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Su teléfono (opcional)",
						"aria-label": "Su teléfono",
						inputMode: "tel",
						value: v.referrer_phone,
						onChange: set("referrer_phone"),
						maxLength: 30
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "Le avisaremos cuando un vecino quiera compañía. Usted decide."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Su nombre",
						"aria-label": "Su nombre",
						value: v.person_name,
						onChange: set("person_name"),
						maxLength: 100
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Su móvil",
						"aria-label": "Su móvil",
						inputMode: "tel",
						value: v.person_phone,
						onChange: set("person_phone"),
						maxLength: 30
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Su barrio",
						"aria-label": "Su barrio",
						value: v.neighborhood,
						onChange: set("neighborhood"),
						maxLength: 100
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-1 flex items-start gap-3 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "mt-0.5 size-5 shrink-0 accent-primary",
						checked: consent,
						onChange: (e) => setConsent(e.target.checked)
					}), tipo === "mayor" ? "La persona sabe que la recomiendo y está de acuerdo en que la ONG la llame." : "Acepto que la ONG me contacte. Mis datos solo se usan para OYE."]
				}),
				ref && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-center text-xs text-muted-foreground",
					children: ["Le ha invitado un vecino · código ", ref]
				})
			]
		})]
	});
}
function Thanks({ tipo, name }) {
	const [code, setCode] = (0, import_react.useState)("");
	const [count, setCount] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const c = myCode();
		setCode(c);
		supabase.rpc("referral_count", { _code: c }).then(({ data }) => setCount(data ?? 0));
	}, []);
	const link = typeof window !== "undefined" ? `${window.location.origin}/recomendar?ref=${code}` : "";
	const msg = `Yo me he apuntado a OYE: llaman cada día a mayores que viven solos y, si algo va mal, va un vecino. ¿Conoces a alguien? ${link}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, {
		title: "¡Gracias!",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col items-center justify-center text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-20 place-items-center rounded-full bg-success text-success-foreground animate-rise",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-10" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-5 text-3xl font-extrabold leading-tight",
					children: tipo === "mayor" ? `La ONG llamará a ${name || "su familiar"}` : "Ya es parte del barrio"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xs text-muted-foreground",
					children: tipo === "mayor" ? "En 48 h le llamarán. Es gratis." : "La ONG le llamará para conocerle."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 w-full rounded-3xl bg-card p-5 shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-bold",
							children: "Cada vecino que invita suma"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: [
								"Su cadena de vecinos: ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-primary",
									children: count ?? "…"
								}),
								" ",
								count === 1 ? "recomendación" : "recomendaciones"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `https://wa.me/?text=${encodeURIComponent(msg)}`,
								target: "_blank",
								rel: "noreferrer",
								className: btn("success", "sm"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-5" }), " WhatsApp"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									navigator.clipboard.writeText(link);
									setCopied(true);
								},
								className: btn("ghost", "sm"),
								children: [
									copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-5" }),
									" ",
									copied ? "Copiado" : "Copiar enlace"
								]
							})]
						})
					]
				})
			]
		})
	});
}
//#endregion
export { Recommend as component };
