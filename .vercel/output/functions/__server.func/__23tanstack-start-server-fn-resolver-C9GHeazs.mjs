//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-C9GHeazs.js
var manifest = {
	"111aa28319e7dcf0aa3324426015f2bac10c12e06a151f15cd01f23cdb3de674": {
		functionName: "getPersonDetails_createServerFn_handler",
		importer: () => import("./_ssr/person.functions-Dms-XBGf.mjs")
	},
	"11e13fc3e19f615027ad4a41b3b9bb9f16045ec6e88c4bf04daa8b7943d55575": {
		functionName: "analyzeCall_createServerFn_handler",
		importer: () => import("./_ssr/call.functions-Bu6T72kz.mjs")
	},
	"12f054b6642a197bbc5f9ecef1fe4988bba9e37a8003628a38f1de321fbd07ce": {
		functionName: "updatePerson_createServerFn_handler",
		importer: () => import("./_ssr/person.functions-Dms-XBGf.mjs")
	},
	"7e3c2e2abcd279961a6582c3bd33c6c07c6d223a066ad48a96c005c76c668d7c": {
		functionName: "deletePerson_createServerFn_handler",
		importer: () => import("./_ssr/person.functions-Dms-XBGf.mjs")
	},
	"9bfe62bf7a903ca801f1631fcf677d0fe7514c856c5d0153ccbeeafeab7efb9a": {
		functionName: "demoAccess_createServerFn_handler",
		importer: () => import("./_ssr/demo.functions-cLqLv03C.mjs")
	},
	"dc93c5071676c5c5028fbdbf2ebd3f08aca5997bb350853586704c3d214b6ac0": {
		functionName: "startCall_createServerFn_handler",
		importer: () => import("./_ssr/call.functions-Bu6T72kz.mjs")
	},
	"efa089d96d5b102e5dc407072893a47f952085ab2500e2150c9fca22d37d81fe": {
		functionName: "addPerson_createServerFn_handler",
		importer: () => import("./_ssr/person.functions-Dms-XBGf.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ??= await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
