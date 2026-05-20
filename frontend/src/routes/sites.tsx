import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/sites")({
  component: () => <PlaceholderPage title="Sites" description="Physical locations across your network." />,
});
