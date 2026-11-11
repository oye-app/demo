import { r as __toESM } from "../_runtime.mjs";
import { S as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { i as enumType, l as stringType, s as objectType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-BoBTfay3.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { E as HandHeart, r as Users, z as Building2 } from "../_libs/lucide-react.mjs";
import { E as useServerFn, _ as meQuery, a as OyeLogo, f as btn, o as PERSONAS, p as createSsrRpc, t as BigButton } from "./oye-C9NPyxa_.mjs";
import { t as lovable } from "./lovable-CokzWi79.mjs";
import { t as Route } from "./bienvenida-D9wzgFkL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bienvenida-jKPCXdjy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Three shared demo accounts (no admin rights) so anyone can try each role in one tap. */
var demoAccess = createServerFn({ method: "POST" }).inputValidator((d) => objectType({ persona: enumType([
	"familia",
	"voluntario",
	"ong"
]) }).parse(d)).handler(createSsrRpc("9bfe62bf7a903ca801f1631fcf677d0fe7514c856c5d0153ccbeeafeab7efb9a"));
var SLIDES = [
	{
		title: "OYE llama cada día",
		text: "Una llamada amable a quien vive solo. Solo tiene que contestar.",
		img: "/assets/onb-1-Bw6gRqMf.jpg",
		alt: "Una mujer mayor sonríe hablando por teléfono en su cocina",
		pos: "50% 25%"
	},
	{
		title: "Un vecino acude",
		text: "Si nota soledad o tristeza, avisa a un voluntario cercano.",
		img: "/assets/onb-2-DFa8O5IC.jpg",
		alt: "Una vecina visita a un hombre mayor en la puerta de su casa",
		pos: "50% 30%"
	},
	{
		title: "Usted, tranquilo",
		text: "La familia recibe un resumen de cada llamada en el móvil.",
		img: "/assets/onb-3-B7ZABWSc.jpg",
		alt: "Una mujer sonríe al leer un mensaje en su móvil",
		pos: "50% 30%"
	}
];
var field = "h-12 w-full rounded-xl border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
function Welcome() {
	const { paso = "intro" } = Route.useSearch();
	const navigate = useNavigate({ from: "/bienvenida" });
	const go = (p) => navigate({
		search: { paso: p },
		replace: true
	});
	const qc = useQueryClient();
	(0, import_react.useEffect)(() => {
		const check = async () => {
			const me = await qc.fetchQuery({
				...meQuery,
				staleTime: 0
			});
			if (me.user && me.profile && paso !== "perfil") navigate({ to: "/" });
			else if (me.user && paso !== "perfil") go("perfil");
		};
		check();
		const { data } = supabase.auth.onAuthStateChange((e) => {
			if (e === "SIGNED_IN") {
				qc.invalidateQueries({ queryKey: ["me"] });
				check();
			}
		});
		return () => data.subscription.unsubscribe();
	}, [paso]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-dvh max-w-md flex-col px-5 pt-4 pb-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-12 shrink-0 items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OyeLogo, { className: "text-primary" }), paso === "intro" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => go("acceso"),
					className: "tap h-11 rounded-2xl px-4 text-base font-bold text-muted-foreground hover:bg-muted",
					children: "Saltar"
				})]
			}),
			paso === "intro" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Intro, { onDone: () => go("acceso") }),
			paso === "acceso" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Access, {}),
			paso === "perfil" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileForm, { onDone: async () => {
				await qc.invalidateQueries({ queryKey: ["me"] });
				navigate({ to: "/" });
			} })
		]
	});
}
function Intro({ onDone }) {
	const [i, setI] = (0, import_react.useState)(0);
	const s = SLIDES[i];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative mt-2 min-h-0 flex-1 overflow-hidden rounded-3xl bg-secondary",
				children: SLIDES.map((x, k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: x.img,
					alt: x.alt,
					width: 832,
					height: 1024,
					style: { objectPosition: x.pos },
					className: `absolute inset-0 size-full object-cover transition-opacity duration-500 ${k === i ? "opacity-100" : "opacity-0"}`
				}, k))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "animate-rise pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-bold text-primary",
						children: [
							i + 1,
							" de ",
							SLIDES.length
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-4xl leading-tight font-extrabold",
						children: s.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-lg text-muted-foreground",
						children: s.text
					})
				]
			}, i),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2",
					role: "tablist",
					"aria-label": "Pasos",
					children: SLIDES.map((_, k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						role: "tab",
						"aria-selected": k === i,
						"aria-label": `Paso ${k + 1}`,
						onClick: () => setI(k),
						className: `h-2.5 rounded-full transition-all ${k === i ? "w-8 bg-primary" : "w-2.5 bg-border"}`
					}, k))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
						onClick: () => i < SLIDES.length - 1 ? setI(i + 1) : onDone(),
						children: i < SLIDES.length - 1 ? "Siguiente" : "Empezar"
					})
				})]
			})
		]
	});
}
function Access() {
	const [mode, setMode] = (0, import_react.useState)("up");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		setMsg(null);
		const r = mode === "in" ? await supabase.auth.signInWithPassword({
			email,
			password
		}) : await supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: `${window.location.origin}/bienvenida` }
		});
		setBusy(false);
		if (r.error) return setMsg({
			ok: false,
			text: mode === "in" ? "Correo o contraseña incorrectos." : "No se pudo crear la cuenta. ¿Ya tiene una?"
		});
		if (mode === "up" && !r.data.session) setMsg({
			ok: true,
			text: "Le hemos enviado un correo. Ábralo para confirmar su cuenta y vuelva aquí."
		});
	}
	const demo = useServerFn(demoAccess);
	async function quick(persona) {
		setBusy(true);
		setMsg(null);
		try {
			const c = await demo({ data: { persona } });
			const r = await supabase.auth.signInWithPassword(c);
			if (r.error) throw r.error;
		} catch {
			setMsg({
				ok: false,
				text: "No se pudo abrir la demo. Inténtelo otra vez."
			});
		}
		setBusy(false);
	}
	async function social(p) {
		if ((await lovable.auth.signInWithOAuth(p, { redirect_uri: `${window.location.origin}/bienvenida` })).error) setMsg({
			ok: false,
			text: "No se pudo entrar. Inténtelo otra vez."
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex flex-1 flex-col justify-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-extrabold",
				children: mode === "up" ? "Cree su cuenta" : "Bienvenido de nuevo"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-muted-foreground",
				children: "Tarda menos de un minuto."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 rounded-2xl bg-secondary p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-bold text-secondary-foreground",
					children: "Probar ya, sin registro"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid grid-cols-3 gap-2",
					children: Object.keys(PERSONAS).map((k) => {
						const I = ICONS[k];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							disabled: busy,
							onClick: () => quick(k),
							className: "tap flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-sm font-bold shadow-card disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(I, { className: "size-6 text-primary" }), k === "familia" ? "Familia" : k === "voluntario" ? "Voluntario" : "ONG"]
						}, k);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [
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
								className: field,
								type: "email",
								required: true,
								autoComplete: "email",
								placeholder: "Correo",
								"aria-label": "Correo",
								value: email,
								onChange: (e) => setEmail(e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: field,
								type: "password",
								required: true,
								minLength: 6,
								autoComplete: mode === "in" ? "current-password" : "new-password",
								placeholder: "Contraseña (mín. 6)",
								"aria-label": "Contraseña",
								value: password,
								onChange: (e) => setPassword(e.target.value)
							}),
							msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								role: "status",
								className: `text-sm font-semibold ${msg.ok ? "text-success" : "text-destructive"}`,
								children: msg.text
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
								disabled: busy,
								children: busy ? "Un momento…" : mode === "up" ? "Crear cuenta" : "Entrar"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							setMode(mode === "up" ? "in" : "up");
							setMsg(null);
						},
						className: btn("quiet", "sm"),
						children: mode === "up" ? "Ya tengo cuenta" : "Soy nuevo: crear cuenta"
					})
				]
			})
		]
	});
}
var ICONS = {
	familia: Users,
	voluntario: HandHeart,
	ong: Building2
};
var RELATIONS = [
	"Madre",
	"Padre",
	"Abuela",
	"Abuelo",
	"Vecino/a"
];
var profileSchema = objectType({
	full_name: stringType().trim().min(2, "Escriba su nombre").max(100),
	phone: stringType().trim().max(30).regex(/^[0-9+\s()-]*$/, "Teléfono: solo números"),
	neighborhood: stringType().trim().max(100),
	senior_name: stringType().trim().max(100)
});
function ProfileForm({ onDone }) {
	const [persona, setPersona] = (0, import_react.useState)(null);
	const [v, setV] = (0, import_react.useState)({
		full_name: "",
		phone: "",
		neighborhood: "",
		senior_name: ""
	});
	const [relation, setRelation] = (0, import_react.useState)("Madre");
	const [err, setErr] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getUser().then(async ({ data: u }) => {
			if (!u.user) return;
			const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
			if (!data) {
				const meta = u.user.user_metadata;
				setV((x) => ({
					...x,
					full_name: meta.full_name ?? meta.name ?? ""
				}));
				return;
			}
			setPersona(data.persona);
			setV({
				full_name: data.full_name,
				phone: data.phone,
				neighborhood: data.neighborhood,
				senior_name: data.senior_name
			});
			if (data.senior_relation) setRelation(data.senior_relation);
		});
	}, []);
	async function submit(e) {
		e.preventDefault();
		setErr("");
		const p = profileSchema.safeParse(v);
		if (!p.success) return setErr(p.error.issues[0]?.message ?? "Revise los datos");
		if (persona === "familia" && p.data.senior_name.length < 2) return setErr("¿Cómo se llama su familiar?");
		const { data: u } = await supabase.auth.getUser();
		if (!u.user || !persona) return;
		setBusy(true);
		const { error } = await supabase.from("profiles").upsert({
			id: u.user.id,
			persona,
			...p.data,
			senior_relation: persona === "familia" ? relation : "",
			senior_name: persona === "familia" ? p.data.senior_name : ""
		});
		setBusy(false);
		if (error) return setErr("No se pudo guardar. Inténtelo otra vez.");
		if (persona === "familia") {
			const { data: existing } = await supabase.from("person_links").select("id").eq("user_id", u.user.id).eq("requested_name", p.data.senior_name).limit(1);
			if (!existing?.length) {
				const { error: requestError } = await supabase.from("person_links").insert({
					user_id: u.user.id,
					requested_name: p.data.senior_name,
					relation
				});
				if (requestError) return setErr("Perfil guardado. Solicite el vínculo desde Inicio.");
			}
		}
		onDone();
	}
	if (!persona) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex flex-1 flex-col justify-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold tracking-wide text-primary uppercase",
				children: "Paso final"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-3xl font-extrabold",
				children: "¿Quién es usted?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-muted-foreground",
				children: "Así le mostramos solo lo que necesita."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 space-y-3",
				children: Object.keys(PERSONAS).map((k) => {
					const I = ICONS[k];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setPersona(k),
						className: "tap flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-card hover:bg-secondary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(I, { className: "size-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-lg font-bold",
							children: PERSONAS[k].label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm text-muted-foreground",
							children: PERSONAS[k].hint
						})] })]
					}, k);
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setPersona(null),
				className: "tap h-11 self-start rounded-2xl px-3 text-base font-bold text-primary hover:bg-secondary",
				children: "← Cambiar"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-extrabold",
				children: "Encantados"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-muted-foreground",
				children: [PERSONAS[persona].label, ". Cuéntenos un poco más."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Su nombre",
						"aria-label": "Su nombre",
						maxLength: 100,
						value: v.full_name,
						onChange: (e) => setV({
							...v,
							full_name: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: "Su móvil (para avisos)",
						"aria-label": "Su móvil",
						inputMode: "tel",
						maxLength: 30,
						value: v.phone,
						onChange: (e) => setV({
							...v,
							phone: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: field,
						placeholder: persona === "ong" ? "Nombre de la ONG o barrio" : "Su barrio",
						"aria-label": "Barrio",
						maxLength: 100,
						value: v.neighborhood,
						onChange: (e) => setV({
							...v,
							neighborhood: e.target.value
						})
					}),
					persona === "familia" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-2 text-sm font-semibold text-muted-foreground",
							children: "¿A quién acompaña OYE?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: RELATIONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setRelation(r),
								"aria-pressed": relation === r,
								className: `rounded-full px-4 py-2 text-sm font-semibold ${relation === r ? "bg-primary text-primary-foreground" : "bg-card shadow-card"}`,
								children: r
							}, r))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: field,
							placeholder: "Su nombre (p. ej. Carmen)",
							"aria-label": "Nombre de su familiar",
							maxLength: 100,
							value: v.senior_name,
							onChange: (e) => setV({
								...v,
								senior_name: e.target.value
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto space-y-2 pt-3",
						children: [err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "text-center text-sm font-semibold text-destructive",
							children: err
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
							disabled: busy,
							children: busy ? "Guardando…" : "Entrar en OYE"
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { Welcome as component };
