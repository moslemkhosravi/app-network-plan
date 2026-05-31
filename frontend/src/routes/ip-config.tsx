import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type * as React from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Edit3,
  HardDrive,
  Monitor,
  Network,
  Phone,
  Plus,
  RefreshCw,
  Router,
  Search,
  Server,
  Trash2,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/ip-config")({
  head: () => ({
    meta: [
      { title: "IP Config — App Network Plan" },
      { name: "description", content: "IP ranges, used IPs and network address validation." },
    ],
  }),
  component: IPConfigPage,
});

const API_BASE_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:8000`
    : "http://127.0.0.1:8000";

type Site = { id: number; name: string; address?: string | null; client_id?: number | null };

type IPRange = {
  id: number;
  name: string;
  cidr: string;
  device_type?: string | null;
  site_id?: number | null;
  description?: string | null;
  gateway?: string | null;
  vlan?: string | null;
  is_active?: boolean | null;
  used_count?: number;
  total_hosts?: number;
  available_count?: number;
};

type IPUsage = {
  ip_address: string;
  source_type: string;
  source_id: number;
  name?: string | null;
  device_type?: string | null;
  site_id?: number | null;
  floor_id?: number | null;
  room_id?: number | null;
  port_id?: number | null;
  connected_to_id?: number | null;
  cable_tag?: string | null;
  vlan?: string | null;
};

const DEVICE_TYPES = [
  { value: "camera", label: "Camera / دوربین", icon: Camera },
  { value: "phone", label: "IP Phone / تلفن", icon: Phone },
  { value: "access-point", label: "Access Point", icon: Wifi },
  { value: "workstation", label: "Computer / PC / Workstation", icon: Monitor },
  { value: "printer", label: "Printer", icon: HardDrive },
  { value: "server", label: "Server", icon: Server },
  { value: "switch", label: "Switch", icon: Router },
  { value: "patch-panel", label: "Patch Panel", icon: Network },
];

function IPConfigPage() {
  const [ranges, setRanges] = useState<IPRange[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [usage, setUsage] = useState<IPUsage[]>([]);
  const [selectedRangeId, setSelectedRangeId] = useState<number | null>(null);
  const [editingRangeId, setEditingRangeId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cidr: "",
    device_type: "camera",
    site_id: "",
    gateway: "",
    vlan: "",
    description: "",
    is_active: true,
  });

  const selectedRange = useMemo(
    () => ranges.find((range) => range.id === selectedRangeId) ?? null,
    [ranges, selectedRangeId],
  );

  const filteredRanges = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranges;
    return ranges.filter((range) =>
      `${range.name} ${range.cidr} ${range.device_type ?? ""} ${range.gateway ?? ""} ${range.vlan ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [query, ranges]);

  const selectedRangeUsage = useMemo(() => {
    if (!selectedRange) return usage;
    return usage;
  }, [selectedRange, usage]);

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    if (selectedRangeId) {
      void fetchRangeUsage(selectedRangeId);
    } else {
      void fetchUsage();
    }
  }, [selectedRangeId]);

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      let message = "خطا در ارتباط با سرور";
      try {
        const err = await response.json();
        message = err.detail || message;
      } catch {
        // ignore non-json errors
      }
      throw new Error(message);
    }

    return response.json();
  }

  async function refreshAll() {
    setLoading(true);
    try {
      const [rangeData, siteData, usageData] = await Promise.all([
        api<IPRange[]>("/ip-ranges/"),
        api<Site[]>("/sites/"),
        api<IPUsage[]>("/ip-usage/"),
      ]);
      setRanges(rangeData);
      setSites(siteData);
      setUsage(usageData);
      if (!selectedRangeId && rangeData.length) setSelectedRangeId(rangeData[0].id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در دریافت اطلاعات IP");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage() {
    try {
      setUsage(await api<IPUsage[]>("/ip-usage/"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در دریافت IPهای استفاده‌شده");
    }
  }

  async function fetchRangeUsage(rangeId: number) {
    try {
      const data = await api<{ range: IPRange; used: IPUsage[] }>(`/ip-ranges/${rangeId}/usage`);
      setUsage(data.used);
      setRanges((prev) => prev.map((range) => (range.id === data.range.id ? data.range : range)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در دریافت مصرف رنج");
    }
  }

  function resetForm() {
    setEditingRangeId(null);
    setForm({
      name: "",
      cidr: "",
      device_type: "camera",
      site_id: "",
      gateway: "",
      vlan: "",
      description: "",
      is_active: true,
    });
  }

  function editRange(range: IPRange) {
    setEditingRangeId(range.id);
    setSelectedRangeId(range.id);
    setForm({
      name: range.name || "",
      cidr: range.cidr || "",
      device_type: range.device_type || "",
      site_id: range.site_id ? String(range.site_id) : "",
      gateway: range.gateway || "",
      vlan: range.vlan || "",
      description: range.description || "",
      is_active: range.is_active !== false,
    });
  }

  async function submitRange(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) return toast.error("نام رنج الزامی است");
    if (!form.cidr.trim()) return toast.error("CIDR الزامی است؛ مثال: 192.168.40.0/24");

    const payload = {
      name: form.name.trim(),
      cidr: form.cidr.trim(),
      device_type: form.device_type || null,
      site_id: form.site_id ? Number(form.site_id) : null,
      gateway: form.gateway.trim() || null,
      vlan: form.vlan.trim() || null,
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    try {
      const saved = editingRangeId
        ? await api<IPRange>(`/ip-ranges/${editingRangeId}`, { method: "PUT", body: JSON.stringify(payload) })
        : await api<IPRange>("/ip-ranges/", { method: "POST", body: JSON.stringify(payload) });
      toast.success(editingRangeId ? "رنج IP ویرایش شد" : "رنج IP ثبت شد");
      resetForm();
      setSelectedRangeId(saved.id);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در ذخیره رنج IP");
    }
  }

  async function deleteRange(range: IPRange) {
    if (!window.confirm(`رنج «${range.name}» حذف شود؟`)) return;
    try {
      await api(`/ip-ranges/${range.id}`, { method: "DELETE" });
      toast.success("رنج حذف شد");
      setSelectedRangeId(null);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در حذف رنج");
    }
  }

  const totalUsed = ranges.reduce((sum, range) => sum + (range.used_count ?? 0), 0);
  const totalCapacity = ranges.reduce((sum, range) => sum + (range.total_hosts ?? 0), 0);
  const duplicateIPs = useMemo(() => {
    const counts = new Map<string, number>();
    usage.forEach((item) => counts.set(item.ip_address, (counts.get(item.ip_address) || 0) + 1));
    return [...counts.entries()].filter(([, count]) => count > 1).length;
  }, [usage]);

  return (
    <AppShell>
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Network className="h-4 w-4" />
              <span>IPAM / IP Config</span>
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">IP Config</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              رنج IP برای دوربین، تلفن، اکسس‌پوینت و دستگاه‌ها تعریف کن؛ سیستم جلوی IP تکراری و IP خارج از رنج را می‌گیرد.
            </p>
          </div>
          <Button onClick={() => void refreshAll()} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="IP Ranges" value={ranges.length} icon={Network} />
          <StatCard title="Used IPs" value={totalUsed} icon={Activity} />
          <StatCard title="Capacity" value={totalCapacity} icon={CheckCircle2} />
          <StatCard title="Duplicate Alerts" value={duplicateIPs} icon={AlertTriangle} danger={duplicateIPs > 0} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{editingRangeId ? "ویرایش رنج" : "رنج جدید"}</h2>
                  <p className="text-xs text-muted-foreground">مثلاً Cameras = 192.168.40.0/24</p>
                </div>
                {editingRangeId && (
                  <Button variant="outline" size="sm" onClick={resetForm}>لغو</Button>
                )}
              </div>

              <form onSubmit={submitRange} className="space-y-4">
                <div className="space-y-2">
                  <Label>نام رنج</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Camera Range" />
                </div>
                <div className="space-y-2">
                  <Label>CIDR</Label>
                  <Input dir="ltr" value={form.cidr} onChange={(e) => setForm({ ...form, cidr: e.target.value })} placeholder="192.168.40.0/24" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>نوع دستگاه</Label>
                    <select
                      value={form.device_type}
                      onChange={(e) => setForm({ ...form, device_type: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">همه دستگاه‌ها</option>
                      {DEVICE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>سایت</Label>
                    <select
                      value={form.site_id}
                      onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">همه سایت‌ها</option>
                      {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Gateway</Label>
                    <Input dir="ltr" value={form.gateway} onChange={(e) => setForm({ ...form, gateway: e.target.value })} placeholder="192.168.40.1" />
                  </div>
                  <div className="space-y-2">
                    <Label>VLAN</Label>
                    <Input dir="ltr" value={form.vlan} onChange={(e) => setForm({ ...form, vlan: e.target.value })} placeholder="40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>توضیحات</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="مثلاً رنج دوربین‌های طبقات اداری" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  فعال باشد
                </label>
                <Button className="w-full gap-2" type="submit">
                  <Plus className="h-4 w-4" />
                  {editingRangeId ? "ذخیره تغییرات" : "ثبت رنج"}
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pr-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی رنج، VLAN، CIDR..." />
              </div>
              <div className="mt-4 space-y-2">
                {filteredRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedRangeId(range.id)}
                    className={`w-full rounded-2xl border p-3 text-right transition hover:bg-muted/50 ${selectedRangeId === range.id ? "border-primary bg-primary/5" : "bg-background"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">{range.name}</div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">{range.cidr}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="secondary">{range.device_type || "all"}</Badge>
                          {range.vlan && <Badge variant="outline">VLAN {range.vlan}</Badge>}
                          {range.site_id && <Badge variant="outline">Site #{range.site_id}</Badge>}
                        </div>
                      </div>
                      <div className="text-left text-xs">
                        <div className="font-semibold">{range.used_count ?? 0}/{range.total_hosts ?? 0}</div>
                        <div className="text-muted-foreground">used</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(((range.used_count ?? 0) / Math.max(range.total_hosts ?? 1, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => editRange(range)}>
                        <Edit3 className="h-3.5 w-3.5" /> ویرایش
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 text-destructive" onClick={() => void deleteRange(range)}>
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedRange ? `مصرف رنج: ${selectedRange.name}` : "همه IPهای استفاده‌شده"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    روی هر رنج کلیک کن تا IPهای استفاده‌شده، دستگاه، پورت، کابل و اتصالش را ببینی.
                  </p>
                </div>
                {selectedRange && <Badge className="font-mono">{selectedRange.cidr}</Badge>}
              </div>
            </div>

            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">IP</th>
                    <th className="pb-3 font-medium">منبع</th>
                    <th className="pb-3 font-medium">نام / دستگاه</th>
                    <th className="pb-3 font-medium">نوع</th>
                    <th className="pb-3 font-medium">Site/Floor/Room</th>
                    <th className="pb-3 font-medium">Port</th>
                    <th className="pb-3 font-medium">Cable</th>
                    <th className="pb-3 font-medium">VLAN</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRangeUsage.map((item) => (
                    <tr key={`${item.source_type}-${item.source_id}-${item.ip_address}`} className="border-b last:border-0">
                      <td className="py-3 font-mono" dir="ltr">{item.ip_address}</td>
                      <td className="py-3"><SourceBadge type={item.source_type} /></td>
                      <td className="py-3 font-medium">{item.name || "—"}</td>
                      <td className="py-3">{item.device_type || "—"}</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        Site {item.site_id ?? "—"} / Floor {item.floor_id ?? "—"} / Room {item.room_id ?? "—"}
                      </td>
                      <td className="py-3">{item.port_id ? `#${item.port_id}` : "—"}</td>
                      <td className="py-3 font-mono" dir="ltr">{item.cable_tag || "—"}</td>
                      <td className="py-3">{item.vlan || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedRangeUsage.length === 0 && (
                <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  هنوز IP استفاده‌شده‌ای برای این محدوده پیدا نشد.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value, icon: Icon, danger = false }: { title: string; value: number; icon: typeof Network; danger?: boolean }) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className={`mt-1 text-2xl font-bold ${danger ? "text-destructive" : ""}`}>{value}</div>
      </div>
      <div className={`rounded-2xl p-3 ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}

function SourceBadge({ type }: { type: string }) {
  const label = type === "map_item" ? "Floor Map" : type === "device" ? "Device" : "Port";
  return <Badge variant={type === "map_item" ? "default" : "secondary"}>{label}</Badge>;
}
