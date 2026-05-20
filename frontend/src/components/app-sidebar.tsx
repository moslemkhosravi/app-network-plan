import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Server,
  HardDrive,
  Cable,
  History,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Sites", url: "/sites", icon: Building2 },
  { title: "Racks", url: "/racks", icon: Server },
  { title: "Devices", url: "/devices", icon: HardDrive },
  { title: "Ports", url: "/ports", icon: Cable },
  { title: "Config History", url: "/config-history", icon: History },
] as const;


export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-md bg-sidebar-primary flex items-center justify-center">
          <Network className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">App Network Plan</div>
          <div className="text-[11px] text-sidebar-foreground/60">Infrastructure</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-medium">
          Management
        </div>
        {items.map((item) => {
          const active = pathname === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 rounded-md px-3 py-2 bg-sidebar-accent/40">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-sidebar-foreground/80">All systems operational</span>
        </div>
      </div>
    </aside>
  );
}
