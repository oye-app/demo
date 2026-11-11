import { r as __toESM } from "../_runtime.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-C9GHeazs.mjs";
import { C as useRouter, Ht as isRedirect, S as useNavigate, p as useLocation, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as TSS_SERVER_FUNCTION, l as createServerFn } from "./createServerFn-DDDJMFWM.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dcy-eaQM.mjs";
import { n as personDisplayName, t as DEMO_PERSON_IDS } from "./person-presentation-DhLlwfkg.mjs";
import { l as stringType, s as objectType } from "../_libs/zod.mjs";
import { n as personRequestSchema, r as personUpdateSchema, t as personDeleteSchema } from "./person-manage-BGjb_D_C.mjs";
import { t as supabase } from "./client-CxM3OIUX.mjs";
import { a as AlertDialogDescription$1, c as AlertDialogTitle$1, d as DialogContent$1, f as DialogDescription$1, g as Slot, h as DialogTitle$1, i as AlertDialogContent$1, l as Dialog$1, m as DialogPortal$1, n as AlertDialogAction$1, o as AlertDialogOverlay$1, p as DialogOverlay$1, r as AlertDialogCancel$1, s as AlertDialogPortal$1, t as AlertDialog$1, u as DialogClose, v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as useQueryClient, n as useSuspenseQuery, r as useQuery, t as queryOptions } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as History, M as ChevronLeft, S as House, V as Bell, g as Pencil, i as UserRound, o as Trash2, p as Phone, t as X, w as Heart } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/oye-aRCGgmP7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var meQuery = queryOptions({
	queryKey: ["me"],
	queryFn: async () => {
		const { data: u } = await supabase.auth.getUser();
		if (!u.user) return {
			user: null,
			profile: null
		};
		const { data: profile } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
		return {
			user: {
				id: u.user.id,
				email: u.user.email ?? ""
			},
			profile
		};
	},
	staleTime: 6e4
});
function useMe() {
	const { data } = useSuspenseQuery(meQuery);
	return data;
}
var PERSONAS = {
	familia: {
		label: "Soy familia",
		hint: "Quiero saber cómo está mi madre, padre o abuelo"
	},
	voluntario: {
		label: "Soy vecino voluntario",
		hint: "Quiero acompañar a mayores de mi barrio"
	},
	ong: {
		label: "Soy de una ONG",
		hint: "Coordino avisos y voluntarios"
	}
};
function personSearch(input) {
	return {
		sid: typeof input["sid"] === "string" ? input["sid"] : void 0,
		aid: typeof input["aid"] === "string" ? input["aid"] : void 0
	};
}
var peopleQuery = (userId) => queryOptions({
	queryKey: ["people", userId],
	queryFn: async () => {
		const { data, error } = await supabase.rpc("person_options");
		if (error) throw error;
		return data ?? [];
	},
	staleTime: 0,
	refetchInterval: 15e3
});
function usePeople() {
	const { user } = useMe();
	return useQuery(peopleQuery(user.id));
}
function usePersonId() {
	const search = useLocation({ select: (l) => l.searchStr });
	return new URLSearchParams(search).get("sid") ?? void 0;
}
function usePerson() {
	const sid = usePersonId();
	const query = usePeople();
	return {
		...query,
		person: query.data?.find((p) => p.id === sid),
		sid
	};
}
queryOptions({
	queryKey: ["alerts"],
	queryFn: () => fetchAlerts()
});
async function fetchAlerts(sid) {
	const rows = [];
	for (let offset = 0;; offset += 50) {
		const { data, error } = await supabase.rpc("visible_alerts", {
			...sid ? { _senior: sid } : {},
			_offset: offset
		});
		if (error) throw error;
		const page = data ?? [];
		rows.push(...page);
		if (page.length < 50) break;
	}
	return rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}
