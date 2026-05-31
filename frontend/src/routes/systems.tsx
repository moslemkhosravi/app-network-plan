import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Cpu,
  Eye,
  HardDrive,
  MonitorCog,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Server,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/systems")({
  component: SystemsPage,
});

type SystemType = "physical" | "virtual";
type SystemStatus = "running" | "stopped" | "maintenance" | "unknown";

type OpenPort = {
  port: string;
  name: string;
  protocol: string;
  description: string;
};

type SystemAsset = {
  id: number;
  name: string;
  hostname?: string | null;
  system_type?: SystemType | string | null;
  status?: SystemStatus | string | null;
  os_family?: string | null;
  os_name?: string | null;
  os_version?: string | null;
  kernel_version?: string | null;
  architecture?: string | null;
  ip_address?: string | null;
  dhcp_enabled?: boolean | null;
  management_ip?: string | null;
  mac_address?: string | null;
  vlan?: string | null;
  domain?: string | null;
  cpu_model?: string | null;
  cpu_cores?: number | null;
  ram_gb?: number | null;
  disk_gb?: number | null;
  hypervisor_type?: string | null;
  vm_name?: string | null;
  vm_id?: string | null;
  host_system_id?: number | null;
  host_device_id?: number | null;
  linked_device_id?: number | null;
  linked_device_text?: string | null;
  owner?: string | null;
  department?: string | null;
  environment?: string | null;
  applications?: string | null;
  open_ports?: string | null;
  notes?: string | null;
};

type HostDevice = {
  id: number;
  name: string;
  hostname?: string | null;
  device_type?: string | null;
  mgmt_ip?: string | null;
};

type SystemForm = {
  name: string;
  hostname: string;
  system_type: SystemType;
  status: SystemStatus;
  os_family: string;
  os_name: string;
  os_version: string;
  kernel_version: string;
  architecture: string;
  ip_address: string;
  dhcp_enabled: boolean;
  management_ip: string;
  mac_address: string;
  vlan: string;
  domain: string;
  cpu_model: string;
  cpu_cores: string;
  ram_gb: string;
  disk_gb: string;
  hypervisor_type: string;
  vm_name: string;
  vm_id: string;
  host_system_id: string;
  host_device_id: string;
  linked_device_id: string;
  linked_device_text: string;
  owner: string;
  department: string;
  environment: string;
  applications: string;
  open_ports: OpenPort[];
  notes: string;
};

const emptyForm: SystemForm = {
  name: "",
  hostname: "",
  system_type: "physical",
  status: "running",
  os_family: "",
  os_name: "",
  os_version: "",
  kernel_version: "",
  architecture: "x86_64",
  ip_address: "",
  dhcp_enabled: false,
  management_ip: "",
  mac_address: "",
  vlan: "",
  domain: "",
  cpu_model: "",
  cpu_cores: "",
  ram_gb: "",
  disk_gb: "",
  hypervisor_type: "",
  vm_name: "",
  vm_id: "",
  host_system_id: "",
  host_device_id: "",
  linked_device_id: "",
  linked_device_text: "",
  owner: "",
  department: "",
  environment: "production",
  applications: "",
  open_ports: [],
  notes: "",
};

const systemTypeOptions = [
  { value: "physical", label: "Physical / عادی" },
  { value: "virtual", label: "Virtual / مجازی" },
];

const statusOptions = [
  { value: "running", label: "Running" },
  { value: "stopped", label: "Stopped" },
  { value: "maintenance", label: "Maintenance" },
  { value: "unknown", label: "Unknown" },
];

const osFamilyOptions = [
  { value: "Linux", label: "Linux / لینوکس" },
  { value: "Windows", label: "Windows / ویندوز" },
  { value: "VMware", label: "VMware / مجازی‌سازی" },
  { value: "BSD", label: "BSD / Unix" },
  { value: "Other", label: "Other / سایر" },
];

const osNameOptionsByFamily: Record<string, { value: string; label: string }[]> = {
  Linux: [
    { value: "Ubuntu Server", label: "Ubuntu Server" },
    { value: "Debian", label: "Debian" },
    { value: "CentOS", label: "CentOS" },
    { value: "Rocky Linux", label: "Rocky Linux" },
    { value: "AlmaLinux", label: "AlmaLinux" },
    { value: "Red Hat Enterprise Linux", label: "Red Hat Enterprise Linux" },
    { value: "SUSE Linux Enterprise", label: "SUSE Linux Enterprise" },
    { value: "Oracle Linux", label: "Oracle Linux" },
    { value: "Other Linux", label: "Other Linux" },
  ],
  Windows: [
    { value: "Windows Server 2025", label: "Windows Server 2025" },
    { value: "Windows Server 2022", label: "Windows Server 2022" },
    { value: "Windows Server 2019", label: "Windows Server 2019" },
    { value: "Windows Server 2016", label: "Windows Server 2016" },
    { value: "Windows 11", label: "Windows 11" },
    { value: "Windows 10", label: "Windows 10" },
    { value: "Other Windows", label: "Other Windows" },
  ],
  VMware: [
    { value: "VMware ESXi", label: "VMware ESXi" },
    { value: "VMware vCenter", label: "VMware vCenter" },
    { value: "VMware vSAN", label: "VMware vSAN" },
    { value: "Other VMware", label: "Other VMware" },
  ],
  BSD: [
    { value: "FreeBSD", label: "FreeBSD" },
    { value: "OpenBSD", label: "OpenBSD" },
    { value: "NetBSD", label: "NetBSD" },
    { value: "Other BSD", label: "Other BSD" },
  ],
  Other: [
    { value: "Appliance OS", label: "Appliance OS" },
    { value: "Custom OS", label: "Custom OS" },
    { value: "Other", label: "Other" },
  ],
};

