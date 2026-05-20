import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/ports")({
  component: () => <PlaceholderPage title="Ports" description="Interfaces, patches and connections." />,
});
