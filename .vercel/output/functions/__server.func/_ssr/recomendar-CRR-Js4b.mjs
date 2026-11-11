import { v as lazyRouteComponent, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as enumType, l as stringType, s as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/recomendar-CRR-Js4b.js
var $$splitComponentImporter = () => import("./recomendar-Cv45-ucz.mjs");
var searchSchema = objectType({
	tipo: enumType(["mayor", "voluntario"]).optional(),
	ref: stringType().max(12).optional()
});
var Route = createFileRoute("/recomendar")({
	validateSearch: (s) => searchSchema.parse(s),
	head: () => ({ meta: [
		{ title: "Recomiende a un vecino mayor · OYE" },
		{
			name: "description",
			content: "¿Conoce a alguien mayor que vive solo? Recomiéndelo a OYE en un minuto, o hágase voluntario de su barrio."
		},
		{
			property: "og:title",
			content: "Recomiende a un vecino mayor · OYE"
		},
		{
			property: "og:description",
			content: "Una llamada al día para quien vive solo. Recomiéndelo en un minuto."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
