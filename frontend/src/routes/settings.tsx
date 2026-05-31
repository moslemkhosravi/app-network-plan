import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, type FormEvent } from "react";
import {
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Phone,
  MessageCircle,
  UserCircle,
  SlidersHorizontal,
  Server,
  Cable,
  Pencil,
  Trash2,
  X,
  LayoutTemplate,
  Upload,
  RefreshCcw,
  HardDrive,
  Network as NetworkIcon,
  Usb,
  PlugZap,
  Fan,
  Cpu,
  Tags,
  Router,
  Boxes,
  Camera,
  Building2,
  MapPin,
  DoorOpen,
  Globe2,
  Smartphone,
  Wifi,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Irannetwork" }],
  }),
  component: SettingsPage,
});

type User = {
  id: number;
  username: string;
  phone_number: string;
  bale_chat_id?: string | null;
  is_active: boolean;
  role?: "admin" | "manager" | "editor" | "viewer" | string;
  is_superuser?: boolean;
  permissions_json?: string | null;
};

type AccessScopeKey = "clients" | "sites" | "rooms" | "devices" | "racks";
type PermissionListScope = { view: number[]; edit: number[] };
type PermissionsState = Record<AccessScopeKey, PermissionListScope> & {
  templates: { view: boolean; edit: boolean };
  systems: { view: boolean; edit: boolean };
  settings: { view: boolean; edit: boolean };
};

type AccessReferenceItem = { id: number; name: string; subtitle?: string | null };
type AccessDeviceNode = { id: number; name: string; hostname?: string | null; device_type?: string | null; site_id?: number | null; room_id?: number | null; rack_id?: number | null };
type AccessRoomNode = { id: number; name: string; subtitle?: string | null; floor_id?: number | null; devices?: AccessDeviceNode[] };
type AccessRackNode = { id: number; name: string; subtitle?: string | null; devices?: AccessDeviceNode[] };
type AccessSiteNode = { id: number; name: string; subtitle?: string | null; rooms?: AccessRoomNode[]; racks?: AccessRackNode[]; devices?: AccessDeviceNode[] };
type AccessClientNode = { id: number; name: string; subtitle?: string | null; sites?: AccessSiteNode[] };
type AccessTree = { clients: AccessClientNode[]; unassigned_sites?: AccessSiteNode[] };

type ProfileForm = {
  username: string;
  phone_number: string;
  bale_chat_id: string;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};


type GeneralSettings = {
  deployment_mode: "local" | "lan" | "staging" | "production" | string;
  primary_domain: string;
  app_subdomain: string;
  api_subdomain: string;
  static_public_ip: string;
  frontend_base_url: string;
  backend_base_url: string;
  mobile_api_base_url: string;
  mobile_app_enabled: boolean;
  mobile_force_update: boolean;
  mobile_min_version: string;
  mobile_latest_version: string;
  android_download_url: string;
  ios_download_url: string;
  allowed_cors_origins: string;
  infrastructure_notes: string;
  updated_at?: string | null;
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  deployment_mode: "local",
  primary_domain: "",
  app_subdomain: "",
  api_subdomain: "",
  static_public_ip: "",
  frontend_base_url: "",
  backend_base_url: "",
  mobile_api_base_url: "",
  mobile_app_enabled: false,
  mobile_force_update: false,
  mobile_min_version: "",
  mobile_latest_version: "",
  android_download_url: "",
  ios_download_url: "",
  allowed_cors_origins: "",
  infrastructure_notes: "",
  updated_at: null,
};

type UserForm = {
  username: string;
  password: string;
  phone_number: string;
  bale_chat_id: string;
};

type DeviceCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

type PortTemplate = {
  id: number;
  name: string;
  port_type: string;
  category?: string;
  role?: string | null;
  poe?: boolean;
  data_port?: boolean;
  uplink?: boolean;
  console?: boolean;
  power?: boolean;
  component_kind?: string | null;
  description?: string | null;
};

type DeviceTemplate = {
  id: number;
  manufacturer: string;
  model_name: string;
  category: string;
  form_factor: string;
  poe?: boolean;
  rack_mountable?: boolean;
  field_capable?: boolean;
  has_front_faceplate?: boolean;
  has_rear_faceplate?: boolean;
  front_stencil_url?: string | null;
  back_stencil_url?: string | null;
  port_templates?: PortTemplate[];
};

type PortGroup = {
  count: number;
  prefix: string;
  port_type: string;
  category: string;
  side?: "front" | "rear" | "internal";
  role?: string;
  component_kind?: string;
  poe?: boolean;
  data_port?: boolean;
  uplink?: boolean;
  console?: boolean;
  power?: boolean;
  description?: string;
};

type TemplateMappedPart = {
  id: string;
  name: string;
  side: "front" | "rear";
  port_type: string;
  category: string;
  role?: string;
  component_kind?: string;
  poe?: boolean;
  data_port?: boolean;
  uplink?: boolean;
  console?: boolean;
  power?: boolean;
  description?: string;
};

// ============================================================
// PDU BUILDER TYPES
// این بخش مخصوص ساخت PDU افقی/عمودی است.
// خروجی‌ها و ورودی‌های برق از روی count ساخته می‌شوند.
// ============================================================
type PduOrientation = "horizontal" | "vertical";

type PduBuilderState = {
  enabled: boolean;
  orientation: PduOrientation;
  outlet_count: number;
  input_count: number;
  outlet_prefix: string;
  input_prefix: string;
  outlet_type: string;
  input_type: string;
  outlet_category: string;
  input_category: string;
  control_count: number;
  control_prefix: string;
  control_type: string;
  control_category: string;
  voltage: string;
  notes: string;
};

// ============================================================
// SERVER HARDWARE BUILDER TYPES
// این بخش مخصوص قطعات سرور است.
// هر آیتم می‌تواند CPU/RAM/Power/NIC/Storage/Fan یا آیتم دلخواه باشد.
// ============================================================
type ServerHardwareSide = "FRONT" | "REAR" | "INTERNAL";

type ServerHardwareIcon =
  | "disk"
  | "network"
  | "usb"
  | "power"
  | "fan"
  | "cpu"
  | "memory"
  | "gpu"
  | "module";

type ServerHardwareItem = {
  id: string;
  enabled: boolean;
  label: string;
  description: string;
  icon: ServerHardwareIcon;
  count: number;
  prefix: string;
  port_type: string;
  side: ServerHardwareSide;
  category: string;
  spec: string;
};

// ============================================================
// PORT / COMPONENT TYPE OPTIONS
// فقط rj45 و sfp برای اتصال کابل شبکه استفاده می‌شوند.
// بقیه برای دیتای کامل دستگاه و قطعات سخت‌افزاری هستند.
// ============================================================
const PORT_TYPE_OPTIONS = [
  { value: "rj45", label: "RJ45 / Network" },
  { value: "sfp", label: "SFP / SFP+" },
  { value: "console", label: "Console / Serial" },
  { value: "power", label: "Power / PSU" },
  { value: "power-outlet", label: "Power Outlet / PDU Output" },
  { value: "power-input", label: "Power Input / PDU Feed" },
  { value: "breaker", label: "Breaker / Main Switch" },
  { value: "usb", label: "USB" },
  { value: "vga", label: "VGA" },
  { value: "hdmi", label: "HDMI" },
  { value: "storage", label: "Storage / Disk" },
  { value: "pcie", label: "PCIe Slot" },
  { value: "fan", label: "Fan / Cooling" },
  { value: "cpu", label: "CPU Socket" },
  { value: "memory", label: "RAM / Memory Slot" },
  { value: "gpu", label: "GPU" },
  { value: "raid", label: "RAID Controller" },
  { value: "hba", label: "HBA / SAS / FC" },
  { value: "module", label: "Module / Other Board" },
  { value: "accessory", label: "Accessory / Body" },
  { value: "rj11", label: "RJ11" },
  { value: "other", label: "Other" },
];

const PORT_ROLE_OPTIONS = [
  { value: "access", label: "Access / Endpoint" },
  { value: "uplink", label: "Uplink / Trunk" },
  { value: "management", label: "Management" },
  { value: "console", label: "Console" },
  { value: "power", label: "Power / PSU" },
  { value: "storage", label: "Storage / Disk" },
  { value: "system", label: "System Component" },
  { value: "other", label: "Other" },
];

const COMPONENT_KIND_OPTIONS = [
  { value: "network-port", label: "Network Port" },
  { value: "uplink-port", label: "Uplink Port" },
  { value: "console-port", label: "Console Port" },
  { value: "management-port", label: "Management Port" },
  { value: "power-input", label: "Power Input" },
  { value: "power-output", label: "Power Output" },
  { value: "psu", label: "PSU / Power Supply" },
  { value: "fan", label: "Fan / Cooling" },
  { value: "drive-bay", label: "Drive Bay" },
  { value: "usb", label: "USB" },
  { value: "video", label: "VGA / HDMI" },
  { value: "module", label: "Module / Slot" },
  { value: "indicator", label: "LED / Indicator" },
  { value: "other", label: "Other" },
];

const PORT_SIDE_OPTIONS = [
  { value: "front", label: "Front / جلوی دستگاه" },
  { value: "rear", label: "Rear / پشت دستگاه" },
  { value: "internal", label: "Internal / داخل دستگاه" },
] as const;

const PORT_CATEGORY_OPTIONS = [
  "Network Ports",
  "Access Ports",
  "Uplink Ports",
  "Management",
  "Power / PSU",
  "Power / Cooling",
  "Storage",
  "USB / Console",
  "Video",
  "Rack Accessory",
  "Front RJ45 Ports",
  "Rear IDC Ports",
  "PDU / Power Outlets",
  "PDU / Power Inputs",
  "PDU / Control",
  "Custom / Other",
];

const SIDE_PREFIX_LABEL: Record<"front" | "rear" | "internal", string> = {
  front: "FRONT",
  rear: "REAR",
  internal: "INTERNAL",
};

const inferSideFromCategory = (category = ""): "front" | "rear" | "internal" => {
  const value = category.trim().toLowerCase();
  if (value.startsWith("rear /") || value.includes(" rear ") || value.includes("rear ") || value.includes("back ")) return "rear";
  if (value.startsWith("internal /") || value.includes(" internal ") || value.includes("cpu") || value.includes("memory")) return "internal";
  return "front";
};

const stripSidePrefix = (category = "") =>
  category
    .replace(/^(FRONT|REAR|INTERNAL)\s*\/\s*/i, "")
    .replace(/^(Front|Rear|Internal)\s*\/\s*/i, "")
    .trim() || "General";

const resolveGroupSide = (group: Pick<PortGroup, "side" | "category">): "front" | "rear" | "internal" =>
  group.side || inferSideFromCategory(group.category || "");

const resolveGroupCategory = (group: Pick<PortGroup, "side" | "category">) => {
  const side = resolveGroupSide(group);
  return `${SIDE_PREFIX_LABEL[side]} / ${stripSidePrefix(group.category || "General")}`;
};

const getTemplateStats = (template: DeviceTemplate) => {
  const ports = template.port_templates || [];
  return {
    total: ports.length,
    data: ports.filter((port) => port.data_port || isDataPortType(port.port_type, port.category || "")).length,
    power: ports.filter((port) => port.power || isPowerPortType(port.port_type, port.category || "")).length,
    console: ports.filter((port) => port.console || port.port_type === "console").length,
    front: ports.filter((port) => inferSideFromCategory(port.category || "") === "front").length,
    rear: ports.filter((port) => inferSideFromCategory(port.category || "") === "rear").length,
    internal: ports.filter((port) => inferSideFromCategory(port.category || "") === "internal").length,
  };
};

const toTitleCase = (value = "") =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getReadablePortType = (portType = "") => {
  const value = portType.toLowerCase().trim();
  if (!value) return "Item";
  if (value === "rj45") return "Ethernet";
  if (value === "sfp") return "SFP";
  if (value === "sfp+") return "SFP+";
  if (value === "qsfp") return "QSFP";
  if (value === "console") return "Console";
  if (value === "usb") return "USB";
  if (value === "power" || value === "power-input") return "Power Input";
  if (value === "power-outlet") return "Power Outlet";
  if (value === "fan") return "Fan";
  if (value === "storage") return "Storage";
  if (value === "hdmi") return "HDMI";
  if (value === "vga") return "VGA";
  return toTitleCase(portType);
};

