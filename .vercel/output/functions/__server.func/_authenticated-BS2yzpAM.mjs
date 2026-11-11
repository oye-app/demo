import { r as __toESM } from "./_runtime.mjs";
import { S as useNavigate, x as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as personDisplayName } from "./_ssr/person-presentation-DhLlwfkg.mjs";
import { n as personRequestSchema } from "./_ssr/person-manage-BGjb_D_C.mjs";
import { t as supabase } from "./_ssr/client-BoBTfay3.mjs";
import { v as require_jsx_runtime, y as require_react } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient, r as useQuery } from "./_libs/tanstack__react-query.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { N as ChevronDown, c as ShieldAlert, d as Plus, j as ChevronRight, k as ClipboardList, p as Phone, r as Users, u as Settings2 } from "./_libs/lucide-react.mjs";
import { C as useMe, D as waitLabel, E as useServerFn, S as useAlerts, T as usePerson, c as STATUS, d as addPerson, i as NEED, l as Screen, m as escalation, n as Chip, r as MOOD, s as PersonAvatar, t as BigButton, u as Segmented, v as minutesWaiting, w as usePeople, x as timeAgo } from "./_ssr/oye-C9NPyxa_.mjs";
import { i as useLatestCallLog, n as SituationReportCard, t as AlertTimeline } from "./_ssr/situation-report-B_4l0tBX.mjs";
import { t as Route } from "./_authenticated-CYl1FtUl.mjs";
import { t as PersonGate } from "./_ssr/person-context-e8jbszAA.mjs";
import { t as WellbeingCard } from "./_ssr/wellbeing-card-B-wvy7nr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_authenticated-BS2yzpAM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AlertCard({ a, actions, showTranscript = true }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const m = MOOD[a.mood];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "animate-rise rounded-3xl bg-card p-5 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
						id: a.senior_id,
						name: a.senior_name,
						small: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2.5 shrink-0 rounded-full ${m.dot}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "truncate text-lg font-extrabold",
								children: personDisplayName(a.senior_name)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-primary",
							children: NEED[a.need]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-xs text-muted-foreground",
						children: timeAgo(a.created_at)
					})
				]
			}),
			a.summary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[0.95rem] leading-snug text-foreground",
				children: a.summary
			}),
			a.memory_note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 text-sm text-muted-foreground",
				children: a.memory_note
			}),
			a.signals.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex flex-wrap gap-1.5",
				children: a.signals.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground",
					children: s
				}, s))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-muted-foreground",
				children: [
					STATUS[a.status],
					a.volunteer_name ? ` · ${a.volunteer_name}` : "",
					a.family_notified ? " · Familia avisada" : ""
				]
			}),
			(() => {
				const e = escalation(a);
				return e.label || e.next ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `mt-2 rounded-xl p-2.5 text-sm font-semibold ${e.level ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`,
					children: [
						e.label,
						e.label && e.next ? " · " : "",
						e.next && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-normal",
							children: ["Si nadie va: ", e.next]
						})
					]
				}) : null;
			})(),
			a.visit_note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 rounded-xl bg-success/10 p-2.5 text-sm font-semibold",
				children: [
					a.volunteer_name,
					": «",
					a.visit_note,
					"»"
				]
			}),
			a.status !== "closed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertTimeline, { a }),
			actions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: actions
			}),
			showTranscript && a.transcript.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setOpen(!open),
				"aria-expanded": open,
				className: "mt-3 flex items-center gap-1 text-sm font-semibold text-primary",
				children: [
					open ? "Ocultar llamada" : "Ver la llamada",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-4 transition ${open ? "rotate-180" : ""}` })
				]
			}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-2 space-y-1.5 rounded-2xl bg-muted p-3 text-sm",
				children: a.transcript.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
						className: l.who === "oye" ? "text-primary" : "text-foreground",
						children: [l.who === "oye" ? "OYE" : personDisplayName(a.senior_name), ":"]
					}),
					" ",
					l.text
				] }, i))
			})] })
		]
	});
}
var NOTES = [
	"Está bien",
	"Hemos charlado",
	"Hemos dado un paseo",
	"Necesita volver a ver a alguien"
];
/** The volunteer's next step for an alert: Voy yo → He llegado → Visita hecha. */
function VisitActions({ a, userId, busyElsewhere = false }) {
	const qc = useQueryClient();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const mine = a.volunteer_id === userId;
	async function run(fn) {
		setBusy(true);
		setMsg("");
		const { data } = fn === "complete_alert" ? await supabase.rpc(fn, {
			_id: a.id,
			_note: note
		}) : await supabase.rpc(fn, { _id: a.id });
		setBusy(false);
		if (!data) setMsg(fn === "accept_alert" ? "Otro vecino ya va, o ya tiene una visita en curso." : "No se pudo guardar. Inténtelo otra vez.");
		await qc.invalidateQueries({ queryKey: ["alerts"] });
	}
	if (a.status === "open") {
		if (busyElsewhere) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-center text-sm text-muted-foreground",
			children: "Termine su visita en curso para aceptar otra."
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
			onClick: () => run("accept_alert"),
			disabled: busy,
			children: "Voy yo"
		}), msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-center text-sm text-muted-foreground",
			children: msg
		})] });
	}
	if (!mine) return null;
	if (a.status === "accepted") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				onClick: () => run("arrive_alert"),
				disabled: busy,
				children: "He llegado"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				tone: "quiet",
				size: "sm",
				onClick: () => run("release_alert"),
				disabled: busy,
				children: "No puedo ir, que vaya otro"
			}),
			msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-destructive",
				children: msg
			})
		]
	});
	if (a.status === "arrived") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold text-muted-foreground",
				children: "¿Cómo ha ido? (lo verá la familia)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: NOTES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					selected: note === n,
					onClick: () => setNote(note === n ? "" : n),
					children: n
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				tone: "success",
				onClick: () => run("complete_alert"),
				disabled: busy,
				children: "Visita hecha"
			}),
			msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-destructive",
				children: msg
			})
		]
	});
	return null;
}
function Home() {
	const { profile } = useMe();
	const { sid, person } = usePerson();
	if (sid) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, { children: profile.persona === "voluntario" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectedVisit, {}) : person && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FamilyHome, {
		senior: personDisplayName(person.name),
		relation: person.relation
	}) }) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Screen, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "pt-1 text-sm text-muted-foreground",
		children: ["Hola, ", profile.full_name.split(" ")[0]]
	}), profile.persona === "ong" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NgoHome, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleSelector, {})] });
}
function PeopleSelector() {
	const { profile, user } = useMe();
	const navigate = useNavigate();
	const add = useServerFn(addPerson);
	const { data: membership, isPending: checkingDemo } = useQuery({
		queryKey: ["demo-membership", user.id],
		queryFn: async () => {
			const { data, error } = await supabase.from("demo_members").select("kind").eq("user_id", user.id).maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const immediate = membership?.kind === "familia" || membership?.kind === "ong";
	const { data: people = [], isPending, error } = usePeople();
	const { data: alerts = [] } = useAlerts(true);
	const qc = useQueryClient();
	const [tab, setTab] = (0, import_react.useState)("open");
	const [lastId, setLastId] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		setLastId(sessionStorage.getItem(`oye-person-${user.id}`) ?? "");
	}, [user.id]);
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [relation, setRelation] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [age, setAge] = (0, import_react.useState)("");
	const [requestError, setRequestError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const { data: requests = [] } = useQuery({
		queryKey: ["links", user.id],
		queryFn: async () => {
			const { data, error } = await supabase.from("person_links").select("*").eq("user_id", user.id).eq("status", "pending");
			if (error) throw error;
			return data ?? [];
		}
	});
	const volunteer = profile.persona === "voluntario";
	const visits = alerts.filter((a) => a.volunteer_id === user.id);
	const opportunities = alerts.filter((a) => a.status === "open").sort((a, b) => Number(b.mood === "no_contesta") - Number(a.mood === "no_contesta") || +new Date(a.created_at) - +new Date(b.created_at));
	const list = volunteer ? tab === "open" ? opportunities : visits : [...people].sort((a, b) => {
		const urgent = (id) => alerts.some((x) => x.senior_id === id && x.status === "open") ? 1 : 0;
		return urgent(b.id) - urgent(a.id) || a.name.localeCompare(b.name);
	});
	async function request(e) {
		e.preventDefault();
		setRequestError("");
		const parsed = personRequestSchema.safeParse({
			requested_name: name,
			relation,
			requested_phone: phone,
			requested_age: age
		});
		if (!parsed.success) {
			setRequestError(parsed.error.issues[0]?.message ?? "Revise los datos");
			return;
		}
		setBusy(true);
		try {
			if (immediate) {
				const result = await add({ data: parsed.data });
				await qc.invalidateQueries({ queryKey: ["people", user.id] });
				toast.success("Persona añadida correctamente");
				await navigate({
					to: "/",
					search: { sid: result.id }
				});
			} else {
				const { error } = await supabase.from("person_links").insert({
					user_id: user.id,
					...parsed.data
				});
				if (error) throw error;
				await qc.invalidateQueries({ queryKey: ["links"] });
				toast.success("Solicitud enviada para revisión");
			}
			setAdding(false);
			setName("");
			setRelation("");
			setPhone("");
			setAge("");
		} catch {
			toast.error(immediate ? "No se pudo añadir la persona." : "No se pudo enviar la solicitud.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 text-3xl font-extrabold",
			children: volunteer ? "Personas" : "Mis personas"
		}),
		volunteer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
				value: tab,
				onChange: setTab,
				items: [{
					k: "open",
					l: "Avisos para ti",
					n: opportunities.length
				}, {
					k: "mine",
					l: "Mis visitas",
					n: visits.length
				}]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 min-h-0 flex-1 overflow-y-auto pb-3",
			children: [
				isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "status",
					className: "py-8 text-center text-muted-foreground",
					children: "Cargando…"
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "py-8 text-center text-destructive",
					children: "No se pudieron cargar las personas."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y",
					children: list.map((item) => {
						const isAlert = "senior_id" in item;
						const id = isAlert ? item.senior_id : item.id;
						if (!id) return null;
						const label = personDisplayName(isAlert ? item.senior_name : item.name);
						const latest = isAlert ? item : alerts.find((a) => a.senior_id === id);
						const state = !latest ? "Sin llamadas" : latest.status === "visited" ? "Acompañada" : latest.status === "accepted" ? "En camino" : latest.status === "arrived" ? "De visita" : latest.status === "open" ? "Necesita atención" : "Está bien";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							search: {
								sid: id,
								aid: isAlert ? item.id : void 0
							},
							onClick: () => sessionStorage.setItem(`oye-person-${user.id}`, id),
							className: `tap flex min-h-24 items-center gap-3 py-4 ${lastId === id ? "bg-secondary/30" : ""}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
									id,
									name: label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-lg font-bold",
											children: label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block text-sm text-muted-foreground",
											children: [!isAlert && item.relation ? `${item.relation} · ` : "", state]
										}),
										isAlert && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block text-xs text-muted-foreground",
											children: [
												item.neighborhood,
												" · ",
												waitLabel(minutesWaiting(item.created_at))
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 shrink-0 text-primary" })
							]
						}) }, item.id);
					})
				}),
				!isPending && !error && !list.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-10 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "mx-auto mb-3 size-9 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold",
						children: volunteer ? "No hay avisos en esta vista" : "Aún no tienes personas vinculadas"
					})]
				}),
				!volunteer && !immediate && requests.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 rounded-xl bg-muted p-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: r.requested_name }), " · Pendiente de aprobación"]
				}, r.id)),
				adding && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: request,
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-semibold",
							children: ["Nombre completo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								maxLength: 100,
								value: name,
								onChange: (e) => setName(e.target.value),
								className: "mt-1 h-12 w-full rounded-xl border bg-card px-3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-semibold",
							children: ["Teléfono de la persona", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "tel",
								autoComplete: "tel",
								required: true,
								maxLength: 30,
								value: phone,
								onChange: (e) => setPhone(e.target.value),
								className: "mt-1 h-12 w-full rounded-xl border bg-card px-3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-semibold",
							children: ["Edad", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								inputMode: "numeric",
								required: true,
								min: 0,
								max: 120,
								step: 1,
								value: age,
								onChange: (e) => setAge(e.target.value),
								className: "mt-1 h-12 w-full rounded-xl border bg-card px-3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-semibold",
							children: ["Vínculo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								maxLength: 60,
								value: relation,
								onChange: (e) => setRelation(e.target.value),
								className: "mt-1 h-12 w-full rounded-xl border bg-card px-3"
							})]
						}),
						requestError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "text-sm text-destructive",
							children: requestError
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							disabled: busy || checkingDemo,
							children: busy ? "Guardando…" : immediate ? "Guardar" : "Enviar solicitud"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							tone: "quiet",
							disabled: busy,
							onClick: () => setAdding(false),
							children: "Cancelar"
						})
					]
				})
			]
		}),
		!volunteer && !adding && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BigButton, {
			tone: "ghost",
			disabled: checkingDemo,
			onClick: () => setAdding(true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" }), "Añadir persona"]
		})
	] });
}
function SelectedVisit() {
	const { user } = useMe();
	const { data = [] } = useAlerts();
	const { aid } = Route.useSearch();
	const { data: all = [] } = useAlerts(true);
	const active = all.find((a) => a.volunteer_id === user.id && ["accepted", "arrived"].includes(a.status));
	const alert = data.find((a) => a.id === aid);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-0 flex-1 overflow-y-auto",
		children: alert ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertCard, {
			a: alert,
			showTranscript: false,
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisitActions, {
				a: alert,
				userId: user.id,
				busyElsewhere: !!active && active.id !== alert.id
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-8 text-center text-muted-foreground",
			children: "Este aviso ya no está disponible."
		})
	});
}
function CallCta({ label = "Llamar ahora" }) {
	const { sid } = usePerson();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/llamada",
		search: { sid },
		className: "tap flex items-center gap-4 rounded-3xl bg-primary p-4 text-primary-foreground shadow-cta",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "relative grid size-12 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ring absolute inset-0 rounded-full bg-primary-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "relative size-5" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-lg font-bold",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-sm text-primary-foreground/80",
				children: "Demo · análisis con IA"
			})]
		})]
	});
}
function FamilyHome({ senior, relation }) {
	const { data = [] } = useAlerts();
	const { sid } = usePerson();
	const { data: latestLog } = useLatestCallLog(sid);
	const last = data.filter((a) => a.senior_id === sid)[0];
	let title = "Aún no hay llamadas";
	let tone = "bg-muted";
	let statusSubtitle = "";
	if (latestLog) switch (latestLog.status) {
		case "llamando":
			title = `Llamando a ${senior}...`;
			tone = "bg-primary animate-pulse";
			statusSubtitle = "Marcando el teléfono...";
			break;
		case "analizando":
			title = `Analizando la llamada de ${senior}...`;
			tone = "bg-primary animate-pulse";
			statusSubtitle = "Procesando informe con IA...";
			break;
		case "urgencia_en_curso":
			title = `🚨 Urgencia en curso con ${senior}`;
			tone = "bg-destructive animate-ping";
			statusSubtitle = "Alerta crítica detectada durante la llamada";
			break;
		case "completada":
			title = latestLog.report?.home_headline || `${senior} está bien`;
			tone = latestLog.nivel_alerta === "ROJO" ? "bg-destructive" : latestLog.nivel_alerta === "AMARILLO" ? "bg-warning" : "bg-success";
			statusSubtitle = latestLog.report?.summary || "";
			break;
		case "rechazada":
			title = `Hoy no ha querido hablar`;
			tone = "bg-warning";
			statusSubtitle = "La persona declinó hablar en este momento";
			break;
		case "no_contesta":
			title = `Hoy no ha contestado`;
			tone = "bg-destructive";
			statusSubtitle = latestLog.motivo ? `Motivo: ${latestLog.motivo}` : "Sin respuesta o buzón de voz";
			break;
		case "error":
			title = `No se pudo analizar la llamada`;
			tone = "bg-destructive";
	}
	else if (last) {
		title = !last ? `Aún no hay llamadas` : last.status === "visited" ? `${senior} está acompañada` : last.status === "accepted" ? `${last.volunteer_name} va de camino` : last.status === "arrived" ? `${last.volunteer_name} está con ${senior}` : last.status === "open" ? last.mood === "no_contesta" ? `${senior} no contesta` : `${senior} necesita a alguien` : `${senior} está bien`;
		tone = !last ? "bg-muted" : last.status === "open" ? MOOD[last.mood].dot : last.status === "closed" || last.status === "visited" ? "bg-success" : "bg-primary";
	}
	const isUrgent = latestLog?.status === "urgencia_en_curso";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
			className: "sr-only",
			children: ["Resumen de ", senior]
		}),
		isUrgent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mt-3 animate-pulse rounded-3xl border-2 border-destructive bg-destructive/15 p-4 shadow-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-7 shrink-0 text-destructive mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-black text-destructive",
					children: "🚨 Alerta crítica: Urgencia en curso"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs font-semibold text-foreground",
					children: [
						"Se ha alertado al contacto de confianza y notificado a los servicios necesarios. Contacte inmediatamente con ",
						senior,
						"."
					]
				})] })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			"aria-live": "polite",
			className: "mt-3 rounded-3xl bg-card p-4 shadow-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-4 shrink-0 rounded-full ${tone}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl leading-tight font-extrabold",
						children: title
					})]
				}),
				statusSubtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-sm text-foreground/90",
					children: statusSubtitle
				}),
				latestLog && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: new Date(latestLog.created_at).toLocaleString("es-ES", {
							day: "numeric",
							month: "short",
							hour: "2-digit",
							minute: "2-digit"
						})
					}), latestLog.status === "completada" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] text-muted-foreground font-semibold",
						children: "Estimación orientativa. No es un diagnóstico."
					})]
				}),
				!latestLog && last && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-xs text-muted-foreground",
					children: new Date(last.created_at).toLocaleString("es-ES", {
						day: "numeric",
						month: "short",
						hour: "2-digit",
						minute: "2-digit"
					})
				}),
				last?.status === "visited" && last.visit_note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 line-clamp-2 text-sm font-semibold",
					children: [
						last.volunteer_name,
						": «",
						last.visit_note,
						"»"
					]
				})
			]
		}),
		latestLog?.status === "completada" && latestLog.report && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SituationReportCard, {
				log: latestLog,
				showExecutiveOnly: true
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WellbeingCard, {
				senior,
				seniorId: sid,
				compact: true
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallCta, { label: "Llamar ahora" })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/persona",
			search: { sid },
			className: "tap mt-3 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-5 text-primary" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block text-sm font-bold text-primary",
						children: ["Ficha de ", senior]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-muted-foreground",
						children: "Llave, medicación, citas y ánimo"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 shrink-0 text-muted-foreground" })
			]
		})
	] });
}
var waited = (a) => Math.round((Date.now() - new Date(a.created_at).getTime()) / 6e4);
var URGENT_MIN = 30;
function NgoHome() {
	const [choosing, setChoosing] = (0, import_react.useState)(false);
	const { data: people = [] } = usePeople();
	const { data = [] } = useAlerts();
	const { user } = useMe();
	const [tab, setTab] = (0, import_react.useState)("open");
	const today = data.filter((a) => new Date(a.created_at).toDateString() === (/* @__PURE__ */ new Date()).toDateString());
	const open = data.filter((a) => a.status === "open").sort((x, y) => Number(y.mood === "no_contesta") - Number(x.mood === "no_contesta") || +new Date(x.created_at) - +new Date(y.created_at));
	const accepted = data.filter((a) => a.status === "accepted" || a.status === "arrived");
	const visited = today.filter((a) => a.status === "visited");
	const active = data.find((a) => a.volunteer_id === user.id && (a.status === "accepted" || a.status === "arrived"));
	const urgent = open.filter((a) => waited(a) >= URGENT_MIN || a.mood === "no_contesta").length;
	const tabs = [
		{
			k: "open",
			l: "Sin atender",
			n: open.length
		},
		{
			k: "accepted",
			l: "En camino",
			n: accepted.length
		},
		{
			k: "visited",
			l: "Hechas hoy",
			n: visited.length
		}
	];
	const list = tab === "open" ? open : tab === "accepted" ? accepted : visited;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-extrabold",
				children: "Panel de avisos"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BigButton, {
					size: "sm",
					tone: "ghost",
					onClick: () => setChoosing(!choosing),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" }), "Personas"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/admin",
					"aria-label": "Administrar datos",
					className: "grid size-11 place-items-center rounded-full bg-secondary text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-5" })
				})]
			})]
		}),
		choosing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 max-h-48 overflow-y-auto",
			children: people.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				search: { sid: p.id },
				className: "tap flex min-h-12 items-center gap-3 border-b py-2 font-semibold",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
						id: p.id,
						name: p.name,
						small: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 truncate",
						children: personDisplayName(p.name)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5" })
				]
			}, p.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted-foreground",
			children: [today.length, " llamadas hoy"]
		}),
		urgent > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			role: "alert",
			className: "mt-3 rounded-2xl bg-destructive/10 p-3 text-sm font-semibold text-destructive",
			children: [
				urgent,
				" ",
				urgent === 1 ? "aviso urgente" : "avisos urgentes",
				": nadie ha acudido aún. Asigne a alguien o vaya usted."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
				value: tab,
				onChange: setTab,
				items: tabs.map((t) => ({
					...t,
					alert: t.k === "open"
				}))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2",
			children: [list.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				a.status === "open" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `mb-1 px-2 text-xs font-bold ${waited(a) >= URGENT_MIN || a.mood === "no_contesta" ? "text-destructive" : "text-muted-foreground"}`,
					children: [
						"Esperando ",
						waited(a) < 60 ? `${waited(a)} min` : `${Math.round(waited(a) / 60)} h`,
						a.mood === "no_contesta" ? " · No contesta: la ONG debe ir" : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					search: { sid: a.senior_id ?? void 0 },
					className: "tap mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-primary",
					children: ["Ver persona", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertCard, {
					a,
					showTranscript: false,
					actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisitActions, {
						a,
						userId: user.id,
						busyElsewhere: !!active
					})
				})
			] }, a.id)), !list.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 pt-4 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: tab === "open" ? "Ningún aviso sin atender. ¡Buen trabajo!" : tab === "accepted" ? "Nadie en camino ahora." : "Aún no hay visitas hoy."
				}), tab === "open" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
					tone: "ghost",
					onClick: () => setChoosing(true),
					children: "Elegir persona para llamar"
				})]
			})]
		})
	] });
}
//#endregion
export { Home as component };
