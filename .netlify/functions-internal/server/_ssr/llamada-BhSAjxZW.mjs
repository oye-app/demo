import { r as __toESM } from "../_runtime.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dcy-eaQM.mjs";
import { n as personDisplayName } from "./person-presentation-DhLlwfkg.mjs";
import { i as enumType, l as stringType, s as objectType, t as arrayType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-CxM3OIUX.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient, r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as Brain, E as HandHeart, L as CalendarClock, P as Check, V as Bell, m as PhoneOff, p as Phone, r as Users, s as Sparkles } from "../_libs/lucide-react.mjs";
import { C as useMe, E as useServerFn, S as useAlerts, T as usePerson, g as lonelyLabel, i as NEED, l as Screen, p as createSsrRpc, r as MOOD, t as BigButton, x as timeAgo } from "./oye-aRCGgmP7.mjs";
import { i as useLatestCallLog, n as SituationReportCard, t as AlertTimeline } from "./situation-report-BRyDPfgd.mjs";
import { t as PersonGate } from "./person-context-Dsg5xSNM.mjs";
import { SCENARIOS } from "./scenarios-C3I3mbc3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/llamada-BhSAjxZW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var inputSchema = objectType({
	seniorId: stringType().uuid(),
	seniorName: stringType().trim().min(1).max(100),
	lines: arrayType(objectType({
		who: enumType(["oye", "mayor"]),
		text: stringType().max(500)
	})).min(1).max(30)
});
var analyzeCall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => inputSchema.parse(d)).handler(createSsrRpc("11e13fc3e19f615027ad4a41b3b9bb9f16045ec6e88c4bf04daa8b7943d55575"));
/**
* Backend function to initiate a real outbound call via Make scenario S1 (Contract A).
* Receives personId, loads person details, formats phone into E.164,
* and POSTs { person_id, name, phone, age, relationship } to MAKE_START_CALL_URL.
*/
var startCall = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({ personId: stringType().uuid() }).parse(d)).handler(createSsrRpc("dc93c5071676c5c5028fbdbf2ebd3f08aca5997bb350853586704c3d214b6ac0"));
var DAYS = [
	"L",
	"M",
	"X",
	"J",
	"V",
	"S",
	"D"
];
/** Daily automatic call: OYE calls this person every chosen day at a set hour (Madrid time). */
function AutoCall({ name, userId, seniorId }) {
	const qc = useQueryClient();
	const { data = [] } = useQuery({
		queryKey: [
			"schedules",
			userId,
			seniorId
		],
		queryFn: async () => (await supabase.from("call_schedules").select("*").eq("senior_id", seniorId).order("created_at")).data ?? []
	});
	const s = data.find((x) => x.senior_id === seniorId);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const refresh = () => qc.invalidateQueries({ queryKey: [
		"schedules",
		userId,
		seniorId
	] });
	async function save(patch) {
		setBusy(true);
		const result = s ? await supabase.from("call_schedules").update(patch).eq("id", s.id) : await supabase.from("call_schedules").insert({
			senior_id: seniorId,
			senior_name: name,
			created_by: userId,
			...patch
		});
		setBusy(false);
		if (result.error) {
			toast.error("No se pudo guardar la programación.");
			return;
		}
		refresh();
	}
	const on = !!s?.active;
	const hour = s?.call_hour ?? 11;
	const days = s?.days ?? [
		1,
		2,
		3,
		4,
		5,
		6,
		7
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4 rounded-2xl bg-card p-3 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "size-5 shrink-0 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-bold leading-tight",
							children: [
								"Llamar a ",
								personDisplayName(name),
								" cada día"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: on ? `Activo · ${String(hour).padStart(2, "0")}:00 h` : "Programación de llamadas simuladas"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						role: "switch",
						"aria-checked": on,
						"aria-label": "Llamada automática",
						disabled: busy || !name.trim(),
						onClick: () => save({ active: !on }),
						className: `relative h-8 w-14 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-1 size-6 rounded-full bg-card shadow transition-all ${on ? "left-7" : "left-1"}` })
					})
				]
			}),
			on && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-2 border-t pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					"aria-label": "Hora",
					value: hour,
					onChange: (e) => save({ call_hour: Number(e.target.value) }),
					className: "h-9 rounded-lg border bg-card px-2 text-sm font-semibold",
					children: Array.from({ length: 14 }, (_, i) => i + 8).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: h,
						children: [h, ":00"]
					}, h))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-1 justify-between",
					children: DAYS.map((d, i) => {
						const n = i + 1;
						const sel = days.includes(n);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-pressed": sel,
							"aria-label": `Día ${d}`,
							onClick: () => {
								const nd = sel ? days.filter((x) => x !== n) : [...days, n].sort();
								if (nd.length) save({ days: nd });
							},
							className: `tap size-10 rounded-full text-sm font-bold ${sel ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`,
							children: d
						}, d);
					})
				})]
			}),
			s?.last_error && on && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs font-semibold text-destructive",
				children: ["Última llamada automática: ", s.last_error]
			})
		]
	});
}
var TALK_STEPS = [
	"OYE saluda y pregunta cómo está",
	"Escucha con atención",
	"Pregunta por su día y su ánimo",
	"Se despide hasta mañana"
];
function Call() {
	const { user } = useMe();
	const { person, sid } = usePerson();
	const name = personDisplayName(person?.name ?? "");
	const [mode, setMode] = (0, import_react.useState)("idle");
	const [simPhase, setSimPhase] = (0, import_react.useState)("pick");
	const [elapsed, setElapsed] = (0, import_react.useState)(0);
	const [talkStep, setTalkStep] = (0, import_react.useState)(0);
	const [simResult, setSimResult] = (0, import_react.useState)(null);
	const [simError, setSimError] = (0, import_react.useState)("");
	const [callingReal, setCallingReal] = (0, import_react.useState)(false);
	const analyze = useServerFn(analyzeCall);
	const triggerOutbound = useServerFn(startCall);
	const linesRef = (0, import_react.useRef)(SCENARIOS.bien.lines("Carmen"));
	const { data: all = [] } = useAlerts();
	const past = all.filter((a) => a.senior_id === sid).slice(0, 3);
	const { data: latestLog, refetch: refetchLog } = useLatestCallLog(sid);
	const isRealActive = mode === "real" || latestLog && [
		"llamando",
		"urgencia_en_curso",
		"analizando"
	].includes(latestLog.status);
	(0, import_react.useEffect)(() => {
		let t;
		if (isRealActive || simPhase === "talking" || simPhase === "ringing") t = setInterval(() => setElapsed((s) => s + 1), 1e3);
		return () => {
			if (t) clearInterval(t);
		};
	}, [isRealActive, simPhase]);
	async function handleStartRealCall() {
		if (!sid) {
			toast.error("Seleccione una persona primero.");
			return;
		}
		setCallingReal(true);
		setElapsed(0);
		setMode("real");
		try {
			if ((await triggerOutbound({ data: { personId: sid } })).ok) {
				toast.success("Llamada iniciada con éxito");
				await refetchLog();
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Error al iniciar la llamada";
			toast.error(msg);
			setMode("idle");
		} finally {
			setCallingReal(false);
		}
	}
	function handleStartSimulation() {
		setMode("sim");
		const n = name.trim() || "Carmen";
		const r = Math.random();
		linesRef.current = SCENARIOS[r < .4 ? "bien" : r < .7 ? "compania" : r < .9 ? "bajo" : "no_contesta"].lines(n);
		setElapsed(0);
		setTalkStep(0);
		setSimResult(null);
		setSimError("");
		setSimPhase("ringing");
	}
	(0, import_react.useEffect)(() => {
		if (mode !== "sim") return;
		if (simPhase === "ringing") {
			const t = setTimeout(() => setSimPhase("talking"), 2200);
			return () => clearTimeout(t);
		}
		if (simPhase === "talking") {
			if (talkStep >= TALK_STEPS.length) {
				setSimPhase("think");
				analyze({ data: {
					seniorId: sid ?? "",
					seniorName: person?.name ?? "",
					lines: linesRef.current
				} }).then((r) => {
					setSimResult(r);
					setSimPhase("done");
				}).catch((e) => {
					setSimError(e.message || "No se pudo analizar.");
					setSimPhase("error");
				});
				return;
			}
			const t = setTimeout(() => setTalkStep((s) => s + 1), 2600);
			return () => clearTimeout(t);
		}
	}, [
		mode,
		simPhase,
		talkStep
	]);
	const n = name.trim() || "Carmen";
	if (mode === "idle" && !isRealActive) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Screen, {
		title: "Llamada de OYE",
		footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BigButton, {
				disabled: callingReal,
				onClick: handleStartRealCall,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-5" }),
					" ",
					callingReal ? "Iniciando..." : "Llamar ahora (llamada real)"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				tone: "quiet",
				onClick: handleStartSimulation,
				children: "Simulación de llamada"
			})]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-3 text-2xl font-extrabold",
				children: ["Llamar a ", n]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Llamada telefónica asistida por IA con análisis geriátrico en tiempo real."
			}),
			latestLog && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2",
					children: "Último informe registrado"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SituationReportCard, { log: latestLog })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Memory, {
				past,
				name: n
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutoCall, {
				name: person?.name ?? "",
				seniorId: sid ?? "",
				userId: user.id
			})
		]
	});
	if (mode === "real" || isRealActive) {
		const isCompleted = latestLog && [
			"completada",
			"rechazada",
			"no_contesta",
			"error"
		].includes(latestLog.status);
		const isEmergency = latestLog?.status === "urgencia_en_curso";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, {
			title: isCompleted ? `Llamada a ${n}` : `Llamando a ${n}`,
			footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
					tone: "ghost",
					onClick: () => {
						setMode("idle");
						setElapsed(0);
					},
					children: "Otra llamada"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					search: { sid },
					className: "block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, { children: "Ver en inicio" })
				})]
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 space-y-4 overflow-y-auto pb-4",
				children: [!isCompleted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col items-center justify-center gap-4 py-8 text-center",
					"aria-live": "polite",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-cta",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ring absolute inset-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "relative size-10 animate-pulse" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-extrabold",
						children: latestLog?.status === "analizando" ? "Analizando conversación..." : isEmergency ? "¡Alerta en la llamada!" : `En llamada · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: latestLog?.status === "analizando" ? "Generando informe sociosanitario y cotejando historial" : isEmergency ? "Se ha detectado una situación crítica" : "Llamada activa en la línea telefónica"
					})] })]
				}), latestLog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SituationReportCard, { log: latestLog })]
			})
		});
	}
	const live = simPhase === "ringing" || simPhase === "talking";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, {
		title: live ? `Llamando a ${n}` : `Llamada a ${n}`,
		footer: simPhase === "done" || simPhase === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				tone: "ghost",
				onClick: () => {
					setMode("idle");
					setSimPhase("pick");
				},
				children: "Otra llamada"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				search: { sid },
				className: "block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, { children: "Ver en inicio" })
			})]
		}) : void 0,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto",
			children: [
				live && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex h-full flex-col items-center justify-center gap-5 text-center",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-cta",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ring absolute inset-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "relative size-10 animate-pulse" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-extrabold",
							children: simPhase === "ringing" ? "Llamando…" : `En llamada · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: simPhase === "ringing" ? `${n} está descolgando` : "La IA conversa y escucha"
						})] }),
						simPhase === "talking" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "w-full space-y-2",
							children: TALK_STEPS.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: `flex items-center gap-3 rounded-2xl p-3 text-left text-sm font-semibold transition-colors ${i < talkStep ? "bg-card text-muted-foreground" : i === talkStep ? "bg-primary/10 text-primary" : "text-muted-foreground/50"}`,
								children: [i < talkStep ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 shrink-0 text-success" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2.5 shrink-0 rounded-full ${i === talkStep ? "animate-pulse bg-primary" : "bg-muted"}` }), s]
							}, s))
						})
					]
				}),
				simPhase === "think" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full flex-col items-center justify-center gap-4 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-20 place-items-center rounded-full bg-secondary text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-9 animate-pulse" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xl font-extrabold",
							children: "La IA está entendiendo la llamada…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Ánimo, señales y si hace falta avisar a alguien"
						})
					]
				}),
				simPhase === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full flex-col items-center justify-center gap-4 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-20 place-items-center rounded-full bg-destructive/10 text-destructive",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { className: "size-9" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "font-semibold text-destructive",
						children: simError
					})]
				}),
				simPhase === "done" && simResult && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Result, {
					r: simResult,
					name: n
				})
			]
		})
	});
}
function Result({ r, name }) {
	const m = MOOD[r.mood];
	const needsHuman = r.need !== "ninguna";
	const notified = [
		{
			Icon: Users,
			label: "Aviso disponible para la familia",
			on: true
		},
		{
			Icon: HandHeart,
			label: "Vecinos voluntarios",
			on: needsHuman
		},
		{
			Icon: Bell,
			label: "ONG",
			on: r.mood === "no_contesta" || r.need === "visita"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "animate-rise rounded-3xl bg-card p-5 shadow-card",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-1.5 text-xs font-bold tracking-wide text-primary uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), " Lo que ha entendido la IA"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-full bg-muted px-2.5 py-1 text-xs font-bold",
					children: [r.durationMin, " min estimados · demo"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-full px-3 py-1 text-xs font-bold ${m.chip}`,
						children: m.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground",
						children: NEED[r.need]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-muted px-3 py-1 text-xs font-bold",
						children: [
							lonelyLabel(r.loneliness),
							" · ",
							r.loneliness,
							"/9"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 leading-snug",
				children: r.summary
			}),
			r.memory && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 flex gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-4 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: TREND[r.trend] }),
					" · ",
					r.memory
				] })]
			}),
			r.signals.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex flex-wrap gap-1.5",
				children: r.signals.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold",
					children: s
				}, s))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertTimeline, { a: {
				status: needsHuman ? "open" : "closed",
				volunteer_name: ""
			} }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-2 border-t pt-4",
				children: notified.map(({ Icon, label, on }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: `flex items-center gap-3 ${on ? "" : "text-muted-foreground"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex-1 font-semibold",
							children: label
						}),
						on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-5 text-success" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs",
							children: "No hace falta"
						})
					]
				}, label))
			}),
			!needsHuman && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: [name, " está bien. Mañana, otra llamada."]
			})
		]
	});
}
var TREND = {
	mejor: "Va mejor",
	igual: "Sigue igual",
	peor: "Va peor",
	nuevo: "Primera llamada"
};
function Memory({ past, name }) {
	if (!past.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "mt-4 rounded-2xl bg-muted p-3 text-sm text-muted-foreground",
		children: [
			"Primera llamada a ",
			name,
			"."
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4 rounded-2xl bg-card p-3 shadow-card",
		"aria-label": `Lo que OYE recuerda de ${name}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "flex items-center gap-1.5 text-xs font-bold tracking-wide text-primary uppercase",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-4" }), " OYE recuerda"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 space-y-1.5",
			children: past.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-start gap-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `mt-1.5 size-2.5 shrink-0 rounded-full ${MOOD[a.mood]?.dot ?? "bg-muted"}` }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "line-clamp-1 flex-1",
						children: a.memory_note || a.summary
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-xs text-muted-foreground",
						children: timeAgo(a.created_at)
					})
				]
			}, a.id))
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonGate, {
	privateData: true,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Call, {})
});
//#endregion
export { SplitComponent as component };