const deriveSummaryPrefixFromPortName = (name = "") => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Item";

  const withoutTrailingNumber = trimmed
    .replace(/\s*[#-]?\s*\d+$/i, "")
    .replace(/\s+\d+\s*$/i, "")
    .replace(/\/\d+$/i, "")
    .replace(/\s+port$/i, " Port")
    .trim();

  return withoutTrailingNumber || trimmed;
};

const getTemplatePortSummaries = (template: DeviceTemplate) => {
  const groups = new Map<
    string,
    {
      label: string;
      portType: string;
      side: "front" | "rear" | "internal";
      count: number;
      poe: number;
      uplink: number;
      console: number;
      power: number;
    }
  >();

  (template.port_templates || []).forEach((port) => {
    const category = stripSidePrefix(port.category || "");
    const side = inferSideFromCategory(port.category || "");
    const readableType = getReadablePortType(port.port_type);
    const prefix = deriveSummaryPrefixFromPortName(port.name || readableType);
    const label = prefix && prefix !== "Item" ? prefix : category && category !== "General" ? category : readableType;
    const key = [
      side,
      label.toLowerCase(),
      category.toLowerCase(),
      (port.port_type || "item").toLowerCase(),
      port.role || "",
      port.component_kind || "",
      Boolean(port.poe),
      Boolean(port.uplink),
      Boolean(port.console),
      Boolean(port.power),
    ].join("::");

    const current = groups.get(key) || {
      label,
      portType: category && category !== label ? `${readableType} • ${category}` : readableType,
      side,
      count: 0,
      poe: 0,
      uplink: 0,
      console: 0,
      power: 0,
    };

    current.count += 1;
    if (port.poe) current.poe += 1;
    if (port.uplink) current.uplink += 1;
    if (port.console || port.port_type === "console") current.console += 1;
    if (port.power || isPowerPortType(port.port_type, port.category || "")) current.power += 1;
    groups.set(key, current);
  });

  return Array.from(groups.values()).sort((a, b) => {
    const order = { front: 0, rear: 1, internal: 2 };
    if (order[a.side] !== order[b.side]) return order[a.side] - order[b.side];
    return a.label.localeCompare(b.label);
  });
};

const inferComponentKind = (portType: string, category = "") => {
  const value = `${portType} ${category}`.toLowerCase();
  if (value.includes("sfp") || value.includes("uplink")) return "uplink-port";
  if (value.includes("console")) return "console-port";
  if (value.includes("power-outlet")) return "power-output";
  if (value.includes("power") || value.includes("psu")) return "power-input";
  if (value.includes("fan")) return "fan";
  if (value.includes("storage") || value.includes("drive")) return "drive-bay";
  if (value.includes("usb")) return "usb";
  if (value.includes("vga") || value.includes("hdmi") || value.includes("video")) return "video";
  if (value.includes("rj45") || value.includes("network") || value.includes("ether")) return "network-port";
  return "other";
};

const inferPortRole = (portType: string, category = "") => {
  const value = `${portType} ${category}`.toLowerCase();
  if (value.includes("uplink") || value.includes("sfp")) return "uplink";
  if (value.includes("console")) return "console";
  if (value.includes("power") || value.includes("psu")) return "power";
  if (value.includes("storage") || value.includes("drive")) return "storage";
  if (value.includes("mgmt") || value.includes("management") || value.includes("ilo")) return "management";
  if (value.includes("rj45") || value.includes("network") || value.includes("ether")) return "access";
  return "other";
};

const isDataPortType = (portType: string, category = "") => {
  const value = `${portType} ${category}`.toLowerCase();
  return value.includes("rj45") || value.includes("sfp") || value.includes("network") || value.includes("ether") || value.includes("uplink");
};

const isPowerPortType = (portType: string, category = "") => {
  const value = `${portType} ${category}`.toLowerCase();
  return value.includes("power") || value.includes("psu") || value.includes("pdu") || value.includes("breaker");
};


const DEFAULT_PORT_GROUPS: PortGroup[] = [
  {
    count: 24,
    prefix: "Port",
    port_type: "rj45",
    category: "Network Ports",
    side: "front",
    role: "access",
    component_kind: "network-port",
    data_port: true,
    poe: false,
    uplink: false,
    console: false,
    power: false,
    description: "Default RJ45 access ports",
  },
];

const DEFAULT_PDU_BUILDER: PduBuilderState = {
  enabled: true,
  orientation: "horizontal",
  outlet_count: 8,
  input_count: 1,
  outlet_prefix: "PDU Outlet",
  input_prefix: "Power Input",
  outlet_type: "power-outlet",
  input_type: "power-input",
  outlet_category: "PDU / Power Outlets",
  input_category: "PDU / Power Inputs",
  control_count: 1,
  control_prefix: "Main Power Switch",
  control_type: "breaker",
  control_category: "PDU / Control",
  voltage: "230V",
  notes: "Rack PDU Dynamic Template",
};

const clonePduBuilder = (): PduBuilderState => ({ ...DEFAULT_PDU_BUILDER });

// ============================================================
// SERVER HARDWARE BUILDER DEFAULTS
// این قسمت فقط preset اولیه سرور را می‌سازد.
// هر ردیف در UI قابل ویرایش، کم/زیاد، حذف یا اضافه است.
// ============================================================
const DEFAULT_SERVER_HARDWARE_ITEMS: ServerHardwareItem[] = [
  {
    id: "cpu_socket",
    enabled: true,
    label: "CPU Socket",
    description: "سوکت‌های CPU داخل سرور",
    icon: "cpu",
    count: 2,
    prefix: "CPU Socket",
    port_type: "cpu",
    side: "INTERNAL",
    category: "Compute",
    spec: "Intel Xeon / AMD EPYC",
  },
  {
    id: "ram_slot",
    enabled: true,
    label: "RAM Slots",
    description: "اسلات‌های RAM / Memory داخل سرور",
    icon: "memory",
    count: 24,
    prefix: "RAM Slot",
    port_type: "memory",
    side: "INTERNAL",
    category: "Memory",
    spec: "DDR4 / DDR5",
  },
  {
    id: "front_disk_bays",
    enabled: true,
    label: "Front Disk Bays",
    description: "Bayهای جلوی سرور برای HDD/SSD",
    icon: "disk",
    count: 8,
    prefix: "Disk Bay",
    port_type: "storage",
    side: "FRONT",
    category: "Storage",
    spec: "SFF/LFF/SAS/SATA/NVMe",
  },
  {
    id: "rear_ilo",
    enabled: true,
    label: "Dedicated iLO / Management",
    description: "پورت مدیریت اختصاصی پشت سرور",
    icon: "network",
    count: 1,
    prefix: "Dedicated iLO / Management Port",
    port_type: "rj45",
    side: "REAR",
    category: "Management",
    spec: "",
  },
  {
    id: "rear_lom_rj45",
    enabled: true,
    label: "Rear LOM RJ45",
    description: "پورت‌های شبکه RJ45 پشت سرور",
    icon: "network",
    count: 4,
    prefix: "Rear LOM RJ45 Port",
    port_type: "rj45",
    side: "REAR",
    category: "Network",
    spec: "1G/10G",
  },
  {
    id: "rear_lom_sfp",
    enabled: true,
    label: "Rear LOM SFP/SFP+",
    description: "پورت‌های SFP/SFP+ پشت سرور",
    icon: "network",
    count: 2,
    prefix: "Rear LOM SFP Port",
    port_type: "sfp",
    side: "REAR",
    category: "Network",
    spec: "10G/25G",
  },
  {
    id: "pcie_rj45_nic",
    enabled: false,
    label: "PCIe RJ45 NIC",
    description: "کارت شبکه RJ45 اضافه روی PCIe",
    icon: "network",
    count: 4,
    prefix: "PCIe RJ45 NIC Port",
    port_type: "rj45",
    side: "REAR",
    category: "PCIe Network",
    spec: "1G/10G",
  },
  {
    id: "pcie_sfp_nic",
    enabled: false,
    label: "PCIe SFP NIC",
    description: "کارت شبکه SFP/SFP+ اضافه روی PCIe",
    icon: "network",
    count: 2,
    prefix: "PCIe SFP NIC Port",
    port_type: "sfp",
    side: "REAR",
    category: "PCIe Network",
    spec: "10G/25G/40G",
  },
  {
    id: "front_usb",
    enabled: true,
    label: "Front USB",
    description: "USBهای جلوی سرور",
    icon: "usb",
    count: 2,
    prefix: "Front USB Port",
    port_type: "usb",
    side: "FRONT",
    category: "USB / Console",
    spec: "USB 3.0",
  },
  {
    id: "rear_usb",
    enabled: true,
    label: "Rear USB",
    description: "USBهای پشت سرور",
    icon: "usb",
    count: 2,
    prefix: "Rear USB Port",
    port_type: "usb",
    side: "REAR",
    category: "USB / Console",
    spec: "USB 3.0",
  },
  {
    id: "rear_vga",
    enabled: true,
    label: "Rear VGA",
    description: "پورت VGA پشت سرور",
    icon: "module",
    count: 1,
    prefix: "Rear VGA Port",
    port_type: "vga",
    side: "REAR",
    category: "Video",
    spec: "",
  },
  {
    id: "serial_console",
    enabled: false,
    label: "Serial / Console",
    description: "پورت سریال یا کنسول سرور",
    icon: "module",
    count: 1,
    prefix: "Serial / Console Port",
    port_type: "console",
    side: "REAR",
    category: "USB / Console",
    spec: "",
  },
  {
    id: "pcie_slots",
    enabled: true,
    label: "PCIe Slots",
    description: "اسلات‌های توسعه PCIe",
    icon: "module",
    count: 8,
    prefix: "PCIe Slot",
    port_type: "pcie",
    side: "REAR",
    category: "Expansion",
    spec: "PCIe Gen4/Gen5",
  },
  {
    id: "psu",
    enabled: true,
    label: "Power Supply / PSU",
    description: "ماژول‌های پاور سرور",
    icon: "power",
    count: 2,
    prefix: "Power Supply",
    port_type: "power",
    side: "REAR",
    category: "Power / Cooling",
    spec: "800W / 1200W",
  },
  {
    id: "power_input",
    enabled: true,
    label: "Power Inputs",
    description: "ورودی کابل برق",
    icon: "power",
    count: 2,
    prefix: "Power Input",
    port_type: "power",
    side: "REAR",
    category: "Power / Cooling",
    spec: "C13/C14/C19",
  },
  {
    id: "fan_modules",
    enabled: true,
    label: "Fan Modules",
    description: "فن‌های داخلی/پشتی سرور",
    icon: "fan",
    count: 6,
    prefix: "Fan Module",
    port_type: "fan",
    side: "INTERNAL",
    category: "Power / Cooling",
    spec: "Hot Plug Fan",
  },
  {
    id: "raid_controller",
    enabled: false,
    label: "RAID Controller",
    description: "کارت RAID داخلی",
    icon: "module",
    count: 1,
    prefix: "RAID Controller",
    port_type: "raid",
    side: "INTERNAL",
    category: "Storage Controller",
    spec: "Smart Array / PERC",
  },
  {
    id: "hba_sas",
    enabled: false,
    label: "HBA / SAS Controller",
    description: "کنترلر HBA/SAS/FC",
    icon: "module",
    count: 1,
    prefix: "HBA / SAS Controller",
    port_type: "hba",
    side: "INTERNAL",
    category: "Storage Controller",
    spec: "SAS / FC / HBA",
  },
  {
    id: "gpu_slots",
    enabled: false,
    label: "GPU",
    description: "GPU یا کارت پردازشی",
    icon: "gpu",
    count: 1,
    prefix: "GPU",
    port_type: "gpu",
    side: "INTERNAL",
    category: "Compute",
    spec: "NVIDIA / AMD",
  },
  {
    id: "m2_slots",
    enabled: false,
    label: "M.2 Slots",
    description: "اسلات‌های M.2 داخلی",
    icon: "disk",
    count: 2,
    prefix: "M.2 Slot",
    port_type: "storage",
    side: "INTERNAL",
    category: "Storage",
    spec: "NVMe",
  },
  {
    id: "tpm_module",
    enabled: false,
    label: "TPM Module",
    description: "ماژول TPM",
    icon: "module",
    count: 1,
    prefix: "TPM Module",
    port_type: "module",
    side: "INTERNAL",
    category: "Security Module",
    spec: "TPM 2.0",
  },
];

const cloneServerHardwareItems = () =>
  DEFAULT_SERVER_HARDWARE_ITEMS.map((item) => ({ ...item }));

const PRESET_GROUPS: Record<string, PortGroup[]> = {
  switch: DEFAULT_PORT_GROUPS,
  network: DEFAULT_PORT_GROUPS,
  router: [
    { count: 7, prefix: "Ether", port_type: "rj45", category: "Ethernet", side: "front" },
    { count: 1, prefix: "SFP+ Port", port_type: "sfp", category: "SFP", side: "front" },
    { count: 1, prefix: "Combo Port", port_type: "rj45", category: "Ethernet", side: "front" },
    { count: 1, prefix: "USB Port", port_type: "usb", category: "USB / Console", side: "front" },
    { count: 1, prefix: "Serial Console", port_type: "console", category: "USB / Console", side: "front" },
    { count: 2, prefix: "Power Input", port_type: "power", category: "Power / Cooling", side: "rear" },
    { count: 2, prefix: "Fan", port_type: "fan", category: "Power / Cooling", side: "rear" },
    { count: 1, prefix: "SD Card Slot", port_type: "storage", category: "Storage", side: "front" },
  ],
  "patch-panel-24": [
    { count: 24, prefix: "PatchPanel0/{n}", port_type: "rj45", category: "Front RJ45 Ports", side: "front" },
    { count: 24, prefix: "PatchPanelRear0/{n}", port_type: "rj45", category: "Rear IDC Ports", side: "rear" },
  ],
  "patch-panel-48": [
    { count: 48, prefix: "PatchPanel0/{n}", port_type: "rj45", category: "Front RJ45 Ports", side: "front" },
    { count: 48, prefix: "PatchPanelRear0/{n}", port_type: "rj45", category: "Rear IDC Ports", side: "rear" },
  ],
  nvr: [
    { count: 2, prefix: "LAN Port", port_type: "rj45", category: "Network", side: "rear" },
    { count: 1, prefix: "HDMI Port", port_type: "hdmi", category: "Video", side: "rear" },
    { count: 1, prefix: "VGA Port", port_type: "vga", category: "Video", side: "rear" },
    { count: 1, prefix: "Front USB Port", port_type: "usb", category: "USB", side: "front" },
    { count: 2, prefix: "Drive Bay", port_type: "storage", category: "Storage", side: "front" },
    { count: 3, prefix: "Status LED", port_type: "accessory", category: "Indicators", side: "front" },
    { count: 1, prefix: "Power Button", port_type: "power", category: "Controls", side: "front" },
  ],
  "cable-guide": [
    { count: 1, prefix: "CableGuide0/1", port_type: "accessory", category: "Rack Accessory", side: "front" },
  ],
  "pdu-horizontal": [
    { count: 8, prefix: "PDU Outlet", port_type: "power-outlet", category: "PDU / Power Outlets", side: "front" },
    { count: 1, prefix: "Power Input", port_type: "power-input", category: "PDU / Power Inputs", side: "rear" },
    { count: 1, prefix: "Main Power Switch", port_type: "breaker", category: "PDU / Control", side: "front" },
  ],
  "pdu-vertical": [
    { count: 8, prefix: "Vertical PDU Outlet", port_type: "power-outlet", category: "PDU / Power Outlets", side: "front" },
    { count: 1, prefix: "Power Input", port_type: "power-input", category: "PDU / Power Inputs", side: "rear" },
    { count: 1, prefix: "Main Power Switch", port_type: "breaker", category: "PDU / Control", side: "front" },
  ],
  camera: [
    { count: 1, prefix: "LAN Port", port_type: "rj45", category: "Network", side: "rear" },
    { count: 1, prefix: "Power Input", port_type: "power", category: "Power" },
  ],
};

const PRESET_BUTTONS = [
  { key: "network", label: "Switch / 24 RJ45", manufacturer: "Cisco", model: "24-Port Switch", category: "switch", form: "1U" },
  { key: "router", label: "MikroTik Router", manufacturer: "MikroTik", model: "CCR1009", category: "router", form: "1U" },
  { key: "patch-panel-24", label: "Patch Panel 24", manufacturer: "Irannetwork", model: "24 Port Patch Panel", category: "patch-panel", form: "3U" },
  { key: "patch-panel-48", label: "Patch Panel 48", manufacturer: "Irannetwork", model: "48 Port Patch Panel", category: "patch-panel", form: "3U" },
  { key: "nvr", label: "NVR", manufacturer: "Irannetwork", model: "NVR", category: "nvr", form: "1U" },
  { key: "cable-guide", label: "Cable Guide", manufacturer: "Irannetwork", model: "Cable Guide", category: "cable-guide", form: "3U" },
  { key: "pdu-horizontal", label: "Rack PDU Horizontal", manufacturer: "Irannetwork", model: "Rack PDU 8-Port", category: "pdu", form: "1U" },
  { key: "pdu-vertical", label: "Rack PDU Vertical", manufacturer: "Irannetwork", model: "Vertical PDU 8-Port", category: "pdu", form: "0U" },
  { key: "camera", label: "Camera", manufacturer: "Irannetwork", model: "IP Camera", category: "camera", form: "1U" },
];


const createDefaultPermissions = (): PermissionsState => ({
  clients: { view: [], edit: [] },
  sites: { view: [], edit: [] },
  rooms: { view: [], edit: [] },
  devices: { view: [], edit: [] },
  racks: { view: [], edit: [] },
  templates: { view: true, edit: false },
  systems: { view: true, edit: false },
  settings: { view: false, edit: false },
});

const parsePermissions = (raw?: string | null): PermissionsState => {
  const defaults = createDefaultPermissions();
  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw);
    return {
      clients: { view: Array.isArray(parsed?.clients?.view) ? parsed.clients.view : [], edit: Array.isArray(parsed?.clients?.edit) ? parsed.clients.edit : [] },
      sites: { view: Array.isArray(parsed?.sites?.view) ? parsed.sites.view : [], edit: Array.isArray(parsed?.sites?.edit) ? parsed.sites.edit : [] },
      rooms: { view: Array.isArray(parsed?.rooms?.view) ? parsed.rooms.view : [], edit: Array.isArray(parsed?.rooms?.edit) ? parsed.rooms.edit : [] },
      devices: { view: Array.isArray(parsed?.devices?.view) ? parsed.devices.view : [], edit: Array.isArray(parsed?.devices?.edit) ? parsed.devices.edit : [] },
      racks: { view: Array.isArray(parsed?.racks?.view) ? parsed.racks.view : [], edit: Array.isArray(parsed?.racks?.edit) ? parsed.racks.edit : [] },
      templates: { view: Boolean(parsed?.templates?.view ?? defaults.templates.view), edit: Boolean(parsed?.templates?.edit ?? defaults.templates.edit) },
      systems: { view: Boolean(parsed?.systems?.view ?? defaults.systems.view), edit: Boolean(parsed?.systems?.edit ?? defaults.systems.edit) },
      settings: { view: Boolean(parsed?.settings?.view ?? defaults.settings.view), edit: Boolean(parsed?.settings?.edit ?? defaults.settings.edit) },
    };
  } catch {
    return defaults;
  }
};


const canManageSettings = (user?: User | null) => {
  if (!user) return false;
  if (user.is_superuser) return true;
  const role = String(user.role || "").toLowerCase();
  if (role === "admin" || role === "manager") return true;
  const permissions = parsePermissions(user.permissions_json);
  return Boolean(permissions.settings.view || permissions.settings.edit);
};

const compactAccessLabel = (permissions?: string | null) => {
  const parsed = parsePermissions(permissions);
  const total = [parsed.clients, parsed.sites, parsed.rooms, parsed.devices, parsed.racks].reduce(
    (sum, scope) => sum + new Set([...scope.view, ...scope.edit]).size,
    0,
  );
  return total ? `${total} scoped item${total === 1 ? "" : "s"}` : "No scoped access";
};

const accessScopeLabel: Record<AccessScopeKey, string> = {
  clients: "Company",
  sites: "Site",
  rooms: "Room",
  racks: "Rack",
  devices: "Device",
};

const flattenAccessTree = (tree: AccessTree): Record<AccessScopeKey, AccessReferenceItem[]> => {
  const refs: Record<AccessScopeKey, AccessReferenceItem[]> = { clients: [], sites: [], rooms: [], devices: [], racks: [] };
  const pushUnique = (scope: AccessScopeKey, item: AccessReferenceItem) => {
    if (!refs[scope].some((existing) => existing.id === item.id)) refs[scope].push(item);
  };

  const readSite = (site: AccessSiteNode, parent?: string) => {
    pushUnique("sites", { id: site.id, name: site.name, subtitle: parent || site.subtitle });
    site.rooms?.forEach((room) => {
      pushUnique("rooms", { id: room.id, name: room.name, subtitle: `${site.name}${room.subtitle ? ` / ${room.subtitle}` : ""}` });
      room.devices?.forEach((device) => pushUnique("devices", { id: device.id, name: device.name, subtitle: `${site.name} / ${room.name}` }));
    });
    site.racks?.forEach((rackItem) => {
      pushUnique("racks", { id: rackItem.id, name: rackItem.name, subtitle: `${site.name}${rackItem.subtitle ? ` / ${rackItem.subtitle}` : ""}` });
      rackItem.devices?.forEach((device) => pushUnique("devices", { id: device.id, name: device.name, subtitle: `${site.name} / ${rackItem.name}` }));
    });
    site.devices?.forEach((device) => pushUnique("devices", { id: device.id, name: device.name, subtitle: site.name }));
  };

  tree.clients.forEach((client) => {
    pushUnique("clients", { id: client.id, name: client.name, subtitle: client.subtitle });
    client.sites?.forEach((site) => readSite(site, client.name));
  });
  tree.unassigned_sites?.forEach((site) => readSite(site, "بدون شرکت"));
  return refs;
};

