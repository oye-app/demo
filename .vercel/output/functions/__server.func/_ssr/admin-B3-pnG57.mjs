import { r as __toESM } from "../_runtime.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BoBTfay3.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { E as HandHeart, F as ChartColumn, d as Plus, l as Settings, o as Trash2, r as Users, x as Inbox, y as LogOut } from "../_libs/lucide-react.mjs";
import { a as OyeLogo, f as btn, t as BigButton } from "./oye-C9NPyxa_.mjs";
import { t as Toaster$1 } from "./styles-CqtVdYJw.mjs";
import { t as lovable } from "./lovable-CokzWi79.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-B3-pnG57.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Admin activity totals: calls, visits, recommendations and what is still pending. */
function activityStats(alerts, refs, todayMs) {
	const isToday = (a) => new Date(a.created_at).getTime() >= todayMs;
	return {
		calls: alerts.length,
		callsToday: alerts.filter(isToday).length,
		visits: alerts.filter((a) => a.status === "visited").length,
		visitsToday: alerts.filter((a) => a.status === "visited" && isToday(a)).length,
		open: alerts.filter((a) => a.status === "open").length,
		onTheWay: alerts.filter((a) => a.status === "accepted" || a.status === "arrived").length,
		refs: refs.length,
		refsAccepted: refs.filter((r) => r.status === "accepted").length,
		refsPending: refs.filter((r) => r.status === "pending").length
	};
}
var input = "h-12 w-full rounded-xl border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
function Admin() {
	const [session, setSession] = (0, import_react.useState)(void 0);
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setSession(data.session));
		const { data } = supabase.auth.onAuthStateChange((event, s) => {
			if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setSession(s);
		});
		return () => data.subscription.unsubscribe();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!session) return setIsAdmin(null);
		supabase.rpc("has_role", {
			_user_id: session.user.id,
			_role: "admin"
		}).then(({ data }) => setIsAdmin(!!data));
	}, [session]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "top-center" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-12 items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OyeLogo, {})
				}), session && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => supabase.auth.signOut(),
					className: "tap flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " Salir"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex flex-1 flex-col",
				children: session === void 0 ? null : !session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignIn, {}) : isAdmin === null ? null : !isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Center, {
					title: "Sin permiso",
					text: "Su cuenta no es administradora. Pida acceso a la persona responsable."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Editor, {})
			})
		]
	});
}
function Center({ title, text, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col items-center justify-center text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-extrabold",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-muted-foreground",
				children: text
			}),
			children
		]
	});
}
function SignIn() {
	const [mode, setMode] = (0, import_react.useState)("in");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		const { error, data } = mode === "in" ? await supabase.auth.signInWithPassword({
			email,
			password
		}) : await supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: `${window.location.origin}/admin` }
		});
		setBusy(false);
		if (error) {
			toast.error("No se pudo entrar. Revise el correo y la contraseña.");
			return;
		}
		if (mode === "up" && !data.session) toast.success("Le hemos enviado un correo para confirmar la cuenta.");
	}
	async function social(provider) {
		if ((await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/admin` })).error) toast.error("No se pudo entrar.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Center, {
		title: "Administración",
		text: "Entre para actualizar personas, voluntarios y organización.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 w-full max-w-sm space-y-3 text-left",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "lovable-auth-button w-full",
					onClick: () => social("lovable"),
					children: "Continue with Lovable"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
					tone: "ghost",
					onClick: () => social("google"),
					children: "Continuar con Google"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-1 text-center text-sm text-muted-foreground",
					children: "o con su correo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: input,
							type: "email",
							required: true,
							placeholder: "Correo",
							"aria-label": "Correo",
							value: email,
							onChange: (e) => setEmail(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: input,
							type: "password",
							required: true,
							minLength: 6,
							placeholder: "Contraseña",
							"aria-label": "Contraseña",
							value: password,
							onChange: (e) => setPassword(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							disabled: busy,
							children: mode === "in" ? "Entrar" : "Crear cuenta"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setMode(mode === "in" ? "up" : "in"),
					className: btn("quiet", "sm"),
					children: mode === "in" ? "¿Primera vez? Crear cuenta" : "Ya tengo cuenta"
				})
			]
		})
	});
}
function Editor() {
	const [tab, setTab] = (0, import_react.useState)("resumen");
	const [pending, setPending] = (0, import_react.useState)(0);
	const refreshPending = () => supabase.from("referrals").select("id", {
		count: "exact",
		head: true
	}).eq("status", "pending").then(({ count }) => setPending(count ?? 0));
	(0, import_react.useEffect)(() => {
		refreshPending();
	}, [tab]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Administración",
		role: "tablist",
		className: "sticky top-0 z-10 mt-2 grid grid-cols-5 gap-1 rounded-2xl bg-secondary p-1",
		children: [
			[
				"resumen",
				"Resumen",
				ChartColumn
			],
			[
				"recomendaciones",
				"Nuevos",
				Inbox
			],
			[
				"personas",
				"Personas",
				Users
			],
			[
				"voluntarios",
				"Voluntarios",
				HandHeart
			],
			[
				"organizacion",
				"Ajustes",
				Settings
			]
		].map(([k, l, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			role: "tab",
			"aria-selected": tab === k,
			onClick: () => setTab(k),
			className: `relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.7rem] font-bold transition ${tab === k ? "bg-card text-primary shadow-card" : "text-secondary-foreground"}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }),
				l,
				k === "recomendaciones" && pending > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute top-1 right-1.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[0.65rem] text-destructive-foreground",
					children: pending
				})
			]
		}, k))
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 flex-1 pb-6",
		children: [
			tab === "resumen" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, { go: setTab }),
			tab === "recomendaciones" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Referrals, { onChange: refreshPending }),
			tab === "personas" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LinkRequests, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListEditor, { kind: "seniors" })] }),
			tab === "voluntarios" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListEditor, { kind: "volunteers" }),
			tab === "organizacion" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoordinatorAccess, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrgEditor, {})] })
		]
	})] });
}
var MOODS = [
	{
		key: "bien",
		label: "Bien",
		dot: "bg-success",
		chip: "bg-success text-success-foreground"
	},
	{
		key: "bajo",
		label: "Ánimo bajo",
		dot: "bg-warning",
		chip: "bg-warning text-warning-foreground"
	},
	{
		key: "no_contesta",
		label: "No contesta",
		dot: "bg-destructive",
		chip: "bg-destructive text-destructive-foreground"
	}
];
var startOfToday = () => {
	const d = /* @__PURE__ */ new Date();
	d.setHours(0, 0, 0, 0);
	return d;
};
function Summary({ go }) {
	const [data, setData] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const since = /* @__PURE__ */ new Date(Date.now() - 5184e5);
		since.setHours(0, 0, 0, 0);
		Promise.all([
			supabase.from("seniors").select("id, name, active"),
			supabase.from("volunteers").select("id", {
				count: "exact",
				head: true
			}).eq("available", true),
			supabase.from("check_ins").select("senior_id, mood, created_at").gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
			supabase.from("referrals").select("status, kind, referrer_name, referrer_code, via_code"),
			supabase.from("alerts").select("status, created_at").order("created_at", { ascending: false }).limit(1e3)
		]).then(([s, v, c, r, al]) => setData({
			seniors: s.data ?? [],
			volunteers: v.count ?? 0,
			checks: c.data ?? [],
			refs: r.data ?? [],
			alerts: al.data ?? []
		}));
	}, []);
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-10 text-center text-muted-foreground",
		children: "Cargando…"
	});
	const active = data.seniors.filter((s) => s.active);
	const today = startOfToday().getTime();
	const latestToday = /* @__PURE__ */ new Map();
	for (const c of data.checks) if (new Date(c.created_at).getTime() >= today && !latestToday.has(c.senior_id)) latestToday.set(c.senior_id, c.mood);
	const attention = active.filter((s) => {
		const m = latestToday.get(s.id);
		return m === "bajo" || m === "no_contesta";
	});
	const notCalled = active.filter((s) => !latestToday.has(s.id)).length;
	const pending = data.refs.filter((r) => r.status === "pending").length;
	const accepted = data.refs.filter((r) => r.status === "accepted").length;
	const days = Array.from({ length: 7 }, (_, i) => {
		const d = startOfToday();
		d.setDate(d.getDate() - (6 - i));
		const end = d.getTime() + 864e5;
		const dayChecks = data.checks.filter((c) => {
			const t = new Date(c.created_at).getTime();
			return t >= d.getTime() && t < end;
		});
		return {
			label: d.toLocaleDateString("es-ES", { weekday: "narrow" }),
			counts: MOODS.map((m) => dayChecks.filter((c) => c.mood === m.key).length)
		};
	});
	const max = Math.max(1, ...days.map((d) => d.counts.reduce((a, b) => a + b, 0)));
	const byCode = /* @__PURE__ */ new Map();
	for (const r of data.refs) if (r.referrer_code) {
		const e = byCode.get(r.referrer_code) ?? {
			name: "",
			n: 0
		};
		if (r.referrer_name) e.name = r.referrer_name;
		byCode.set(r.referrer_code, e);
	}
	for (const r of data.refs) {
		const code = r.via_code || r.referrer_code;
		if (!code) continue;
		const e = byCode.get(code) ?? {
			name: "",
			n: 0
		};
		e.n++;
		byCode.set(code, e);
	}
	const top = [...byCode.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 3);
	const stats = [
		[
			"Personas acompañadas",
			active.length,
			"personas"
		],
		[
			"Voluntarios disponibles",
			data.volunteers,
			"voluntarios"
		],
		[
			"Recomendaciones nuevas",
			pending,
			"recomendaciones"
		],
		[
			"Sin llamar hoy",
			notCalled,
			"personas"
		]
	];
	const act = activityStats(data.alerts, data.refs, today);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-5 shadow-card",
				"aria-label": "Actividad",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-bold",
						children: "Actividad"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-3 gap-2 text-center",
						children: [
							[
								"Llamadas",
								act.calls,
								`${act.callsToday} hoy`
							],
							[
								"Visitas hechas",
								act.visits,
								`${act.visitsToday} hoy`
							],
							[
								"Recomendaciones",
								act.refs,
								`${act.refsAccepted} dadas de alta`
							]
						].map(([l, n, sub]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-secondary p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl font-extrabold text-primary",
									children: n
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-semibold",
									children: l
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[0.65rem] text-muted-foreground",
									children: sub
								})
							]
						}, l))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-4 text-sm font-bold text-muted-foreground",
						children: "Pendiente"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 grid grid-cols-3 gap-2 text-center",
						children: [
							[
								"Sin atender",
								act.open,
								true
							],
							[
								"En camino",
								act.onTheWay,
								false
							],
							[
								"Recomend. por revisar",
								act.refsPending,
								false
							]
						].map(([l, n, hot]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl border p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-2xl font-extrabold ${hot && n > 0 ? "text-destructive" : "text-foreground"}`,
								children: n
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: l
							})]
						}, l))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2.5",
				children: stats.map(([l, n, t]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => go(t),
					className: "tap rounded-2xl bg-card p-4 text-left shadow-card hover:bg-secondary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-3xl font-extrabold text-primary",
						children: n
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: l
					})]
				}, l))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-5 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-bold",
					children: "Necesitan atención hoy"
				}), attention.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Nadie, por ahora. ¡Buen día!"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: attention.map((s) => {
						const m = MOODS.find((x) => x.key === latestToday.get(s.id));
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold",
								children: s.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `rounded-full px-3 py-1 text-xs font-bold ${m.chip}`,
								children: m.label
							})]
						}, s.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-5 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-bold",
						children: "Cómo están · 7 días"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex gap-3 text-xs text-muted-foreground",
						children: MOODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 rounded-full ${m.dot}` }), m.label]
						}, m.key))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex h-28 items-end gap-2",
					role: "img",
					"aria-label": "Estado de ánimo de los últimos 7 días",
					children: days.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex w-full flex-1 flex-col-reverse overflow-hidden rounded-lg bg-muted",
							children: d.counts.map((c, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: MOODS[j].dot,
								style: { height: `${c / max * 100}%` }
							}, j))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: d.label
						})]
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-3xl bg-card p-5 shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-bold",
						children: "Vecinos que más recomiendan"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [accepted, " recomendaciones ya acompañadas"]
					}),
					top.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "Aún no hay recomendaciones."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-3 space-y-2",
						children: top.map(([code, e], i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-7 place-items-center rounded-full bg-secondary text-sm font-bold text-primary",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 font-semibold",
									children: e.name || `Vecino ${code}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-muted-foreground",
									children: e.n
								})
							]
						}, code))
					})
				]
			})
		]
	});
}
function Referrals({ onChange }) {
	const qc = useQueryClient();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [show, setShow] = (0, import_react.useState)("pending");
	async function load() {
		let q = supabase.from("referrals").select("*").order("created_at", { ascending: false });
		if (show === "pending") q = q.eq("status", "pending");
		const { data } = await q;
		setRows(data ?? []);
	}
	(0, import_react.useEffect)(() => {
		load();
	}, [show]);
	async function accept(r) {
		if ((r.kind === "senior" ? await supabase.from("seniors").insert({
			name: r.person_name,
			age: r.person_age,
			phone: r.person_phone,
			family_contact: [r.referrer_name, r.referrer_phone].filter(Boolean).join(" · "),
			notes: r.relation ? `Recomendado: ${r.relation}` : ""
		}) : await supabase.from("volunteers").insert({
			name: r.person_name,
			phone: r.person_phone,
			neighborhood: r.neighborhood
		})).error) {
			toast.error("No se pudo dar de alta.");
			return;
		}
		await supabase.from("referrals").update({ status: "accepted" }).eq("id", r.id);
		toast.success(r.kind === "senior" ? `${r.person_name} ya recibe llamadas` : `${r.person_name} ya es voluntario`);
		qc.invalidateQueries({ queryKey: ["public-data"] });
		load();
		onChange();
	}
	async function dismiss(r) {
		await supabase.from("referrals").update({ status: "dismissed" }).eq("id", r.id);
		load();
		onChange();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2",
				children: ["pending", "all"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setShow(s),
					className: `tap h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${show === s ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`,
					children: s === "pending" ? "Por revisar" : "Todas"
				}, s))
			}),
			rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-10 text-center text-muted-foreground",
				children: "No hay recomendaciones por revisar."
			}),
			rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-3xl bg-card p-5 shadow-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-wide text-primary uppercase",
								children: r.kind === "senior" ? "Persona mayor" : "Voluntario"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-xl font-extrabold",
								children: [r.person_name, r.person_age ? `, ${r.person_age}` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [r.person_phone, r.neighborhood ? ` · ${r.neighborhood}` : ""]
							}),
							r.kind === "senior" && r.referrer_name && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm",
								children: [
									"Lo recomienda ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: r.referrer_name }),
									r.relation ? ` (${r.relation.toLowerCase()})` : "",
									r.referrer_phone ? ` · ${r.referrer_phone}` : ""
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-xs text-muted-foreground",
						children: new Date(r.created_at).toLocaleDateString("es-ES", {
							day: "numeric",
							month: "short"
						})
					})]
				}), r.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => accept(r),
						className: btn("primary", "sm"),
						children: "Dar de alta"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => dismiss(r),
						className: btn("ghost", "sm"),
						children: "Descartar"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm font-semibold text-muted-foreground",
					children: r.status === "accepted" ? "Dado de alta" : "Descartado"
				})]
			}, r.id))
		]
	});
}
var fields = {
	seniors: [
		{
			key: "name",
			label: "Nombre y apellido"
		},
		{
			key: "age",
			label: "Edad",
			type: "number"
		},
		{
			key: "phone",
			label: "Teléfono"
		},
		{
			key: "address",
			label: "Dirección"
		},
		{
			key: "neighborhood",
			label: "Barrio"
		},
		{
			key: "family_contact",
			label: "Contacto de la familia"
		},
		{
			key: "notes",
			label: "Notas",
			type: "textarea"
		},
		{
			key: "active",
			label: "Recibe llamadas",
			type: "check"
		}
	],
	volunteers: [
		{
			key: "name",
			label: "Nombre y apellido"
		},
		{
			key: "phone",
			label: "Teléfono"
		},
		{
			key: "neighborhood",
			label: "Barrio"
		},
		{
			key: "available",
			label: "Disponible",
			type: "check"
		}
	]
};
function ListEditor({ kind }) {
	const qc = useQueryClient();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [moods, setMoods] = (0, import_react.useState)({});
	async function load() {
		const { data } = await supabase.from(kind).select("*").order("created_at");
		setRows(data ?? []);
		if (kind === "seniors") {
			const { data: c } = await supabase.from("check_ins").select("senior_id, mood").gte("created_at", startOfToday().toISOString()).order("created_at");
			const m = {};
			for (const x of c ?? []) m[x.senior_id] = x.mood;
			setMoods(m);
		}
	}
	async function logMood(id, mood) {
		setMoods((m) => ({
			...m,
			[id]: mood
		}));
		const { error } = await supabase.from("check_ins").insert({
			senior_id: id,
			mood
		});
		if (error) toast.error("No se pudo registrar.");
	}
	(0, import_react.useEffect)(() => {
		load();
		setEditing(null);
	}, [kind]);
	async function save(values) {
		const { error } = editing === "new" ? await supabase.from(kind).insert(values) : await supabase.from(kind).update(values).eq("id", editing.id);
		if (error) {
			toast.error("No se pudo guardar. Revise los datos.");
			return;
		}
		toast.success("Guardado");
		setEditing(null);
		qc.invalidateQueries({ queryKey: ["public-data"] });
		load();
	}
	async function remove(row) {
		if (!confirm(`¿Borrar a ${row.name}?`)) return;
		const { error } = await supabase.from(kind).delete().eq("id", row.id);
		if (error) {
			toast.error("No se pudo borrar.");
			return;
		}
		toast.success("Borrado");
		qc.invalidateQueries({ queryKey: ["public-data"] });
		load();
	}
	if (editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowForm, {
		fields: fields[kind],
		initial: editing === "new" ? null : editing,
		onCancel: () => setEditing(null),
		onSave: save
	});
	const activeKey = kind === "seniors" ? "active" : "available";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			kind === "seniors" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Toque un color para anotar su ánimo de hoy."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BigButton, {
				onClick: () => setEditing("new"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" }),
					" ",
					kind === "seniors" ? "Añadir persona" : "Añadir voluntario"
				]
			}),
			rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-center text-muted-foreground",
				children: "Todavía no hay nadie."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y rounded-3xl bg-card shadow-card",
				children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-2 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setEditing(r),
							className: "min-w-0 flex-1 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block truncate font-bold",
								children: [r.name, r.age ? `, ${r.age}` : ""]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block truncate text-sm text-muted-foreground",
								children: [r[activeKey] ? kind === "seniors" ? "Recibe llamadas" : "Disponible" : "En pausa", r.phone ? ` · ${r.phone}` : ""]
							})]
						}),
						kind === "seniors" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-1",
							role: "group",
							"aria-label": `Cómo está ${r.name} hoy`,
							children: MOODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => logMood(r.id, m.key),
								"aria-label": m.label,
								"aria-pressed": moods[r.id] === m.key,
								title: m.label,
								className: `grid size-9 place-items-center rounded-full transition ${moods[r.id] === m.key ? m.chip : "bg-muted"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-3 rounded-full ${moods[r.id] === m.key ? "bg-card" : m.dot}` })
							}, m.key))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => remove(r),
							"aria-label": `Borrar a ${r.name}`,
							className: "grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" })
						})
					]
				}, r.id))
			})
		]
	});
}
function RowForm({ fields, initial, onCancel, onSave }) {
	const [v, setV] = (0, import_react.useState)(() => Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] ?? (f.type === "check" ? true : "")])));
	function submit(e) {
		e.preventDefault();
		const out = { ...v };
		for (const f of fields) if (f.type === "number") out[f.key] = out[f.key] === "" ? null : Number(out[f.key]);
		onSave(out);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: submit,
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-extrabold",
				children: initial ? `Editar ${initial.name}` : "Nuevo"
			}),
			fields.map((f) => f.type === "check" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex h-12 items-center gap-3 font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					className: "size-6 accent-primary",
					checked: !!v[f.key],
					onChange: (e) => setV({
						...v,
						[f.key]: e.target.checked
					})
				}), f.label]
			}, f.key) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block text-sm font-semibold text-muted-foreground",
					children: f.label
				}), f.type === "textarea" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: `${input} h-24 py-3`,
					value: String(v[f.key] ?? ""),
					onChange: (e) => setV({
						...v,
						[f.key]: e.target.value
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: input,
					type: f.type === "number" ? "number" : "text",
					required: f.key === "name",
					min: f.type === "number" ? 0 : void 0,
					max: f.type === "number" ? 120 : void 0,
					maxLength: 200,
					value: String(v[f.key] ?? ""),
					onChange: (e) => setV({
						...v,
						[f.key]: e.target.value
					})
				})]
			}, f.key)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
					tone: "ghost",
					onClick: onCancel,
					children: "Cancelar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, { children: "Guardar" })]
			})
		]
	});
}
function OrgEditor() {
	const qc = useQueryClient();
	const [v, setV] = (0, import_react.useState)({
		name: "",
		neighborhood: "",
		phone: "",
		email: ""
	});
	(0, import_react.useEffect)(() => {
		supabase.from("organization").select("name, neighborhood, phone, email").eq("id", 1).maybeSingle().then(({ data }) => data && setV(data));
	}, []);
	async function submit(e) {
		e.preventDefault();
		const { error } = await supabase.from("organization").upsert({
			id: 1,
			...v
		});
		if (error) {
			toast.error("No se pudo guardar.");
			return;
		}
		toast.success("Guardado");
		qc.invalidateQueries({ queryKey: ["public-data"] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: submit,
		className: "space-y-4",
		children: [[
			[
				"name",
				"Nombre de la organización",
				"text"
			],
			[
				"neighborhood",
				"Barrio",
				"text"
			],
			[
				"phone",
				"Teléfono",
				"tel"
			],
			[
				"email",
				"Correo",
				"email"
			]
		].map(([k, l, t]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "block",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mb-1 block text-sm font-semibold text-muted-foreground",
				children: l
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: input,
				type: t,
				required: k === "name",
				maxLength: 200,
				value: v[k],
				onChange: (e) => setV({
					...v,
					[k]: e.target.value
				})
			})]
		}, k)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, { children: "Guardar" })]
	});
}
function LinkRequests() {
	const qc = useQueryClient();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [people, setPeople] = (0, import_react.useState)([]);
	const [profiles, setProfiles] = (0, import_react.useState)([]);
	const [selected, setSelected] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function load() {
		const [r, p, u] = await Promise.all([
			supabase.from("person_links").select("*").eq("status", "pending"),
			supabase.from("seniors").select("id,name").eq("is_demo", false).eq("active", true),
			supabase.from("profiles").select("id,full_name")
		]);
		setRows(r.data ?? []);
		setPeople(p.data ?? []);
		setProfiles(u.data ?? []);
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	async function review(id, approve) {
		setBusy(true);
		const { data, error } = await supabase.rpc("review_person_link", {
			_id: id,
			_senior: selected[id] ?? "00000000-0000-0000-0000-000000000000",
			_approve: approve
		});
		setBusy(false);
		if (error || !data) {
			toast.error("No se pudo revisar el vínculo.");
			return;
		}
		toast.success(approve ? "Vínculo aprobado" : "Solicitud rechazada");
		qc.invalidateQueries({ queryKey: ["people"] });
		load();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-5 space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-extrabold",
				children: "Vínculos por verificar"
			}),
			!rows.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Sin solicitudes pendientes."
			}),
			rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "space-y-3 rounded-2xl border bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-bold",
						children: [
							r.requested_name,
							" · ",
							r.relation
						]
					}),
					(r.requested_phone || r.requested_age !== null) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: [r.requested_age !== null ? `${r.requested_age} años` : "", r.requested_phone].filter(Boolean).join(" · ")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: ["Solicita: ", profiles.find((p) => p.id === r.user_id)?.full_name ?? "Cuenta registrada"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm font-semibold",
						children: ["Persona verificada", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"aria-label": `Persona para ${r.requested_name}`,
							value: selected[r.id] ?? "",
							onChange: (e) => setSelected({
								...selected,
								[r.id]: e.target.value
							}),
							className: `${input} mt-1`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Seleccionar persona"
							}), people.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: p.id,
								children: p.name
							}, p.id))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							size: "sm",
							disabled: busy || !selected[r.id],
							onClick: () => review(r.id, true),
							children: "Aprobar vínculo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							size: "sm",
							tone: "ghost",
							disabled: busy,
							onClick: () => review(r.id, false),
							children: "Rechazar"
						})]
					})
				]
			}, r.id))
		]
	});
}
function CoordinatorAccess() {
	const [profiles, setProfiles] = (0, import_react.useState)([]);
	const [approved, setApproved] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function load() {
		const [p, c] = await Promise.all([supabase.from("profiles").select("id,full_name").eq("persona", "ong"), supabase.from("coordinators").select("user_id")]);
		setProfiles(p.data ?? []);
		setApproved((c.data ?? []).map((x) => x.user_id));
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	async function toggle(id) {
		setBusy(true);
		const r = approved.includes(id) ? await supabase.from("coordinators").delete().eq("user_id", id) : await supabase.from("coordinators").insert({ user_id: id });
		setBusy(false);
		if (r.error) {
			toast.error("No se pudo cambiar el acceso.");
			return;
		}
		load();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-5 space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-xl font-extrabold",
			children: "Acceso de coordinación"
		}), profiles.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 font-semibold",
				children: p.full_name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
				size: "sm",
				tone: "ghost",
				disabled: busy,
				onClick: () => toggle(p.id),
				children: approved.includes(p.id) ? "Revocar" : "Autorizar"
			}) })]
		}, p.id))]
	});
}
//#endregion
export { Admin as component };
