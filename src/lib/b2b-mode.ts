import { useEffect, useSyncExternalStore } from "react";

export type B2BClientMode = "standard" | "aseguradora" | "teleasistencia" | "fundacion";

export const B2B_MODE_OPTIONS: {
  id: Exclude<B2BClientMode, "standard">;
  shortLabel: string;
  label: string;
  clients: string;
}[] = [
  {
    id: "aseguradora",
    shortLabel: "Aseguradora",
    label: "Vista Aseguradora Salud",
    clients: "Sanitas · DKV · Santalucía · Mapfre",
  },
  {
    id: "teleasistencia",
    shortLabel: "Teleasistencia",
    label: "Vista Teleasistencia",
    clients: "Tunstall Televida · ILUNION · Atenzia",
  },
  {
    id: "fundacion",
    shortLabel: "Fundación",
    label: "Vista Fundación & Impacto",
    clients: "SoledadES · Fundación ONCE · Mutua · la Caixa",
  },
];

const STORAGE_KEY = "oye-b2b-meeting-mode";
const VALID_MODES = new Set<B2BClientMode>(["standard", "aseguradora", "teleasistencia", "fundacion"]);

let currentMode: B2BClientMode = "standard";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function setB2BMode(next: B2BClientMode) {
  currentMode = next;
  if (typeof window !== "undefined") {
    try {
      if (next === "standard") {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): B2BClientMode {
  return currentMode;
}

function getServerSnapshot(): B2BClientMode {
  return "standard";
}

/**
 * Hydration-safe hook for toggling B2B meeting views without altering the default B2C/family view.
 */
export function useB2BMode(): [B2BClientMode, (next: B2BClientMode) => void] {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY) as B2BClientMode | null;
      if (saved && VALID_MODES.has(saved) && saved !== currentMode) {
        currentMode = saved;
        emit();
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  return [mode, setB2BMode];
}