function SettingsPage() {
  const API_BASE_URL =
    typeof window !== "undefined"
      ? `http://${window.location.hostname}:8000`
      : "http://127.0.0.1:8000";

  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [openUserModal, setOpenUserModal] = useState(false);
  const [editBaleOpen, setEditBaleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [baleChatIdDraft, setBaleChatIdDraft] = useState("");
  const [userForm, setUserForm] = useState<UserForm>({ username: "", password: "", phone_number: "", bale_chat_id: "" });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({ username: "", phone_number: "", bale_chat_id: "" });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({ current_password: "", new_password: "", confirm_password: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [isLoadingGeneralSettings, setIsLoadingGeneralSettings] = useState(false);
  const [isSavingGeneralSettings, setIsSavingGeneralSettings] = useState(false);

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessUser, setAccessUser] = useState<User | null>(null);
  const [accessRole, setAccessRole] = useState("viewer");
  const [accessIsActive, setAccessIsActive] = useState(true);
  const [accessIsSuperuser, setAccessIsSuperuser] = useState(false);
  const [accessPermissions, setAccessPermissions] = useState<PermissionsState>(createDefaultPermissions());
  const [accessRefs, setAccessRefs] = useState<Record<AccessScopeKey, AccessReferenceItem[]>>({ clients: [], sites: [], rooms: [], devices: [], racks: [] });
  const [accessTree, setAccessTree] = useState<AccessTree>({ clients: [], unassigned_sites: [] });
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState(() => {
    if (typeof window === "undefined") return "templates";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return ["profile", "general", "users", "categories", "templates"].includes(tab || "") ? tab! : "templates";
  });

  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [templates, setTemplates] = useState<DeviceTemplate[]>([]);
  const [previewVersion, setPreviewVersion] = useState(() => Date.now());

  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    manufacturer: "",
    model_name: "",
    category: "network",
    form_factor: "1U",
    poe: false,
    rack_mountable: true,
    field_capable: false,
    has_front_faceplate: true,
    has_rear_faceplate: false,
    front_stencil: null as File | null,
    back_stencil: null as File | null,
    port_groups: [] as PortGroup[],
  });
  // ============================================================
  // SERVER HARDWARE BUILDER STATE
  // این state فقط برای ساخت قطعات سرور است.
  // ============================================================
  const [serverHardwareItems, setServerHardwareItems] = useState<ServerHardwareItem[]>(cloneServerHardwareItems());

  // ============================================================
  // PDU BUILDER STATE
  // این state فقط برای ساخت PDU و پورت‌های برق استفاده می‌شود.
  // ============================================================
  const [pduBuilder, setPduBuilder] = useState<PduBuilderState>(clonePduBuilder());

  const [openEditTemplateModal, setOpenEditTemplateModal] = useState(false);
  const [editPortGroups, setEditPortGroups] = useState<PortGroup[]>([]);
  const [editMappedTemplateParts, setEditMappedTemplateParts] = useState<TemplateMappedPart[]>([]);
  const [editSelectedMappedPartId, setEditSelectedMappedPartId] = useState("");
  const [editActiveTab, setEditActiveTab] = useState<"groups" | "items">("groups");
  const [editTemplateForm, setEditTemplateForm] = useState({
    id: 0,
    manufacturer: "",
    model_name: "",
    category: "network",
    form_factor: "1U",
    poe: false,
    rack_mountable: true,
    field_capable: false,
    has_front_faceplate: true,
    has_rear_faceplate: false,
    front_stencil: null as File | null,
    back_stencil: null as File | null,
  });

  const [deleteTemplateState, setDeleteTemplateState] = useState<{ step: number; id: number | null }>({ step: 0, id: null });

  const [activeFaceplateSide, setActiveFaceplateSide] = useState<"front" | "rear">("front");
  const [mappedTemplateParts, setMappedTemplateParts] = useState<TemplateMappedPart[]>([]);
  const [selectedMappedPartId, setSelectedMappedPartId] = useState<string>("");
  const [frontStencilPreviewUrl, setFrontStencilPreviewUrl] = useState("");
  const [rearStencilPreviewUrl, setRearStencilPreviewUrl] = useState("");

  const refreshPreviews = () => setPreviewVersion(Date.now());

  const changeSettingsTab = (value: string) => {
    setActiveSettingsTab(value);
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (value === "templates") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", value);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("token") || window.localStorage.getItem("access_token") || "";
  };

  const authHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchGeneralSettings = async () => {
    setIsLoadingGeneralSettings(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/general`, { headers: authHeaders() });
      if (!response.ok) throw new Error("Failed to fetch general settings");
      const data = await response.json();
      setGeneralSettings({ ...DEFAULT_GENERAL_SETTINGS, ...data });
    } catch {
      toast.error("خطا در دریافت تنظیمات اصلی برنامه");
    } finally {
      setIsLoadingGeneralSettings(false);
    }
  };

  const updateGeneralSetting = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setGeneralSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetGeneralSettingsForm = () => {
    setGeneralSettings(DEFAULT_GENERAL_SETTINGS);
  };

  const submitGeneralSettings = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingGeneralSettings(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/general`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(generalSettings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Failed to save general settings");
      setGeneralSettings({ ...DEFAULT_GENERAL_SETTINGS, ...data });
      toast.success("تنظیمات اصلی برنامه ذخیره شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در ذخیره تنظیمات اصلی برنامه");
    } finally {
      setIsSavingGeneralSettings(false);
    }
  };


  const buildStaticUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}v=${previewVersion}`;
    }
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE_URL}${cleanUrl}?v=${previewVersion}`;
  };

  const slugifyClient = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const getCategoryLabel = (slug: string) => categories.find((cat) => cat.slug === slug)?.name || slug;

  const loadSelectedStencilPreview = (side: "front" | "rear") => {
    const file = side === "front" ? templateForm.front_stencil : templateForm.back_stencil;
    if (!file) {
      toast.error(side === "front" ? "اول فایل Front را انتخاب کن" : "اول فایل Rear را انتخاب کن");
      return;
    }
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setFrontStencilPreviewUrl(url);
      setActiveFaceplateSide("front");
    } else {
      setRearStencilPreviewUrl(url);
      setActiveFaceplateSide("rear");
    }
    toast.success("فایل در پیش‌نمایش بارگذاری شد؛ حالا روی پورت‌ها و قطعات کلیک کن");
  };

  const loadEditStencilPreview = (side: "front" | "back") => {
    const file = side === "front" ? editTemplateForm.front_stencil : editTemplateForm.back_stencil;
    if (!file) {
      toast.error(side === "front" ? "اول فایل Front جدید را انتخاب کن" : "اول فایل Rear جدید را انتخاب کن");
      return;
    }
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setFrontStencilPreviewUrl(url);
      setActiveFaceplateSide("front");
    } else {
      setRearStencilPreviewUrl(url);
      setActiveFaceplateSide("rear");
    }
    toast.success("فایل جدید در پیش‌نمایش Edit بارگذاری شد");
  };

  const guessPortTypeFromPartName = (name: string) => {
    const value = name.toLowerCase();
    if (value.includes("sfp") || value.includes("uplink")) return "sfp";
    if (value.includes("console")) return "console";
    if (value.includes("power supply") || value.includes("psu") || value.includes("power input") || value.includes("ac")) return "power";
    if (value.includes("power outlet")) return "power-outlet";
    if (value.includes("usb")) return "usb";
    if (value.includes("vga")) return "vga";
    if (value.includes("hdmi")) return "hdmi";
    if (value.includes("fan")) return "fan";
    if (value.includes("disk") || value.includes("drive")) return "storage";
    if (value.includes("cpu")) return "cpu";
    if (value.includes("ram") || value.includes("memory")) return "memory";
    if (value.includes("pcie")) return "pcie";
    if (value.includes("rj11")) return "rj11";
    if (value.includes("port") || value.includes("eth") || value.includes("lan") || value.includes("mgmt") || value.includes("management")) return "rj45";
    return "other";
  };

  const guessCategoryFromPartName = (name: string, portType: string) => {
    const value = name.toLowerCase();
    if (value.includes("power") || value.includes("psu") || portType.includes("power")) return "Power / Cooling";
    if (value.includes("fan") || portType === "fan") return "Power / Cooling";
    if (value.includes("disk") || value.includes("drive") || portType === "storage") return "Storage";
    if (value.includes("console") || value.includes("usb") || portType === "console" || portType === "usb") return "USB / Console";
    if (value.includes("vga") || value.includes("hdmi") || portType === "vga" || portType === "hdmi") return "Video";
    return "Network Ports";
  };

  const buildMappedPartDefaults = (rawName: string, side: "front" | "rear"): TemplateMappedPart => {
    const name = String(rawName).trim();
    const portType = guessPortTypeFromPartName(name);
    const category = guessCategoryFromPartName(name, portType);
    return {
      id: `${side}:${name}`,
      name,
      side,
      port_type: portType,
      category,
      role: inferPortRole(portType, category),
      component_kind: inferComponentKind(portType, category),
      poe: false,
      data_port: isDataPortType(portType, category),
      uplink: inferPortRole(portType, category) === "uplink",
      console: portType === "console",
      power: isPowerPortType(portType, category),
      description: "",
    };
  };

  const updateMappedPart = (id: string, field: keyof TemplateMappedPart, value: string | boolean) => {
    setMappedTemplateParts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "port_type") {
          const portType = String(value);
          const category = guessCategoryFromPartName(item.name, portType);
          const isPower = isPowerPortType(portType, category);
          const isData = isDataPortType(portType, category) && !isPower;
          return {
            ...item,
            port_type: portType,
            category,
            role: inferPortRole(portType, category),
            component_kind: inferComponentKind(portType, category),
            data_port: isData,
            power: isPower,
            console: portType === "console",
            uplink: inferPortRole(portType, category) === "uplink",
            poe: isData ? Boolean(item.poe) : false,
          };
        }
        if (field === "power" && Boolean(value)) {
          return { ...item, power: true, data_port: false, poe: false, role: "power" };
        }
        if (field === "data_port" && Boolean(value)) {
          return { ...item, data_port: true, power: false };
        }
        return { ...item, [field]: value };
      }),
    );
  };

  const removeMappedPart = (id: string) => {
    setMappedTemplateParts((prev) => prev.filter((item) => item.id !== id));
    setSelectedMappedPartId((prev) => (prev === id ? "" : prev));
  };

  useEffect(() => {
    if (!openTemplateModal && !openEditTemplateModal) return;

    const handleStencilMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const messageType = String((data as any).type || (data as any).event || "").toUpperCase();
      if (!["PORT_CLICK", "PART_CLICK", "COMPONENT_CLICK"].includes(messageType)) return;
      const partName = String((data as any).portName || (data as any).partName || (data as any).name || "").trim();
      if (!partName) return;
      const sideValue = String((data as any).side || activeFaceplateSide).toLowerCase().includes("rear") ? "rear" : "front";
      const mapped = buildMappedPartDefaults(partName, sideValue as "front" | "rear");
      if (openEditTemplateModal) {
        setEditMappedTemplateParts((prev) => (prev.some((item) => item.id === mapped.id) ? prev : [...prev, mapped]));
        setEditSelectedMappedPartId(mapped.id);
        setEditActiveTab("items");
      } else {
        setMappedTemplateParts((prev) => (prev.some((item) => item.id === mapped.id) ? prev : [...prev, mapped]));
        setSelectedMappedPartId(mapped.id);
      }
    };

    window.addEventListener("message", handleStencilMessage);
    return () => window.removeEventListener("message", handleStencilMessage);
  }, [openTemplateModal, openEditTemplateModal, activeFaceplateSide]);

  const buildMappedPortGroupsFromParts = (parts: TemplateMappedPart[]): PortGroup[] =>
    parts.map((item) => ({
      count: 1,
      prefix: item.name,
      port_type: item.port_type,
      category: resolveGroupCategory({ category: item.category, side: item.side === "rear" ? "rear" : "front" }),
      side: item.side === "rear" ? "rear" : "front",
      role: item.role,
      component_kind: item.component_kind,
      poe: Boolean(item.poe),
      data_port: Boolean(item.data_port),
      uplink: Boolean(item.uplink),
      console: Boolean(item.console),
      power: Boolean(item.power),
      description: item.description || `${item.side.toUpperCase()} faceplate item`,
    }));

  const expandPortGroups = (groups: PortGroup[]) => {
    const expanded: Array<Record<string, unknown>> = [];

    groups.forEach((group) => {
      const count = Math.max(0, Number.parseInt(String(group.count), 10) || 0);
      if (count <= 0) return;

      for (let index = 0; index < count; index += 1) {
        const portName = resolvePortName(group, index).trim();
        if (!portName) continue;

        expanded.push({
          name: portName,
          port_type: group.port_type || "other",
          category: resolveGroupCategory(group),
          role: group.role || inferPortRole(group.port_type || "other", group.category || ""),
          component_kind: group.component_kind || inferComponentKind(group.port_type || "other", group.category || ""),
          poe: Boolean(group.poe),
          data_port: group.data_port ?? isDataPortType(group.port_type || "other", group.category || ""),
          uplink: Boolean(group.uplink),
          console: Boolean(group.console) || group.port_type === "console",
          power: group.power ?? isPowerPortType(group.port_type || "other", group.category || ""),
          description: group.description || "",
        });
      }
    });

    return expanded;
  };

  const syncTemplatePortGroups = async (templateId: number, groups: PortGroup[]) => {
    const payload = expandPortGroups(groups);
    const requestInit: RequestInit = {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    };

    const primary = await fetch(`${API_BASE_URL}/templates/devices/${templateId}/ports/bulk/`, requestInit);
    if (primary.ok) return;

    // Compatibility fallback for servers that registered the same route without trailing slash.
    const fallback = await fetch(`${API_BASE_URL}/templates/devices/${templateId}/ports/bulk`, requestInit);
    if (fallback.ok) return;

    const primaryDetail = await primary.text().catch(() => "");
    const fallbackDetail = await fallback.text().catch(() => "");
    throw new Error(fallbackDetail || primaryDetail || `Failed to sync template ports: ${fallback.status}`);
  };

  const portsToPortGroups = (ports: PortTemplate[] = []): PortGroup[] => {
    const buckets = new Map<string, PortGroup>();

    ports.forEach((port) => {
      const side = inferSideFromCategory(port.category || "") as "front" | "rear" | "internal";
      const category = stripSidePrefix(port.category || "Network Ports");
      const role = port.role || inferPortRole(port.port_type || "other", category);
      const componentKind = port.component_kind || inferComponentKind(port.port_type || "other", category);
      const poe = Boolean(port.poe);
      const dataPort = port.data_port ?? isDataPortType(port.port_type || "other", category);
      const uplink = Boolean(port.uplink);
      const console = Boolean(port.console);
      const power = port.power ?? isPowerPortType(port.port_type || "other", category);
      const description = port.description || "";
      const prefix = deriveGroupPrefixFromPortName(port.name || "Port");
      const key = [side, category, port.port_type || "other", role, componentKind, poe, dataPort, uplink, console, power, description, prefix].join("|");
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(key, {
          count: 1,
          prefix,
          port_type: port.port_type || "other",
          category,
          side,
          role,
          component_kind: componentKind,
          poe,
          data_port: dataPort,
          uplink,
          console,
          power,
          description,
        });
      }
    });

    return Array.from(buckets.values());
  };

  const loadExistingTemplateIntoInteractiveEditor = (tpl: DeviceTemplate) => {
    const groups = portsToPortGroups(tpl.port_templates || []);
    setEditPortGroups(groups);
    // Existing saved ports are reconstructed as editable groups above.
    // The clicked-items list must only contain NEW stencil clicks during this edit session;
    // otherwise every saved port appears as a clicked item and gets duplicated on update.
    setEditMappedTemplateParts([]);
    setEditSelectedMappedPartId("");
    setEditActiveTab("groups");
    setSelectedMappedPartId("");
    setActiveFaceplateSide("front");
    setFrontStencilPreviewUrl(tpl.front_stencil_url ? buildStaticUrl(tpl.front_stencil_url) : "");
    setRearStencilPreviewUrl(tpl.back_stencil_url ? buildStaticUrl(tpl.back_stencil_url) : "");
  };

  // ============================================================
  // SERVER HARDWARE -> PORT TEMPLATE GROUPS
  // چون بک‌اند فعلاً side/spec جدا ندارد، side و spec را داخل category ذخیره می‌کنیم.
  // بعداً اگر ستون جدا اضافه کردیم، فقط همین تابع را تغییر می‌دهیم.
  // ============================================================
  const getEnabledServerPortGroups = (items: ServerHardwareItem[]): PortGroup[] =>
    items
      .filter((item) => item.enabled && Number(item.count) > 0)
      .map((item) => ({
        count: Number(item.count) || 0,
        prefix: item.prefix.trim() || item.label.trim() || "Server Item",
        port_type: item.port_type || "other",
        category: `${item.category || "Server Hardware"}${item.spec ? ` / ${item.spec}` : ""}`,
        side: item.side.toLowerCase() as "front" | "rear" | "internal",
        role: inferPortRole(item.port_type, item.category),
        component_kind: inferComponentKind(item.port_type, item.category),
        poe: false,
        data_port: isDataPortType(item.port_type, item.category),
        uplink: false,
        console: item.port_type === "console",
        power: isPowerPortType(item.port_type, item.category),
        description: item.description || item.spec || "",
      }));

  const getPduPortGroups = (builder: PduBuilderState): PortGroup[] => {
    const groups: PortGroup[] = [];

    if (Number(builder.outlet_count) > 0) {
      groups.push({
        count: Number(builder.outlet_count) || 0,
        prefix: builder.outlet_prefix.trim() || "PDU Outlet",
        port_type: builder.outlet_type || "power-outlet",
        category: builder.outlet_category || "PDU / Power Outlets",
        side: "front",
        role: "power",
        component_kind: "power-output",
        poe: false,
        data_port: false,
        uplink: false,
        console: false,
        power: true,
        description: builder.notes,
      });
    }

    if (Number(builder.input_count) > 0) {
      groups.push({
        count: Number(builder.input_count) || 0,
        prefix: builder.input_prefix.trim() || "Power Input",
        port_type: builder.input_type || "power-input",
        category: builder.input_category || "PDU / Power Inputs",
        side: "rear",
        role: "power",
        component_kind: "power-input",
        poe: false,
        data_port: false,
        uplink: false,
        console: false,
        power: true,
        description: builder.notes,
      });
    }

    if (Number(builder.control_count) > 0) {
      groups.push({
        count: Number(builder.control_count) || 0,
        prefix: builder.control_prefix.trim() || "Main Power Switch",
        port_type: builder.control_type || "breaker",
        category: builder.control_category || "PDU / Control",
        side: "front",
        role: "power",
        component_kind: "indicator",
        poe: false,
        data_port: false,
        uplink: false,
        console: false,
        power: true,
        description: builder.notes,
      });
    }

    return groups;
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      manufacturer: "",
      model_name: "",
      category: "network",
      form_factor: "1U",
      poe: false,
      rack_mountable: true,
      field_capable: false,
      has_front_faceplate: true,
      has_rear_faceplate: false,
      front_stencil: null,
      back_stencil: null,
      port_groups: [],
    });
    setServerHardwareItems(cloneServerHardwareItems());
    setPduBuilder(clonePduBuilder());
    setMappedTemplateParts([]);
    setSelectedMappedPartId("");
    setActiveFaceplateSide("front");
    setFrontStencilPreviewUrl("");
    setRearStencilPreviewUrl("");
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, { headers: authHeaders() });
      if (!response.ok) {
        if (response.status === 401) throw new Error("AUTH");
        if (response.status === 403) return;
        throw new Error("Failed to fetch users");
      }
      setUsers(await response.json());
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("خطا در دریافت لیست کاربران");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, { headers: authHeaders() });
      if (!response.ok) throw new Error("Failed to fetch profile");
      const user = (await response.json()) as User;
      setCurrentUser(user);
      setProfileForm({
        username: user.username || "",
        phone_number: user.phone_number || "",
        bale_chat_id: user.bale_chat_id || "",
      });
      return user;
    } catch (error) {
      console.error("Failed to fetch current user", error);
      return null;
      // صفحه Settings بدون پروفایل هم باید بالا بیاید؛ Auth Guard مسیر ورود را کنترل می‌کند.
    }
  };

  const fetchAccessReferences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/access/references/tree`, { headers: authHeaders() });
      if (!response.ok) {
        if (response.status === 403) return;
        throw new Error("Failed to fetch access tree");
      }
      const tree = (await response.json()) as AccessTree;
      const safeTree = { clients: tree.clients || [], unassigned_sites: tree.unassigned_sites || [] };
      setAccessTree(safeTree);
      setAccessRefs(flattenAccessTree(safeTree));
    } catch (error) {
      console.error("Failed to fetch access tree", error);
      toast.error("خطا در دریافت ساختار درختی سطح دسترسی");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/device-categories/`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      setCategories(await response.json());
    } catch {
      toast.error("خطا در دریافت دسته‌بندی‌ها");
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/devices/`, { headers: authHeaders() });
      if (!response.ok) throw new Error("Failed to fetch templates");
      setTemplates(await response.json());
    } catch {
      toast.error("خطا در دریافت لیست الگوهای دستگاه");
    }
  };

  const fetchTemplateDetail = async (templateId: number) => {
    const response = await fetch(`${API_BASE_URL}/templates/devices/${templateId}`, { headers: authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch template detail");
    return (await response.json()) as DeviceTemplate;
  };

  useEffect(() => {
    const loadSettings = async () => {
      const me = await fetchCurrentUser();
      if (!me || canManageSettings(me)) {
        fetchGeneralSettings();
        fetchUsers();
        fetchAccessReferences();
      }
      fetchCategories();
      fetchTemplates();
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpenAddUser() {
    setUserForm({ username: "", password: "", phone_number: "", bale_chat_id: "" });
    setOpenUserModal(true);
  }

  function openEditBale(user: User) {
    setSelectedUser(user);
    setBaleChatIdDraft(user.bale_chat_id || "");
    setEditBaleOpen(true);
  }

  function handleOpenAddTemplate() {
    resetTemplateForm();
    setPreviewVersion(Date.now());
    setOpenTemplateModal(true);
  }

  function handleTemplateModalOpenChange(open: boolean) {
    if (isSubmittingTemplate) return;
    if (!open) {
      setOpenTemplateModal(false);
      resetTemplateForm();
      return;
    }
    handleOpenAddTemplate();
  }

  async function submitUser(e: FormEvent) {
    e.preventDefault();

    if (!userForm.username.trim() || !userForm.password.trim() || !userForm.phone_number.trim()) {
      toast.error("نام کاربری، رمز عبور و شماره موبایل الزامی است");
      return;
    }

    try {
      const payload = {
        username: userForm.username.trim(),
        password: userForm.password,
        phone_number: userForm.phone_number.trim(),
        bale_chat_id: userForm.bale_chat_id.trim() || null,
        role: "viewer",
        is_superuser: false,
        permissions_json: JSON.stringify(createDefaultPermissions()),
      };

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("کاربر جدید با موفقیت در سیستم ثبت شد");
        setOpenUserModal(false);
        setUserForm({ username: "", password: "", phone_number: "", bale_chat_id: "" });
        fetchUsers();
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در ثبت کاربر");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  }

  async function saveBaleChatId(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/bale-chat`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ bale_chat_id: baleChatIdDraft.trim() || null }),
      });

      if (response.ok) {
        toast.success("شناسه عددی بله ذخیره شد");
        setEditBaleOpen(false);
        setSelectedUser(null);
        setBaleChatIdDraft("");
        fetchUsers();
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در ذخیره Bale Chat ID");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  }

  async function submitProfile(e: FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          username: profileForm.username.trim(),
          phone_number: profileForm.phone_number.trim(),
          bale_chat_id: profileForm.bale_chat_id.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "خطا در ذخیره پروفایل");
      if (data.access_token && typeof window !== "undefined") {
        window.localStorage.setItem("token", data.access_token);
        window.localStorage.setItem("access_token", data.access_token);
      }
      setCurrentUser(data.user);
      setProfileForm({ username: data.user.username, phone_number: data.user.phone_number, bale_chat_id: data.user.bale_chat_id || "" });
      toast.success("پروفایل ذخیره شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در ذخیره پروفایل");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setIsSavingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(passwordForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "خطا در تغییر رمز عبور");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("رمز عبور تغییر کرد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در تغییر رمز عبور");
    } finally {
      setIsSavingPassword(false);
    }
  }

  function openAccessEditor(user: User) {
    setAccessUser(user);
    setAccessRole(user.role || "viewer");
    setAccessIsActive(Boolean(user.is_active));
    setAccessIsSuperuser(Boolean(user.is_superuser));
    setAccessPermissions(parsePermissions(user.permissions_json));
    setAccessModalOpen(true);
  }

  const togglePermissionId = (scope: AccessScopeKey, mode: "view" | "edit", id: number) => {
    setAccessPermissions((prev) => {
      const current = new Set(prev[scope][mode]);
      if (current.has(id)) current.delete(id); else current.add(id);
      const next = { ...prev, [scope]: { ...prev[scope], [mode]: Array.from(current) } };
      if (mode === "edit" && current.has(id) && !next[scope].view.includes(id)) {
        next[scope].view = [...next[scope].view, id];
      }
      return next;
    });
  };

  async function saveUserAccess(e: FormEvent) {
    e.preventDefault();
    if (!accessUser) return;
    setIsSavingAccess(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${accessUser.id}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          role: accessRole,
          is_active: accessIsActive,
          is_superuser: accessIsSuperuser,
          permissions_json: JSON.stringify(accessPermissions),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "خطا در ذخیره سطح دسترسی");
      toast.success("سطح دسترسی کاربر ذخیره شد");
      setAccessModalOpen(false);
      setAccessUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در ذخیره سطح دسترسی");
    } finally {
      setIsSavingAccess(false);
    }
  }

  async function submitCategory(e: FormEvent) {
    e.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) return;

    setIsSubmittingCategory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/device-categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: categoryForm.slug.trim() || slugifyClient(name),
          description: categoryForm.description.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success("دسته‌بندی جدید ثبت شد");
        setCategoryForm({ name: "", slug: "", description: "" });
        fetchCategories();
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در ثبت دسته‌بندی");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsSubmittingCategory(false);
    }
  }

  async function deleteCategory(id: number) {
    const ok = window.confirm("آیا از حذف این دسته‌بندی مطمئن هستید؟ اگر در الگو استفاده شده باشد حذف نمی‌شود.");
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE_URL}/device-categories/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("دسته‌بندی حذف شد");
        fetchCategories();
      } else {
        const err = await response.json();
        toast.error(err.detail || "خطا در حذف دسته‌بندی");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((u) =>
      u.username.toLowerCase().includes(normalizedQuery) ||
      u.phone_number.includes(normalizedQuery) ||
      String(u.bale_chat_id || "").includes(normalizedQuery),
    );
  }, [users, query]);

  const setTemplateCategory = (category: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      category,
      form_factor:
        category === "server"
          ? "1U"
          : category === "pdu"
            ? (pduBuilder.orientation === "vertical" ? "0U" : "1U")
            : prev.form_factor || "1U",
      poe: ["switch", "camera", "phone", "access-point"].includes(category) ? true : false,
      rack_mountable: !["camera", "phone", "access-point", "workstation"].includes(category),
      field_capable: ["camera", "phone", "access-point", "workstation", "printer"].includes(category),
      has_front_faceplate: true,
      has_rear_faceplate: ["server", "router", "nvr"].includes(category),
      // انتخاب دسته‌بندی فقط نوع دستگاه را عوض می‌کند.
      // پورت/قطعه پیش‌فرض فقط با دکمه‌های Preset یا افزودن دستی ساخته می‌شود.
      port_groups: [],
    }));

    setMappedTemplateParts([]);
    setSelectedMappedPartId("");
    if (category === "server") setServerHardwareItems(cloneServerHardwareItems());
    if (category === "pdu") setPduBuilder(clonePduBuilder());
  };

  const applyTemplatePreset = (key: string) => {
    const preset = PRESET_BUTTONS.find((item) => item.key === key);
    const groups = PRESET_GROUPS[key] || [];
    if (!preset) return;

    if (key === "pdu-horizontal" || key === "pdu-vertical") {
      const orientation: PduOrientation = key === "pdu-vertical" ? "vertical" : "horizontal";
      setPduBuilder({
        ...clonePduBuilder(),
        orientation,
        outlet_prefix: orientation === "vertical" ? "Vertical PDU Outlet" : "PDU Outlet",
        notes: orientation === "vertical" ? "Vertical PDU Template" : "Rack PDU Dynamic Template",
      });
    }

    setTemplateForm((prev) => ({
      ...prev,
      manufacturer: prev.manufacturer || preset.manufacturer,
      model_name: prev.model_name || preset.model,
      category: preset.category,
      form_factor: preset.form,
      poe: ["switch", "camera", "phone", "access-point"].includes(preset.category),
      rack_mountable: !["camera", "phone", "access-point", "workstation"].includes(preset.category),
      field_capable: ["camera", "phone", "access-point", "workstation", "printer"].includes(preset.category),
      has_front_faceplate: true,
      has_rear_faceplate: ["server", "router", "nvr"].includes(preset.category),
      port_groups: preset.category === "pdu" ? [] : [...groups],
    }));
  };

  const applyHpDl360Preset = () => {
    setTemplateForm((prev) => ({
      ...prev,
      manufacturer: prev.manufacturer || "HP",
      model_name: prev.model_name || "DL360 Gen10",
      category: "server",
      form_factor: "1U",
      poe: false,
      rack_mountable: true,
      field_capable: false,
      has_front_faceplate: true,
      has_rear_faceplate: true,
    }));
    setServerHardwareItems(cloneServerHardwareItems());
  };

  // ============================================================
  // SERVER HARDWARE BUILDER ACTIONS
  // هر تغییری روی قطعات سرور فقط از این بخش کنترل می‌شود.
  // ============================================================
  const updateServerHardwareItem = <K extends keyof ServerHardwareItem>(
    id: string,
    field: K,
    value: ServerHardwareItem[K],
  ) => {
    setServerHardwareItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const addServerHardwareItem = () => {
    const id = `custom_${Date.now()}`;
    setServerHardwareItems((prev) => [
      ...prev,
      {
        id,
        enabled: true,
        label: "Custom Item",
        description: "قطعه دلخواه سرور",
        icon: "module",
        count: 1,
        prefix: "Custom Item",
        port_type: "other",
        side: "INTERNAL",
        category: "Custom Hardware",
        spec: "",
      },
    ]);
  };

  const removeServerHardwareItem = (id: string) => {
    setServerHardwareItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetServerHardwareItems = () => {
    setServerHardwareItems(cloneServerHardwareItems());
  };

  // ============================================================
  // PDU BUILDER ACTIONS
  // این بخش فقط تنظیم تعداد پاورها/پریزها و نوع PDU را کنترل می‌کند.
  // ============================================================
  const updatePduBuilder = <K extends keyof PduBuilderState>(field: K, value: PduBuilderState[K]) => {
    setPduBuilder((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "orientation") {
        next.outlet_prefix = value === "vertical" ? "Vertical PDU Outlet" : "PDU Outlet";
        setTemplateForm((form) => ({
          ...form,
          form_factor: value === "vertical" ? "0U" : "1U",
        }));
      }

      return next;
    });
  };

  const resetPduBuilder = () => {
    setPduBuilder(clonePduBuilder());
    setTemplateForm((prev) => ({ ...prev, form_factor: "1U" }));
  };

  const buildPduStencilFile = async (file: File, outletCount: number) => {
    const raw = await file.text();
    const safeCount = Math.max(1, Number(outletCount) || 1);
    const patched = raw
      .replace(/const\s+PORT_COUNT\s*=\s*\d+\s*;/, `const PORT_COUNT = ${safeCount};`)
      .replace(/<span id="port-count-title">\d+<\/span>/, `<span id="port-count-title">${safeCount}</span>`);

    return new File([patched], file.name, { type: file.type || "text/html" });
  };

  const addPortGroup = () => {
    setTemplateForm((prev) => ({
      ...prev,
      port_groups: [
        ...prev.port_groups,
        {
          count: 1,
          prefix: "Uplink",
          port_type: "sfp",
          category: "Network Ports",
          side: "front",
          role: "uplink",
          component_kind: "uplink-port",
          poe: false,
          data_port: true,
          uplink: true,
          console: false,
          power: false,
          description: "",
        },
      ],
    }));
  };

  const updatePortGroup = (index: number, field: keyof PortGroup, value: string | number | boolean) => {
    setTemplateForm((prev) => {
      const updatedGroups = [...prev.port_groups];
      const current = { ...updatedGroups[index], [field]: value } as PortGroup;

      if (field === "port_type" || field === "category") {
        const isPower = isPowerPortType(current.port_type, current.category);
        const isData = isDataPortType(current.port_type, current.category) && !isPower;
        current.role = current.role || inferPortRole(current.port_type, current.category);
        current.component_kind = current.component_kind || inferComponentKind(current.port_type, current.category);
        current.data_port = isData;
        current.power = isPower;
        current.console = current.port_type === "console" || Boolean(current.console);
        if (isPower) current.poe = false;
      }

      if (field === "power" && Boolean(value)) {
        current.data_port = false;
        current.poe = false;
        current.role = "power";
        current.component_kind = current.component_kind || "power-input";
      }

      if (field === "data_port" && Boolean(value)) {
        current.power = false;
      }

      updatedGroups[index] = current;
      return { ...prev, port_groups: updatedGroups };
    });
  };

  const removePortGroup = (index: number) => {
    setTemplateForm((prev) => ({ ...prev, port_groups: prev.port_groups.filter((_, i) => i !== index) }));
  };

  const addEditPortGroup = () => {
    setEditPortGroups((prev) => [
      ...prev,
      {
        count: 1,
        prefix: "Port",
        port_type: "rj45",
        category: "Network Ports",
        side: "front",
        role: "access",
        component_kind: "network-port",
        poe: false,
        data_port: true,
        uplink: false,
        console: false,
        power: false,
        description: "",
      },
    ]);
    setEditActiveTab("groups");
  };

  const updateEditPortGroup = (index: number, field: keyof PortGroup, value: string | number | boolean) => {
    setEditPortGroups((prev) => {
      const updatedGroups = [...prev];
      const current = { ...updatedGroups[index], [field]: value } as PortGroup;

      if (field === "port_type" || field === "category") {
        const isPower = isPowerPortType(current.port_type, current.category);
        const isData = isDataPortType(current.port_type, current.category) && !isPower;
        current.role = current.role || inferPortRole(current.port_type, current.category);
        current.component_kind = current.component_kind || inferComponentKind(current.port_type, current.category);
        current.data_port = isData;
        current.power = isPower;
        current.console = current.port_type === "console" || Boolean(current.console);
        if (isPower) current.poe = false;
      }

      if (field === "power" && Boolean(value)) {
        current.data_port = false;
        current.poe = false;
        current.role = "power";
        current.component_kind = current.component_kind || "power-input";
      }

      if (field === "data_port" && Boolean(value)) {
        current.power = false;
      }

      updatedGroups[index] = current;
      return updatedGroups;
    });
  };

  const removeEditPortGroup = (index: number) => {
    setEditPortGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEditMappedPart = (id: string, field: keyof TemplateMappedPart, value: string | boolean) => {
    setEditMappedTemplateParts((prev) => prev.map((part) => (part.id === id ? { ...part, [field]: value } : part)));
  };

  const removeEditMappedPart = (id: string) => {
    setEditMappedTemplateParts((prev) => prev.filter((part) => part.id !== id));
    setEditSelectedMappedPartId((prev) => (prev === id ? "" : prev));
  };

  const deriveGroupPrefixFromPortName = (name: string) => {
    const trimmed = (name || "Port").trim();
    return trimmed.replace(/\s+\d+$/, "").replace(/\/{0,1}\d+$/, "{n}") || trimmed || "Port";
  };

  const resolvePortName = (group: PortGroup, index: number) => {
    const number = index + 1;
    if (group.prefix.includes("{n}")) return group.prefix.split("{n}").join(String(number));
    return group.count === 1 ? group.prefix : `${group.prefix} ${number}`;
  };

  async function createPortGroupTemplates(newTemplateId: number, groups: PortGroup[]) {
    for (const group of groups) {
      const count = Number.parseInt(group.count.toString(), 10) || 0;
      if (count <= 0) continue;

      for (let i = 0; i < count; i++) {
        const portName = resolvePortName(group, i);
        const portRes = await fetch(`${API_BASE_URL}/templates/devices/${newTemplateId}/ports/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            name: portName,
            port_type: group.port_type,
            category: resolveGroupCategory(group),
            role: group.role || inferPortRole(group.port_type, group.category),
            component_kind: group.component_kind || inferComponentKind(group.port_type, group.category),
            poe: Boolean(group.poe),
            data_port: group.data_port ?? isDataPortType(group.port_type, group.category),
            uplink: Boolean(group.uplink),
            console: Boolean(group.console) || group.port_type === "console",
            power: group.power ?? isPowerPortType(group.port_type, group.category),
            description: group.description || "",
          }),
        });

        if (!portRes.ok) throw new Error(`Failed to create port ${portName}`);
      }
    }
  }

  async function uploadStencil(templateId: number, side: "front" | "back", file: File) {
    const formData = new FormData();
    const fileToUpload =
      templateForm.category === "pdu"
        ? await buildPduStencilFile(file, pduBuilder.outlet_count)
        : file;

    formData.append("file", fileToUpload);

    const uploadRes = await fetch(`${API_BASE_URL}/templates/devices/${templateId}/stencil/?side=${side}`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    if (!uploadRes.ok) throw new Error(`Failed to upload ${side} stencil`);
  }

  async function submitTemplate(e: FormEvent) {
    e.preventDefault();
    if (!templateForm.manufacturer.trim() || !templateForm.model_name.trim()) return;

    setIsSubmittingTemplate(true);

    try {
      const resTemplate = await fetch(`${API_BASE_URL}/templates/devices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          manufacturer: templateForm.manufacturer,
          model_name: templateForm.model_name,
          category: templateForm.category,
          form_factor: templateForm.form_factor,
          poe: templateForm.poe,
          rack_mountable: templateForm.rack_mountable,
          field_capable: templateForm.field_capable,
          has_front_faceplate: templateForm.has_front_faceplate,
          has_rear_faceplate: templateForm.has_rear_faceplate,
        }),
      });

      if (!resTemplate.ok) throw new Error("Failed to create template");
      const newTemplate = await resTemplate.json();

      if (templateForm.front_stencil) await uploadStencil(newTemplate.id, "front", templateForm.front_stencil);
      if (templateForm.back_stencil) await uploadStencil(newTemplate.id, "back", templateForm.back_stencil);

      const clickedPartGroups = buildMappedPortGroupsFromParts(mappedTemplateParts);

      const baseGroups =
        templateForm.category === "server"
          ? getEnabledServerPortGroups(serverHardwareItems)
          : templateForm.category === "pdu"
            ? getPduPortGroups(pduBuilder)
            : templateForm.port_groups;
      const groupsToCreate = [...baseGroups, ...clickedPartGroups];
      await createPortGroupTemplates(newTemplate.id, groupsToCreate);

      toast.success("الگوی دستگاه به همراه قطعات و قالب گرافیکی با موفقیت ثبت شد!");
      setOpenTemplateModal(false);
      resetTemplateForm();
      refreshPreviews();
      fetchTemplates();
    } catch {
      toast.error("خطا در ارتباط با سرور هنگام ثبت الگو");
    } finally {
      setIsSubmittingTemplate(false);
    }
  }

  async function handleOpenEditTemplate(tpl: DeviceTemplate) {
    try {
      const freshTemplate = await fetchTemplateDetail(tpl.id);
      setEditTemplateForm({
        id: freshTemplate.id,
        manufacturer: freshTemplate.manufacturer,
        model_name: freshTemplate.model_name,
        category: freshTemplate.category,
        form_factor: freshTemplate.form_factor,
        poe: Boolean(freshTemplate.poe),
        rack_mountable: freshTemplate.rack_mountable ?? true,
        field_capable: Boolean(freshTemplate.field_capable),
        has_front_faceplate: freshTemplate.has_front_faceplate ?? true,
        has_rear_faceplate: Boolean(freshTemplate.has_rear_faceplate),
        front_stencil: null,
        back_stencil: null,
      });
      loadExistingTemplateIntoInteractiveEditor(freshTemplate);
      setOpenEditTemplateModal(true);
    } catch {
      toast.error("خطا در دریافت اطلاعات کامل الگو");
    }
  }

  async function submitEditTemplate(e: FormEvent) {
    e.preventDefault();
    if (!editTemplateForm.manufacturer.trim() || !editTemplateForm.model_name.trim()) return;

    setIsSubmittingTemplate(true);
    try {
      const res = await fetch(`${API_BASE_URL}/templates/devices/${editTemplateForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          manufacturer: editTemplateForm.manufacturer,
          model_name: editTemplateForm.model_name,
          category: editTemplateForm.category,
          form_factor: editTemplateForm.form_factor,
          poe: editTemplateForm.poe,
          rack_mountable: editTemplateForm.rack_mountable,
          field_capable: editTemplateForm.field_capable,
          has_front_faceplate: editTemplateForm.has_front_faceplate,
          has_rear_faceplate: editTemplateForm.has_rear_faceplate,
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      if (editTemplateForm.front_stencil) await uploadStencil(editTemplateForm.id, "front", editTemplateForm.front_stencil);
      if (editTemplateForm.back_stencil) await uploadStencil(editTemplateForm.id, "back", editTemplateForm.back_stencil);

      const groupsToSync = [...editPortGroups, ...buildMappedPortGroupsFromParts(editMappedTemplateParts)];
      await syncTemplatePortGroups(editTemplateForm.id, groupsToSync);

      toast.success("الگوی دستگاه و آیتم‌های Front / Rear با موفقیت ویرایش شد!");
      setOpenEditTemplateModal(false);
      refreshPreviews();
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error("خطا در ویرایش الگو؛ ذخیره اطلاعات یا گروه‌های الگو انجام نشد");
    } finally {
      setIsSubmittingTemplate(false);
    }
  }

  const initiateDeleteTemplate = (id: number) => setDeleteTemplateState({ step: 1, id });
  const handleFirstConfirmTemplate = () => setDeleteTemplateState((prev) => ({ ...prev, step: 2 }));
  const cancelDeleteTemplate = () => setDeleteTemplateState({ step: 0, id: null });

  const handleFinalDeleteTemplate = async () => {
    if (!deleteTemplateState.id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/templates/devices/${deleteTemplateState.id}`, { method: "DELETE", headers: authHeaders() });

      if (res.ok) {
        toast.success("الگو با موفقیت حذف شد");
        fetchTemplates();
      } else {
        const err = await res.json();
        toast.error(err.detail || "خطا در حذف الگو");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      cancelDeleteTemplate();
    }
  };

  // ============================================================
  // SERVER HARDWARE ICONS
  // ============================================================
  const getHardwareIcon = (icon: ServerHardwareIcon) => {
    if (icon === "disk") return <HardDrive className="h-4 w-4" />;
    if (icon === "network") return <NetworkIcon className="h-4 w-4" />;
    if (icon === "usb") return <Usb className="h-4 w-4" />;
    if (icon === "power") return <PlugZap className="h-4 w-4" />;
    if (icon === "fan") return <Fan className="h-4 w-4" />;
    if (icon === "memory") return <HardDrive className="h-4 w-4" />;
    if (icon === "gpu") return <Cpu className="h-4 w-4" />;
    return <Cpu className="h-4 w-4" />;
  };

  const getTemplateIcon = (category: string) => {
    if (category === "server") return <Server className="h-5 w-5 text-purple-500 opacity-75" />;
    if (category === "pdu") return <PlugZap className="h-5 w-5 text-yellow-500 opacity-75" />;
    if (category === "router") return <Router className="h-5 w-5 text-amber-500 opacity-75" />;
    if (category === "patch-panel") return <Boxes className="h-5 w-5 text-slate-500 opacity-75" />;
    if (category === "nvr" || category === "camera") return <Camera className="h-5 w-5 text-emerald-500 opacity-75" />;
    return <Cable className="h-5 w-5 text-blue-500 opacity-75" />;
  };

  // ============================================================
  // SERVER HARDWARE COUNTS
  // ============================================================
  const selectedServerGroups = getEnabledServerPortGroups(serverHardwareItems);
  const selectedServerPartsCount = selectedServerGroups.reduce((sum, group) => sum + Number(group.count || 0), 0);
  const selectedPduGroups = getPduPortGroups(pduBuilder);
  const selectedPduPortsCount = selectedPduGroups.reduce((sum, group) => sum + Number(group.count || 0), 0);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6" dir="ltr">
        <div className="text-left">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1.5">Manage your account settings, users, templates, and categories.</p>
        </div>

        <Tabs value={activeSettingsTab} onValueChange={changeSettingsTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none pb-px bg-transparent h-auto p-0 mb-6 overflow-x-auto gap-2">
            <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
              <UserCircle className="h-4 w-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> General
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
              <ShieldCheck className="h-4 w-4 mr-2" /> Users & Access
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
              <Tags className="h-4 w-4 mr-2" /> Device Categories
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">
              <Server className="h-4 w-4 mr-2" /> Device Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" /> Profile</CardTitle>
                  <CardDescription>اطلاعات حساب کاربری لاگین‌شده را همین‌جا مدیریت کن.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={profileForm.username} onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input value={profileForm.phone_number} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_number: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bale Numeric Chat ID</Label>
                      <Input value={profileForm.bale_chat_id} onChange={(e) => setProfileForm((prev) => ({ ...prev, bale_chat_id: e.target.value.replace(/\D/g, "") }))} placeholder="مثلاً 123456789" />
                    </div>
                    <Button type="submit" disabled={isSavingProfile}>{isSavingProfile ? "Saving..." : "Save Profile"}</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>برای امنیت، رمز فعلی باید وارد شود.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))} />
                    </div>
                    <Button type="submit" variant="outline" disabled={isSavingPassword}>{isSavingPassword ? "Updating..." : "Update Password"}</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {currentUser && (
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm text-muted-foreground">Signed in as</div>
                    <div className="font-semibold">{currentUser.username}</div>
                  </div>
                  <Badge variant="outline">{currentUser.role || "viewer"}</Badge>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" /> General / Core App Settings
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  تنظیمات زیرساختی خود برنامه؛ برای دامین، ساب‌دامین، IP Static و اپلیکیشن موبایل.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={fetchGeneralSettings} disabled={isLoadingGeneralSettings}>
                <RefreshCcw className="h-4 w-4 mr-2" /> {isLoadingGeneralSettings ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            <form onSubmit={submitGeneralSettings} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5" /> Deployment & Addressing</CardTitle>
                  <CardDescription>دامین‌ها، آدرس‌های اصلی و IP ثابت برنامه را اینجا نگه‌دار.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deployment Mode</Label>
                    <select
                      value={generalSettings.deployment_mode}
                      onChange={(e) => updateGeneralSetting("deployment_mode", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="local">Local / Development</option>
                      <option value="lan">LAN / Internal Network</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Static Public IP</Label>
                    <Input value={generalSettings.static_public_ip} onChange={(e) => updateGeneralSetting("static_public_ip", e.target.value)} placeholder="مثلاً 185.120.10.20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Domain</Label>
                    <Input value={generalSettings.primary_domain} onChange={(e) => updateGeneralSetting("primary_domain", e.target.value)} placeholder="example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>App Subdomain</Label>
                    <Input value={generalSettings.app_subdomain} onChange={(e) => updateGeneralSetting("app_subdomain", e.target.value)} placeholder="app.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>API Subdomain</Label>
                    <Input value={generalSettings.api_subdomain} onChange={(e) => updateGeneralSetting("api_subdomain", e.target.value)} placeholder="api.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Frontend Base URL</Label>
                    <Input value={generalSettings.frontend_base_url} onChange={(e) => updateGeneralSetting("frontend_base_url", e.target.value)} placeholder="https://app.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Backend Base URL</Label>
                    <Input value={generalSettings.backend_base_url} onChange={(e) => updateGeneralSetting("backend_base_url", e.target.value)} placeholder="https://api.example.com" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Allowed CORS Origins</Label>
                    <Textarea
                      value={generalSettings.allowed_cors_origins}
                      onChange={(e) => updateGeneralSetting("allowed_cors_origins", e.target.value)}
                      placeholder={"https://app.example.com\nhttps://admin.example.com"}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">هر origin را در یک خط جدا بنویس؛ فعلاً ذخیره می‌شود تا در مرحله deployment/runtime استفاده شود.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> Mobile App Settings</CardTitle>
                  <CardDescription>پایه تنظیمات اپ موبایل برای نسخه‌های بعدی.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label>Mobile App Enabled</Label>
                      <p className="text-xs text-muted-foreground mt-1">فعال/غیرفعال بودن سرویس موبایل در تنظیمات برنامه.</p>
                    </div>
                    <Switch checked={generalSettings.mobile_app_enabled} onCheckedChange={(checked) => updateGeneralSetting("mobile_app_enabled", checked)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label>Force Update</Label>
                      <p className="text-xs text-muted-foreground mt-1">برای وقتی که نسخه قدیمی موبایل نباید اجازه ورود داشته باشد.</p>
                    </div>
                    <Switch checked={generalSettings.mobile_force_update} onCheckedChange={(checked) => updateGeneralSetting("mobile_force_update", checked)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Mobile API Base URL</Label>
                    <Input value={generalSettings.mobile_api_base_url} onChange={(e) => updateGeneralSetting("mobile_api_base_url", e.target.value)} placeholder="https://api.example.com/mobile" />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Supported Version</Label>
                    <Input value={generalSettings.mobile_min_version} onChange={(e) => updateGeneralSetting("mobile_min_version", e.target.value)} placeholder="1.0.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Latest Version</Label>
                    <Input value={generalSettings.mobile_latest_version} onChange={(e) => updateGeneralSetting("mobile_latest_version", e.target.value)} placeholder="1.1.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Android Download URL</Label>
                    <Input value={generalSettings.android_download_url} onChange={(e) => updateGeneralSetting("android_download_url", e.target.value)} placeholder="https://.../app.apk" />
                  </div>
                  <div className="space-y-2">
                    <Label>iOS Download URL</Label>
                    <Input value={generalSettings.ios_download_url} onChange={(e) => updateGeneralSetting("ios_download_url", e.target.value)} placeholder="https://apps.apple.com/..." />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5" /> Infrastructure Notes</CardTitle>
                  <CardDescription>یادداشت‌های زیرساختی برای DNS، Reverse Proxy، SSL یا سرور.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={generalSettings.infrastructure_notes}
                    onChange={(e) => updateGeneralSetting("infrastructure_notes", e.target.value)}
                    placeholder="مثلاً: DNS روی Cloudflare است، SSL از Nginx گرفته می‌شود، API پشت reverse proxy است..."
                    rows={4}
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs text-muted-foreground">
                      {generalSettings.updated_at ? `Last update: ${new Date(generalSettings.updated_at).toLocaleString()}` : "هنوز ذخیره نشده"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={resetGeneralSettingsForm}>Defaults</Button>
                      <Button type="submit" disabled={isSavingGeneralSettings}>{isSavingGeneralSettings ? "Saving..." : "Save General Settings"}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">System Users</h2>
                <p className="text-sm text-muted-foreground mt-1">برای هر کاربر شماره موبایل و Chat ID بله را مشخص کن تا OTP روی مسیر خودش ارسال شود.</p>
              </div>
              <Button onClick={handleOpenAddUser} className="gap-2 bg-primary text-white">
                <Plus className="h-4 w-4" /> Add New User
              </Button>
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users by name, phone or Bale chat id..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Phone / SMS OTP</TableHead>
                    <TableHead>Bale Chat ID</TableHead>
                    <TableHead>Role / Access</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">USR-{u.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          <UserCog className="h-4 w-4 text-muted-foreground" /> {u.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" /> {u.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.bale_chat_id ? (
                          <div className="flex items-center gap-2 font-mono text-sm">
                            <MessageCircle className="h-3 w-3 text-muted-foreground" /> {u.bale_chat_id}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set — fallback to admin Bale</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={u.is_superuser ? "default" : "outline"}>{u.is_superuser ? "Super Admin" : (u.role || "viewer")}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{u.is_superuser ? "Full access" : compactAccessLabel(u.permissions_json)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <Badge className="bg-success/15 text-success hover:bg-success/15">
                            <span className="h-1.5 w-1.5 rounded-full bg-success mr-1.5" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openAccessEditor(u)}>
                            <ShieldCheck className="h-3.5 w-3.5" /> Access
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openEditBale(u)}>
                            <Pencil className="h-3.5 w-3.5" /> Bale ID
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap" dir="rtl">
              <div className="text-right">
                <h2 className="text-xl font-semibold tracking-tight">Device Categories</h2>
                <p className="text-sm text-muted-foreground mt-1">اینجا می‌تونی دسته‌بندی دستگاه‌ها رو دستی اضافه کنی؛ مثل Camera، Router، Patch Panel یا هر چیز دیگه.</p>
              </div>
              <Button type="button" variant="outline" onClick={fetchCategories} className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Refresh
              </Button>
            </div>

            <Card className="p-4" dir="rtl">
              <form onSubmit={submitCategory} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="space-y-2">
                  <Label>نام دسته‌بندی</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value, slug: prev.slug || slugifyClient(e.target.value) }))}
                    placeholder="مثلا Camera"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={categoryForm.slug} onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: slugifyClient(e.target.value) }))} placeholder="camera" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>توضیح</Label>
                  <Input value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="اختیاری" />
                </div>
                <Button type="submit" disabled={isSubmittingCategory} className="gap-2">
                  <Plus className="h-4 w-4" /> {isSubmittingCategory ? "در حال ثبت..." : "Add Category"}
                </Button>
              </form>
            </Card>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell><Badge variant="secondary">{category.slug}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{category.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="text-left" dir="rtl">
                <h2 className="text-xl font-semibold tracking-tight text-right">Device Templates Catalog</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl text-right">در این بخش می‌توانید الگوهای دستگاه‌ها را تعریف کنید. دسته‌بندی‌ها از API خوانده می‌شوند و presetها قطعات مناسب را خودکار می‌سازند.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={refreshPreviews} className="gap-2">
                  <RefreshCcw className="h-4 w-4" /> Refresh Preview
                </Button>
                <Button onClick={handleOpenAddTemplate} className="gap-2 bg-primary text-white">
                  <Plus className="h-4 w-4" /> Add New Template
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => {
                const stats = getTemplateStats(tpl);
                return (
                <Card key={tpl.id} className="overflow-hidden flex flex-col group relative">
                  <CardHeader className="bg-muted/30 pb-4 border-b border-border">
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <CardDescription className="font-mono text-xs mb-1">{tpl.manufacturer}</CardDescription>
                        <CardTitle className="text-base">{tpl.model_name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleOpenEditTemplate(tpl)} title="Edit Template">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => initiateDeleteTemplate(tpl.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {getTemplateIcon(tpl.category)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Form Factor:</span><span className="font-medium">{tpl.form_factor}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Category:</span><span className="font-medium">{getCategoryLabel(tpl.category)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Items Count:</span><Badge variant="secondary">{stats.total} Items</Badge></div>
                    </div>

                    <div className="rounded-xl border bg-muted/10 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">Defined Groups</span>
                        <Badge variant="outline">{stats.total} Items</Badge>
                      </div>

                      {getTemplatePortSummaries(tpl).length > 0 ? (
                        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                          {getTemplatePortSummaries(tpl).map((group, index) => (
                            <div key={`${tpl.id}-${group.side}-${group.label}-${group.portType}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border bg-background px-2.5 py-2 text-xs">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{group.label}</div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                                  <span>{group.portType}</span>
                                  <span>•</span>
                                  <span>{SIDE_PREFIX_LABEL[group.side]}</span>
                                  {group.poe > 0 && <span>• PoE {group.poe}</span>}
                                  {group.uplink > 0 && <span>• Uplink {group.uplink}</span>}
                                </div>
                              </div>
                              <Badge variant={group.power > 0 ? "destructive" : group.console > 0 ? "outline" : "secondary"} className="shrink-0">
                                {group.count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed bg-background px-3 py-4 text-center text-xs text-muted-foreground">
                          هنوز هیچ پورت یا آیتمی برای این الگو ثبت نشده است.
                        </div>
                      )}
                    </div>

                    {tpl.front_stencil_url ? (
                      <div className="mt-4 border border-slate-800 rounded-md bg-black relative h-28 w-full overflow-hidden">
                        <div className="absolute top-1/2 left-1/2" style={{ width: "1360px", height: "300px", transform: "translate(-50%, -50%) scale(0.2)", transformOrigin: "center" }}>
                          <iframe src={buildStaticUrl(tpl.front_stencil_url)} title={`${tpl.model_name} Preview`} className="w-full h-full border-none pointer-events-none" scrolling="no" tabIndex={-1} />
                        </div>
                        <div className="absolute inset-0 bg-transparent z-20" />
                      </div>
                    ) : (
                      <div className="mt-4 border border-dashed border-primary/20 bg-primary/5 text-primary/80 rounded-md p-4 flex flex-col items-center justify-center h-28 relative overflow-hidden">
                        <LayoutTemplate className="h-6 w-6 mb-2 opacity-50" />
                        <span className="text-xs font-medium z-10">Logical Faceplate</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
              {templates.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg" dir="rtl">هیچ الگویی ثبت نشده است. از دکمه بالا یک الگوی جدید بسازید.</div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>


      <Dialog open={accessModalOpen} onOpenChange={setAccessModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>مدیریت سطح دسترسی {accessUser?.username}</DialogTitle>
            <DialogDescription>مشخص کن این کاربر چه Client، Site، Room، Rack و Deviceهایی را ببیند یا ویرایش کند.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveUserAccess} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3" dir="ltr">
              <div className="space-y-2">
                <Label>Role</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={accessRole} onChange={(e) => setAccessRole(e.target.value)}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2 rounded-md border p-3 mt-7">
                <input type="checkbox" checked={accessIsActive} onChange={(e) => setAccessIsActive(e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 mt-7 md:col-span-2">
                <input type="checkbox" checked={accessIsSuperuser} onChange={(e) => setAccessIsSuperuser(e.target.checked)} />
                Super Admin / دسترسی کامل بدون محدودیت
              </label>
            </div>

            <Card className="overflow-hidden" dir="rtl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> دسترسی درختی شرکت / سایت / اتاق / رک / دستگاه
                </CardTitle>
                <CardDescription>
                  اگر روی شرکت یا سایت دسترسی بدهی، زیرمجموعه‌های آن هم در بک‌اند قابل مشاهده می‌شوند. برای محدودیت دقیق، فقط همان اتاق، رک یا دستگاه را تیک بزن.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[52vh] overflow-y-auto space-y-4" dir="ltr">
                {accessTree.clients.map((client) => (
                  <div key={client.id} className="rounded-xl border bg-muted/20 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-background p-2 border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{client.name}</div>
                          {client.subtitle && <div className="text-xs text-muted-foreground truncate">{client.subtitle}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.clients.view.includes(client.id)} onChange={() => togglePermissionId("clients", "view", client.id)} disabled={accessIsSuperuser} /> View</label>
                        <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.clients.edit.includes(client.id)} onChange={() => togglePermissionId("clients", "edit", client.id)} disabled={accessIsSuperuser} /> Edit</label>
                      </div>
                    </div>

                    <div className="pl-4 space-y-3 border-l">
                      {(client.sites || []).map((site) => (
                        <div key={site.id} className="rounded-lg border bg-background p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{site.name}</div>
                                {site.subtitle && <div className="text-xs text-muted-foreground truncate">{site.subtitle}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs shrink-0">
                              <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.sites.view.includes(site.id)} onChange={() => togglePermissionId("sites", "view", site.id)} disabled={accessIsSuperuser} /> View</label>
                              <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.sites.edit.includes(site.id)} onChange={() => togglePermissionId("sites", "edit", site.id)} disabled={accessIsSuperuser} /> Edit</label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 pl-5">
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><DoorOpen className="h-3.5 w-3.5" /> Rooms</div>
                              {(site.rooms || []).map((room) => (
                                <div key={room.id} className="rounded-md border p-2 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium truncate">{room.name}</div>
                                      {room.subtitle && <div className="text-[11px] text-muted-foreground truncate">{room.subtitle}</div>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] shrink-0">
                                      <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.rooms.view.includes(room.id)} onChange={() => togglePermissionId("rooms", "view", room.id)} disabled={accessIsSuperuser} /> V</label>
                                      <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.rooms.edit.includes(room.id)} onChange={() => togglePermissionId("rooms", "edit", room.id)} disabled={accessIsSuperuser} /> E</label>
                                    </div>
                                  </div>
                                  {(room.devices || []).length > 0 && <div className="space-y-1 border-t pt-2">
                                    {(room.devices || []).map((device) => (
                                      <div key={device.id} className="flex items-center justify-between gap-2 text-xs rounded bg-muted/30 px-2 py-1">
                                        <span className="truncate">{device.name}</span>
                                        <span className="flex items-center gap-2 shrink-0">
                                          <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.devices.view.includes(device.id)} onChange={() => togglePermissionId("devices", "view", device.id)} disabled={accessIsSuperuser} /> V</label>
                                          <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.devices.edit.includes(device.id)} onChange={() => togglePermissionId("devices", "edit", device.id)} disabled={accessIsSuperuser} /> E</label>
                                        </span>
                                      </div>
                                    ))}
                                  </div>}
                                </div>
                              ))}
                              {(site.rooms || []).length === 0 && <div className="text-xs text-muted-foreground rounded-md border p-3 text-center">اتاقی ثبت نشده</div>}
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Boxes className="h-3.5 w-3.5" /> Racks</div>
                              {(site.racks || []).map((rackItem) => (
                                <div key={rackItem.id} className="rounded-md border p-2 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium truncate">{rackItem.name}</div>
                                      {rackItem.subtitle && <div className="text-[11px] text-muted-foreground truncate">{rackItem.subtitle}</div>}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] shrink-0">
                                      <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.racks.view.includes(rackItem.id)} onChange={() => togglePermissionId("racks", "view", rackItem.id)} disabled={accessIsSuperuser} /> V</label>
                                      <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.racks.edit.includes(rackItem.id)} onChange={() => togglePermissionId("racks", "edit", rackItem.id)} disabled={accessIsSuperuser} /> E</label>
                                    </div>
                                  </div>
                                  {(rackItem.devices || []).length > 0 && <div className="space-y-1 border-t pt-2">
                                    {(rackItem.devices || []).map((device) => (
                                      <div key={device.id} className="flex items-center justify-between gap-2 text-xs rounded bg-muted/30 px-2 py-1">
                                        <span className="truncate">{device.name}</span>
                                        <span className="flex items-center gap-2 shrink-0">
                                          <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.devices.view.includes(device.id)} onChange={() => togglePermissionId("devices", "view", device.id)} disabled={accessIsSuperuser} /> V</label>
                                          <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.devices.edit.includes(device.id)} onChange={() => togglePermissionId("devices", "edit", device.id)} disabled={accessIsSuperuser} /> E</label>
                                        </span>
                                      </div>
                                    ))}
                                  </div>}
                                </div>
                              ))}
                              {(site.racks || []).length === 0 && <div className="text-xs text-muted-foreground rounded-md border p-3 text-center">رکی ثبت نشده</div>}
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Server className="h-3.5 w-3.5" /> Site Devices</div>
                              {(site.devices || []).map((device) => (
                                <div key={device.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">{device.name}</div>
                                    {(device.hostname || device.device_type) && <div className="text-[11px] text-muted-foreground truncate">{device.hostname || device.device_type}</div>}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.devices.view.includes(device.id)} onChange={() => togglePermissionId("devices", "view", device.id)} disabled={accessIsSuperuser} /> V</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" checked={accessPermissions.devices.edit.includes(device.id)} onChange={() => togglePermissionId("devices", "edit", device.id)} disabled={accessIsSuperuser} /> E</label>
                                  </div>
                                </div>
                              ))}
                              {(site.devices || []).length === 0 && <div className="text-xs text-muted-foreground rounded-md border p-3 text-center">دستگاه مستقیمی ثبت نشده</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(client.sites || []).length === 0 && <div className="text-sm text-muted-foreground rounded-lg border bg-background p-4 text-center">برای این شرکت سایتی ثبت نشده است.</div>}
                    </div>
                  </div>
                ))}
                {accessTree.clients.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">ساختار شرکتی برای نمایش وجود ندارد.</div>}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="ltr">
              <Card className="p-4 space-y-3">
                <div className="font-medium">Templates</div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={accessPermissions.templates.view} disabled={accessIsSuperuser} onChange={(e) => setAccessPermissions((prev) => ({ ...prev, templates: { ...prev.templates, view: e.target.checked } }))} /> View templates</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={accessPermissions.templates.edit} disabled={accessIsSuperuser} onChange={(e) => setAccessPermissions((prev) => ({ ...prev, templates: { ...prev.templates, edit: e.target.checked, view: true } }))} /> Edit templates</label>
              </Card>
              <Card className="p-4 space-y-3">
                <div className="font-medium">Systems</div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={accessPermissions.systems.view} disabled={accessIsSuperuser} onChange={(e) => setAccessPermissions((prev) => ({ ...prev, systems: { ...prev.systems, view: e.target.checked } }))} /> View systems</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={accessPermissions.systems.edit} disabled={accessIsSuperuser} onChange={(e) => setAccessPermissions((prev) => ({ ...prev, systems: { ...prev.systems, edit: e.target.checked, view: true } }))} /> Edit systems</label>
              </Card>
              <Card className="p-4 space-y-3">
                <div className="font-medium">Settings</div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={accessPermissions.settings.view} disabled={accessIsSuperuser} onChange={(e) => setAccessPermissions((prev) => ({ ...prev, settings: { ...prev.settings, view: e.target.checked } }))} /> View settings</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={accessPermissions.settings.edit} disabled={accessIsSuperuser} onChange={(e) => setAccessPermissions((prev) => ({ ...prev, settings: { ...prev.settings, edit: e.target.checked, view: true } }))} /> Edit settings</label>
              </Card>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setAccessModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSavingAccess}>{isSavingAccess ? "Saving..." : "Save Access"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openUserModal} onOpenChange={setOpenUserModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitUser}>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new team member. OTP can be delivered by SMS and Bale.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} placeholder="e.g. admin" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Enter a strong password" required />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number / SMS OTP</Label>
                <Input type="tel" value={userForm.phone_number} onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })} placeholder="09xxxxxxxxx" required />
              </div>
              <div className="space-y-2">
                <Label>Bale Numeric Chat ID</Label>
                <Input inputMode="numeric" value={userForm.bale_chat_id} onChange={(e) => setUserForm({ ...userForm, bale_chat_id: e.target.value })} placeholder="مثلاً 1720912117" />
                <p className="text-xs text-muted-foreground">اگر خالی باشد، OTP بله به Chat ID ادمین ارسال می‌شود.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenUserModal(false)}>Cancel</Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editBaleOpen} onOpenChange={setEditBaleOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={saveBaleChatId}>
            <DialogHeader>
              <DialogTitle>Edit Bale Chat ID</DialogTitle>
              <DialogDescription>شناسه عددی بله برای کاربر {selectedUser?.username} را وارد کن.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bale Numeric Chat ID</Label>
                <Input inputMode="numeric" value={baleChatIdDraft} onChange={(e) => setBaleChatIdDraft(e.target.value)} placeholder="مثلاً 1720912117" />
                <p className="text-xs text-muted-foreground">اگر خالی ذخیره شود، OTP بله برای این کاربر به ادمین ارسال می‌شود.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditBaleOpen(false)}>Cancel</Button>
              <Button type="submit">Save Bale ID</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openTemplateModal} onOpenChange={handleTemplateModalOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={submitTemplate}>
            <DialogHeader>
              <DialogTitle>Add Device Template</DialogTitle>
              <DialogDescription>Define a blueprint, choose category/preset, upload HTML stencils, and create ports/components.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label>Manufacturer (Brand)</Label><Input value={templateForm.manufacturer} onChange={(e) => setTemplateForm({ ...templateForm, manufacturer: e.target.value })} placeholder="e.g. MikroTik or Irannetwork" required /></div>
              <div className="space-y-2"><Label>Model Name</Label><Input value={templateForm.model_name} onChange={(e) => setTemplateForm({ ...templateForm, model_name: e.target.value })} placeholder="e.g. CCR1009 or 24 Port Patch Panel" required /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={templateForm.category} onChange={(e) => setTemplateCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                  {!categories.some((category) => category.slug === "server") && <option value="server">Server</option>}
                  {!categories.some((category) => category.slug === "pdu") && <option value="pdu">PDU / Power Distribution</option>}
                </select>
              </div>
              <div className="space-y-2"><Label>Form Factor</Label><Input value={templateForm.form_factor} onChange={(e) => setTemplateForm({ ...templateForm, form_factor: e.target.value })} placeholder="e.g. 1U or 3U" required /></div>

              <div className="col-span-2 rounded-xl border bg-blue-50/60 dark:bg-blue-950/20 p-4 space-y-3" dir="rtl">
                <div>
                  <h3 className="font-semibold">قابلیت‌های دستگاه</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    این قابلیت‌ها از Template به Device منتقل می‌شوند؛ مثلاً اگر PoE فعال باشد، موقع ساخت دستگاه و اتصال پورت‌ها PoE به‌صورت پیش‌فرض روشن می‌شود.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={templateForm.poe} onChange={(e) => setTemplateForm({ ...templateForm, poe: e.target.checked })} />
                    <span>PoE Capable</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={templateForm.rack_mountable} onChange={(e) => setTemplateForm({ ...templateForm, rack_mountable: e.target.checked })} />
                    <span>Rack Mount</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={templateForm.field_capable} onChange={(e) => setTemplateForm({ ...templateForm, field_capable: e.target.checked })} />
                    <span>Field Device</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={templateForm.has_front_faceplate} onChange={(e) => setTemplateForm({ ...templateForm, has_front_faceplate: e.target.checked })} />
                    <span>Front Faceplate</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={templateForm.has_rear_faceplate} onChange={(e) => setTemplateForm({ ...templateForm, has_rear_faceplate: e.target.checked })} />
                    <span>Rear Faceplate</span>
                  </label>
                </div>
              </div>

              <div className="col-span-2 border rounded-xl p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div><h3 className="font-semibold">Quick Presets</h3><p className="text-xs text-muted-foreground mt-1">برای دستگاه‌های آماده، preset بزن تا port/componentها خودکار ساخته شوند.</p></div>
                  <Button type="button" variant="outline" size="sm" onClick={applyHpDl360Preset}>Preset: HP DL360 Gen10</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_BUTTONS.map((preset) => <Button key={preset.key} type="button" variant="outline" size="sm" onClick={() => applyTemplatePreset(preset.key)}>{preset.label}</Button>)}
                </div>
              </div>

              {templateForm.category === "server" && (
                <div className="col-span-2 border rounded-xl p-4 bg-purple-50/60 dark:bg-purple-950/20 space-y-4" dir="rtl">
                  {/* ============================================================
                      SERVER HARDWARE BUILDER UI
                      این قسمت فقط UI قطعات سرور است.
                      برای اضافه/کم کردن قطعات سرور، فقط همین بلاک و DEFAULT_SERVER_HARDWARE_ITEMS را تغییر بده.
                  ============================================================ */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Server className="h-4 w-4 text-purple-600" />
                        Server Hardware Builder
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        CPU، RAM، پاور، کارت شبکه، Disk Bay و هر قطعه دلخواه را با تعداد، نوع، سمت دستگاه و مشخصات دقیق تعریف کن.
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button type="button" variant="outline" size="sm" onClick={resetServerHardwareItems}>
                        Reset Defaults
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={applyHpDl360Preset}>
                        Preset: HP DL360 Gen10
                      </Button>
                      <Button type="button" size="sm" onClick={addServerHardwareItem} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add Custom Item
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-3 text-sm flex items-center justify-between">
                    <span>تعداد آیتم‌هایی که برای این سرور ساخته می‌شود:</span>
                    <Badge className="bg-purple-600">{selectedServerPartsCount} Items</Badge>
                  </div>

                  <div className="space-y-3">
                    {serverHardwareItems.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 transition ${
                          item.enabled
                            ? "bg-white dark:bg-slate-900 border-purple-300 shadow-sm"
                            : "bg-background/40 opacity-70"
                        }`}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                          <label className="lg:col-span-1 flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => updateServerHardwareItem(item.id, "enabled", e.target.checked)}
                            />
                            <span className="text-purple-600">{getHardwareIcon(item.icon)}</span>
                          </label>

                          <div className="lg:col-span-2 space-y-1">
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={item.label}
                              onChange={(e) => updateServerHardwareItem(item.id, "label", e.target.value)}
                              className="h-9"
                              placeholder="RAM Slot"
                            />
                          </div>

                          <div className="lg:col-span-2 space-y-1">
                            <Label className="text-xs">Name / Pattern</Label>
                            <Input
                              value={item.prefix}
                              onChange={(e) => updateServerHardwareItem(item.id, "prefix", e.target.value)}
                              className="h-9"
                              placeholder="RAM Slot یا NIC Port"
                            />
                          </div>

                          <div className="lg:col-span-1 space-y-1">
                            <Label className="text-xs">Count</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.count}
                              onChange={(e) =>
                                updateServerHardwareItem(item.id, "count", Number.parseInt(e.target.value, 10) || 0)
                              }
                              className="h-9"
                            />
                          </div>

                          <div className="lg:col-span-2 space-y-1">
                            <Label className="text-xs">Type</Label>
                            <select
                              value={item.port_type}
                              onChange={(e) => updateServerHardwareItem(item.id, "port_type", e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              {PORT_TYPE_OPTIONS.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="lg:col-span-1 space-y-1">
                            <Label className="text-xs">Side</Label>
                            <select
                              value={item.side}
                              onChange={(e) =>
                                updateServerHardwareItem(item.id, "side", e.target.value as ServerHardwareSide)
                              }
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              <option value="FRONT">FRONT</option>
                              <option value="REAR">REAR</option>
                              <option value="INTERNAL">INTERNAL</option>
                            </select>
                          </div>

                          <div className="lg:col-span-2 space-y-1">
                            <Label className="text-xs">Category</Label>
                            <Input
                              value={item.category}
                              onChange={(e) => updateServerHardwareItem(item.id, "category", e.target.value)}
                              className="h-9"
                              placeholder="Memory / Compute / Network"
                            />
                          </div>

                          <div className="lg:col-span-1 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive"
                              onClick={() => removeServerHardwareItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Spec / Details</Label>
                            <Input
                              value={item.spec}
                              onChange={(e) => updateServerHardwareItem(item.id, "spec", e.target.value)}
                              className="h-9"
                              placeholder="مثلا 32GB DDR4 3200 یا 800W یا 10G"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateServerHardwareItem(item.id, "description", e.target.value)}
                              className="h-9"
                              placeholder="توضیح داخلی برای این قطعه"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {templateForm.category === "pdu" && (
                <div className="col-span-2 border rounded-xl p-4 bg-yellow-50/70 dark:bg-yellow-950/20 space-y-4" dir="rtl">
                  {/* ============================================================
                      PDU BUILDER UI
                      این قسمت فقط برای PDU افقی/عمودی و پورت‌های برق است.
                      فایل HTML افقی یا عمودی را آپلود کن؛ PORT_COUNT بر اساس Outlet Count خودکار تنظیم می‌شود.
                  ============================================================ */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <PlugZap className="h-4 w-4 text-yellow-600" />
                        PDU / Power Distribution Builder
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        نوع PDU، تعداد خروجی‌های برق، ورودی برق و کلید اصلی را مشخص کن تا پورت‌های برق دستگاه خودکار ساخته شوند.
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button type="button" variant="outline" size="sm" onClick={resetPduBuilder}>
                        Reset PDU
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyTemplatePreset("pdu-horizontal")}>
                        Preset: Horizontal 1U
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyTemplatePreset("pdu-vertical")}>
                        Preset: Vertical 0U
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-3 text-sm flex items-center justify-between">
                    <span>تعداد پورت/کامپوننتی که برای این PDU ساخته می‌شود:</span>
                    <Badge className="bg-yellow-600">{selectedPduPortsCount} Items</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">PDU Type</Label>
                      <select
                        value={pduBuilder.orientation}
                        onChange={(e) => updatePduBuilder("orientation", e.target.value as PduOrientation)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="horizontal">Horizontal / Rack 1U</option>
                        <option value="vertical">Vertical / Rack 0U</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Outlet Count</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pduBuilder.outlet_count}
                        onChange={(e) => updatePduBuilder("outlet_count", Number.parseInt(e.target.value, 10) || 1)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Power Input Count</Label>
                      <Input
                        type="number"
                        min="0"
                        value={pduBuilder.input_count}
                        onChange={(e) => updatePduBuilder("input_count", Number.parseInt(e.target.value, 10) || 0)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Voltage / Spec</Label>
                      <Input
                        value={pduBuilder.voltage}
                        onChange={(e) => updatePduBuilder("voltage", e.target.value)}
                        className="h-9"
                        placeholder="230V / 16A / C13"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-white dark:bg-slate-900 p-3 space-y-3">
                      <h4 className="font-medium text-sm">Power Outlets</h4>
                      <div className="space-y-1">
                        <Label className="text-xs">Name / Pattern</Label>
                        <Input
                          value={pduBuilder.outlet_prefix}
                          onChange={(e) => updatePduBuilder("outlet_prefix", e.target.value)}
                          className="h-9"
                          placeholder="PDU Outlet"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <select
                          value={pduBuilder.outlet_type}
                          onChange={(e) => updatePduBuilder("outlet_type", e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        >
                          {PORT_TYPE_OPTIONS.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Input
                          value={pduBuilder.outlet_category}
                          onChange={(e) => updatePduBuilder("outlet_category", e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-white dark:bg-slate-900 p-3 space-y-3">
                      <h4 className="font-medium text-sm">Power Inputs</h4>
                      <div className="space-y-1">
                        <Label className="text-xs">Name / Pattern</Label>
                        <Input
                          value={pduBuilder.input_prefix}
                          onChange={(e) => updatePduBuilder("input_prefix", e.target.value)}
                          className="h-9"
                          placeholder="Power Input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <select
                          value={pduBuilder.input_type}
                          onChange={(e) => updatePduBuilder("input_type", e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        >
                          {PORT_TYPE_OPTIONS.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Input
                          value={pduBuilder.input_category}
                          onChange={(e) => updatePduBuilder("input_category", e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-white dark:bg-slate-900 p-3 space-y-3">
                      <h4 className="font-medium text-sm">Control / Breaker</h4>
                      <div className="space-y-1">
                        <Label className="text-xs">Control Count</Label>
                        <Input
                          type="number"
                          min="0"
                          value={pduBuilder.control_count}
                          onChange={(e) => updatePduBuilder("control_count", Number.parseInt(e.target.value, 10) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={pduBuilder.control_prefix}
                          onChange={(e) => updatePduBuilder("control_prefix", e.target.value)}
                          className="h-9"
                          placeholder="Main Power Switch"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Input
                          value={pduBuilder.control_category}
                          onChange={(e) => updatePduBuilder("control_category", e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                    برای PDU افقی فایل <b>Rack Pdu Dynamic Template.html</b> را در Front Stencil بگذار. برای PDU عمودی فایل <b>Vertical PDU.html</b> را بگذار. عدد <b>PORT_COUNT</b> داخل HTML هنگام ذخیره Template خودکار با Outlet Count جایگزین می‌شود.
                  </div>
                </div>
              )}

              <div className="col-span-2 grid grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900 mt-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Front Faceplate Stencil (HTML/SVG)</Label>
                  <Input type="file" accept=".html,.svg" onChange={(e) => setTemplateForm({ ...templateForm, front_stencil: e.target.files?.[0] || null })} className="cursor-pointer file:text-blue-600 file:bg-blue-50 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground">اول فایل را انتخاب کن، بعد روی دکمه Upload/Preview بزن تا پایین نمایش داده شود.</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => loadSelectedStencilPreview("front")} disabled={!templateForm.front_stencil}>
                      Upload / Preview Front
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Rear Faceplate Stencil (Optional)</Label>
                  <Input type="file" accept=".html,.svg" onChange={(e) => setTemplateForm({ ...templateForm, back_stencil: e.target.files?.[0] || null })} className="cursor-pointer file:text-purple-600 file:bg-purple-50 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2" />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-muted-foreground">برای پشت دستگاه هم همین کار را انجام بده.</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => loadSelectedStencilPreview("rear")} disabled={!templateForm.back_stencil}>
                      Upload / Preview Rear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="col-span-2 rounded-xl border bg-amber-50/50 dark:bg-amber-950/10 p-4 space-y-4" dir="rtl">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-semibold">نمای زنده Front / Rear و تعریف دقیق آیتم‌ها</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      بعد از انتخاب فایل HTML یا SVG، همین‌جا نمای جلو و پشت دستگاه را می‌بینی. روی هر پورت یا قطعه در خود قالب کلیک کن تا به لیست پایین اضافه شود و نوع، نقش، PoE، Uplink، Power و توضیح آن را دقیق مشخص کنی.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant={activeFaceplateSide === "front" ? "default" : "outline"} size="sm" onClick={() => setActiveFaceplateSide("front")}>Front</Button>
                    <Button type="button" variant={activeFaceplateSide === "rear" ? "default" : "outline"} size="sm" onClick={() => setActiveFaceplateSide("rear")}>Rear</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 items-start">
                  <div className="rounded-xl border bg-white dark:bg-slate-950 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                      <div>
                        <div className="text-sm font-semibold">نمای کامل Front و Rear دستگاه</div>
                        <div className="text-[11px] text-muted-foreground">نمای Front و Rear همیشه زیر هم و با عرض کامل نمایش داده می‌شوند؛ برای ثبت آیتم، روی پورت یا قطعه داخل همان سمت کلیک کن.</div>
                      </div>
                      <Badge variant="outline">Interactive</Badge>
                    </div>
                    <div className="flex flex-col gap-5 p-4">
                      <div className={`rounded-xl border overflow-hidden ${activeFaceplateSide === "front" ? "ring-2 ring-blue-500/50" : ""}`} onMouseEnter={() => setActiveFaceplateSide("front")}>
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-blue-50 dark:bg-blue-950/20">
                          <div className="text-sm font-semibold">Front Faceplate</div>
                          <Badge variant="outline">Front</Badge>
                        </div>
                        {frontStencilPreviewUrl ? (
                          <div className="w-full overflow-x-auto overflow-y-hidden bg-white" dir="ltr">
                            <iframe src={frontStencilPreviewUrl} title="Front Template Preview" className="h-[520px] w-[1500px] min-w-[1500px] max-w-none border-none bg-white" scrolling="auto" />
                          </div>
                        ) : (
                          <div className="h-[430px] flex items-center justify-center text-sm text-muted-foreground p-6 text-center">فایل Front هنوز انتخاب نشده است.</div>
                        )}
                      </div>
                      <div className={`rounded-xl border overflow-hidden ${activeFaceplateSide === "rear" ? "ring-2 ring-purple-500/50" : ""}`} onMouseEnter={() => setActiveFaceplateSide("rear")}>
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-purple-50 dark:bg-purple-950/20">
                          <div className="text-sm font-semibold">Rear Faceplate</div>
                          <Badge variant="outline">Rear</Badge>
                        </div>
                        {rearStencilPreviewUrl ? (
                          <div className="w-full overflow-x-auto overflow-y-hidden bg-white" dir="ltr">
                            <iframe src={rearStencilPreviewUrl} title="Rear Template Preview" className="h-[520px] w-[1500px] min-w-[1500px] max-w-none border-none bg-white" scrolling="auto" />
                          </div>
                        ) : (
                          <div className="h-[430px] flex items-center justify-center text-sm text-muted-foreground p-6 text-center">فایل Rear هنوز انتخاب نشده است.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">لیست آیتم‌های انتخاب‌شده</h4>
                        <p className="text-xs text-muted-foreground mt-1">هر آیتمی که از روی قالب کلیک کنی اینجا اضافه می‌شود و با دکمه سطل زباله پاک می‌شود.</p>
                      </div>
                      <Badge>{mappedTemplateParts.length} Item(s)</Badge>
                    </div>

                    <div className="max-h-56 overflow-auto rounded-lg border divide-y">
                      {mappedTemplateParts.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">هنوز آیتمی از روی قالب انتخاب نشده است.</div>
                      ) : mappedTemplateParts.map((item) => (
                        <div key={item.id} className={`p-2 flex items-center justify-between gap-2 ${selectedMappedPartId === item.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}>
                          <button type="button" className="text-right flex-1" onClick={() => setSelectedMappedPartId(item.id)}>
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-[11px] text-muted-foreground">{item.side.toUpperCase()} • {item.port_type} • {item.category}</div>
                          </button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMappedPart(item.id)} title="حذف آیتم">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {selectedMappedPartId && mappedTemplateParts.find((item) => item.id === selectedMappedPartId) && (() => {
                      const selectedPart = mappedTemplateParts.find((item) => item.id === selectedMappedPartId)!;
                      return (
                        <div className="space-y-3 rounded-xl border p-3 bg-muted/20">
                          <div className="font-semibold text-sm">تنظیمات آیتم: {selectedPart.name}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Name</Label>
                              <Input value={selectedPart.name} onChange={(e) => updateMappedPart(selectedPart.id, "name", e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Side</Label>
                              <select value={selectedPart.side} onChange={(e) => updateMappedPart(selectedPart.id, "side", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                <option value="front">Front</option>
                                <option value="rear">Rear</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Type</Label>
                              <select value={selectedPart.port_type} onChange={(e) => updateMappedPart(selectedPart.id, "port_type", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                {PORT_TYPE_OPTIONS.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Role</Label>
                              <select value={selectedPart.role || "other"} onChange={(e) => updateMappedPart(selectedPart.id, "role", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                {PORT_ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Category</Label>
                              <Input value={selectedPart.category} onChange={(e) => updateMappedPart(selectedPart.id, "category", e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Component Kind</Label>
                              <select value={selectedPart.component_kind || "other"} onChange={(e) => updateMappedPart(selectedPart.id, "component_kind", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                                {COMPONENT_KIND_OPTIONS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                            <label className="flex items-center gap-2 rounded-lg border px-2 py-2 bg-background"><input type="checkbox" checked={Boolean(selectedPart.poe) && !Boolean(selectedPart.power)} disabled={Boolean(selectedPart.power)} onChange={(e) => updateMappedPart(selectedPart.id, "poe", e.target.checked)} /> PoE</label>
                            <label className="flex items-center gap-2 rounded-lg border px-2 py-2 bg-background"><input type="checkbox" checked={Boolean(selectedPart.data_port)} onChange={(e) => updateMappedPart(selectedPart.id, "data_port", e.target.checked)} /> Data</label>
                            <label className="flex items-center gap-2 rounded-lg border px-2 py-2 bg-background"><input type="checkbox" checked={Boolean(selectedPart.uplink)} onChange={(e) => updateMappedPart(selectedPart.id, "uplink", e.target.checked)} /> Uplink</label>
                            <label className="flex items-center gap-2 rounded-lg border px-2 py-2 bg-background"><input type="checkbox" checked={Boolean(selectedPart.console)} onChange={(e) => updateMappedPart(selectedPart.id, "console", e.target.checked)} /> Console</label>
                            <label className="flex items-center gap-2 rounded-lg border px-2 py-2 bg-background"><input type="checkbox" checked={Boolean(selectedPart.power)} onChange={(e) => updateMappedPart(selectedPart.id, "power", e.target.checked)} /> Power</label>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description / Use</Label>
                            <Input value={selectedPart.description || ""} onChange={(e) => updateMappedPart(selectedPart.id, "description", e.target.value)} placeholder="مثلاً Uplink to Core, Power Supply 1, Management Port ..." className="h-9" />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {templateForm.category !== "server" && templateForm.category !== "pdu" && (
                <div className="col-span-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <Label className="text-base font-semibold">Port / Component Configurations</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        برای هر گروه مشخص کن دقیقاً چه چیزی است: پورت شبکه، Uplink، Console، Power، PSU، Fan، Disk Bay و اینکه PoE دارد یا نه.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPortGroup} className="gap-1 h-8">
                      <Plus className="h-3.5 w-3.5" /> Add Group
                    </Button>
                  </div>


                  <div className="space-y-3">
                    {templateForm.port_groups.map((group, index) => (
                      <div key={index} className="rounded-xl border bg-muted/10 p-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="space-y-1 md:col-span-1">
                            <Label className="text-xs">Count</Label>
                            <Input
                              type="number"
                              min="1"
                              value={group.count}
                              onChange={(e) => updatePortGroup(index, "count", Number.parseInt(e.target.value, 10) || 1)}
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-3">
                            <Label className="text-xs">Name / Pattern</Label>
                            <Input
                              value={group.prefix}
                              onChange={(e) => updatePortGroup(index, "prefix", e.target.value)}
                              placeholder="Port یا Gi1/0/{n}"
                              className="h-9"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Type</Label>
                            <select
                              value={group.port_type}
                              onChange={(e) => updatePortGroup(index, "port_type", e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              {PORT_TYPE_OPTIONS.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Role</Label>
                            <select
                              value={group.role || inferPortRole(group.port_type, group.category)}
                              onChange={(e) => updatePortGroup(index, "role", e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              {PORT_ROLE_OPTIONS.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Component</Label>
                            <select
                              value={group.component_kind || inferComponentKind(group.port_type, group.category)}
                              onChange={(e) => updatePortGroup(index, "component_kind", e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              {COMPONENT_KIND_OPTIONS.map((kind) => (
                                <option key={kind.value} value={kind.value}>
                                  {kind.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <Label className="text-xs">Category / Tab</Label>
                            <select
                              value={group.category}
                              onChange={(e) => updatePortGroup(index, "category", e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            >
                              {!PORT_CATEGORY_OPTIONS.includes(group.category) && group.category && (
                                <option value={group.category}>{group.category}</option>
                              )}
                              {PORT_CATEGORY_OPTIONS.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                          <div className="space-y-1">
                            <Label className="text-xs">Side</Label>
                            <select
                              value={resolveGroupSide(group)}
                              onChange={(e) => updatePortGroup(index, "side", e.target.value as "front" | "rear" | "internal")}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                            >
                              {PORT_SIDE_OPTIONS.map((side) => (
                                <option key={side.value} value={side.value}>{side.label}</option>
                              ))}
                            </select>
                          </div>

                          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(group.data_port ?? isDataPortType(group.port_type, group.category))}
                              onChange={(e) => updatePortGroup(index, "data_port", e.target.checked)}
                            />
                            <span>Data Port</span>
                          </label>

                          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(group.poe) && !Boolean(group.power ?? isPowerPortType(group.port_type, group.category))}
                              disabled={Boolean(group.power ?? isPowerPortType(group.port_type, group.category))}
                              onChange={(e) => updatePortGroup(index, "poe", e.target.checked)}
                            />
                            <span>PoE</span>
                          </label>

                          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(group.uplink)}
                              onChange={(e) => updatePortGroup(index, "uplink", e.target.checked)}
                            />
                            <span>Uplink</span>
                          </label>

                          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(group.console)}
                              onChange={(e) => updatePortGroup(index, "console", e.target.checked)}
                            />
                            <span>Console</span>
                          </label>

                          <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(group.power ?? isPowerPortType(group.port_type, group.category))}
                              onChange={(e) => updatePortGroup(index, "power", e.target.checked)}
                            />
                            <span>Power</span>
                          </label>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive justify-self-end"
                            onClick={() => removePortGroup(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Description / Note</Label>
                          <Input
                            value={group.description || ""}
                            onChange={(e) => updatePortGroup(index, "description", e.target.value)}
                            placeholder="مثلاً: پورت‌های PoE برای دوربین‌ها، Uplink trunk، ورودی برق پاور..."
                            className="h-9"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => handleTemplateModalOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isSubmittingTemplate}>{isSubmittingTemplate ? "Saving..." : "Save Template"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditTemplateModal} onOpenChange={(val) => { if (!isSubmittingTemplate) setOpenEditTemplateModal(val); }}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={submitEditTemplate}>
            <DialogHeader><DialogTitle>Edit Device Template</DialogTitle><DialogDescription>Update the details or replace the faceplate stencils.</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label>Manufacturer (Brand)</Label><Input value={editTemplateForm.manufacturer} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, manufacturer: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Model Name</Label><Input value={editTemplateForm.model_name} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, model_name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Category</Label><select value={editTemplateForm.category} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, category: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></div>
              <div className="space-y-2"><Label>Form Factor</Label><Input value={editTemplateForm.form_factor} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, form_factor: e.target.value })} required /></div>
              <div className="col-span-2 rounded-xl border bg-blue-50/60 dark:bg-blue-950/20 p-4 space-y-3" dir="rtl">
                <h3 className="font-semibold">قابلیت‌های دستگاه</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer"><input type="checkbox" checked={editTemplateForm.poe} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, poe: e.target.checked })} /> PoE Capable</label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer"><input type="checkbox" checked={editTemplateForm.rack_mountable} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, rack_mountable: e.target.checked })} /> Rack Mount</label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer"><input type="checkbox" checked={editTemplateForm.field_capable} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, field_capable: e.target.checked })} /> Field Device</label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer"><input type="checkbox" checked={editTemplateForm.has_front_faceplate} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, has_front_faceplate: e.target.checked })} /> Front Faceplate</label>
                  <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm cursor-pointer"><input type="checkbox" checked={editTemplateForm.has_rear_faceplate} onChange={(e) => setEditTemplateForm({ ...editTemplateForm, has_rear_faceplate: e.target.checked })} /> Rear Faceplate</label>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900 mt-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Replace Front Stencil</Label>
                  <Input type="file" accept=".html,.svg" onChange={(e) => setEditTemplateForm({ ...editTemplateForm, front_stencil: e.target.files?.[0] || null })} className="cursor-pointer text-xs" />
                  <Button type="button" size="sm" variant="outline" onClick={() => loadEditStencilPreview("front")} disabled={!editTemplateForm.front_stencil}>Upload / Preview Front</Button>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Replace Rear Stencil</Label>
                  <Input type="file" accept=".html,.svg" onChange={(e) => setEditTemplateForm({ ...editTemplateForm, back_stencil: e.target.files?.[0] || null })} className="cursor-pointer text-xs" />
                  <Button type="button" size="sm" variant="outline" onClick={() => loadEditStencilPreview("back")} disabled={!editTemplateForm.back_stencil}>Upload / Preview Rear</Button>
                </div>
              </div>

              <div className="col-span-2 rounded-xl border bg-amber-50/50 dark:bg-amber-950/10 p-4 space-y-4" dir="rtl">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-semibold">نمای Front / Rear همین Template</h3>
                    <p className="text-xs text-muted-foreground mt-1">در حالت Edit هم فایل فعلی را می‌بینی. اگر فایل جدید انتخاب کردی، روی Upload/Preview بزن تا جایگزین پیش‌نمایش شود.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant={activeFaceplateSide === "front" ? "default" : "outline"} size="sm" onClick={() => setActiveFaceplateSide("front")}>Front</Button>
                    <Button type="button" variant={activeFaceplateSide === "rear" ? "default" : "outline"} size="sm" onClick={() => setActiveFaceplateSide("rear")}>Rear</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 items-start">
                  <div className="rounded-xl border bg-white dark:bg-slate-950 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                      <div>
                        <div className="text-sm font-semibold">نمای کامل Front و Rear همین Template</div>
                        <div className="text-[11px] text-muted-foreground">نمای Front و Rear زیر هم و با عرض کامل نمایش داده می‌شود تا Switch یا هر دستگاهی کامل و تمیز دیده شود.</div>
                      </div>
                      <Badge variant="outline">Edit Preview</Badge>
                    </div>
                    <div className="flex flex-col gap-5 p-4">
                      <div className={`rounded-xl border overflow-hidden ${activeFaceplateSide === "front" ? "ring-2 ring-blue-500/50" : ""}`} onMouseEnter={() => setActiveFaceplateSide("front")}>
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-blue-50 dark:bg-blue-950/20">
                          <div className="text-sm font-semibold">Front Faceplate</div>
                          <Badge variant="outline">Front</Badge>
                        </div>
                        {frontStencilPreviewUrl ? (
                          <div className="w-full overflow-x-auto overflow-y-hidden bg-white" dir="ltr">
                            <iframe src={frontStencilPreviewUrl} title="Template Edit Front Preview" className="h-[520px] w-[1500px] min-w-[1500px] max-w-none border-none bg-white" scrolling="auto" />
                          </div>
                        ) : (
                          <div className="h-[430px] flex items-center justify-center text-sm text-muted-foreground p-6 text-center">برای Front فایل preview وجود ندارد.</div>
                        )}
                      </div>
                      <div className={`rounded-xl border overflow-hidden ${activeFaceplateSide === "rear" ? "ring-2 ring-purple-500/50" : ""}`} onMouseEnter={() => setActiveFaceplateSide("rear")}>
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-purple-50 dark:bg-purple-950/20">
                          <div className="text-sm font-semibold">Rear Faceplate</div>
                          <Badge variant="outline">Rear</Badge>
                        </div>
                        {rearStencilPreviewUrl ? (
                          <div className="w-full overflow-x-auto overflow-y-hidden bg-white" dir="ltr">
                            <iframe src={rearStencilPreviewUrl} title="Template Edit Rear Preview" className="h-[520px] w-[1500px] min-w-[1500px] max-w-none border-none bg-white" scrolling="auto" />
                          </div>
                        ) : (
                          <div className="h-[430px] flex items-center justify-center text-sm text-muted-foreground p-6 text-center">برای Rear فایل preview وجود ندارد.</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h4 className="font-semibold">Group / Port های Template</h4>
                        <p className="text-xs text-muted-foreground mt-1">گروه‌های ذخیره‌شده این الگو اینجا نمایش داده می‌شوند؛ می‌توانی حذف، ویرایش یا گروه جدید اضافه کنی.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant={editActiveTab === "groups" ? "default" : "outline"} onClick={() => setEditActiveTab("groups")}>Groups ({editPortGroups.length})</Button>
                        <Button type="button" size="sm" variant={editActiveTab === "items" ? "default" : "outline"} onClick={() => setEditActiveTab("items")}>New Clicked Items ({editMappedTemplateParts.length})</Button>
                      </div>
                    </div>

                    {editActiveTab === "groups" ? (
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <Button type="button" variant="outline" size="sm" onClick={addEditPortGroup} className="gap-1 h-8">
                            <Plus className="h-3.5 w-3.5" /> Add Group
                          </Button>
                        </div>
                        <div className="max-h-[430px] overflow-auto space-y-3 pr-1">
                          {editPortGroups.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground text-center border rounded-lg">هیچ گروهی برای این Template ثبت نشده؛ با Add Group یک گروه جدید بساز.</div>
                          ) : editPortGroups.map((group, index) => (
                            <div key={index} className="rounded-xl border bg-muted/10 p-3 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="space-y-1 md:col-span-1"><Label className="text-xs">Count</Label><Input type="number" min="1" value={group.count} onChange={(e) => updateEditPortGroup(index, "count", Number.parseInt(e.target.value, 10) || 1)} className="h-9" /></div>
                                <div className="space-y-1 md:col-span-3"><Label className="text-xs">Name / Pattern</Label><Input value={group.prefix} onChange={(e) => updateEditPortGroup(index, "prefix", e.target.value)} placeholder="Port یا Gi1/0/{n}" className="h-9" /></div>
                                <div className="space-y-1 md:col-span-2"><Label className="text-xs">Type</Label><select value={group.port_type} onChange={(e) => updateEditPortGroup(index, "port_type", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">{PORT_TYPE_OPTIONS.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
                                <div className="space-y-1 md:col-span-2"><Label className="text-xs">Role</Label><select value={group.role || inferPortRole(group.port_type, group.category)} onChange={(e) => updateEditPortGroup(index, "role", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">{PORT_ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></div>
                                <div className="space-y-1 md:col-span-2"><Label className="text-xs">Component</Label><select value={group.component_kind || inferComponentKind(group.port_type, group.category)} onChange={(e) => updateEditPortGroup(index, "component_kind", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">{COMPONENT_KIND_OPTIONS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></div>
                                <div className="space-y-1 md:col-span-2"><Label className="text-xs">Category / Tab</Label><select value={group.category} onChange={(e) => updateEditPortGroup(index, "category", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">{!PORT_CATEGORY_OPTIONS.includes(group.category) && group.category && <option value={group.category}>{group.category}</option>}{PORT_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                                <div className="space-y-1"><Label className="text-xs">Side</Label><select value={resolveGroupSide(group)} onChange={(e) => updateEditPortGroup(index, "side", e.target.value as "front" | "rear" | "internal")} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs">{PORT_SIDE_OPTIONS.map((side) => <option key={side.value} value={side.value}>{side.label}</option>)}</select></div>
                                <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(group.data_port ?? isDataPortType(group.port_type, group.category))} onChange={(e) => updateEditPortGroup(index, "data_port", e.target.checked)} /><span>Data Port</span></label>
                                <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(group.poe) && !Boolean(group.power ?? isPowerPortType(group.port_type, group.category))} disabled={Boolean(group.power ?? isPowerPortType(group.port_type, group.category))} onChange={(e) => updateEditPortGroup(index, "poe", e.target.checked)} /><span>PoE</span></label>
                                <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(group.uplink)} onChange={(e) => updateEditPortGroup(index, "uplink", e.target.checked)} /><span>Uplink</span></label>
                                <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(group.console)} onChange={(e) => updateEditPortGroup(index, "console", e.target.checked)} /><span>Console</span></label>
                                <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(group.power ?? isPowerPortType(group.port_type, group.category))} onChange={(e) => updateEditPortGroup(index, "power", e.target.checked)} /><span>Power</span></label>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive justify-self-end" onClick={() => removeEditPortGroup(index)} title="حذف گروه"><X className="h-4 w-4" /></Button>
                              </div>
                              <div className="space-y-1"><Label className="text-xs">Description / Note</Label><Input value={group.description || ""} onChange={(e) => updateEditPortGroup(index, "description", e.target.value)} placeholder="مثلاً Uplink trunk، پورت‌های PoE، ورودی برق..." className="h-9" /></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">فقط آیتم‌های جدیدی که در همین ویرایش از روی Stencil کلیک می‌کنی اینجا می‌آیند. آیتم‌های ذخیره‌شده قبلی در تب Groups هستند.</p>
                          <Badge>{editMappedTemplateParts.length} Item(s)</Badge>
                        </div>
                        <div className="max-h-[300px] overflow-auto rounded-lg border divide-y">
                          {editMappedTemplateParts.length === 0 ? <div className="p-4 text-sm text-muted-foreground text-center">آیتم جدیدی کلیک نشده است.</div> : editMappedTemplateParts.map((item) => (
                            <div key={item.id} className={`p-2 flex items-center justify-between gap-2 ${editSelectedMappedPartId === item.id ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}>
                              <button type="button" className="text-right flex-1" onClick={() => setEditSelectedMappedPartId(item.id)}>
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-[11px] text-muted-foreground">{item.side.toUpperCase()} • {item.port_type} • {item.category} • {item.poe ? "PoE" : "No PoE"}</div>
                              </button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeEditMappedPart(item.id)} title="حذف آیتم"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const selectedPart = editMappedTemplateParts.find((item) => item.id === editSelectedMappedPartId);
                          if (!selectedPart) return null;
                          return (
                            <div className="rounded-lg border bg-muted/10 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={selectedPart.name} onChange={(e) => updateEditMappedPart(selectedPart.id, "name", e.target.value)} className="h-9" /></div>
                              <div className="space-y-1"><Label className="text-xs">Type</Label><select value={selectedPart.port_type} onChange={(e) => updateEditMappedPart(selectedPart.id, "port_type", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">{PORT_TYPE_OPTIONS.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
                              <div className="space-y-1"><Label className="text-xs">Category</Label><Input value={selectedPart.category} onChange={(e) => updateEditMappedPart(selectedPart.id, "category", e.target.value)} className="h-9" /></div>
                              <div className="space-y-1"><Label className="text-xs">Side</Label><select value={selectedPart.side} onChange={(e) => updateEditMappedPart(selectedPart.id, "side", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"><option value="front">Front</option><option value="rear">Rear</option></select></div>
                              <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(selectedPart.poe)} onChange={(e) => updateEditMappedPart(selectedPart.id, "poe", e.target.checked)} /><span>PoE</span></label>
                              <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(selectedPart.data_port)} onChange={(e) => updateEditMappedPart(selectedPart.id, "data_port", e.target.checked)} /><span>Data Port</span></label>
                              <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(selectedPart.power)} onChange={(e) => updateEditMappedPart(selectedPart.id, "power", e.target.checked)} /><span>Power</span></label>
                              <div className="space-y-1 md:col-span-4"><Label className="text-xs">Description</Label><Input value={selectedPart.description || ""} onChange={(e) => updateEditMappedPart(selectedPart.id, "description", e.target.value)} className="h-9" /></div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpenEditTemplateModal(false)}>Cancel</Button><Button type="submit" disabled={isSubmittingTemplate}>{isSubmittingTemplate ? "Updating..." : "Update Template"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <Dialog open={deleteTemplateState.step > 0} onOpenChange={(open) => !open && cancelDeleteTemplate()}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">{deleteTemplateState.step === 1 ? "حذف الگو" : "تایید نهایی حذف"}</DialogTitle><DialogDescription className="text-right mt-2">{deleteTemplateState.step === 1 ? "آیا از حذف این الگوی دستگاه مطمئن هستید؟" : "اخطار: در صورت حذف این الگو، دستگاه‌هایی که از روی آن ساخته شده‌اند ممکن است دچار مشکل نمایشی شوند. آیا واقعا حذف شود؟"}</DialogDescription></DialogHeader>
          <DialogFooter className="flex w-full mt-4 sm:justify-center gap-2 flex-row-reverse sm:space-x-reverse">
            {deleteTemplateState.step === 1 ? (
              <><Button variant="outline" className="flex-1" onClick={cancelDeleteTemplate}>خیر، انصراف</Button><Button variant="destructive" className="flex-1" onClick={handleFirstConfirmTemplate}>بله، حذف کن</Button></>
            ) : (
              <><Button variant="destructive" className="flex-1" onClick={handleFinalDeleteTemplate}>بله، قطعا حذف کن</Button><Button variant="outline" className="flex-1" onClick={cancelDeleteTemplate}>خیر، انصراف</Button></>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
