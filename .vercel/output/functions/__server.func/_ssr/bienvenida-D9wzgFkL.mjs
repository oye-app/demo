import { v as lazyRouteComponent, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as enumType, s as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bienvenida-D9wzgFkL.js
var $$splitComponentImporter = () => import("./bienvenida-jKPCXdjy.mjs");
var search = objectType({ paso: enumType([
	"intro",
	"acceso",
	"perfil"
]).optional() });
var Route = createFileRoute("/bienvenida")({
	ssr: false,
	validateSearch: (s) => search.parse(s),
	head: () => ({ meta: [
		{ title: "Bienvenido a OYE" },
		{
			name: "description",
			content: "La IA llama cada día a mayores que viven solos. El humano acude. Entre y díganos quién es."
		},
		{
			property: "og:title",
			content: "Bienvenido a OYE"
		},
		{
			property: "og:description",
			content: "La IA llama. El humano acude."
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
