import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Server, HardDrive, Cable, History, Activity } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/clients/$clientId")({
  component: ClientWorkspace,
});

function ClientWorkspace() {
  const { clientId } = Route.useParams();
  const [client, setClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const API_BASE_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://127.0.0.1:8000";

  // دریافت اطلاعات خود مشتری
  useEffect(() => {
    window.localStorage.setItem("activeClientId", String(clientId));
    fetch(`${API_BASE_URL}/clients/`)
      .then(res => res.json())
      .then(data => {
        const currentClient = data.find((c: any) => c.id === parseInt(clientId));
        if (currentClient) {
          window.localStorage.setItem("activeClient", JSON.stringify({ id: currentClient.id, name: currentClient.name }));
          setClient(currentClient);
        } else {
          window.localStorage.setItem("activeClient", JSON.stringify({ id: Number(clientId), name: `Client #${clientId}` }));
          setClient({ id: Number(clientId), name: `Client #${clientId}` });
        }
      });
  }, [clientId]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "sites", label: "Sites & Locations", icon: Building2 },
    { id: "racks", label: "Racks", icon: Server },
    { id: "devices", label: "Devices", icon: HardDrive },
    { id: "ports", label: "Ports & Cabling", icon: Cable },
    { id: "history", label: "Config History", icon: History },
  ];

  if (!client) return <AppShell><div className="p-8 text-center animate-pulse">Loading Workspace...</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* هدر فضای کاری مشتری */}
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <Link to="/clients" className="p-2 hover:bg-muted rounded-md transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Client Workspace</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Contact: {client.contact_info || "No contact info provided"}
            </p>
          </div>
        </div>

        {/* منوی تب‌های داخلی */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* محتوای تب‌ها */}
        <Card className="min-h-[400px] p-6 border-border shadow-sm bg-card">
          {activeTab === "overview" && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Welcome to {client.name}'s Network</h2>
              <p className="text-muted-foreground max-w-md">
                Select a tab above to manage sites, racks, devices, and cabling exclusively for this client. All data is securely isolated.
              </p>
            </div>
          )}
          
          {/* در مراحل بعدی، کدهای مربوط به سایت‌ها، رک‌ها و... را داخل این تب‌ها قرار می‌دهیم */}
          {activeTab !== "overview" && (
            <div className="text-center py-20 text-muted-foreground animate-pulse">
              Loading {activeTab} for {client.name}... 
              <br />
              <span className="text-xs">(We will migrate the UI here in the next step!)</span>
            </div>
          )}
        </Card>

      </div>
    </AppShell>
  );
}
