import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Router, Server, Network, HardDrive, Cpu } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Devices — App Network Plan" },
      { name: "description", content: "Manage network equipment and servers." },
    ],
  }),
  component: DevicesPage,
});

type Device = {
  id: string;
  name: string;
  device_type: string;
  rack_id: number;
  start_u: number | null;
  end_u: number | null;
};

type Rack = {
  id: number;
  name: string;
};

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({ 
    name: "", 
    device_type: "switch", 
    rack_id: "", 
    start_u: "", 
    end_u: "" 
  });

  const API_BASE_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://127.0.0.1:8000";

  // دریافت لیست تجهیزات
  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/`);
      if (response.ok) {
        const data = await response.json();
        const mappedDevices = data.map((d: any) => ({
          id: `DEV-${String(d.id).padStart(3, "0")}`,
          name: d.name,
          device_type: d.device_type,
          rack_id: d.rack_id,
          start_u: d.start_u,
          end_u: d.end_u
        }));
        setDevices(mappedDevices);
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست تجهیزات");
    }
  };

  // دریافت لیست رک‌ها برای فرم ثبت نام
  const fetchRacks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/racks/`);
      if (response.ok) {
        const data = await response.json();
        setRacks(data);
      }
    } catch (error) {
      console.error("Failed to fetch racks");
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchRacks();
  }, []);

  function openAdd() {
    setForm({ name: "", device_type: "switch", rack_id: "", start_u: "", end_u: "" });
    setOpen(true);
  }

  // ارسال تجهیز جدید به بک‌اند
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.rack_id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/devices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: form.name, 
          device_type: form.device_type,
          rack_id: parseInt(form.rack_id),
          start_u: form.start_u ? parseInt(form.start_u) : null,
          end_u: form.end_u ? parseInt(form.end_u) : null
        })
      });

      if (response.ok) {
        toast.success("تجهیز جدید با موفقیت در رک ثبت شد");
        setOpen(false);
        fetchDevices();
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در ثبت تجهیز");
      }
    } catch (error) {
      toast.error("خطا در ارتباط با سرور");
    }
  }

  const filtered = useMemo(
    () =>
      devices.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.id.toLowerCase().includes(query.toLowerCase()) ||
          d.device_type.toLowerCase().includes(query.toLowerCase())
      ),
    [devices, query]
  );

  // آیکون مناسب بر اساس نوع دستگاه
  const getDeviceIcon = (type: string) => {
    switch(type) {
      case 'switch': return <Network className="h-4 w-4" />;
      case 'router': return <Router className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'patch_panel': return <HardDrive className="h-4 w-4" />;
      default: return <Cpu className="h-4 w-4" />;
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Cpu className="h-3.5 w-3.5" />
              <span>Hardware</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Devices</h1>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Device
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
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
                <TableHead className="font-medium">Device Name</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Rack ID</TableHead>
                <TableHead className="font-medium">Position (U)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {getDeviceIcon(d.device_type)}
                      {d.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{d.device_type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>Rack #{d.rack_id}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-muted-foreground">
                      {d.start_u && d.end_u ? `U${d.start_u} - U${d.end_u}` : "Unmounted"}
                    </span>
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
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>Mount a new device into a rack.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rack">Select Rack</Label>
                <select
                  id="rack"
                  value={form.rack_id}
                  onChange={(e) => setForm({ ...form, rack_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="" disabled>Choose a rack...</option>
                  {racks.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Device Type</Label>
                <select
                  id="type"
                  value={form.device_type}
                  onChange={(e) => setForm({ ...form, device_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="switch">Switch</option>
                  <option value="router">Router</option>
                  <option value="server">Server</option>
                  <option value="patch_panel">Patch Panel</option>
                  <option value="firewall">Firewall</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Device Name / Hostname</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Core-SW-01"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_u">Start Unit (U)</Label>
                  <Input
                    id="start_u"
                    type="number"
                    value={form.start_u}
                    onChange={(e) => setForm({ ...form, start_u: e.target.value })}
                    placeholder="e.g. 40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_u">End Unit (U)</Label>
                  <Input
                    id="end_u"
                    type="number"
                    value={form.end_u}
                    onChange={(e) => setForm({ ...form, end_u: e.target.value })}
                    placeholder="e.g. 41"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Mount Device</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}