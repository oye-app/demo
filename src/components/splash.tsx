import { useEffect, useState } from "react";
import { OyeLogo } from "@/components/oye";

/** Brief brand splash: only the OYE logo, ~2 s, then it fades away. */
export function Splash() {
  const [state, setState] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const t = setTimeout(() => setState("out"), 2000);
    return () => clearTimeout(t);
  }, []);

  if (state === "done") return null;
  return (
    <div
      aria-hidden="true"
      onTransitionEnd={() => {
        if (state === "out") setState("done");
      }}
      className={`fixed inset-0 z-50 grid place-items-center bg-primary text-primary-foreground transition-opacity duration-500 ease-out ${
        state === "out" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-splash-in">
        <OyeLogo big heartClassName="fill-primary" />
      </div>
    </div>
  );
}
