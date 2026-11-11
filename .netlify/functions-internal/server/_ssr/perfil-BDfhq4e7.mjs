import { r as __toESM } from "../_runtime.mjs";
import { S as useNavigate, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-CxM3OIUX.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient, r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { V as Bell, i as UserRound, j as ChevronRight, u as Settings2, w as Heart, y as LogOut } from "../_libs/lucide-react.mjs";
import { C as useMe, l as Screen, o as PERSONAS, t as BigButton, w as usePeople } from "./oye-aRCGgmP7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/perfil-BDfhq4e7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfilePage() {
	const { profile, user } = useMe();
	const { data: people = [] } = usePeople();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const { data: isAdmin } = useQuery({
		queryKey: ["is-admin", user.id],
		queryFn: async () => (await supabase.rpc("has_role", {
			_user_id: user.id,
			_role: "admin"
		})).data ?? false
	});
	async function signOut() {
		await qc.cancelQueries();
		qc.clear();
		await supabase.auth.signOut();
		navigate({
			to: "/bienvenida",
			search: { paso: "acceso" },
			replace: true
		});
	}
	const rows = [
		["Correo", user.email],
		["Móvil", profile.phone || "—"],
		["Barrio", profile.neighborhood || "—"],
		...profile.persona === "familia" ? [["Acompañamos a", `${people.length} personas`]] : []
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Screen, {
		title: "Mi perfil",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4 pt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-16 place-items-center rounded-full bg-primary text-primary-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "size-8" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "truncate text-2xl font-extrabold",
						children: profile.full_name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-primary font-semibold",
						children: PERSONAS[profile.persona].label
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "mt-5 divide-y rounded-3xl bg-card px-4 shadow-card",
				children: rows.map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-3 py-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-muted-foreground",
						children: k
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "truncate font-semibold",
						children: v
					})]
				}, k))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PushToggle, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mt-4 divide-y rounded-3xl bg-card shadow-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/bienvenida",
						search: { paso: "perfil" },
						className: "flex items-center gap-3 p-4 font-semibold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "size-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1",
								children: "Cambiar mis datos o mi papel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 text-muted-foreground" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/recomendar",
						className: "flex items-center gap-3 p-4 font-semibold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1",
								children: "Recomendar a un vecino mayor"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 text-muted-foreground" })
						]
					}),
					isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/admin",
						className: "flex items-center gap-3 p-4 font-semibold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1",
								children: "Administración"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 text-muted-foreground" })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BigButton, {
					tone: "danger",
					onClick: signOut,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-5" }), " Cerrar sesión"]
				})
			})
		]
	});
}
function PushToggle() {
	const [perm, setPerm] = (0, import_react.useState)("default");
	const [iframe, setIframe] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
		setIframe(window.top !== window.self);
	}, []);
	async function enable() {
		if (typeof Notification === "undefined") return;
		setPerm(await Notification.requestPermission());
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-5 shrink-0 text-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold",
					children: "Notificaciones"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: perm === "granted" ? "Con OYE abierta en este dispositivo" : perm === "denied" ? "Bloqueadas: actívelas en los ajustes del navegador" : perm === "unsupported" ? "Este navegador no las admite" : iframe ? "Abra la app en una pestaña propia para activarlas" : "Avisos mientras OYE está abierta"
				})]
			}),
			perm === "default" && !iframe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-28 shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BigButton, {
					size: "sm",
					onClick: enable,
					children: "Activar"
				})
			})
		]
	});
}
//#endregion
export { ProfilePage as component };
