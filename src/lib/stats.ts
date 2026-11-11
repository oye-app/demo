/** Admin activity totals: calls, visits, recommendations and what is still pending. */
export function activityStats(alerts: { status: string; created_at: string }[], refs: { status: string }[], todayMs: number) {
  const isToday = (a: { created_at: string }) => new Date(a.created_at).getTime() >= todayMs;
  return {
    calls: alerts.length,
    callsToday: alerts.filter(isToday).length,
    visits: alerts.filter((a) => a.status === "visited").length,
    visitsToday: alerts.filter((a) => a.status === "visited" && isToday(a)).length,
    open: alerts.filter((a) => a.status === "open").length,
    onTheWay: alerts.filter((a) => a.status === "accepted" || a.status === "arrived").length,
    refs: refs.length,
    refsAccepted: refs.filter((r) => r.status === "accepted").length,
    refsPending: refs.filter((r) => r.status === "pending").length,
  };
}
