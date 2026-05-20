import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Server, Building2, Layers } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/racks")({
  head: () => ({
    meta: [
      { title: "Racks — App Network Plan" },
      { name: "description", content: "Manage network racks and physical space." },
    ],
  }),
  component: RacksPage,
});

type Rack = {
  id: string;
  name: string;
  size_u: number;
  site_id: number;
};

type Site = {
  id: number;
  name: string;
};

function RacksPage() {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [sites, setSites] = useState<Site[]>([]); // برای لیست کشویی انتخاب سایت
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ name: "", size_u: 42, site_id: "" });

  // آی‌پی سرور برای اتصال به بک‌اند
  const API_BASE_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://127.0.0.1:8000";

  // دریافت لیست رک‌ها
  const fetchRacks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/racks/`);
      if (response.ok) {
        const data = await response.json();
        const mappedRacks = data.map((r: any) => ({
          id: `RCK-${String(r.id).padStart(3, "0")}`,
          name: r.name,
          size_u: r.size_u,
          site_id: r.site_id
        }));
        setRacks(mappedRacks);
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست رک‌ها");
    }
  };

  // دریافت لیست سایت‌ها (برای استفاده در فرم ثبت رک)
  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sites/`);
      if (response.ok) {
        const data = await response.json();
        setSites(data);
      }
    } catch (error) {
      console.error("Failed to fetch sites");
    }
  };

  useEffect(() => {
    fetchRacks();
    fetchSites();
  }, []);

  function openAdd() {
    setForm({ name: "", size_u: 42, site_id: "" });
    setOpen(true);
  }

  // ارسال اطلاعات رک جدید به بک‌اند
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.site_id || !form.size_u) return;

    try {
      const response = await fetch(`${API_BASE_URL}/racks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: form.name, 
          size_u: parseInt(form.size_u.toString()),
          site_id: parseInt(form.site_id)
        })
      });

      if (response.ok) {
        toast.success("رک جدید با موفقیت ثبت شد");
        setOpen(false);
        fetchRacks(); // آپدیت لیست رک‌ها
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در ثبت رک");
      }
    } catch (error) {
      toast.error("خطا در ارتباط با سرور");
    }
  }

  const filtered = useMemo(
    () =>
      racks.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.id.toLowerCase().includes(query.toLowerCase())
      ),
    [racks, query]
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Server className="h-3.5 w-3.5" />
              <span>Infrastructure</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Racks</h1>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Rack
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search racks..."
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
                <TableHead className="font-medium">Rack Name</TableHead>
                <TableHead className="font-medium">Size (U)</TableHead>
                <TableHead className="font-medium">Site ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                  <TableCell><div className="font-medium">{r.name}</div></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Layers className="h-3 w-3 text-muted-foreground" />
                      <span>{r.size_u}U</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>Site #{r.site_id}</span>
                    </div>
                  </TableCell>
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
              <DialogTitle>Add New Rack</DialogTitle>
              <DialogDescription>Create a new rack inside an existing site.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="site">Select Site</Label>
                <select
                  id="site"
                  value={form.site_id}
                  onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="" disabled>Choose a site...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Rack Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rack A1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size (U)</Label>
                <Input
                  id="size"
                  type="number"
                  min="1"
                  max="60"
                  value={form.size_u}
                  onChange={(e) => setForm({ ...form, size_u: parseInt(e.target.value) })}
                  placeholder="e.g. 42"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save Rack</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}