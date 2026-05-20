import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Users, Building2, Server, HardDrive, Cable, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — App Network Plan" },
      { name: "description", content: "Network infrastructure overview." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Clients", value: 28, icon: Users, href: "/clients", trend: "+3 this month" },
  { label: "Sites", value: 64, icon: Building2, href: "/sites", trend: "+7 this month" },
  { label: "Racks", value: 142, icon: Server, href: "/racks", trend: "92% capacity" },
  { label: "Devices", value: 1284, icon: HardDrive, href: "/devices", trend: "1,201 online" },
  { label: "Ports", value: 8412, icon: Cable, href: "/ports", trend: "78% utilization" },
  { label: "Uptime", value: "99.98%", icon: Activity, href: "/", trend: "30-day average" },
];

function Dashboard() {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your network infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.href}>
              <Card className="p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      {s.label}
                    </div>
                    <div className="text-3xl font-semibold mt-2 tabular-nums">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.trend}</div>
                  </div>
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="font-semibold mb-1">Welcome to App Network Plan</h2>
          <p className="text-sm text-muted-foreground">
            Head over to{" "}
            <Link to="/clients" className="text-primary underline-offset-4 hover:underline">
              Clients
            </Link>{" "}
            to start managing your network organizations.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
