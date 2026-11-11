import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { _ as MessageCircle, h as PhoneCall, r as Users, w as Heart } from "../_libs/lucide-react.mjs";
import { S as useAlerts } from "./oye-C9NPyxa_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wellbeing-card-B-wvy7nr.js
var import_jsx_runtime = require_jsx_runtime();
var toneOf = (pct) => pct == null ? "unknown" : pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad";
/** Wellbeing summary per senior, derived from their recent calls (last 14 days). */
function wellbeing(alerts, senior, seniorId) {
	const mine = alerts.filter((a) => !!seniorId && a.senior_id === seniorId).filter((a) => Date.now() - +new Date(a.created_at) < 12096e5);
	const answered = mine.filter((a) => a.mood !== "no_contesta");
	const animo = answered.length ? Math.round(answered.filter((a) => a.mood === "bien").length / answered.length * 100) : null;
	const scores = answered.map((a) => a.loneliness_score).filter((s) => s != null);
	const soledad = scores.length ? Math.round(100 - (scores.reduce((x, y) => x + y, 0) / scores.length - 3) / 6 * 100) : null;
	const compania = mine.length ? Math.round(mine.filter((a) => a.status === "visited" || a.status === "closed" || a.need === "ninguna").length / mine.length * 100) : null;
	const contacto = mine.length ? Math.round(answered.length / mine.length * 100) : null;
	const items = [
		{
			key: "animo",
			label: "Ánimo",
			icon: Heart,
			pct: animo,
			hint: `${answered.filter((a) => a.mood === "bien").length} de ${answered.length} llamadas bien`,
			tone: toneOf(animo)
		},
		{
			key: "soledad",
			label: "Compañía sentida",
			icon: Users,
			pct: soledad,
			hint: soledad == null ? "Sin datos suficientes" : soledad >= 70 ? "No se siente sola" : soledad >= 40 ? "A veces se siente sola" : "Se siente sola",
			tone: toneOf(soledad)
		},
		{
			key: "compania",
			label: "Visitas",
			icon: MessageCircle,
			pct: compania,
			hint: `${mine.filter((a) => a.status === "visited").length} visitas en 14 días`,
			tone: toneOf(compania)
		},
		{
			key: "contacto",
			label: "Contacto",
			icon: PhoneCall,
			pct: contacto,
			hint: `${answered.length} de ${mine.length} llamadas contestadas`,
			tone: toneOf(contacto)
		}
	];
	const known = items.filter((i) => i.pct != null);
	return {
		overall: known.length ? Math.round(known.reduce((x, i) => x + (i.pct ?? 0), 0) / known.length) : null,
		items
	};
}
var overallLabel = (pct) => pct >= 70 ? "Va bien" : pct >= 40 ? "Hay que vigilar" : "Necesita atención";
var BAR = {
	good: "bg-success",
	warn: "bg-warning",
	bad: "bg-destructive",
	unknown: "bg-muted"
};
var TXT = {
	good: "text-success",
	warn: "text-warning",
	bad: "text-destructive",
	unknown: "text-muted-foreground"
};
/** Quick wellbeing summary for one senior: overall % + 4 priority bars. */
function WellbeingCard({ senior, seniorId, compact = false }) {
	const { data = [] } = useAlerts();
	const { overall, items } = wellbeing(data, senior, seniorId);
	if (overall == null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "Sin datos suficientes"
	});
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		"aria-label": `Resumen de bienestar de ${senior}`,
		className: "rounded-3xl bg-card p-4 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-baseline gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `text-2xl font-extrabold ${TXT[tone(overall)]}`,
					children: [overall, "%"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: overallLabel(overall)
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex gap-3",
				children: items.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col items-center gap-0.5",
					title: `${i.label}: ${i.hint}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(i.icon, { className: `size-4 ${TXT[i.tone]}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `text-xs font-extrabold ${TXT[i.tone]}`,
						children: i.pct == null ? "—" : `${i.pct}%`
					})]
				}, i.key))
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": `Resumen de bienestar de ${senior}`,
		className: "rounded-3xl bg-card p-5 shadow-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-bold text-muted-foreground",
				children: "Bienestar · 14 días"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-baseline gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `text-3xl font-extrabold ${TXT[tone(overall)]}`,
					children: [overall, "%"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: overallLabel(overall)
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-3 space-y-2.5",
			children: items.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `grid size-9 shrink-0 place-items-center rounded-xl bg-secondary ${TXT[i.tone]}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(i.icon, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold",
								children: i.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-sm font-extrabold ${TXT[i.tone]}`,
								children: i.pct == null ? "—" : `${i.pct}%`
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 h-1.5 overflow-hidden rounded-full bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `h-full rounded-full ${BAR[i.tone]}`,
								style: { width: `${i.pct == null ? "—" : `${i.pct}%`}` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 truncate text-xs text-muted-foreground",
							children: i.hint
						})
					]
				})]
			}, i.key))
		})]
	});
}
function tone(pct) {
	return pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad";
}
//#endregion
export { WellbeingCard as t };
