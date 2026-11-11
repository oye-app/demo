import "../_runtime.mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as personDisplayName } from "./person-presentation-DhLlwfkg.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { C as useMe, D as waitLabel, S as useAlerts, l as Screen, s as PersonAvatar, v as minutesWaiting } from "./oye-aRCGgmP7.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function Avisos() {
	const { user } = useMe();
	const { data = [], isLoading, error } = useAlerts(true);
	const active = data.find((a) => a.volunteer_id === user.id && ["accepted", "arrived"].includes(a.status));
	const open = data.filter((a) => a.status === "open");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Screen, {
		title: "Avisos para ti",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto",
			children: [
				active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					search: {
						sid: active.senior_id ?? void 0,
						aid: active.id
					},
					className: "tap mb-4 flex min-h-16 items-center gap-3 rounded-xl bg-secondary p-3 font-bold text-primary",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
							id: active.senior_id,
							name: active.senior_name,
							small: true
						}),
						"Visita en curso · ",
						personDisplayName(active.senior_name)
					]
				}),
				open.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					search: {
						sid: a.senior_id ?? void 0,
						aid: a.id
					},
					className: "tap flex min-h-24 items-center gap-3 border-b py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
						id: a.senior_id,
						name: a.senior_name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-lg font-bold",
							children: personDisplayName(a.senior_name)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block text-sm text-muted-foreground",
							children: [
								a.neighborhood,
								" · Espera ",
								waitLabel(minutesWaiting(a.created_at))
							]
						})]
					})]
				}, a.id)),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					children: "No se pudieron cargar los avisos."
				}),
				!isLoading && !open.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-8 text-center text-muted-foreground",
					children: "No hay avisos nuevos."
				})
			]
		})
	});
}
//#endregion
export { Avisos as component };
