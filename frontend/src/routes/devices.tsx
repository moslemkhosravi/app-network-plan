import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/devices")({
  component: () => <PlaceholderPage title="Devices" description="Switches, routers, firewalls and servers." />,
});
