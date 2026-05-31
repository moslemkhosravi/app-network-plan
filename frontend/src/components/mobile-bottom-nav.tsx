import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Building2, HardDrive, MonitorCog, User, Briefcase, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchCurrentUser, isSuperAdminUser } from "@/lib/auth";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };

const clientNav: NavItem[] = [
  { title: "Sites", url: "/sites", icon: Building2 },
  { title: "Devices", url: "/devices", icon: HardDrive },
  { title: "Systems", url: "/systems", icon: MonitorCog },
  { title: "Profile", url: "/profile", icon: User },
];

const baseGlobalNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Systems", url: "/systems", icon: MonitorCog },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Profile", url: "/profile", icon: User },
];

const adminGlobalNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Briefcase },
  { title: "Systems", url: "/systems", icon: MonitorCog },
  { title: "Profile", url: "/profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeClient, setActiveClient] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const API_BASE_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://127.0.0.1:8000";

  useEffect(() => {
    let mounted = true;

    setActiveClient(Boolean(localStorage.getItem("activeClient")));

    fetchCurrentUser(API_BASE_URL)
      .then((user) => {
        if (mounted) setIsSuperAdmin(isSuperAdminUser(user));
      })
      .catch(() => {
        if (mounted) setIsSuperAdmin(false);
      });

    return () => {
      mounted = false;
    };
  }, [pathname, API_BASE_URL]);

  const items = activeClient ? clientNav : isSuperAdmin ? adminGlobalNav : baseGlobalNav;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.url;
          const Icon = item.icon;
          return (
            <li key={item.url}>
              <Link
                to={item.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors min-h-[56px] active:bg-accent/40",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-xl transition-all",
                    active ? "bg-primary/15 text-primary scale-110" : ""
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
