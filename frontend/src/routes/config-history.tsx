import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/config-history")({
  component: () => (
    <PlaceholderPage title="Config History" description="Track every configuration change over time." />
  ),
});
