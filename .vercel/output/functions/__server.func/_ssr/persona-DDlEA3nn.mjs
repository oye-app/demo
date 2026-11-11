import { r as __toESM } from "../_runtime.mjs";
import { m as useBlocker } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as personDisplayName } from "./person-presentation-DhLlwfkg.mjs";
import { t as supabase } from "./client-BoBTfay3.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient, r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { I as CalendarDays, R as Cake, T as HeartHandshake, b as KeyRound, f as Pill, s as Sparkles } from "../_libs/lucide-react.mjs";
import { C as useMe, S as useAlerts, T as usePerson, g as lonelyLabel, l as Screen, t as BigButton, u as Segmented, x as timeAgo } from "./oye-C9NPyxa_.mjs";
import { t as PersonGate } from "./person-context-e8jbszAA.mjs";
import { t as WellbeingCard } from "./wellbeing-card-B-wvy7nr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/persona-DDlEA3nn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PersonPage() {
	const { person, sid } = usePerson();
	const [tab, setTab] = (0, import_react.useState)("agenda");
	const name = person?.name ?? "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Screen, {
		title: "Ficha de la persona",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
			value: tab,
			onChange: setTab,
			items: [{
				k: "agenda",
				l: "Agenda y llave"
			}, {
				k: "soledad",
				l: "Soledad"
			}]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2",
			children: [name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WellbeingCard, {
				senior: personDisplayName(name),
				seniorId: sid
			}) : null, !name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-10 text-center text-muted-foreground",
				children: "Aún no hay personas. Haga una primera llamada."
			}) : tab === "agenda" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Agenda, {
				name,
				seniorId: sid ?? ""
			}, sid) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loneliness, { name: personDisplayName(name) }, sid)]
		})]
	});
}
function Agenda({ name, seniorId }) {
	const { user } = useMe();
	const qc = useQueryClient();
	const { data, isLoading, error: loadError } = useQuery({
		queryKey: [
			"care",
			user.id,
			seniorId
		],
		queryFn: async () => {
			const { data, error } = await supabase.from("senior_care").select("*").eq("senior_id", seniorId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const [f, setF] = (0, import_react.useState)({
		key_contact_name: "",
		key_contact_phone: "",
		meds: "",
		appointments: "",
		birthday: ""
	});
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [saved, setSaved] = (0, import_react.useState)(false);
	const baseline = data ? {
		key_contact_name: data.key_contact_name,
		key_contact_phone: data.key_contact_phone,
		meds: data.meds,
		appointments: data.appointments,
		birthday: data.birthday
	} : {
		key_contact_name: "",
		key_contact_phone: "",
		meds: "",
		appointments: "",
		birthday: ""
	};
	const dirty = JSON.stringify(f) !== JSON.stringify(baseline) && !saved;
	const blocker = useBlocker({
		shouldBlockFn: () => dirty,
		enableBeforeUnload: dirty,
		withResolver: true
	});
	(0, import_react.useEffect)(() => {
		if (data) setF({
			key_contact_name: data.key_contact_name,
			key_contact_phone: data.key_contact_phone,
			meds: data.meds,
			appointments: data.appointments,
			birthday: data.birthday
		});
	}, [data]);
	async function save(e) {
		e?.preventDefault();
		if (f.key_contact_phone && !/^[+()\d\s-]{7,24}$/.test(f.key_contact_phone)) {
			toast.error("Revise el teléfono del contacto.");
			return;
		}
		setBusy(true);
		const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim().slice(0, 300)]));
		const { error } = data ? await supabase.from("senior_care").update(clean).eq("id", data.id) : await supabase.from("senior_care").insert({
			...clean,
			senior_id: seniorId,
			senior_name: name,
			created_by: user.id
		});
		setBusy(false);
		if (error) {
			toast.error("No se pudo guardar. Inténtelo otra vez.");
			return;
		}
		toast.success("Guardado. OYE lo tendrá en cuenta en la próxima llamada.");
		setSaved(true);
		await qc.invalidateQueries({ queryKey: [
			"care",
			user.id,
			seniorId
		] });
		if (blocker.status === "blocked") blocker.proceed();
	}
	const field = (k, label, ph, Icon, type = "text") => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "mb-1 flex items-center gap-1.5 text-sm font-semibold",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-primary" }), label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type,
			value: f[k],
			onChange: (e) => {
				setSaved(false);
				setF({
					...f,
					[k]: e.target.value
				});
			},
			placeholder: ph,
			className: "h-12 w-full rounded-xl border bg-card px-3 text-base outline-none focus:ring-2 focus:ring-ring"
		})]
	});
	if (loadError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		role: "alert",
		className: "text-destructive",
		children: "No se pudo cargar la ficha. Vuelve a intentarlo desde Inicio."
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "pt-10 text-center text-muted-foreground",
		children: "Cargando…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: save,
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3 rounded-3xl bg-card p-4 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-semibold",
						children: [
							"Si ",
							personDisplayName(name),
							" no contesta, ¿quién tiene llave?"
						]
					}),
					field("key_contact_name", "Contacto con llave", "Ej.: Rosa, vecina del 2.º", KeyRound),
					field("key_contact_phone", "Teléfono del contacto", "600 000 000", KeyRound, "tel")
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3 rounded-3xl bg-card p-4 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Lo que OYE recordará en la llamada"
					}),
					field("meds", "Medicación", "Ej.: tensión por la mañana", Pill),
					field("appointments", "Citas", "Ej.: médico el jueves 10:00", CalendarDays),
					field("birthday", "Cumpleaños", "Ej.: 14 de marzo", Cake)
				]
			}),
			blocker.status === "blocked" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "Cambios sin guardar",
				className: "fixed inset-0 z-50 grid place-items-center bg-background/95 p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm space-y-3 rounded-2xl border bg-card p-5 shadow-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold",
							children: "Cambios sin guardar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							disabled: busy,
							onClick: () => {
								save();
							},
							children: "Guardar y salir"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							tone: "ghost",
							onClick: () => blocker.proceed(),
							children: "Descartar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							tone: "quiet",
							onClick: () => blocker.reset(),
							children: "Seguir editando"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				disabled: busy,
				children: busy ? "Guardando…" : "Guardar"
			})
		]
	});
}
function Loneliness({ name }) {
	const { data: alerts = [] } = useAlerts();
	const scored = alerts.filter((a) => a.loneliness_score != null).slice(0, 8).flatMap((a) => a.loneliness_score == null ? [] : [{
		score: a.loneliness_score,
		at: a.created_at
	}]);
	const last = scored[0];
	const first = scored.length > 1 ? scored[scored.length - 1] : void 0;
	const max = Math.max(...scored.map((s) => s.score), 9);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-4 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartHandshake, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-extrabold",
						children: ["Cómo se siente ", name]
					})]
				}), last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-2xl font-extrabold",
					children: [
						lonelyLabel(last.score),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-base font-semibold text-muted-foreground",
							children: [
								"· ",
								last.score,
								"/9"
							]
						})
					]
				}), first && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: last.score < first.score ? `Ha mejorado ${first.score - last.score} puntos desde la primera llamada` : last.score > first.score ? "Ha empeorado: conviene más visitas" : "Igual que al empezar"
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Aún sin medir. La IA la calcula en la próxima llamada."
				})]
			}),
			scored.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-4 shadow-card",
				"aria-label": "Evolución de la soledad",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm font-semibold",
					children: "Evolución por llamada"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-24 items-end gap-1.5",
					children: [...scored].reverse().map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-1 flex-col items-center gap-1",
						title: `${s.score}/9 · ${timeAgo(s.at)}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-muted-foreground",
							children: s.score
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `w-full rounded-t-md ${s.score >= 6 ? "bg-warning" : "bg-success"}`,
							style: { height: `${s.score / max * 100}%` }
						})]
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mt-0.5 size-4 shrink-0" }),
					"La IA la calcula sola en cada llamada, escuchando cómo habla ",
					name,
					". Escala 3-9: a partir de 6, se siente sola."
				]
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonGate, {
	privateData: true,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonPage, {})
});
//#endregion
export { SplitComponent as component };
