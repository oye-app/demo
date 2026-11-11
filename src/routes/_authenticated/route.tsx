import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { meQuery } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.fetchQuery(meQuery);
    if (!me.user) throw redirect({ to: "/bienvenida" });
    if (!me.profile) throw redirect({ to: "/bienvenida", search: { paso: "perfil" } });
  },
  component: () => <Outlet />,
});
