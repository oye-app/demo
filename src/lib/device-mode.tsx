import { useEffect, useSyncExternalStore } from "react";

export type DeviceMode = "desktop" | "mobile";
export type DevicePreference = "auto" | DeviceMode;

export interface DeviceSignals {
  width: number;
  hasFinePointer: boolean;
  maxTouchPoints: number;
  userAgent: string;
}

export interface DeviceState {
  mode: DeviceMode;
  detectedMode: DeviceMode;
  preference: DevicePreference;
  source: "auto" | "manual";
  viewportWidth: number;
  hasFinePointer: boolean;
}

export const DESKTOP_MIN_WIDTH = 1024;
const PREFERENCE_STORAGE_KEY = "oye-device-preference";
const PHONE_UA_REGEX = /(iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Android.*Mobile)/i;

/**
 * Pure, deterministic classification of desktop vs mobile environment from viewport & pointer signals.
 */
export function classifyDeviceMode(signals: DeviceSignals): DeviceMode {
  const { width, hasFinePointer, maxTouchPoints, userAgent } = signals;
  if (!Number.isFinite(width) || width < DESKTOP_MIN_WIDTH) {
    return "mobile";
  }
  const isDedicatedPhoneUa = PHONE_UA_REGEX.test(userAgent);
  if (isDedicatedPhoneUa && !hasFinePointer && width < 1180) {
    return "mobile";
  }
  if (hasFinePointer || maxTouchPoints === 0 || width >= DESKTOP_MIN_WIDTH) {
    return "desktop";
  }
  return "mobile";
}

export function readBrowserDeviceSignals(): DeviceSignals {
  if (typeof window === "undefined") {
    return {
      width: 390,
      hasFinePointer: false,
      maxTouchPoints: 1,
      userAgent: "",
    };
  }

  const width = window.innerWidth || document.documentElement.clientWidth || 390;
  const hasFinePointer =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: fine)").matches || window.matchMedia("(any-hover: hover)").matches
      : width >= DESKTOP_MIN_WIDTH;
  const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints ?? 0 : 0;
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent ?? "" : "";

  return { width, hasFinePointer, maxTouchPoints, userAgent };
}

const SERVER_SNAPSHOT: DeviceState = {
  mode: "mobile",
  detectedMode: "mobile",
  preference: "auto",
  source: "auto",
  viewportWidth: 390,
  hasFinePointer: false,
};

let currentPreference: DevicePreference = "auto";
let currentState: DeviceState = SERVER_SNAPSHOT;
let listenersBound = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function readSavedPreference(): DevicePreference {
  if (typeof window === "undefined") return "auto";
  try {
    const saved = window.sessionStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (saved === "desktop" || saved === "mobile" || saved === "auto") {
      return saved;
    }
  } catch {
    // Ignore storage access errors in private mode
  }
  return "auto";
}

function computeNextState(): DeviceState {
  const signals = readBrowserDeviceSignals();
  const detectedMode = classifyDeviceMode(signals);
  const mode: DeviceMode = currentPreference === "auto" ? detectedMode : currentPreference;
  return {
    mode,
    detectedMode,
    preference: currentPreference,
    source: currentPreference === "auto" ? "auto" : "manual",
    viewportWidth: signals.width,
    hasFinePointer: signals.hasFinePointer,
  };
}

function syncDeviceDomAttribute(state: DeviceState) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset["deviceMode"] = state.mode;
    document.documentElement.dataset["deviceDetected"] = state.detectedMode;
  }
}

function statesEqual(a: DeviceState, b: DeviceState): boolean {
  return (
    a.mode === b.mode &&
    a.detectedMode === b.detectedMode &&
    a.preference === b.preference &&
    a.viewportWidth === b.viewportWidth &&
    a.hasFinePointer === b.hasFinePointer
  );
}

export function refreshDeviceState() {
  if (typeof window === "undefined") return;
  const next = computeNextState();
  syncDeviceDomAttribute(next);
  if (!statesEqual(currentState, next)) {
    currentState = next;
    emit();
  }
}

export function setDevicePreference(next: DevicePreference) {
  currentPreference = next;
  if (typeof window !== "undefined") {
    try {
      if (next === "auto") {
        window.sessionStorage.removeItem(PREFERENCE_STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(PREFERENCE_STORAGE_KEY, next);
      }
    } catch {
      // Ignore storage errors
    }
  }
  refreshDeviceState();
}

function ensureGlobalListeners() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  currentPreference = readSavedPreference();

  const onUpdate = () => refreshDeviceState();
  window.addEventListener("resize", onUpdate, { passive: true });
  window.addEventListener("orientationchange", onUpdate, { passive: true });

  if (typeof window.matchMedia === "function") {
    const mqWidth = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const mqPointer = window.matchMedia("(pointer: fine)");
    mqWidth.addEventListener?.("change", onUpdate);
    mqPointer.addEventListener?.("change", onUpdate);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DeviceState {
  return currentState;
}

function getServerSnapshot(): DeviceState {
  return SERVER_SNAPSHOT;
}

/**
 * Hydration-safe hook that automatically detects whether the visitor is on Desktop or Mobile,
 * reacts live to window resizing / pointer changes, and supports optional Auto/Desktop/Mobile switching.
 */
export function useDeviceMode() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureGlobalListeners();
    refreshDeviceState();
  }, []);

  return {
    ...state,
    isDesktop: state.mode === "desktop",
    isMobile: state.mode === "mobile",
    isAuto: state.source === "auto",
    setPreference: setDevicePreference,
  };
}
