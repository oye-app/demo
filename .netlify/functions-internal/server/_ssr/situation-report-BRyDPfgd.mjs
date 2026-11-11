import { r as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-CxM3OIUX.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient, r as useQuery, t as queryOptions } from "../_libs/tanstack__react-query.mjs";
import { A as CircleCheck, B as Brain, H as Activity, O as Clock, P as Check, a as TriangleAlert, c as ShieldAlert, h as PhoneCall, n as Volume2, r as Users, s as Sparkles, v as MapPin, w as Heart } from "../_libs/lucide-react.mjs";
import { h as fmtTime } from "./oye-aRCGgmP7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/situation-report-BRyDPfgd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Care flow: call + AI → neighbours alerted → on the way → arrived → visit done. */
function AlertTimeline({ a }) {
	const human = a.status !== "closed";
	const st = a.status;
	const steps = human ? [
		{
			label: "Llamada e IA",
			done: true,
			t: a.created_at
		},
		{
			label: "Aviso a vecinos",
			done: true,
			t: a.created_at
		},
		{
			label: a.volunteer_name ? `${a.volunteer_name} va` : "En camino",
			done: [
				"accepted",
				"arrived",
				"visited"
			].includes(st),
			t: a.accepted_at
		},
		{
			label: "Ha llegado",
			done: st === "arrived" || st === "visited",
			t: a.arrived_at
		},
		{
			label: "Visita hecha",
			done: st === "visited",
			t: a.visited_at
		}
	] : [
		{
			label: "Llamada",
			done: true,
			t: a.created_at
		},
		{
			label: "IA analiza",
			done: true,
			t: a.created_at
		},
		{
			label: "Familia avisada",
			done: true,
			t: a.created_at
		}
	];
	const cur = steps.findIndex((s) => !s.done);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: `mt-4 grid gap-1 ${human ? "grid-cols-5" : "grid-cols-3"}`,
		"aria-label": "Progreso del aviso",
		children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "relative flex flex-col items-center gap-1 text-center",
			children: [
				i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-3.5 right-1/2 -z-0 h-0.5 w-full ${s.done ? "bg-success" : "bg-muted"}` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `relative z-10 grid size-7 place-items-center rounded-full ${s.done ? "bg-success text-success-foreground" : i === cur ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"}`,
					children: s.done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-bold",
						children: i + 1
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `text-[0.65rem] leading-tight ${s.done || i === cur ? "font-semibold" : "text-muted-foreground"}`,
					children: s.label
				}),
				s.done && s.t && i >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[0.6rem] text-muted-foreground",
					children: fmtTime(s.t)
				})
			]
		}, i))
	});
}
var STATUS_MESSAGES = {
	llamando: {
		title: "Llamando...",
		subtitle: "Marcando el teléfono de la persona mayor",
		tone: "info"
	},
	analizando: {
		title: "Analizando la llamada...",
		subtitle: "Procesando la conversación y contrastando con el historial",
		tone: "info"
	},
	urgencia_en_curso: {
		title: "Urgencia en curso",
		subtitle: "Se ha detectado una situación crítica durante la llamada",
		tone: "destructive"
	},
	completada: {
		title: "Informe disponible",
		subtitle: "Llamada analizada con éxito",
		tone: "success"
	},
	rechazada: {
		title: "Hoy no ha querido hablar",
		subtitle: "La persona declinó la llamada o pidió posponerla",
		tone: "warning"
	},
	no_contesta: {
		title: "Hoy no ha contestado",
		subtitle: "Línea ocupada, buzón de voz o sin respuesta",
		tone: "warning"
	},
	error: {
		title: "No se pudo analizar",
		subtitle: "Hubo un error al procesar el informe de la llamada",
		tone: "destructive"
	}
};
function fetchLatestCallLog(personId) {
	return queryOptions({
		queryKey: [
			"call_logs",
			"latest",
			personId
		],
		queryFn: async () => {
			const { data, error } = await supabase.from("call_logs").select("*").eq("person_id", personId).order("created_at", { ascending: false }).limit(1).maybeSingle();
			if (error) {
				console.error("Error fetching latest call_log:", error);
				return null;
			}
			return data ?? null;
		},
		staleTime: 2e3
	});
}
function fetchAllCallLogs(personId) {
	return queryOptions({
		queryKey: [
			"call_logs",
			"list",
			personId ?? "all"
		],
		queryFn: async () => {
			let q = supabase.from("call_logs").select("*");
			if (personId) q = q.eq("person_id", personId);
			const { data, error } = await q.order("created_at", { ascending: false });
			if (error) {
				console.error("Error fetching call_logs:", error);
				return [];
			}
			return data ?? [];
		},
		staleTime: 5e3
	});
}
/**
* Hook that subscribes via Supabase Realtime to public.call_logs.
* Updates in under 3 seconds upon INSERT or UPDATE.
*/
function useLatestCallLog(personId) {
	const qc = useQueryClient();
	(0, import_react.useEffect)(() => {
		if (!personId) return;
		const channelName = `call_logs_realtime_${personId}_${Math.random().toString(36).slice(2, 7)}`;
		const channel = supabase.channel(channelName).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "call_logs",
			filter: `person_id=eq.${personId}`
		}, (payload) => {
			qc.invalidateQueries({ queryKey: ["call_logs"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [personId, qc]);
	return useQuery(fetchLatestCallLog(personId ?? ""));
}
function useAllCallLogs(personId) {
	const qc = useQueryClient();
	(0, import_react.useEffect)(() => {
		const channelName = `call_logs_all_realtime_${Math.random().toString(36).slice(2, 7)}`;
		const channel = supabase.channel(channelName).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "call_logs"
		}, () => {
			qc.invalidateQueries({ queryKey: ["call_logs"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [qc]);
	return useQuery(fetchAllCallLogs(personId));
}
function SituationReportCard({ log, showExecutiveOnly = false }) {
	const { status, nivel_alerta, report } = log;
	if (status === "llamando") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "animate-pulse rounded-3xl border border-primary/30 bg-primary/10 p-5 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative flex size-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex size-4 rounded-full bg-primary" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-bold text-primary",
				children: "Llamando..."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: STATUS_MESSAGES.llamando.subtitle
			})] })]
		})
	});
	if (status === "analizando") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "animate-pulse rounded-3xl border border-primary/20 bg-secondary/60 p-5 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, {
				className: "size-6 animate-spin text-primary",
				style: { animationDuration: "3s" }
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-bold text-foreground",
				children: "Analizando la llamada..."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: STATUS_MESSAGES.analizando.subtitle
			})] })]
		})
	});
	if (status === "urgencia_en_curso") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "animate-bounce rounded-3xl border-2 border-destructive bg-destructive/15 p-5 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-8 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-block rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground uppercase",
					children: "Urgencia en curso"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-1 text-lg font-black text-destructive",
					children: "¡Alerta crítica en la llamada!"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm font-semibold text-foreground",
					children: "Se ha detectado una situación urgente. El protocolo de emergencia ha sido activado y se ha alertado al contacto de confianza."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs font-bold text-destructive",
					children: "Si es necesario, contacte inmediatamente con el 112."
				})
			] })]
		})
	});
	if (status === "rechazada") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-3xl border border-warning/30 bg-warning/10 p-5 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-6 text-warning" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-bold text-foreground",
				children: "Hoy no ha querido hablar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: STATUS_MESSAGES.rechazada.subtitle
			})] })]
		})
	});
	if (status === "no_contesta") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-3xl border border-warning/30 bg-muted/60 p-5 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneCall, { className: "size-6 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-bold text-foreground",
				children: "Hoy no ha contestado"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: log.motivo ? `Motivo: ${log.motivo}` : STATUS_MESSAGES.no_contesta.subtitle
			})] })]
		})
	});
	if (status === "error") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-3xl border border-destructive/30 bg-destructive/10 p-5 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-6 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-bold text-destructive",
				children: "No se pudo analizar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: STATUS_MESSAGES.error.subtitle
			})] })]
		})
	});
	if (!report) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-3xl bg-card p-5 shadow-card",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Llamada completada sin informe detallado."
		})
	});
	const alertLevel = report.nivel_alerta || nivel_alerta || "VERDE";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "space-y-4 rounded-3xl bg-card p-5 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: `rounded-full border px-2.5 py-0.5 text-xs font-black uppercase ${alertLevel === "ROJO" ? "bg-destructive/15 text-destructive border-destructive/30" : alertLevel === "AMARILLO" ? "bg-warning/20 text-warning-foreground border-warning/40" : "bg-success/15 text-success border-success/30"}`,
							children: ["Nivel ", alertLevel]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-muted-foreground",
							children: new Date(report.timestamp_evaluacion || log.created_at).toLocaleDateString("es-ES", {
								day: "numeric",
								month: "short",
								hour: "2-digit",
								minute: "2-digit"
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1.5 text-xl font-extrabold leading-snug text-foreground",
						children: report.home_headline || report.call_title || "Informe de llamada"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl font-black text-primary",
						children: report.score_bienestar_global != null ? `${report.score_bienestar_global}/10` : `${report.global_pct}%`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-bold text-muted-foreground uppercase",
						children: "Bienestar"
					})]
				})]
			}),
			(report.top_badges?.length > 0 || report.bottom_tags?.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-1.5",
				children: [report.top_badges?.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary",
					children: ["✓ ", b]
				}, `tb-${i}`)), report.bottom_tags?.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground",
					children: t
				}, `bt-${i}`))]
			}),
			report.sub_percentages && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-4 gap-2 rounded-2xl bg-muted/60 p-3 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground font-semibold",
						children: "Ánimo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-black text-foreground",
						children: [report.sub_percentages.mood, "%"]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground font-semibold",
						children: "Social"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-black text-foreground",
						children: [report.sub_percentages.social, "%"]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground font-semibold",
						children: "Fluidez"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-black text-foreground",
						children: [report.sub_percentages.chat, "%"]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground font-semibold",
						children: "Rutina"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-black text-foreground",
						children: [report.sub_percentages.routine, "%"]
					})] })
				]
			}),
			report.summary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm leading-relaxed text-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: report.summary })
			}),
			report.oye_recuerda_insight && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-2.5 rounded-2xl bg-secondary/80 p-3 text-xs text-secondary-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 shrink-0 text-primary mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold",
						children: "Memoria OYE: "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: report.oye_recuerda_insight })]
				})]
			}),
			report.diagnostico_situacion_ejecutivo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border/80 bg-background/50 p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2 mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
						children: "Diagnóstico ejecutivo de situación"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground",
						children: "Estimación orientativa. No es un diagnóstico."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "whitespace-pre-line text-sm leading-relaxed font-medium text-foreground",
					children: report.diagnostico_situacion_ejecutivo
				})]
			}),
			!showExecutiveOnly && report.evaluacion_escalas && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 pt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
						children: "Evaluación de Escalas Geriátricas"
					}),
					report.evaluacion_escalas.soledad_ucla && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-muted/40 p-3.5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3.5 text-primary" }), " Soledad (UCLA-3)"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-extrabold text-foreground",
								children: [
									report.evaluacion_escalas.soledad_ucla.nivel,
									" (",
									report.evaluacion_escalas.soledad_ucla.puntuacion_estimada,
									"/9)"
								]
							})]
						}), report.evaluacion_escalas.soledad_ucla.evidencia_escuchada && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 italic text-muted-foreground",
							children: report.evaluacion_escalas.soledad_ucla.evidencia_escuchada
						})]
					}),
					report.evaluacion_escalas.animo_yesavage_gds5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-muted/40 p-3.5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-3.5 text-primary" }), " Ánimo (Yesavage GDS-5)"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-extrabold text-foreground",
								children: [
									report.evaluacion_escalas.animo_yesavage_gds5.nivel,
									" (",
									report.evaluacion_escalas.animo_yesavage_gds5.puntuacion_estimada,
									"/5)"
								]
							})]
						}), report.evaluacion_escalas.animo_yesavage_gds5.evidencia_escuchada && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 italic text-muted-foreground",
							children: report.evaluacion_escalas.animo_yesavage_gds5.evidencia_escuchada
						})]
					}),
					report.evaluacion_escalas.autocuidado_y_salud && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-muted/40 p-3.5 text-xs space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-3.5 text-primary" }), " Autocuidado y Salud"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-3 gap-1 pt-1 text-[11px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded bg-background/80 p-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground block",
											children: "Comida:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: report.evaluacion_escalas.autocuidado_y_salud.alimentacion_hidratacion
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded bg-background/80 p-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground block",
											children: "Sueño:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: report.evaluacion_escalas.autocuidado_y_salud.sueno_descanso
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded bg-background/80 p-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground block",
											children: "Medicación:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: report.evaluacion_escalas.autocuidado_y_salud.adherencia_medicacion
										})]
									})
								]
							}),
							report.evaluacion_escalas.autocuidado_y_salud.evidencia_escuchada && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "italic text-muted-foreground pt-0.5",
								children: report.evaluacion_escalas.autocuidado_y_salud.evidencia_escuchada
							})
						]
					}),
					report.evaluacion_escalas.indicadores_vocales_cognitivos && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-muted/40 p-3.5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-3.5 text-primary" }), " Indicadores cognitivos y voz"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-foreground",
								children: report.evaluacion_escalas.indicadores_vocales_cognitivos.estado
							})]
						}), report.evaluacion_escalas.indicadores_vocales_cognitivos.observacion && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-muted-foreground",
							children: report.evaluacion_escalas.indicadores_vocales_cognitivos.observacion
						})]
					})
				]
			}),
			report.prescripcion_y_derivacion_humana && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-bold text-primary flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " Derivación y Protocolo Humano"]
						}), report.prescripcion_y_derivacion_humana.activar_protocolo_voy_yo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-primary px-2.5 py-0.5 font-bold text-primary-foreground",
							children: "Protocolo «Voy yo» activo"
						})]
					}),
					report.prescripcion_y_derivacion_humana.anillo_derivacion_recomendado && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-muted-foreground",
							children: "Anillo recomendado: "
						}), report.prescripcion_y_derivacion_humana.anillo_derivacion_recomendado.replace(/_/g, " ")]
					}),
					report.prescripcion_y_derivacion_humana.mensaje_sms_alerta && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-xl bg-background/80 p-2.5 font-mono text-[11px] text-foreground",
						children: [
							"«",
							report.prescripcion_y_derivacion_humana.mensaje_sms_alerta,
							"»"
						]
					}),
					report.prescripcion_y_derivacion_humana.prescripcion_social_barrio && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-1.5 pt-1 text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-semibold",
							children: "Actividad sugerida: "
						}), report.prescripcion_y_derivacion_humana.prescripcion_social_barrio] })]
					})
				]
			})
		]
	});
}
//#endregion
export { useLatestCallLog as i, SituationReportCard as n, useAllCallLogs as r, AlertTimeline as t };
