//#region node_modules/.nitro/vite/services/ssr/assets/person-presentation-DhLlwfkg.js
/** Display-only formatting; stored names and access checks remain untouched. */
function personDisplayName(name) {
	return name.replace(/\s*(?:[·—–-]\s*)?\bdemo\b\s*/gi, " ").trim();
}
var DEMO_PERSON_IDS = {
	carmen: "d0000000-0000-4000-8000-000000000001",
	antonio: "d0000000-0000-4000-8000-000000000002"
};
//#endregion
export { personDisplayName as n, DEMO_PERSON_IDS as t };
