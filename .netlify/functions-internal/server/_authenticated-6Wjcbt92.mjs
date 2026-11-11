import { v as lazyRouteComponent, y as createFileRoute } from "./_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "./_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { y as personSearch } from "./_ssr/oye-aRCGgmP7.mjs";
require_jsx_runtime();
var $$splitComponentImporter = () => import("./_authenticated-DaZpu9_c.mjs");
var Route = createFileRoute("/_authenticated/")({
	validateSearch: personSearch,
	head: () => ({ meta: [
		{ title: "OYE · La IA llama. El humano acude." },
		{
			name: "description",
			content: "OYE llama cada día a las personas mayores que viven solas. Si algo va mal, avisa a un vecino y a la familia."
		},
		{
			property: "og:title",
			content: "OYE · La IA llama. El humano acude."
		},
		{
			property: "og:description",
			content: "Una llamada al día para mayores que viven solos. Sin app."
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
