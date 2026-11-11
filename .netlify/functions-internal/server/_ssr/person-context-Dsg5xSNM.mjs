import { r as __toESM } from "../_runtime.mjs";
import { p as useLocation, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as personDisplayName } from "./person-presentation-DhLlwfkg.mjs";
import { t as supabase } from "./client-CxM3OIUX.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { j as ChevronRight } from "../_libs/lucide-react.mjs";
import { C as useMe, T as usePerson, b as personSection, f as btn, l as Screen, s as PersonAvatar } from "./oye-aRCGgmP7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/person-context-Dsg5xSNM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PersonGate({ children, privateData = false }) {
	const { user } = useMe();
	const { person, data: people = [], isPending, error } = usePerson();
	const path = useLocation({ select: (location) => location.pathname });
	const section = personSection(path);
	const access = useQuery({
		queryKey: [
			"person-access",
			user.id,
			person?.id
		],
		queryFn: async () => {
			if (!person) return false;
			const r = await supabase.rpc("can_care", { _sid: person.id });
			if (r.error) throw r.error;
			return !!r.data;
		},
		enabled: privateData && !!person,
		staleTime: 0
	});
	if (privateData && person && access.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		role: "status",
		children: "Comprobando acceso…"
	}) });
	if (privateData && person && !access.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Screen, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8",
		children: "No tienes acceso a la ficha ni a las llamadas de esta persona."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		className: btn(),
		children: "Volver a mis personas"
	})] });
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		role: "status",
		className: "py-8 text-center text-muted-foreground",
		children: "Cargando persona…"
	}) });
	if (!person) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Screen, {
		...section === "/llamada" ? { title: "Llamada" } : section === "/historial" ? { title: "Historial" } : {},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-5 text-2xl font-extrabold",
			children: error ? "No pudimos cargar las personas" : "Elige una persona"
		}), error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			className: `mt-5 ${btn()}`,
			children: "Mis personas"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "mt-4 divide-y",
			children: [people.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: section,
				search: {
					sid: option.id,
					aid: void 0
				},
				className: "tap flex min-h-20 items-center gap-3 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
						id: option.id,
						name: option.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-lg font-bold",
							children: personDisplayName(option.name)
						}), option.relation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm text-muted-foreground",
							children: option.relation
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 shrink-0 text-primary" })
				]
			}) }, option.id)), !people.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "py-8 text-muted-foreground",
				children: ["No tienes personas disponibles.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: `mt-5 ${btn()}`,
					children: "Mis personas"
				})]
			})]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children }, person.id);
}
//#endregion
export { PersonGate as t };
