import { Link, useLocation } from "@tanstack/react-router";
import { AlertNotifier } from "@/components/alert-notifier";
import { Bell, ChevronLeft, Heart, History, Home, Phone, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { meQuery } from "@/lib/auth";
import { usePersonId, peopleQuery } from "@/lib/people";
import { personSection } from "@/lib/person-navigation";
import type { ReactNode } from "react";
import { PersonAvatar } from "./person-avatar";
import { personDisplayName } from "@/lib/person-presentation";
import { PersonEditor } from "./person-editor";

export function OyeLogo({
  className = "",
  big = false,
  heartClassName = "fill-background",
}: {
  className?: string;
  big?: boolean;
  heartClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className={big ? "size-16" : "size-7"} aria-hidden="true">
        <path
          d="M15 4C8.4 4 3 8.9 3 15c0 3 1.3 5.7 3.4 7.7L5 28l5.6-2.6c1.4.4 2.9.6 4.4.6 6.6 0 12-4.9 12-11S21.6 4 15 4Z"
          fill="currentColor"
        />
        <path
          d="M15 20.5s-5-3-5-6.3A2.7 2.7 0 0 1 15 12.6a2.7 2.7 0 0 1 5 1.6c0 3.3-5 6.3-5 6.3Z"
          className={heartClassName}
        />
        <path d="M24 3.5c1.6 1 2.7 2.6 3 4.5M26.5 1.5c2 1.3 3.4 3.4 3.8 5.8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <span className={big ? "text-4xl" : "text-2xl"}>OYE</span>
    </span>
  );
}

export function Screen({ title, children, footer }: { title?: string; children: ReactNode; footer?: ReactNode }) {
  const path = useLocation({ select: (l) => l.pathname });
  const sid = usePersonId();
  const {data:me}=useQuery(meQuery);
  const {data:people=[]}=useQuery({...peopleQuery(me?.user?.id??""),enabled:!!sid && !!me?.user});
  const selected = people.find((p) => p.id === sid);
  const isTab = NAV.some((n) => n.to === path) || path === "/avisos";
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-4 pb-3">
        <header className="grid h-12 shrink-0 grid-cols-[3rem_1fr_3rem] items-center">
          {title && !isTab ? (
            <Link to="/" aria-label="Volver al inicio" className="tap -ml-2 grid size-11 place-items-center rounded-full text-primary hover:bg-secondary">
              <ChevronLeft className="size-7" />
            </Link>
          ) : (
            <span />
          )}
          <div className="truncate text-center text-lg font-bold text-foreground">
            {title ?? <OyeLogo className="text-primary" />}
          </div>
          <span />
        </header>
        {selected && <div className="mb-3 flex shrink-0 items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><PersonAvatar key={selected.id} id={selected.id} name={selected.name} small /><PersonEditor key={selected.id} id={selected.id} name={selected.name} /></div><Link to={personSection(path)} search={{ sid: undefined, aid: undefined }} className="tap inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary">Cambiar persona</Link></div>}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
        {footer && <div className="shrink-0 pt-3">{footer}</div>}
      </div>
      <BottomNav path={path} />
    </div>
  );
}

const NAV = [
  { to: "/", label: "Inicio", Icon: Home },
  { to: "/llamada", label: "Llamada", Icon: Phone },
  { to: "/recomendar", label: "Recomendar", Icon: Heart, accent: true },
  { to: "/historial", label: "Historial", Icon: History },
  { to: "/perfil", label: "Perfil", Icon: UserRound },
] as const;
const VOLUNTEER_NAV = [NAV[0], { to: "/avisos", label: "Avisos", Icon: Bell }, NAV[2], NAV[3], NAV[4]] as const;
const HISTORY_LABEL = { familia: "Llamadas", voluntario: "Mis visitas", ong: "Avisos" } as const;

function BottomNav({ path }: { path: string }) {
  const { data } = useQuery(meQuery);
  const sid = usePersonId();
  const persona = data?.profile?.persona as keyof typeof HISTORY_LABEL | undefined;
  if (!persona || !data?.profile || !data.user) return null;
  return (
    <>
    <AlertNotifier profile={data.profile} userId={data.user.id} />
    <nav aria-label="Principal" className="shrink-0 border-t bg-card/90 pb-[calc(35px+env(safe-area-inset-bottom))] backdrop-blur">
      <ul className="grid grid-cols-5">
        {(persona === "voluntario" ? VOLUNTEER_NAV : NAV).map(({ to, label, Icon, ...rest }) => {
          const active = path === to;
          const accent = "accent" in rest;
          return (
            <li key={to}>
              <Link
                to={to}
                search={to === "/llamada" || to === "/historial" ? { sid } : {}}
                aria-current={active ? "page" : undefined}
                className={`tap flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                {accent ? (
                  <span className={`-mt-5 grid size-12 place-items-center rounded-full shadow-cta ${active ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"}`}>
                    <Icon className="size-6" fill="currentColor" />
                  </span>
                ) : (
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                )}
                {to === "/historial" ? HISTORY_LABEL[persona] : label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}

export function DemoTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
      Datos de ejemplo
    </span>
  );
}

/**
 * Button system (one hierarchy everywhere):
 * primary = main action of the screen · success = closes a flow · ghost = secondary
 * · quiet = tertiary text action · danger = destructive. Always h-14, rounded-2xl.
 */
const TONES = {
  primary: "bg-primary text-primary-foreground shadow-cta hover:bg-primary/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  ghost: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
  quiet: "text-muted-foreground hover:bg-muted",
  danger: "text-destructive hover:bg-destructive/10",
} as const;
export type Tone = keyof typeof TONES;
export const btn = (tone: Tone = "primary", size: "md" | "sm" = "md") =>
  `tap inline-flex w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-50 ${size === "md" ? "h-14 text-lg" : "h-11 text-base"} ${TONES[tone]}`;

export function BigButton({
  children,
  onClick,
  tone = "primary",
  size = "md",
  disabled,
  type,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: Tone;
  size?: "md" | "sm";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button onClick={onClick} type={type ?? (onClick ? "button" : "submit")} disabled={disabled} className={btn(tone, size)}>
      {children}
    </button>
  );
}

/** Single-choice pill used for every filter and quick option (people, notes, days). */
export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`tap h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${selected ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}>
      {children}
    </button>
  );
}

/** Status tabs with counters (same look on every panel). */
export function Segmented<K extends string>({ value, onChange, items }: {
  value: K; onChange: (k: K) => void; items: { k: K; l: string; n?: number; alert?: boolean }[];
}) {
  return (
    <div role="tablist" className="grid gap-1 rounded-2xl bg-muted p-1" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((t) => {
        const on = value === t.k;
        return (
          <button key={t.k} role="tab" aria-selected={on} onClick={() => onChange(t.k)}
            className={`tap flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold ${on ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}>
            {t.l}
            {t.n !== undefined && (
              <span className={`min-w-6 rounded-full px-1.5 text-xs leading-5 ${t.alert && t.n ? "bg-destructive text-destructive-foreground" : on ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t.n}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