function useAlerts(global = false) {
	const qc = useQueryClient();
	const sid = usePersonId();
	const { user } = useMe();
	(0, import_react.useEffect)(() => {
		const ch = supabase.channel(`alerts-live-${crypto.randomUUID()}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "alerts"
		}, () => {
			qc.invalidateQueries({ queryKey: ["alerts"] });
			qc.invalidateQueries({ queryKey: ["people"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [qc]);
	return useQuery({
		queryKey: [
			"alerts",
			user.id,
			global ? "all" : sid ?? "all"
		],
		queryFn: () => fetchAlerts(global ? void 0 : sid),
		refetchInterval: 15e3
	});
}
var MOOD = {
	bien: {
		label: "Está bien",
		dot: "bg-success",
		chip: "bg-success text-success-foreground"
	},
	bajo: {
		label: "Ánimo bajo",
		dot: "bg-warning",
		chip: "bg-warning text-warning-foreground"
	},
	no_contesta: {
		label: "No contesta",
		dot: "bg-destructive",
		chip: "bg-destructive text-destructive-foreground"
	}
};
var NEED = {
	ninguna: "Nada que hacer",
	compania: "Quiere compañía",
	llamada: "Necesita que le llamen",
	visita: "Hay que ir a verle"
};
var STATUS = {
	open: "Esperando voluntario",
	accepted: "Voluntario en camino",
	arrived: "Voluntario con la persona",
	visited: "Visita hecha",
	closed: "Todo bien"
};
function timeAgo(iso) {
	const m = Math.round((Date.now() - new Date(iso).getTime()) / 6e4);
	if (m < 1) return "ahora";
	if (m < 60) return `hace ${m} min`;
	const h = Math.round(m / 60);
	if (h < 24) return `hace ${h} h`;
	return new Date(iso).toLocaleDateString("es-ES", {
		day: "numeric",
		month: "short"
	});
}
var minutesWaiting = (iso) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));
var waitLabel = (m) => m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 1440)} d`;
var fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("es-ES", {
	hour: "2-digit",
	minute: "2-digit"
}) : "";
/** Loose neighbourhood match: "Chamberí" matches "Asociación Vecinal Chamberí". */
var sameArea = (a, b) => {
	const x = a.trim().toLowerCase(), y = b.trim().toLowerCase();
	return !x || !y || x.includes(y) || y.includes(x);
};
function escalation(a, now = Date.now()) {
	if (a.status !== "open") return {
		level: 0,
		label: "",
		next: ""
	};
	const m = Math.max(0, Math.round((now - new Date(a.created_at).getTime()) / 6e4));
	const at = (min) => new Date(new Date(a.created_at).getTime() + min * 6e4).toLocaleTimeString("es-ES", {
		hour: "2-digit",
		minute: "2-digit"
	});
	const noAnswer = a.mood === "no_contesta";
	if (m >= 60) return {
		level: 2,
		label: noAnswer ? "Sin respuesta: llamar a quien tiene llave" : "Familia avisada",
		next: ""
	};
	if (m >= 30) return {
		level: 1,
		label: "Escalado a la ONG",
		next: `Familia a las ${at(60)}`
	};
	if (noAnswer) return {
		level: 0,
		label: m >= 15 ? "Volver a llamar ahora" : `OYE vuelve a llamar a las ${at(15)}`,
		next: `ONG a las ${at(30)}`
	};
	return {
		level: 0,
		label: "",
		next: `ONG a las ${at(30)}`
	};
}
/** UCLA-3 loneliness score (3-9). 3-5 = not lonely, 6-9 = lonely. */
var lonelyLabel = (s) => s >= 6 ? "Se siente sola" : "No se siente sola";
/** Decide whether this person should hear about an alert change, and what to say. Pure for testing. */
function notificationFor(p, userId, a, isNew, authorizedIds = []) {
	const name = personDisplayName(a.senior_name);
	if (p.persona === "familia") {
		if (!a.senior_id || !authorizedIds.includes(a.senior_id)) return null;
		if (isNew) return a.status === "closed" ? `OYE ha llamado a ${name}: está bien.` : `OYE ha llamado a ${name}. Estamos avisando a un vecino.`;
		if (a.status === "accepted") return `${a.volunteer_name} va de camino a ver a ${name}.`;
		if (a.status === "arrived") return `${a.volunteer_name} ya está con ${name}.`;
		if (a.status === "visited") return `Visita hecha: ${a.volunteer_name} ha estado con ${name}.`;
		return null;
	}
	if (p.persona === "voluntario") {
		const near = !p.neighborhood || !a.neighborhood || sameArea(a.neighborhood, p.neighborhood);
		if (a.status === "open" && near && (isNew || !a.volunteer_id)) return `${name} necesita compañía cerca de usted.`;
		return null;
	}
	if (isNew && a.status === "open") return `Nuevo aviso: ${name}${a.mood === "no_contesta" ? " no contesta" : " necesita compañía"}.`;
	return null;
}
function AlertNotifier({ profile, userId }) {
	const { data: people = [] } = usePeople();
	const ids = (0, import_react.useRef)([]);
	ids.current = people.map((p) => p.id);
	const qc = useQueryClient();
	const ref = (0, import_react.useRef)(profile);
	ref.current = profile;
	(0, import_react.useEffect)(() => {
		let previous = /* @__PURE__ */ new Map();
		let initialized = false;
		let stopped = false;
		const poll = async () => {
			try {
				const alerts = await fetchAlerts();
				if (stopped) return;
				for (const a of alerts) {
					const old = previous.get(a.id);
					if (initialized && old !== a.status && !(a.volunteer_id === userId && old)) {
						const text = notificationFor(ref.current, userId, a, !old, ids.current);
						if (text) toast(text, { action: {
							label: "Abrir",
							onClick: () => {
								if (a.senior_id) window.location.assign(`/?sid=${encodeURIComponent(a.senior_id)}${ref.current.persona === "voluntario" ? `&aid=${encodeURIComponent(a.id)}` : ""}`);
							}
						} });
					}
				}
				previous = new Map(alerts.map((a) => [a.id, a.status]));
				initialized = true;
				qc.invalidateQueries({ queryKey: ["alerts"] });
				qc.invalidateQueries({ queryKey: ["people"] });
			} catch {}
		};
		poll();
		const timer = setInterval(poll, 15e3);
		const ch = supabase.channel(`alerts-notify-${userId}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "alerts"
		}, (payload) => {
			if (payload.eventType === "DELETE") return;
			const a = payload.new;
			const old = payload.old;
			if (payload.eventType === "UPDATE" && old.status === a.status) return;
			if (a.volunteer_id === userId && payload.eventType === "UPDATE") return;
			const text = notificationFor(ref.current, userId, a, payload.eventType === "INSERT", ids.current);
			if (!text) return;
			previous.set(a.id, a.status);
			toast(text);
			if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) try {
				new Notification("OYE", {
					body: text,
					tag: a.id
				});
			} catch {}
		}).subscribe();
		return () => {
			stopped = true;
			clearInterval(timer);
			supabase.removeChannel(ch);
		};
	}, [userId, qc]);
	return null;
}
/** Keep person selection in the current personal section, never in a visit. */
function personSection(path) {
	if (path === "/llamada" || path === "/historial" || path === "/persona") return path;
	return "/";
}
var carmen_portrait_default = "/assets/carmen-portrait-Q_JbthYr.jpg";
var antonio_portrait_default = "/assets/antonio-portrait-Dd6Nsrmh.jpg";
/** Fictional portraits are tied to demo IDs, never to a real person's name. */
function PersonAvatar({ id, name, small = false }) {
	const [failed, setFailed] = (0, import_react.useState)(false);
	const photo = id === DEMO_PERSON_IDS.carmen ? carmen_portrait_default : id === DEMO_PERSON_IDS.antonio ? antonio_portrait_default : void 0;
	const size = small ? "size-10" : "size-12";
	return photo && !failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: photo,
		alt: "",
		width: 48,
		height: 48,
		loading: "lazy",
		onError: () => setFailed(true),
		className: `${size} shrink-0 rounded-full object-cover`
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		"aria-hidden": "true",
		className: `${size} grid shrink-0 place-items-center rounded-full bg-secondary font-extrabold text-primary`,
		children: personDisplayName(name).split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("")
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var AlertDialog = AlertDialog$1;
var AlertDialogPortal = AlertDialogPortal$1;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay$1, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = AlertDialogOverlay$1.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = AlertDialogContent$1.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = AlertDialogTitle$1.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = AlertDialogDescription$1.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction$1, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = AlertDialogAction$1.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel$1, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = AlertDialogCancel$1.displayName;
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getPersonDetails = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("111aa28319e7dcf0aa3324426015f2bac10c12e06a151f15cd01f23cdb3de674"));
var updatePerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => personUpdateSchema.parse(input)).handler(createSsrRpc("12f054b6642a197bbc5f9ecef1fe4988bba9e37a8003628a38f1de321fbd07ce"));
var deletePerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => personDeleteSchema.parse(input)).handler(createSsrRpc("7e3c2e2abcd279961a6582c3bd33c6c07c6d223a066ad48a96c005c76c668d7c"));
var addPerson = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => personRequestSchema.parse(input)).handler(createSsrRpc("efa089d96d5b102e5dc407072893a47f952085ab2500e2150c9fca22d37d81fe"));
function PersonEditor({ id, name }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const read = useServerFn(getPersonDetails);
	const query = useQuery({
		queryKey: ["person-edit", id],
		queryFn: () => read({ data: { id } }),
		enabled: open,
		staleTime: 0
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "ghost",
		onClick: () => setOpen(true),
		className: "h-11 min-w-0 justify-start px-1 font-bold",
		"aria-label": `Editar datos de ${personDisplayName(name)}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "truncate",
			children: personDisplayName(name)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "shrink-0 text-primary" })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["Datos de ", personDisplayName(name)] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "sr-only",
					children: "Editar datos de la persona"
				}),
				query.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "status",
					children: "Cargando…"
				}) : query.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					children: "No se pudieron cargar los datos."
				}) : query.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditForm, {
					details: query.data,
					close: () => setOpen(false)
				}, `${id}-${query.data.requested_name}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Solo la administración puede modificar los datos de esta persona." })
			]
		})
	})] });
}
function EditForm({ details, close }) {
	const [form, setForm] = (0, import_react.useState)({
		requested_name: personDisplayName(details.requested_name),
		requested_phone: details.requested_phone,
		requested_age: details.requested_age?.toString() ?? "",
		relation: details.relation
	});
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [confirm, setConfirm] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const update = useServerFn(updatePerson);
	const remove = useServerFn(deletePerson);
	const qc = useQueryClient();
	const navigate = useNavigate();
	const refresh = () => Promise.all([
		"people",
		"person-edit",
		"alerts",
		"links"
	].map((key) => qc.invalidateQueries({ queryKey: [key] })));
	async function save(e) {
		e.preventDefault();
		setError("");
		const parsed = personUpdateSchema.safeParse({
			...form,
			id: details.id
		});
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Revise los datos");
			return;
		}
		setBusy(true);
		try {
			await update({ data: parsed.data });
			await refresh();
			close();
			toast.success("Datos actualizados correctamente");
		} catch {
			setError("No se pudieron guardar los cambios.");
		} finally {
			setBusy(false);
		}
	}
	async function destroy() {
		setBusy(true);
		setError("");
		try {
			await remove({ data: {
				id: details.id,
				confirmed: true
			} });
			setConfirm(false);
			close();
			await navigate({
				to: "/",
				search: {}
			});
			await refresh();
			toast.success("Persona eliminada correctamente");
		} catch (e) {
			setError(e instanceof Error ? e.message : "No se pudo eliminar la persona.");
			setConfirm(false);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: save,
		className: "space-y-3",
		children: [
			[
				{
					key: "requested_name",
					label: "Nombre completo",
					type: "text"
				},
				{
					key: "requested_phone",
					label: "Teléfono de la persona",
					type: "tel"
				},
				{
					key: "requested_age",
					label: "Edad",
					type: "number"
				},
				{
					key: "relation",
					label: "Vínculo",
					type: "text"
				}
			].map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm font-semibold",
				children: [field.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					required: true,
					disabled: busy,
					type: field.type,
					min: field.type === "number" ? 0 : void 0,
					max: field.type === "number" ? 120 : void 0,
					value: form[field.key],
					onChange: (e) => setForm({
						...form,
						[field.key]: e.target.value
					}),
					className: "mt-1 h-12 w-full rounded-lg border bg-card px-3"
				})]
			}, field.key)),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-sm text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				disabled: busy,
				className: "h-12 w-full",
				children: busy ? "Guardando…" : "Guardar cambios"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "ghost",
				disabled: busy,
				onClick: () => setConfirm(true),
				className: "h-12 w-full text-destructive",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {}), "Eliminar persona"]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
		open: confirm,
		onOpenChange: (value) => {
			if (!busy) setConfirm(value);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, {
			className: "w-[calc(100%-2rem)] max-w-md rounded-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogTitle, { children: [
					"¿Eliminar a ",
					personDisplayName(details.requested_name),
					"?"
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "Dejará de aparecer en la lista y se detendrán sus llamadas programadas." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
						disabled: busy,
						children: "Cancelar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "destructive",
						disabled: busy,
						onClick: destroy,
						children: busy ? "Eliminando…" : "Sí, eliminar"
					})]
				})
			]
		})
	})] });
}
function OyeLogo({ className = "", big = false, heartClassName = "fill-background" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 32 32",
			className: big ? "size-16" : "size-7",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M15 4C8.4 4 3 8.9 3 15c0 3 1.3 5.7 3.4 7.7L5 28l5.6-2.6c1.4.4 2.9.6 4.4.6 6.6 0 12-4.9 12-11S21.6 4 15 4Z",
					fill: "currentColor"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M15 20.5s-5-3-5-6.3A2.7 2.7 0 0 1 15 12.6a2.7 2.7 0 0 1 5 1.6c0 3.3-5 6.3-5 6.3Z",
					className: heartClassName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M24 3.5c1.6 1 2.7 2.6 3 4.5M26.5 1.5c2 1.3 3.4 3.4 3.8 5.8",
					stroke: "currentColor",
					strokeWidth: "1.6",
					fill: "none",
					strokeLinecap: "round"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: big ? "text-4xl" : "text-2xl",
			children: "OYE"
		})]
	});
}
function Screen({ title, children, footer }) {
	const path = useLocation({ select: (l) => l.pathname });
	const sid = usePersonId();
	const { data: me } = useQuery(meQuery);
	const { data: people = [] } = useQuery({
		...peopleQuery(me?.user?.id ?? ""),
		enabled: !!sid && !!me?.user
	});
	const selected = people.find((p) => p.id === sid);
	const isTab = NAV.some((n) => n.to === path) || path === "/avisos";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex h-dvh max-w-md flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1 flex-col px-5 pt-4 pb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "grid h-12 shrink-0 grid-cols-[3rem_1fr_3rem] items-center",
					children: [
						title && !isTab ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							"aria-label": "Volver al inicio",
							className: "tap -ml-2 grid size-11 place-items-center rounded-full text-primary hover:bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-7" })
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate text-center text-lg font-bold text-foreground",
							children: title ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OyeLogo, { className: "text-primary" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
					]
				}),
				selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex shrink-0 items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonAvatar, {
							id: selected.id,
							name: selected.name,
							small: true
						}, selected.id), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonEditor, {
							id: selected.id,
							name: selected.name
						}, selected.id)]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: personSection(path),
						search: {
							sid: void 0,
							aid: void 0
						},
						className: "tap inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary",
						children: "Cambiar persona"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex min-h-0 flex-1 flex-col overflow-y-auto",
					children
				}),
				footer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "shrink-0 pt-3",
					children: footer
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, { path })]
	});
}
var NAV = [
	{
		to: "/",
		label: "Inicio",
		Icon: House
	},
	{
		to: "/llamada",
		label: "Llamada",
		Icon: Phone
	},
	{
		to: "/recomendar",
		label: "Recomendar",
		Icon: Heart,
		accent: true
	},
	{
		to: "/historial",
		label: "Historial",
		Icon: History
	},
	{
		to: "/perfil",
		label: "Perfil",
		Icon: UserRound
	}
];
var VOLUNTEER_NAV = [
	NAV[0],
	{
		to: "/avisos",
		label: "Avisos",
		Icon: Bell
	},
	NAV[2],
	NAV[3],
	NAV[4]
];
var HISTORY_LABEL = {
	familia: "Llamadas",
	voluntario: "Mis visitas",
	ong: "Avisos"
};
function BottomNav({ path }) {
	const { data } = useQuery(meQuery);
	const sid = usePersonId();
	const persona = data?.profile?.persona;
	if (!persona || !data?.profile || !data.user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertNotifier, {
		profile: data.profile,
		userId: data.user.id
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Principal",
		className: "shrink-0 border-t bg-card/90 pb-[calc(35px+env(safe-area-inset-bottom))] backdrop-blur",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid grid-cols-5",
			children: (persona === "voluntario" ? VOLUNTEER_NAV : NAV).map(({ to, label, Icon, ...rest }) => {
				const active = path === to;
				const accent = "accent" in rest;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to,
					search: to === "/llamada" || to === "/historial" ? { sid } : {},
					"aria-current": active ? "page" : void 0,
					className: `tap flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`,
					children: [accent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `-mt-5 grid size-12 place-items-center rounded-full shadow-cta ${active ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "size-6",
							fill: "currentColor"
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-6",
						strokeWidth: active ? 2.4 : 1.8
					}), to === "/historial" ? HISTORY_LABEL[persona] : label]
				}) }, to);
			})
		})
	})] });
}
/**
* Button system (one hierarchy everywhere):
* primary = main action of the screen · success = closes a flow · ghost = secondary
* · quiet = tertiary text action · danger = destructive. Always h-14, rounded-2xl.
*/
var TONES = {
	primary: "bg-primary text-primary-foreground shadow-cta hover:bg-primary/90",
	success: "bg-success text-success-foreground hover:bg-success/90",
	ghost: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
	quiet: "text-muted-foreground hover:bg-muted",
	danger: "text-destructive hover:bg-destructive/10"
};
var btn = (tone = "primary", size = "md") => `tap inline-flex w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-50 ${size === "md" ? "h-14 text-lg" : "h-11 text-base"} ${TONES[tone]}`;
function BigButton({ children, onClick, tone = "primary", size = "md", disabled, type }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		type: type ?? (onClick ? "button" : "submit"),
		disabled,
		className: btn(tone, size),
		children
	});
}
/** Single-choice pill used for every filter and quick option (people, notes, days). */
function Chip({ selected, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": selected,
		onClick,
		className: `tap h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${selected ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`,
		children
	});
}
/** Status tabs with counters (same look on every panel). */
function Segmented({ value, onChange, items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "tablist",
		className: "grid gap-1 rounded-2xl bg-muted p-1",
		style: { gridTemplateColumns: `repeat(${items.length}, 1fr)` },
		children: items.map((t) => {
			const on = value === t.k;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				role: "tab",
				"aria-selected": on,
				onClick: () => onChange(t.k),
				className: `tap flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold ${on ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`,
				children: [t.l, t.n !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `min-w-6 rounded-full px-1.5 text-xs leading-5 ${t.alert && t.n ? "bg-destructive text-destructive-foreground" : on ? "bg-primary text-primary-foreground" : "bg-card"}`,
					children: t.n
				})]
			}, t.k);
		})
	});
}
//#endregion
export { useMe as C, waitLabel as D, useServerFn as E, useAlerts as S, usePerson as T, meQuery as _, OyeLogo as a, personSection as b, STATUS as c, addPerson as d, btn as f, lonelyLabel as g, fmtTime as h, NEED as i, Screen as l, escalation as m, Chip as n, PERSONAS as o, createSsrRpc as p, MOOD as r, PersonAvatar as s, BigButton as t, Segmented as u, minutesWaiting as v, usePeople as w, timeAgo as x, personSearch as y };
