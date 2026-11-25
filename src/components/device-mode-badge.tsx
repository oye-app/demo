import { Monitor, Smartphone, Sparkles } from "lucide-react";
import { useDeviceMode, type DevicePreference } from "@/lib/device-mode";

const OPTIONS: { id: DevicePreference; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "desktop", label: "Desktop" },
  { id: "mobile", label: "Móvil" },
];

export function DeviceModeBadge({ compact = false }: { compact?: boolean }) {
  const { isDesktop, detectedMode, preference, isAuto, setPreference } = useDeviceMode();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setPreference(isAuto ? (isDesktop ? "mobile" : "desktop") : "auto")}
        title={`Dispositivo detectado: ${detectedMode === "desktop" ? "Escritorio" : "Móvil"}. Pulsa para alternar o volver a Automático.`}
        className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
      >
        {isDesktop ? <Monitor className="size-3.5 text-primary" /> : <Smartphone className="size-3.5 text-primary" />}
        <span>{isDesktop ? "Desktop" : "Móvil"}</span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">
          {isAuto ? "Auto" : "Manual"}
        </span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Selector automático de vista Escritorio o Móvil"
      className="rounded-2xl border bg-secondary/40 p-2.5 space-y-2"
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 font-extrabold text-foreground">
          {isDesktop ? <Monitor className="size-3.5 text-primary" /> : <Smartphone className="size-3.5 text-primary" />}
          {isDesktop ? "Vista Escritorio" : "Vista Móvil"}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
          <Sparkles className="size-3" />
          {isAuto
            ? `Auto (${detectedMode === "desktop" ? "PC" : "Móvil"})`
            : `Forzado (${preference === "desktop" ? "PC" : "Móvil"})`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-card p-1 border">
        {OPTIONS.map((opt) => {
          const active = preference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreference(opt.id)}
              aria-pressed={active}
              className={`rounded-lg py-1 text-[10px] font-extrabold transition-colors cursor-pointer ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
