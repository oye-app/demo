import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  classifyDeviceMode,
  refreshDeviceState,
  setDevicePreference,
  useDeviceMode,
} from "@/lib/device-mode";
import { DeviceModeBadge } from "@/components/device-mode-badge";

function Probe() {
  const { mode, detectedMode, preference, isDesktop, isMobile, isAuto } = useDeviceMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="detected">{detectedMode}</span>
      <span data-testid="pref">{preference}</span>
      <span data-testid="flags">{`${isDesktop}-${isMobile}-${isAuto}`}</span>
      <DeviceModeBadge />
    </div>
  );
}

describe("Automatic Desktop / Mobile detection", () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    window.sessionStorage.clear();
    setDevicePreference("auto");
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: originalWidth });
    setDevicePreference("auto");
  });

  it("classifies real-world viewport, pointer, and user-agent combinations accurately", () => {
    expect(
      classifyDeviceMode({
        width: 1440,
        hasFinePointer: true,
        maxTouchPoints: 0,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
      })
    ).toBe("desktop");

    expect(
      classifyDeviceMode({
        width: 390,
        hasFinePointer: false,
        maxTouchPoints: 5,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      })
    ).toBe("mobile");

    expect(
      classifyDeviceMode({
        width: 820,
        hasFinePointer: true,
        maxTouchPoints: 0,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
      })
    ).toBe("mobile");

    expect(
      classifyDeviceMode({
        width: 1080,
        hasFinePointer: false,
        maxTouchPoints: 5,
        userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Mobile)",
      })
    ).toBe("mobile");

    expect(
      classifyDeviceMode({
        width: 1280,
        hasFinePointer: false,
        maxTouchPoints: 5,
        userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)",
      })
    ).toBe("desktop");
  });

  it("automatically reacts to window resize across 1024px threshold and allows manual override + reset to Auto", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1366 });
    render(<Probe />);

    expect(screen.getByTestId("mode").textContent).toBe("desktop");
    expect(screen.getByTestId("flags").textContent).toBe("true-false-true");
    expect(document.documentElement.dataset["deviceMode"]).toBe("desktop");

    // Simulate resizing browser to mobile width
    act(() => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 412 });
      refreshDeviceState();
    });
    expect(screen.getByTestId("mode").textContent).toBe("mobile");
    expect(screen.getByTestId("detected").textContent).toBe("mobile");

    // Manual override to Desktop on small width, then back to Auto
    fireEvent.click(screen.getByRole("button", { name: "Desktop" }));
    expect(screen.getByTestId("mode").textContent).toBe("desktop");
    expect(screen.getByTestId("flags").textContent).toBe("true-false-false");

    fireEvent.click(screen.getByRole("button", { name: "Auto" }));
    expect(screen.getByTestId("mode").textContent).toBe("mobile");
    expect(screen.getByTestId("flags").textContent).toBe("false-true-true");
  });
});
