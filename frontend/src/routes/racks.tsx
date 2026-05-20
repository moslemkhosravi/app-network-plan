import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/racks")({
  component: () => <PlaceholderPage title="Racks" description="Server racks and rack units." />,
});