const architectureOptions = [
  { value: "x86_64", label: "x86_64 / 64-bit" },
  { value: "arm64", label: "ARM64" },
  { value: "x86", label: "x86 / 32-bit" },
  { value: "other", label: "Other" },
];


const windowsEditionOptions = [
  { value: "Datacenter", label: "Datacenter" },
  { value: "Standard", label: "Standard" },
  { value: "Essentials", label: "Essentials" },
  { value: "Core", label: "Core Installation" },
  { value: "Desktop Experience", label: "Desktop Experience" },
  { value: "Other", label: "Other" },
];

const esxiVersionOptions = [
  { value: "ESXi 8.0", label: "ESXi 8.0" },
  { value: "ESXi 7.0", label: "ESXi 7.0" },
  { value: "ESXi 6.7", label: "ESXi 6.7" },
  { value: "vCenter Server 8", label: "vCenter Server 8" },
  { value: "vCenter Server 7", label: "vCenter Server 7" },
  { value: "Other", label: "Other" },
];

const hypervisorOptions = [
  { value: "VMware", label: "VMware" },
  { value: "Hyper-V", label: "Microsoft Hyper-V" },
  { value: "Proxmox", label: "Proxmox VE" },
  { value: "KVM", label: "KVM" },
  { value: "Xen", label: "Xen" },
  { value: "Other", label: "Other" },
];

const environmentOptions = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "test", label: "Test" },
  { value: "development", label: "Development" },
  { value: "dr", label: "DR / Backup Site" },
];

const portProtocolOptions = [
  { value: "TCP", label: "TCP" },
  { value: "UDP", label: "UDP" },
  { value: "TCP/UDP", label: "TCP/UDP" },
];

const cpuModelOptions = [
  { value: "Intel Xeon Bronze 3100 Series", label: "Intel Xeon Bronze 3100 Series" },
  { value: "Intel Xeon Bronze 3200 Series", label: "Intel Xeon Bronze 3200 Series" },
  { value: "Intel Xeon Bronze 3400 Series", label: "Intel Xeon Bronze 3400 Series" },
  { value: "Intel Xeon Silver 4100 Series", label: "Intel Xeon Silver 4100 Series" },
  { value: "Intel Xeon Silver 4200 Series", label: "Intel Xeon Silver 4200 Series" },
  { value: "Intel Xeon Silver 4300 Series", label: "Intel Xeon Silver 4300 Series" },
  { value: "Intel Xeon Silver 4400 Series", label: "Intel Xeon Silver 4400 Series" },
  { value: "Intel Xeon Gold 5100 Series", label: "Intel Xeon Gold 5100 Series" },
  { value: "Intel Xeon Gold 5200 Series", label: "Intel Xeon Gold 5200 Series" },
  { value: "Intel Xeon Gold 5300 Series", label: "Intel Xeon Gold 5300 Series" },
  { value: "Intel Xeon Gold 5400 Series", label: "Intel Xeon Gold 5400 Series" },
  { value: "Intel Xeon Gold 6100 Series", label: "Intel Xeon Gold 6100 Series" },
  { value: "Intel Xeon Gold 6200 Series", label: "Intel Xeon Gold 6200 Series" },
  { value: "Intel Xeon Gold 6300 Series", label: "Intel Xeon Gold 6300 Series" },
  { value: "Intel Xeon Gold 6400 Series", label: "Intel Xeon Gold 6400 Series" },
  { value: "Intel Xeon Platinum 8100 Series", label: "Intel Xeon Platinum 8100 Series" },
  { value: "Intel Xeon Platinum 8200 Series", label: "Intel Xeon Platinum 8200 Series" },
  { value: "Intel Xeon Platinum 8300 Series", label: "Intel Xeon Platinum 8300 Series" },
  { value: "Intel Xeon Platinum 8400 Series", label: "Intel Xeon Platinum 8400 Series" },
  { value: "Intel Xeon E-2100 Series", label: "Intel Xeon E-2100 Series" },
  { value: "Intel Xeon E-2200 Series", label: "Intel Xeon E-2200 Series" },
  { value: "Intel Xeon E-2300 Series", label: "Intel Xeon E-2300 Series" },
  { value: "Intel Xeon E-2400 Series", label: "Intel Xeon E-2400 Series" },
  { value: "Intel Xeon D-1500 Series", label: "Intel Xeon D-1500 Series" },
  { value: "Intel Xeon D-2100 Series", label: "Intel Xeon D-2100 Series" },
  { value: "Intel Xeon D-2700 Series", label: "Intel Xeon D-2700 Series" },
  { value: "Intel Xeon W Series", label: "Intel Xeon W Series" },
  { value: "Intel Core i3", label: "Intel Core i3" },
  { value: "Intel Core i5", label: "Intel Core i5" },
  { value: "Intel Core i7", label: "Intel Core i7" },
  { value: "Intel Core i9", label: "Intel Core i9" },
  { value: "AMD EPYC 7001 Series", label: "AMD EPYC 7001 Series / Naples" },
  { value: "AMD EPYC 7002 Series", label: "AMD EPYC 7002 Series / Rome" },
  { value: "AMD EPYC 7003 Series", label: "AMD EPYC 7003 Series / Milan" },
  { value: "AMD EPYC 7003X Series", label: "AMD EPYC 7003X Series / Milan-X" },
  { value: "AMD EPYC 9004 Series", label: "AMD EPYC 9004 Series / Genoa" },
  { value: "AMD EPYC 8004 Series", label: "AMD EPYC 8004 Series / Siena" },
  { value: "AMD EPYC 9005 Series", label: "AMD EPYC 9005 Series / Turin" },
  { value: "AMD Ryzen 3", label: "AMD Ryzen 3" },
  { value: "AMD Ryzen 5", label: "AMD Ryzen 5" },
  { value: "AMD Ryzen 7", label: "AMD Ryzen 7" },
  { value: "AMD Ryzen 9", label: "AMD Ryzen 9" },
  { value: "AMD Threadripper", label: "AMD Threadripper" },
  { value: "Other / Custom", label: "Other / Custom" },
];

