import { r as __toESM } from "../_runtime.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as personDisplayName } from "./person-presentation-DhLlwfkg.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { B as Brain, N as ChevronDown } from "../_libs/lucide-react.mjs";
import { C as useMe, S as useAlerts, T as usePerson, c as STATUS, f as btn, g as lonelyLabel, h as fmtTime, i as NEED, l as Screen, r as MOOD, s as PersonAvatar } from "./oye-aRCGgmP7.mjs";
import { n as SituationReportCard, r as useAllCallLogs, t as AlertTimeline } from "./situation-report-BRyDPfgd.mjs";
import { t as PersonGate } from "./person-context-Dsg5xSNM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/historial-DnSuuvI7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HistoryEntry() {
	const { profile } = useMe();
	const { sid } = usePerson();
	if (profile.persona === "voluntario" && !sid) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryPage, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryPage, {}) });
}
function HistoryPage() {
	const { profile, user } = useMe();
	const { data: alerts = [], isLoading: loadingAlerts, error: alertsError } = useAlerts();
	const { sid, person } = usePerson();
	const { data: callLogs = [], isLoading: loadingLogs } = useAllCallLogs(sid);
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const title = profile.persona === "voluntario" ? "Mis visitas" : `Llamadas a ${personDisplayName(person?.name ?? "")}`;
	const legacyList = alerts.filter((a) => (!sid || a.senior_id === sid) && (profile.persona !== "voluntario" || a.volunteer_id === user.id));
	const hasLogs = callLogs.length > 0;
	const isLoading = loadingLogs || loadingAlerts;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, {
		title,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 space-y-3 overflow-y-auto pb-4",
			children: [
				callLogs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallLogRowCard, {
					log,
					personName: personDisplayName(person?.name ?? log.nombre ?? "Mayor"),
					open: openId === log.id,
					onToggle: () => setOpenId(openId === log.id ? null : log.id)
				}, log.id)),
				!hasLogs && legacyList.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegacyCallRow, {
					visit: profile.persona === "voluntario",
					a,
					open: openId === a.id,
					onToggle: () => setOpenId(openId === a.id ? null : a.id)
				}, a.id)),
				alertsError && !hasLogs && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "pt-10 text-center text-destructive",
					children: "No se pudo cargar el historial."
				}),
				!isLoading && !hasLogs && !legacyList.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pt-10 text-center text-muted-foreground",
					children: profile.persona === "voluntario" ? "Todavía no hay visitas." : "Todavía no hay llamadas registradas."
				})
			]
		})
	});
}
function CallLogRowCard({ log, personName, open, onToggle }) {
	const d = new Date(log.created_at);
	const day = d.toLocaleDateString("es-ES", {
		weekday: "short",
		day: "numeric",
		month: "short"
	});
	const time = d.toLocaleTimeString("es-ES", {
		hour: "2-digit",
		minute: "2-digit"
	});
	const alertBadge = log.nivel_alerta === "ROJO" ? "bg-destructive text-destructive-foreground" : log.nivel_alerta === "AMARILLO" ? "bg-warning text-warning-foreground" : log.nivel_alerta === "VERDE" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "overflow-hidden rounded-3xl bg-card shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onToggle,
			"aria-expanded": open,
			className: "tap flex w-full items-center gap-3 p-4 text-left",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
					id: log.person_id,
					name: personName,
					small: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2 font-bold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: personName
							}),
							log.nivel_alerta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${alertBadge}`,
								children: log.nivel_alerta
							}),
							log.status !== "completada" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground",
								children: log.status.replace(/_/g, " ")
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block text-xs capitalize text-muted-foreground",
						children: [
							day,
							" · ",
							time,
							" · ",
							log.duracion_seg != null ? `${Math.round(log.duracion_seg / 60)} min` : "En curso"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}` })
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-rise space-y-3 border-t p-4 pt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SituationReportCard, { log })
		})]
	});
}
function LegacyCallRow({ a, open, onToggle, visit = false }) {
	const m = MOOD[a.mood] ?? MOOD.bien;
	const day = new Date(a.created_at).toLocaleDateString("es-ES", {
		weekday: "short",
		day: "numeric",
		month: "short"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "overflow-hidden rounded-3xl bg-card shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onToggle,
			"aria-expanded": open,
			className: "tap flex w-full items-center gap-3 p-4 text-left",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
					id: a.senior_id,
					name: a.senior_name,
					small: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block font-bold",
						children: [
							personDisplayName(a.senior_name),
							" · ",
							visit ? STATUS[a.status] : m.label
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block text-xs capitalize text-muted-foreground",
						children: [
							day,
							" · ",
							fmtTime(a.created_at),
							" · ",
							visit ? a.visited_at ? `Visita · ${fmtTime(a.visited_at)}` : "Visita en curso" : a.is_simulated ? `${a.duration_min ?? "—"} min estimados · Demo` : `${a.duration_min ?? "—"} min`
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}` })
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "animate-rise space-y-3 border-t px-4 pt-3 pb-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground",
							children: NEED[a.need]
						}),
						a.loneliness_score != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-muted px-2.5 py-1 text-xs font-bold",
							children: [
								lonelyLabel(a.loneliness_score),
								" · ",
								a.loneliness_score,
								"/9"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-muted px-2.5 py-1 text-xs font-bold",
							children: STATUS[a.status]
						})
					]
				}),
				visit && a.senior_id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					search: {
						sid: a.senior_id,
						aid: a.id
					},
					className: btn("ghost", "sm"),
					children: "Abrir visita"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-snug",
					children: a.summary
				}),
				a.memory_note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "mt-0.5 size-4 shrink-0" }), a.memory_note]
				}),
				a.signals.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-wrap gap-1.5",
					children: a.signals.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-full bg-muted px-2.5 py-1 text-xs font-semibold",
						children: s
					}, s))
				}),
				a.status !== "closed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertTimeline, { a }),
				a.visit_note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-xl bg-success/10 p-2.5 text-sm font-semibold",
					children: [
						a.volunteer_name,
						": «",
						a.visit_note,
						"»"
					]
				})
			]
		})]
	});
}
//#endregion
export { HistoryEntry as component };
