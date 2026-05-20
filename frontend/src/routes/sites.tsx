import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Building2, MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/sites")({
  head: () => ({
    meta: [
      { title: "Sites — App Network Plan" },
      { name: "description", content: "Manage network sites and physical locations." },
    ],
  }),
  component: SitesPage,
});

type Site = {
  id: string;
  name: string;
  address: string;
  client_id: number;
  status: "active" | "offline";
};

type Client = {
  id: number;
  name: string;
};

function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]); // برای لیست کشویی انتخاب مشتری
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ name: "", address: "", client_id: "" });

  // آی‌پی سرور (همان کد امنی که برای کلاینت‌ها نوشتیم)
  const API_BASE_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://127.0.0.1:8000";

  // تابع دریافت لیست سایت‌ها از بک‌اند
  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sites/`);
      if (response.ok) {
        const data = await response.json();
        const mappedSites = data.map((s: any) => ({
          id: `SIT-${String(s.id).padStart(3, "0")}`,
          name: s.name,
          address: s.address || "—",
          client_id: s.client_id,
          status: "active"
        }));
        setSites(mappedSites);
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست سایت‌ها");
    }
  };

  // تابع دریافت لیست مشتریان (برای استفاده در فرم ثبت سایت)
  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients");
    }
  };

  useEffect(() => {
    fetchSites();
    fetchClients();
  }, []);

  function openAdd() {
    setForm({ name: "", address: "", client_id: "" });
    setOpen(true);
  }

  // ارسال اطلاعات سایت جدید به بک‌اند
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.client_id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sites/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: form.name, 
          address: form.address,
          client_id: parseInt(form.client_id)
        })
      });

      if (response.ok) {
        toast.success("سایت جدید با موفقیت ثبت شد");
        setOpen(false);
        fetchSites(); // آپدیت لیست سایت‌ها به صورت زنده
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در ثبت سایت");
      }
    } catch (error) {
      toast.error("خطا در ارتباط با سرور");
    }
  }

  const filtered = useMemo(
    () =>
      sites.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.id.toLowerCase().includes(query.toLowerCase())
      ),
    [sites, query]
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span>Network Operations</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Sites</h1>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Site
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sites..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[120px] font-medium">ID</TableHead>
                <TableHead className="font-medium">Site Name</TableHead>
                <TableHead className="font-medium">Address / Location</TableHead>
                <TableHead className="font-medium">Client ID</TableHead>
                <TableHead className="font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.id}</TableCell>
                  <TableCell><div className="font-medium">{s.name}</div></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{s.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>Client #{s.client_id}</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
              <DialogDescription>Register a new physical location or datacenter.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client">Select Client</Label>
                <select
                  id="client"
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="" disabled>Choose a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Site Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Datacenter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Physical location address"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save Site</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: "active" | "offline" }) {
  if (status === "active") {
    return (
      <Badge className="bg-success/15 text-success hover:bg-success/15 border border-success/20 gap-1.5 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1.5 font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-background" /> Offline
    </Badge>
  );
}