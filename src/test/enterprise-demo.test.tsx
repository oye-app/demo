import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  BASELINE_BENCHMARKS,
  COMPETITOR_BENCHMARK_MATRIX,
  ENTERPRISE_PRESETS,
  PILOT_BLUEPRINT_PHASES,
  buildEnterpriseProposalMarkdown,
  buildEnterpriseSampleFhirBundle,
  simulateEnterpriseCohort,
} from "@/lib/enterprise-demo";
import { CohortRoiSimulator } from "@/components/enterprise/cohort-roi-simulator";
import { EnterprisePortal } from "@/components/enterprise/enterprise-portal";
import { LivePipelineTester } from "@/components/console/live-pipeline-tester";

describe("Enterprise cohort ROI & benchmark helpers", () => {
  it("switches to Opt C SIP tier when cohort >= 2500 seniors and clamps boundaries", () => {
    const small = simulateEnterpriseCohort({
      seniors: 250,
      eeaSharePct: 100,
      greenFilterRatePct: 85,
      baselineKey: "telecare_es",
    });
    const large = simulateEnterpriseCohort({
      seniors: 2500,
      eeaSharePct: 100,
      greenFilterRatePct: 85,
      baselineKey: "telecare_es",
    });

    expect(small.tierLabel).toContain("Opt B");
    expect(small.costPerSeniorEur).toBe(8.5);
    expect(large.tierLabel).toContain("Opt C");
    expect(large.costPerSeniorEur).toBe(4.55);
    expect(large.savingsPct).toBeGreaterThan(small.savingsPct);
    expect(large.dailyAutoResolvedGreen + large.dailyHumanPriorityCases).toBe(large.dailyCallsTotal);

    const clamped = simulateEnterpriseCohort({
      seniors: -20,
      eeaSharePct: 140,
      greenFilterRatePct: 10,
      baselineKey: "sensi_audio",
    });
    expect(clamped.seniors).toBe(50);
    expect(clamped.eeaSharePct).toBe(100);
    expect(clamped.greenFilterRatePct).toBe(65);
    expect(clamped.baseline.monthlyEurPerSenior).toBe(BASELINE_BENCHMARKS.sensi_audio.monthlyEurPerSenior);
  });

  it("generates structural FHIR R4 sample with LOINC codes and copyable Markdown proposal", () => {
    const sample = buildEnterpriseSampleFhirBundle();
    expect(sample.structural_sample).toBe(true);
    const json = JSON.stringify(sample.bundle);
    expect(json).toContain("106418-7");
    expect(json).toContain("48545-8");

    const sim = simulateEnterpriseCohort({
      seniors: 10000,
      eeaSharePct: 85,
      greenFilterRatePct: 85,
      baselineKey: "sensi_audio",
    });
    const md = buildEnterpriseProposalMarkdown(sim, "Aseguradora Salud Senior", "Sanitas Demo");
    expect(md).toContain("Sanitas Demo");
    expect(md).toContain("10.000");
    expect(md).toContain("HMAC-SHA256");
    expect(md).toContain("106418-7");
  });

  it("contains complete competitive benchmark rows and 4-week pilot phases", () => {
    expect(ENTERPRISE_PRESETS).toHaveLength(4);
    expect(COMPETITOR_BENCHMARK_MATRIX.length).toBeGreaterThanOrEqual(7);
    expect(PILOT_BLUEPRINT_PHASES).toHaveLength(4);
    for (const row of COMPETITOR_BENCHMARK_MATRIX) {
      expect(row.oye.length).toBeGreaterThan(2);
      expect(row.tucuvi.length).toBeGreaterThan(1);
    }
  });
});

describe("Enterprise UI components", () => {
  it("updates ROI outputs interactively when clicking buyer presets and baseline selectors", () => {
    render(<CohortRoiSimulator />);
    expect(screen.getByText(/Simulador Económico & Operativo de Cohorte/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Ayuntamiento \/ Distrito/i }));
    expect(screen.getByText(/250 personas/i)).toBeTruthy();
    expect(screen.getByText(/Estándar Optimizado \(Opt B\)/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Aseguradora Salud Senior/i }));
    expect(screen.getByText(/10\.000 personas/i)).toBeTruthy();
    expect(screen.getByText(/Escala SIP \/ Telecom \(Opt C\)/i)).toBeTruthy();
  });

  it("renders EnterprisePortal with security center, competitive table, and publicSafe sandbox", () => {
    render(<EnterprisePortal />);
    expect(screen.getByText(/Por qué OYE supera a teleasistencia clásica/i)).toBeTruthy();
    expect(screen.getByText(/Bundle HL7 FHIR R4 \(Ejemplo Estructural\)/i)).toBeTruthy();
    expect(screen.getByText(/Hoja de ruta estándar para piloto corporativo o municipal de 30 días/i)).toBeTruthy();

    // Verify publicSafe sandbox shields Caller ID lookup without login
    fireEvent.click(screen.getByRole("button", { name: /Entrante 24\/7 \(Caller ID\)/i }));
    expect(screen.getByText(/Protegido por RGPD \/ Consola/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Teléfono entrante \(Caller ID\)/i)).toBeNull();
  });

  it("keeps authenticated sandbox phone input available when publicSafe is false", () => {
    render(<LivePipelineTester seniorName="Carmen" />);
    fireEvent.click(screen.getByRole("button", { name: /Entrante 24\/7 \(Caller ID\)/i }));
    expect(screen.getByLabelText(/Teléfono entrante \(Caller ID\)/i)).toBeTruthy();
  });
});
