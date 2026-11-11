import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, ChevronRight, Heart, LogOut, Settings2, UserRound } from "lucide-react";
import { BigButton, Screen } from "@/components/oye";
import { usePeople } from "@/lib/people";
import { PERSONAS, useMe, type Persona } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil · OYE" },
      { name: "description", content: "Sus datos en OYE." },
      { property: "og:title", content: "Mi perfil · OYE" },
      { property: "og:description", content: "Sus datos en OYE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user } = useMe();
  const {data:people=[]}=usePeople();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data ?? false,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/bienvenida", search: { paso: "acceso" }, replace: true });
  }

  const rows = [
    ["Correo", user.email],
    ["Móvil", profile.phone || "—"],
    ["Barrio", profile.neighborhood || "—"],
    ...(profile.persona === "familia" ? [["Acompañamos a", `${people.length} personas`]] : []),
  ];

  return (
    <Screen title="Mi perfil">
      <div className="flex items-center gap-4 pt-2">
        <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground"><UserRound className="size-8" /></span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">{profile.full_name}</h1>
          <p className="text-sm text-primary font-semibold">{PERSONAS[profile.persona as Persona].label}</p>
        </div>
      </div>
      <dl className="mt-5 divide-y rounded-3xl bg-card px-4 shadow-card">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-3.5">
            <dt className="text-muted-foreground">{k}</dt><dd className="truncate font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <PushToggle />
      <nav className="mt-4 divide-y rounded-3xl bg-card shadow-card">
        <Link to="/bienvenida" search={{ paso: "perfil" }} className="flex items-center gap-3 p-4 font-semibold">
          <UserRound className="size-5 text-primary" /><span className="flex-1">Cambiar mis datos o mi papel</span><ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <Link to="/recomendar" className="flex items-center gap-3 p-4 font-semibold">
          <Heart className="size-5 text-primary" /><span className="flex-1">Recomendar a un vecino mayor</span><ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        {isAdmin && (
          <Link to="/admin" className="flex items-center gap-3 p-4 font-semibold">
            <Settings2 className="size-5 text-primary" /><span className="flex-1">Administración</span><ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        )}
      </nav>
      <div className="mt-4"><BigButton tone="danger" onClick={signOut}><LogOut className="size-5" /> Cerrar sesión</BigButton></div>
    </Screen>
  );
}

function PushToggle() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [iframe, setIframe] = useState(false);
  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    setIframe(window.top !== window.self);
  }, []);
  async function enable() {
    if (typeof Notification === "undefined") return;
    setPerm(await Notification.requestPermission());
  }
  const text = perm === "granted" ? "Con OYE abierta en este dispositivo"
    : perm === "denied" ? "Bloqueadas: actívelas en los ajustes del navegador"
    : perm === "unsupported" ? "Este navegador no las admite"
    : iframe ? "Abra la app en una pestaña propia para activarlas"
    : "Avisos mientras OYE está abierta";
  return (
    <div className="mt-4 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card">
      <Bell className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1"><p className="font-semibold">Notificaciones</p><p className="text-xs text-muted-foreground">{text}</p></div>
      {perm === "default" && !iframe && <div className="w-28 shrink-0"><BigButton size="sm" onClick={enable}>Activar</BigButton></div>}
    </div>
  );
}
