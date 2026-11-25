import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Smartphone, Sparkles } from "lucide-react";
import { OyeLogo } from "@/components/oye";
import { EnterprisePortal } from "@/components/enterprise/enterprise-portal";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "OYE Empresas & AAPP · Demo Desktop, ROI y Arquitectura Clínica" },
      {
        name: "description",
        content:
          "Portal B2B desktop para aseguradoras, teleasistencia, ayuntamientos y ONG: simulador ROI de cohorte, Sandbox GPT-4o anti-alucinación, HL7 FHIR R4 y acceso directo a Consola.",
      },
    ],
  }),
  component: EmpresasRoute,
});

function EmpresasRoute() {
  return (
    <div className="min-h-dvh bg-secondary/35 text-foreground flex flex-col">
      {/* Desktop Sticky Enterprise Header */}
      <header className="sticky top-0 z-30 border-b bg-card/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/empresas" className="text-primary">
              <OyeLogo />
            </Link>
            <span className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary sm:inline-flex">
              <Building2 className="size-3.5" />
              Enterprise · Teleasistencia · Aseguradoras · AAPP
            </span>
          </div>

          <nav aria-label="Secciones Enterprise" className="hidden items-center gap-5 text-xs font-bold text-muted-foreground lg:flex">
            <a href="#simulador-roi" className="hover:text-foreground transition-colors">
              Simulador ROI
            </a>
            <a href="#sandbox-clinico" className="hover:text-foreground transition-colors">
              Sandbox GPT-4o & FHIR
            </a>
            <a href="#comparativa" className="hover:text-foreground transition-colors">
              Comparativa Global
            </a>
            <a href="#piloto-30d" className="hover:text-foreground transition-colors">
              Piloto 30 Días
            </a>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/bienvenida"
              className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <Smartphone className="size-3.5" />
              App Móvil
            </Link>
            <Link
              to="/consola"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-extrabold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Sparkles className="size-3.5" />
              Consola Operativa ONG
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <EnterprisePortal />
      </main>

      <footer className="border-t bg-card px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">OYE Platform</strong> · Voz telefónica universal sin hardware · Triaje clínico + cierre vecinal verificable.
          </p>
          <div className="flex items-center gap-4 font-bold">
            <Link to="/consola" className="text-primary hover:underline">
              Entrar a Consola de Coordinación
            </Link>
            <Link to="/bienvenida" className="hover:text-foreground">
              Acceso Familia / Voluntario
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
