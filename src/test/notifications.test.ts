import { describe, expect, it } from "vitest";
import { notificationFor } from "@/components/alert-notifier";
import { activityStats } from "@/lib/stats";
import type { Alert } from "@/lib/alerts";

const alert = (o: Partial<Alert>) => ({ senior_id:"c", senior_name: "Carmen", status: "open", volunteer_name: "", volunteer_id: null, neighborhood: "Chamberí", mood: "bajo", ...o }) as Alert;
const fam = { persona: "familia", senior_name: "Carmen", neighborhood: "" };
const vol = { persona: "voluntario", senior_name: "", neighborhood: "Chamberí" };

describe("notifications", () => {
  it("family hears when the visit is done", () => {
    expect(notificationFor(fam, "u", alert({ status: "visited", volunteer_name: "Javier" }), false,["c"])).toContain("Visita hecha");
  });
  it("family does not hear about other people", () => {
    expect(notificationFor(fam, "u", alert({ senior_id:"p", senior_name: "Carmen", status: "visited" }), false,["c"])).toBeNull();
  });
  it("volunteer hears about new alerts in their neighbourhood only", () => {
    expect(notificationFor(vol, "u", alert({}), true)).not.toBeNull();
    expect(notificationFor(vol, "u", alert({ neighborhood: "Retiro" }), true)).toBeNull();
  });
});

describe("admin activity", () => {
  it("counts calls, visits and pending", () => {
    const s = activityStats(
      [{ status: "open", created_at: "2026-01-01" }, { status: "visited", created_at: "2026-01-01" }, { status: "arrived", created_at: "2026-01-01" }],
      [{ status: "pending" }, { status: "accepted" }],
      0,
    );
    expect(s).toMatchObject({ calls: 3, visits: 1, open: 1, onTheWay: 1, refs: 2, refsPending: 1, refsAccepted: 1 });
  });
});

it("notifies for a second authorized person",()=>{expect(notificationFor(fam,"u",alert({senior_id:"b",status:"visited"}),false,["c","b"])).not.toBeNull();});