function withCurrentOption(options: { value: string; label: string }[], currentValue: string) {
  if (!currentValue || options.some((item) => item.value === currentValue)) return options;
  return [{ value: currentValue, label: currentValue }, ...options];
}

function parseOpenPorts(value?: string | null): OpenPort[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      port: String(item?.port || ""),
      name: String(item?.name || ""),
      protocol: String(item?.protocol || "TCP"),
      description: String(item?.description || ""),
    }));
  } catch {
    return [];
  }
}

function formatOpenPorts(value?: string | null) {
  const ports = parseOpenPorts(value);
  if (!ports.length) return "—";
  return ports.slice(0, 3).map((item) => `${item.name || "Port"} ${item.port ? `(${item.port}/${item.protocol || "TCP"})` : ""}`.trim()).join(", ");
}

function SystemsPage() {
  const API_BASE_URL =
    typeof window !== "undefined"
      ? `http://${window.location.hostname}:8000`
      : "http://127.0.0.1:8000";

  const [systems, setSystems] = useState<SystemAsset[]>([]);
  const [hosts, setHosts] = useState<HostDevice[]>([]);
  const [physicalDevices, setPhysicalDevices] = useState<HostDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewSystem, setViewSystem] = useState<SystemAsset | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SystemForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const selectedOsFamily = form.os_family || "";
  const osNameOptions = withCurrentOption(osNameOptionsByFamily[selectedOsFamily] || [], form.os_name);

  const hostById = useMemo(() => {
    const map = new Map<number, HostDevice>();
    hosts.forEach((host) => map.set(host.id, host));
    physicalDevices.forEach((device) => {
      if (!map.has(device.id)) map.set(device.id, device);
    });
    return map;
  }, [hosts, physicalDevices]);

  const hostServerOptions = useMemo(() => {
    const map = new Map<number, HostDevice>();
    [...hosts, ...physicalDevices].forEach((device) => {
      if (!map.has(device.id)) map.set(device.id, device);
    });
    return Array.from(map.values()).map((host) => ({
      value: String(host.id),
      label: `${host.name}${host.hostname ? ` / ${host.hostname}` : ""}${host.device_type ? ` (${host.device_type})` : ""}${host.mgmt_ip ? ` - ${host.mgmt_ip}` : ""}`,
    }));
  }, [hosts, physicalDevices]);

  const hostSystemOptions = useMemo(() => {
    return systems
      .filter((system) => system.id !== editingId)
      .map((system) => ({
        value: String(system.id),
        label: `${system.name}${system.hostname ? ` / ${system.hostname}` : ""}${system.system_type ? ` - ${system.system_type === "virtual" ? "Virtual" : "Physical"}` : ""}${system.os_name ? ` (${system.os_name})` : ""}${system.ip_address ? ` - ${system.ip_address}` : ""}`,
      }));
  }, [systems, editingId]);

  const stats = useMemo(() => {
    const total = systems.length;
    const virtual = systems.filter((item) => item.system_type === "virtual").length;
    const physical = systems.filter((item) => item.system_type !== "virtual").length;
    const running = systems.filter((item) => item.status === "running").length;
    return { total, virtual, physical, running };
  }, [systems]);

  const filteredSystems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return systems.filter((item) => {
      if (typeFilter !== "all" && item.system_type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (osFilter !== "all" && (item.os_family || "").toLowerCase() !== osFilter.toLowerCase()) return false;
      if (!normalizedQuery) return true;
      return [
        item.name,
        item.hostname,
        item.ip_address,
        item.management_ip,
        item.os_name,
        item.os_version,
        item.cpu_model,
        item.vm_name,
        item.open_ports,
        item.linked_device_text,
        item.owner,
        item.department,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [systems, query, typeFilter, statusFilter, osFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [systemsResponse, hostsResponse, devicesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/systems/`),
        fetch(`${API_BASE_URL}/systems/hosts`),
        fetch(`${API_BASE_URL}/devices/?limit=1000`),
      ]);

      if (!systemsResponse.ok) throw new Error("systems");
      if (!hostsResponse.ok) throw new Error("hosts");
      if (!devicesResponse.ok) throw new Error("devices");

      setSystems(await systemsResponse.json());
      setHosts(await hostsResponse.json());
      setPhysicalDevices(await devicesResponse.json());
    } catch (error) {
      toast.error("خطا در دریافت اطلاعات سیستم‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowAdvancedDetails(false);
    setDialogOpen(true);
  };

  const openViewDialog = (system: SystemAsset) => {
    setViewSystem(system);
  };

  const openEditDialog = (system: SystemAsset) => {
    setEditingId(system.id);
    setForm({
      name: system.name || "",
      hostname: system.hostname || "",
      system_type: system.system_type === "virtual" ? "virtual" : "physical",
      status: (system.status as SystemStatus) || "unknown",
      os_family: system.os_family || "",
      os_name: system.os_name || "",
      os_version: system.os_version || "",
      kernel_version: system.kernel_version || "",
      architecture: system.architecture || "",
      ip_address: system.ip_address || "",
      dhcp_enabled: Boolean(system.dhcp_enabled),
      management_ip: system.management_ip || "",
      mac_address: system.mac_address || "",
      vlan: system.vlan || "",
      domain: system.domain || "",
      cpu_model: system.cpu_model || "",
      cpu_cores: system.cpu_cores?.toString() || "",
      ram_gb: system.ram_gb?.toString() || "",
      disk_gb: system.disk_gb?.toString() || "",
      hypervisor_type: system.hypervisor_type || "",
      vm_name: system.vm_name || "",
      vm_id: system.vm_id || "",
      host_system_id: system.host_system_id?.toString() || "",
      host_device_id: system.host_device_id?.toString() || "",
      linked_device_id: system.linked_device_id?.toString() || "",
      linked_device_text: system.linked_device_text || "",
      owner: system.owner || "",
      department: system.department || "",
      environment: system.environment || "",
      applications: system.applications || "",
      open_ports: parseOpenPorts(system.open_ports),
      notes: system.notes || "",
    });
    setShowAdvancedDetails(false);
    setDialogOpen(true);
  };

  const updateForm = (field: keyof SystemForm, value: string | boolean | OpenPort[]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value } as SystemForm;
      if (field === "system_type" && value === "physical") {
        next.host_device_id = "";
        next.host_system_id = "";
        next.hypervisor_type = "";
        next.vm_name = "";
        next.vm_id = "";
        next.management_ip = "";
        next.cpu_model = next.cpu_model || "";
      }
      if (field === "system_type" && value === "virtual") {
        next.linked_device_id = "";
        next.linked_device_text = "";
        next.cpu_model = "";
      }
      if (field === "dhcp_enabled" && value === true) {
        next.ip_address = "";
      }
      if (field === "os_family") {
        const osFamily = String(value);
        next.os_name = "";
        next.kernel_version = "";
        next.domain = osFamily === "Windows" ? next.domain : "";
        next.architecture = next.architecture || "x86_64";
      }
      return next;
    });
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    hostname: form.hostname.trim() || null,
    system_type: form.system_type,
    status: form.status,
    os_family: form.os_family.trim() || null,
    os_name: form.os_name.trim() || null,
    os_version: form.os_version.trim() || null,
    kernel_version: form.kernel_version.trim() || null,
    architecture: form.architecture.trim() || null,
    ip_address: form.dhcp_enabled ? null : form.ip_address.trim() || null,
    dhcp_enabled: form.dhcp_enabled,
    management_ip: form.system_type === "physical" ? null : form.management_ip.trim() || null,
    mac_address: form.mac_address.trim() || null,
    vlan: form.vlan.trim() || null,
    domain: form.domain.trim() || null,
    cpu_model: form.system_type === "virtual" ? null : form.cpu_model.trim() || null,
    cpu_cores: form.cpu_cores ? Number(form.cpu_cores) : null,
    ram_gb: form.ram_gb ? Number(form.ram_gb) : null,
    disk_gb: form.disk_gb ? Number(form.disk_gb) : null,
    hypervisor_type: form.system_type === "virtual" ? form.hypervisor_type.trim() || null : null,
    vm_name: form.system_type === "virtual" ? form.vm_name.trim() || null : null,
    vm_id: form.system_type === "virtual" ? form.vm_id.trim() || null : null,
    host_system_id: form.system_type === "virtual" && form.host_system_id ? Number(form.host_system_id) : null,
    host_device_id: form.system_type === "virtual" && form.host_device_id ? Number(form.host_device_id) : null,
    linked_device_id: form.system_type === "physical" && form.linked_device_id ? Number(form.linked_device_id) : null,
    linked_device_text: form.system_type === "physical" ? form.linked_device_text.trim() || null : null,
    owner: form.owner.trim() || null,
    department: form.department.trim() || null,
    environment: form.environment.trim() || null,
    applications: form.applications.trim() || null,
    open_ports: JSON.stringify(form.open_ports.filter((item) => item.port.trim() || item.name.trim())),
    notes: form.notes.trim() || null,
  });

  const saveSystem = async () => {
    if (!form.name.trim()) {
      toast.error("نام سیستم الزامی است");
      return;
    }
    if (form.system_type === "virtual" && !form.host_system_id && !form.host_device_id) {
      toast.error("برای سیستم مجازی، سیستم میزبان یا سرور میزبان را انتخاب کن");
      return;
    }

    try {
      const response = await fetch(
        editingId ? `${API_BASE_URL}/systems/${editingId}` : `${API_BASE_URL}/systems/`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "save failed");
      }

      toast.success(editingId ? "سیستم بروزرسانی شد" : "سیستم ثبت شد");
      setDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "خطا در ذخیره سیستم");
    }
  };

  const deleteSystem = async (system: SystemAsset) => {
    if (!confirm(`سیستم ${system.name} حذف شود؟`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/systems/${system.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
      toast.success("سیستم حذف شد");
      await loadData();
    } catch (error) {
      toast.error("خطا در حذف سیستم");
    }
  };

  const statusBadge = (status?: string | null) => {
    const value = status || "unknown";
    const label = statusOptions.find((item) => item.value === value)?.label || value;
    return <Badge variant={value === "running" ? "default" : "secondary"}>{label}</Badge>;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <MonitorCog className="h-8 w-8 text-primary" />
              Systems
            </h1>
            <p className="text-muted-foreground mt-1">
              مدیریت سیستم‌عامل‌ها، سرورهای فیزیکی و ماشین‌های مجازی به همراه RAM، CPU، مدل CPU، IP و مشخصات نرم‌افزاری.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add System
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard title="Total Systems" value={stats.total} icon={<MonitorCog className="h-5 w-5" />} />
          <SummaryCard title="Virtual Machines" value={stats.virtual} icon={<Server className="h-5 w-5" />} />
          <SummaryCard title="Physical" value={stats.physical} icon={<HardDrive className="h-5 w-5" />} />
          <SummaryCard title="Running" value={stats.running} icon={<Cpu className="h-5 w-5" />} />
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, hostname, IP, OS, CPU model..."
                className="pl-9"
              />
            </div>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All Types</option>
              {systemTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Statuses</option>
              {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={osFilter} onChange={(event) => setOsFilter(event.target.value)}>
              <option value="all">All OS</option>
              {osFamilyOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>CPU / RAM</TableHead>
                  <TableHead>Host / Linked Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystems.map((system) => {
                  const host = system.host_device_id ? hostById.get(system.host_device_id) : null;
                  const hostSystem = system.host_system_id ? systems.find((item) => item.id === system.host_system_id) : null;
                  const linkedDevice = system.linked_device_id ? hostById.get(system.linked_device_id) : null;
                  return (
                    <TableRow key={system.id}>
                      <TableCell>
                        <div className="font-semibold">{system.name}</div>
                        <div className="text-xs text-muted-foreground">{system.vm_name || system.hostname || system.domain || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{system.system_type === "virtual" ? "Virtual" : "Physical"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>{system.os_name || system.os_family || "—"}</div>
                        <div className="text-xs text-muted-foreground">{system.os_version || system.kernel_version || ""}</div>
                      </TableCell>
                      <TableCell>
                        <div>{system.dhcp_enabled ? "DHCP" : system.ip_address || "—"}</div>
                        {system.system_type === "virtual" && (
                          <div className="text-xs text-muted-foreground">Mgmt: {system.management_ip || "—"}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{system.cpu_cores ? `${system.cpu_cores} Core` : "—"} / {system.ram_gb ? `${system.ram_gb} GB` : "—"}</div>
                        {system.system_type !== "virtual" && (
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">{system.cpu_model || "CPU model: —"}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {system.system_type === "virtual" ? (
                          <div>
                            <div>{hostSystem?.name || host?.name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{system.vm_name || system.hypervisor_type || system.vm_id || ""}</div>
                          </div>
                        ) : (
                          <div>
                            <div>{system.linked_device_text || linkedDevice?.name || "—"}</div>
                            {linkedDevice && (
                              <div className="text-xs text-muted-foreground">{linkedDevice.device_type || linkedDevice.hostname || ""}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{statusBadge(system.status)}</div>
                        <div className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">Ports: {formatOpenPorts(system.open_ports)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openViewDialog(system)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(system)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteSystem(system)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredSystems.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      {loading ? "در حال دریافت اطلاعات..." : "هنوز سیستمی ثبت نشده است."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <SystemViewDialog
          system={viewSystem}
          systems={systems}
          hostById={hostById}
          onClose={() => setViewSystem(null)}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit System" : "Add System"}</DialogTitle>
              <DialogDescription>
                مشخصات سیستم‌عامل، منابع، IP، پورت‌های باز و ارتباط با سرور/سیستم میزبان را ثبت کن.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              <div className="rounded-lg border bg-muted/25 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">اطلاعات اصلی</h3>
                    <p className="text-sm text-muted-foreground">
                      اول نوع سیستم و نوع سیستم‌عامل را انتخاب کن؛ فیلدهای بعدی بر اساس همین انتخاب‌ها تغییر می‌کنند.
                    </p>
                  </div>
                  <Badge variant="outline">Smart Form</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="Name" value={form.name} onChange={(value) => updateForm("name", value)} required />
                  <Field label="Hostname" value={form.hostname} onChange={(value) => updateForm("hostname", value)} />
                  <SelectField label="System Type" value={form.system_type} onChange={(value) => updateForm("system_type", value)} options={systemTypeOptions} />
                  <SelectField label="Status" value={form.status} onChange={(value) => updateForm("status", value)} options={statusOptions} />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/25 p-4">
                <div className="mb-4">
                  <h3 className="font-semibold">سیستم‌عامل</h3>
                  <p className="text-sm text-muted-foreground">
                    گزینه‌ها آماده هستند تا هر بار لازم نباشد نوع OS یا نسخه‌های رایج را دستی تایپ کنی.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <SelectField
                    label="OS Family"
                    value={form.os_family}
                    onChange={(value) => updateForm("os_family", value)}
                    options={osFamilyOptions}
                    placeholder="Select OS family"
                  />
                  {selectedOsFamily ? (
                    <SelectField
                      label={selectedOsFamily === "Linux" ? "Distribution" : selectedOsFamily === "Windows" ? "Windows Version" : "OS Name"}
                      value={form.os_name}
                      onChange={(value) => updateForm("os_name", value)}
                      options={osNameOptions}
                      placeholder="Select OS"
                    />
                  ) : (
                    <Field label="OS Name" value={form.os_name} onChange={(value) => updateForm("os_name", value)} placeholder="اول OS Family را انتخاب کن" />
                  )}
                  {selectedOsFamily === "Windows" ? (
                    <SelectField
                      label="Windows Server Edition"
                      value={form.os_version}
                      onChange={(value) => updateForm("os_version", value)}
                      options={withCurrentOption(windowsEditionOptions, form.os_version)}
                      placeholder="Select edition"
                    />
                  ) : selectedOsFamily === "VMware" ? (
                    <SelectField
                      label="ESXi / vCenter Version"
                      value={form.os_version}
                      onChange={(value) => updateForm("os_version", value)}
                      options={withCurrentOption(esxiVersionOptions, form.os_version)}
                      placeholder="Select version"
                    />
                  ) : (
                    <Field
                      label={selectedOsFamily === "Linux" ? "Release" : "OS Version"}
                      value={form.os_version}
                      onChange={(value) => updateForm("os_version", value)}
                      placeholder={selectedOsFamily === "Linux" ? "22.04 LTS / 9.4" : "Version"}
                    />
                  )}
                  <SelectField label="Architecture" value={form.architecture} onChange={(value) => updateForm("architecture", value)} options={architectureOptions} />
                </div>

                {selectedOsFamily === "Linux" && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field label="Kernel Version" value={form.kernel_version} onChange={(value) => updateForm("kernel_version", value)} placeholder="5.15 / 6.x" />
                    {form.system_type === "virtual" && (
                      <Field label="Management IP / SSH" value={form.management_ip} onChange={(value) => updateForm("management_ip", value)} />
                    )}
                  </div>
                )}

                {selectedOsFamily === "Windows" && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field label="Build Number" value={form.kernel_version} onChange={(value) => updateForm("kernel_version", value)} placeholder="20348 / 17763" />
                    <Field label="Domain / Workgroup" value={form.domain} onChange={(value) => updateForm("domain", value)} />
                    {form.system_type === "virtual" && (
                      <Field label="Management IP / RDP" value={form.management_ip} onChange={(value) => updateForm("management_ip", value)} />
                    )}
                    <Field label="Windows Roles / Services" value={form.applications} onChange={(value) => updateForm("applications", value)} placeholder="AD DS, DNS, IIS, File Server..." />
                  </div>
                )}

                {selectedOsFamily === "VMware" && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field label="Build Number" value={form.kernel_version} onChange={(value) => updateForm("kernel_version", value)} placeholder="ESXi build / vCenter build" />
                    {form.system_type === "virtual" && (
                      <Field label="Management IP" value={form.management_ip} onChange={(value) => updateForm("management_ip", value)} />
                    )}
                    <Field label="Management Network / VLAN" value={form.vlan} onChange={(value) => updateForm("vlan", value)} />
                    <Field label="Datastore / Cluster" value={form.applications} onChange={(value) => updateForm("applications", value)} placeholder="Datastore name, cluster, vSAN..." />
                  </div>
                )}

                {selectedOsFamily && !["Linux", "Windows", "VMware"].includes(selectedOsFamily) && (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field label="Build / Kernel" value={form.kernel_version} onChange={(value) => updateForm("kernel_version", value)} />
                    {form.system_type === "virtual" && (
                      <Field label="Management IP" value={form.management_ip} onChange={(value) => updateForm("management_ip", value)} />
                    )}
                  </div>
                )}
              </div>

              {form.system_type === "virtual" ? (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold">مشخصات ماشین مجازی</h3>
                    <p className="text-sm text-muted-foreground">برای VM می‌توانی هر سیستم ثبت‌شده قبلی را به عنوان میزبان/سیستم والد انتخاب کنی؛ لازم نیست حتماً ESXi باشد.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="VM Name" value={form.vm_name} onChange={(value) => updateForm("vm_name", value)} placeholder="Name inside hypervisor" />
                    <SelectField
                      label="Installed On / Parent System"
                      value={form.host_system_id}
                      onChange={(value) => updateForm("host_system_id", value)}
                      options={hostSystemOptions}
                      placeholder="Select any previously added system"
                    />
                    <SelectField
                      label="Fallback Host Server / Device"
                      value={form.host_device_id}
                      onChange={(value) => updateForm("host_device_id", value)}
                      options={hostServerOptions}
                      placeholder="Select physical device if host system is not registered"
                    />
                    <SelectField
                      label="Hypervisor"
                      value={form.hypervisor_type}
                      onChange={(value) => updateForm("hypervisor_type", value)}
                      options={withCurrentOption(hypervisorOptions, form.hypervisor_type)}
                      placeholder="Select hypervisor"
                    />
                    <Field label="VM ID" value={form.vm_id} onChange={(value) => updateForm("vm_id", value)} />
                    <NetworkAddressFields form={form} updateForm={updateForm} />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold">ارتباط با سرور فیزیکی</h3>
                    <p className="text-sm text-muted-foreground">برای سیستم عادی/فیزیکی، در صورت نیاز آن را به Device واقعی داخل رک وصل کن.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <SelectField
                      label="Linked Physical Device"
                      value={form.linked_device_id}
                      onChange={(value) => updateForm("linked_device_id", value)}
                      options={physicalDevices.map((device) => ({
                        value: String(device.id),
                        label: `${device.name}${device.hostname ? ` / ${device.hostname}` : ""}${device.device_type ? ` (${device.device_type})` : ""}${device.mgmt_ip ? ` - ${device.mgmt_ip}` : ""}`,
                      }))}
                      placeholder="Select network equipment"
                    />
                    <Field
                      label="Linked Physical Device / Manual"
                      value={form.linked_device_text}
                      onChange={(value) => updateForm("linked_device_text", value)}
                      placeholder="مثلاً Dell R740, Firewall HA, Storage Controller..."
                    />
                    <NetworkAddressFields form={form} updateForm={updateForm} />
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/25 p-4">
                <div className="mb-4">
                  <h3 className="font-semibold">منابع سیستم</h3>
                  <p className="text-sm text-muted-foreground">مشخصات CPU، RAM و Storage که برای مستندسازی و ظرفیت‌سنجی نیاز داریم.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  {form.system_type !== "virtual" && (
                    <SelectField label="CPU Model" value={form.cpu_model} onChange={(value) => updateForm("cpu_model", value)} options={withCurrentOption(cpuModelOptions, form.cpu_model)} placeholder="Select Intel / AMD CPU model" />
                  )}
                  <Field label={form.system_type === "virtual" ? "vCPU" : "CPU Cores"} type="number" value={form.cpu_cores} onChange={(value) => updateForm("cpu_cores", value)} />
                  <Field label="RAM GB" type="number" value={form.ram_gb} onChange={(value) => updateForm("ram_gb", value)} />
                  <Field label={form.system_type === "virtual" ? "Virtual Disk GB" : "Disk GB"} type="number" value={form.disk_gb} onChange={(value) => updateForm("disk_gb", value)} />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/25 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">پورت‌های باز سیستم</h3>
                    <p className="text-sm text-muted-foreground">بعد از مشخص کردن IP، سرویس‌ها و پورت‌هایی که روی این سیستم باز هستند را ثبت کن.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateForm("open_ports", [...form.open_ports, { port: "", name: "", protocol: "TCP", description: "" }])}>
                    Add Port
                  </Button>
                </div>
                <OpenPortsEditor ports={form.open_ports} onChange={(ports) => updateForm("open_ports", ports)} />
              </div>

              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={() => setShowAdvancedDetails((value) => !value)}>
                  {showAdvancedDetails ? "Hide Advanced Details" : "Show Advanced Details"}
                </Button>
              </div>

              {showAdvancedDetails && (
                <div className="grid gap-5 rounded-lg border bg-muted/20 p-4">
                  <div>
                    <h3 className="font-semibold">جزئیات تکمیلی</h3>
                    <p className="text-sm text-muted-foreground">این قسمت‌ها اختیاری هستند و از اول فرم را شلوغ نمی‌کنند.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <Field label="MAC Address" value={form.mac_address} onChange={(value) => updateForm("mac_address", value)} />
                    <Field label="VLAN" value={form.vlan} onChange={(value) => updateForm("vlan", value)} />
                    <Field label="Domain" value={form.domain} onChange={(value) => updateForm("domain", value)} />
                    <SelectField label="Environment" value={form.environment} onChange={(value) => updateForm("environment", value)} options={environmentOptions} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Owner" value={form.owner} onChange={(value) => updateForm("owner", value)} />
                    <Field label="Department" value={form.department} onChange={(value) => updateForm("department", value)} />
                    <Field label="Applications / Services" value={form.applications} onChange={(value) => updateForm("applications", value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <textarea
                      value={form.notes}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder="Backup, license, update policy, installed services..."
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveSystem}>{editingId ? "Save Changes" : "Create System"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}


function SystemViewDialog({
  system,
  systems,
  hostById,
  onClose,
}: {
  system: SystemAsset | null;
  systems: SystemAsset[];
  hostById: Map<number, HostDevice>;
  onClose: () => void;
}) {
  if (!system) return null;

  const isVirtual = system.system_type === "virtual";
  const hostSystem = system.host_system_id ? systems.find((item) => item.id === system.host_system_id) : null;
  const fallbackHost = system.host_device_id ? hostById.get(system.host_device_id) : null;
  const linkedDevice = system.linked_device_id ? hostById.get(system.linked_device_id) : null;
  const ports = parseOpenPorts(system.open_ports);
  const primaryAddress = system.dhcp_enabled ? "DHCP" : system.ip_address || "—";

  return (
    <Dialog open={Boolean(system)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <div className="border-b bg-gradient-to-br from-primary/15 via-background to-muted/40 p-6">
          <DialogHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isVirtual ? "default" : "secondary"}>{isVirtual ? "Virtual Machine" : "Physical System"}</Badge>
                  {statusBadgeStatic(system.status)}
                  {system.environment && <Badge variant="outline">{system.environment}</Badge>}
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold tracking-tight">{system.vm_name || system.name}</DialogTitle>
                  <DialogDescription className="mt-2 text-base">
                    {system.hostname || system.name} {system.os_name ? `• ${system.os_name}` : ""} {system.os_version ? `• ${system.os_version}` : ""}
                  </DialogDescription>
                </div>
              </div>
              <div className="rounded-2xl border bg-background/80 px-5 py-4 text-right shadow-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Primary IP</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{primaryAddress}</div>
                {isVirtual && <div className="text-xs text-muted-foreground">Mgmt: {system.management_ip || "—"}</div>}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="grid gap-4 p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <DetailCard title="System Identity">
              <InfoRow label="Name" value={system.name} />
              <InfoRow label="Hostname" value={system.hostname} />
              {isVirtual && <InfoRow label="VM Name" value={system.vm_name} />}
              <InfoRow label="Type" value={isVirtual ? "Virtual" : "Physical"} />
              <InfoRow label="Status" value={system.status} />
            </DetailCard>

            <DetailCard title="Operating System">
              <InfoRow label="Family" value={system.os_family} />
              <InfoRow label="OS" value={system.os_name} />
              <InfoRow label="Version / Edition" value={system.os_version} />
              <InfoRow label="Build / Kernel" value={system.kernel_version} />
              <InfoRow label="Architecture" value={system.architecture} />
            </DetailCard>

            <DetailCard title="Resources">
              {!isVirtual && <InfoRow label="CPU Model" value={system.cpu_model} />}
              <InfoRow label={isVirtual ? "vCPU" : "CPU Cores"} value={system.cpu_cores ? `${system.cpu_cores}` : null} />
              <InfoRow label="RAM" value={system.ram_gb ? `${system.ram_gb} GB` : null} />
              <InfoRow label={isVirtual ? "Virtual Disk" : "Disk"} value={system.disk_gb ? `${system.disk_gb} GB` : null} />
            </DetailCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DetailCard title={isVirtual ? "Virtual Placement" : "Physical Link"}>
              {isVirtual ? (
                <>
                  <InfoRow label="Installed On / Parent System" value={hostSystem ? `${hostSystem.name}${hostSystem.hostname ? ` / ${hostSystem.hostname}` : ""}` : null} />
                  <InfoRow label="Fallback Host Device" value={fallbackHost ? `${fallbackHost.name}${fallbackHost.hostname ? ` / ${fallbackHost.hostname}` : ""}` : null} />
                  <InfoRow label="Hypervisor" value={system.hypervisor_type} />
                  <InfoRow label="VM ID" value={system.vm_id} />
                </>
              ) : (
                <>
                  <InfoRow label="Linked Device" value={linkedDevice ? `${linkedDevice.name}${linkedDevice.hostname ? ` / ${linkedDevice.hostname}` : ""}` : null} />
                  <InfoRow label="Manual Device" value={system.linked_device_text} />
                </>
              )}
            </DetailCard>

            <DetailCard title="Network">
              <InfoRow label="IP Assignment" value={system.dhcp_enabled ? "DHCP" : "Static"} />
              <InfoRow label="Primary IP" value={system.ip_address} />
              {isVirtual && <InfoRow label="Management IP" value={system.management_ip} />}
              <InfoRow label="MAC Address" value={system.mac_address} />
              <InfoRow label="VLAN" value={system.vlan} />
              <InfoRow label="Domain / Workgroup" value={system.domain} />
            </DetailCard>
          </div>

          <DetailCard title="Open Ports">
            {ports.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ports.map((port, index) => (
                  <div key={`${port.port}-${index}`} className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{port.name || "Unnamed Port"}</div>
                        <div className="text-sm text-muted-foreground">{port.description || "No description"}</div>
                      </div>
                      <Badge variant="outline" className="tabular-nums">{port.port || "—"}/{port.protocol || "TCP"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">پورتی برای این سیستم ثبت نشده است.</div>
            )}
          </DetailCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <DetailCard title="Ownership">
              <InfoRow label="Owner" value={system.owner} />
              <InfoRow label="Department" value={system.department} />
              <InfoRow label="Environment" value={system.environment} />
            </DetailCard>

            <DetailCard title="Applications & Notes">
              <InfoRow label="Applications / Services" value={system.applications} />
              <InfoRow label="Notes" value={system.notes} />
            </DetailCard>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b pb-2">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[145px_1fr] gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words font-medium">{value || "—"}</div>
    </div>
  );
}

function statusBadgeStatic(status?: string | null) {
  const value = status || "unknown";
  const label = statusOptions.find((item) => item.value === value)?.label || value;
  return <Badge variant={value === "running" ? "default" : "secondary"}>{label}</Badge>;
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </div>
      <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
    </Card>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function NetworkAddressFields({
  form,
  updateForm,
}: {
  form: SystemForm;
  updateForm: (field: keyof SystemForm, value: string | boolean | OpenPort[]) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>IP Assignment</Label>
        <CheckboxField label="DHCP" checked={form.dhcp_enabled} onChange={(checked) => updateForm("dhcp_enabled", checked)} />
      </div>
      {!form.dhcp_enabled && (
        <Field label="Primary IP" value={form.ip_address} onChange={(value) => updateForm("ip_address", value)} />
      )}
    </>
  );
}

function OpenPortsEditor({ ports, onChange }: { ports: OpenPort[]; onChange: (ports: OpenPort[]) => void }) {
  const updatePort = (index: number, field: keyof OpenPort, value: string) => {
    onChange(ports.map((port, itemIndex) => itemIndex === index ? { ...port, [field]: value } : port));
  };
  const removePort = (index: number) => {
    onChange(ports.filter((_, itemIndex) => itemIndex !== index));
  };

  if (!ports.length) {
    return <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">هنوز پورتی ثبت نشده است.</div>;
  }

  return (
    <div className="space-y-3">
      {ports.map((port, index) => (
        <div key={index} className="grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-[140px_1fr_140px_1fr_auto]">
          <Field label="Port" value={port.port} onChange={(value) => updatePort(index, "port", value)} placeholder="80 / 443 / 3389" />
          <Field label="Port Name" value={port.name} onChange={(value) => updatePort(index, "name", value)} placeholder="HTTP / RDP / SSH" />
          <SelectField label="Protocol" value={port.protocol} onChange={(value) => updatePort(index, "protocol", value)} options={portProtocolOptions} />
          <Field label="Description" value={port.description} onChange={(value) => updatePort(index, "description", value)} placeholder="Optional" />
          <div className="flex items-end">
            <Button type="button" variant="destructive" size="sm" onClick={() => removePort(index)}>Remove</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? " *" : ""}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </div>
  );
}
