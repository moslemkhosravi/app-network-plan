import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Settings — Irannetwork" }] }),
  component: UsersRedirectPage,
});

function UsersRedirectPage() {
  useEffect(() => {
    window.location.replace("/settings?tab=users");
  }, []);

  return null;
}
