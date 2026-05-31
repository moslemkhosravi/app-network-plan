import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Cable,
  Unplug,
  MonitorUp,
  MonitorDown,
  ArrowRightLeft,
  Server,
  Hash,
  Tag,
  Network,
  RefreshCcw,
} from "lucide-react";

export interface Port {
  id: number | string;
  name: string;
  port_type: string;
  status: string;
  description?: string;
  connected_to_id?: number | null;
  cable_tag?: string | null;
  cable_label?: string | null;
  cable_type?: string | null;
  cable_color?: string | null;
  cable_length_m?: number | null;
  ip_address?: string | null;
  vlan?: string | null;
  poe?: boolean | null;
  role?: string | null;
  data_port?: boolean | null;
  uplink?: boolean | null;
  console?: boolean | null;
  power?: boolean | null;
  component_kind?: string | null;
}

export interface DeviceWithTemplate {
  id: number | string;
  hostname: string;
  name?: string;
  device_type?: string | null;
  site_id?: number | null;
  poe?: boolean | null;
  image_url?: string;
  front_stencil_url?: string;
  back_stencil_url?: string;
  ports: Port[];
}

type BackendDevice = {
  id: number;
  name: string;
  hostname?: string | null;
  device_type?: string | null;
  site_id?: number | null;
  poe?: boolean | null;
};

type BackendPort = {
  id: number;
  device_id: number;
  port_number?: string | null;
  name?: string | null;
  port_type?: string | null;
  status?: string | null;
  description?: string | null;
  connected_to_id?: number | null;
  cable_tag?: string | null;
  cable_label?: string | null;
  cable_type?: string | null;
  cable_color?: string | null;
  cable_length_m?: number | null;
  ip_address?: string | null;
  vlan?: string | null;
  poe?: boolean | null;
  role?: string | null;
  data_port?: boolean | null;
  uplink?: boolean | null;
  console?: boolean | null;
  power?: boolean | null;
  component_kind?: string | null;
};

type IPRange = {
  id: number;
  name: string;
  cidr: string;
  device_type?: string | null;
  site_id?: number | null;
  gateway?: string | null;
  vlan?: string | null;
  is_active?: boolean | null;
  used_count?: number | null;
  total_hosts?: number | null;
  available_count?: number | null;
};

type IPUsage = {
  ip_address: string;
  source_type: string;
  source_id: number;
  name?: string | null;
  device_type?: string | null;
  site_id?: number | null;
  cable_tag?: string | null;
  vlan?: string | null;
};

type IPRangeUsageResponse = {
  range: IPRange;
  used: IPUsage[];
};

type DeviceFaceplateProps = {
  device: DeviceWithTemplate;
  onUpdate?: () => void;
};

type FaceplateSide = "front" | "rear";

type FaceplateFrameProps = {
  title: string;
  side: FaceplateSide;
  url: string;
  buildStaticUrl: (url?: string) => string;
  ports: Port[];
};

const CONNECTABLE_PORT_TYPES = new Set([
  "rj45",
  "sfp",
  "sfp+",
  "fiber",
  "ethernet",
  "power",
  "power-outlet",
  "power-input",
]);

const NETWORK_PORT_TYPES = new Set(["rj45", "sfp", "sfp+", "fiber", "ethernet", "lan", "network"]);
const POWER_PORT_TYPES = new Set(["power", "power-input", "power-outlet", "psu", "pdu", "breaker", "ac", "dc"]);
const NON_IP_PORT_TYPES = new Set(["power", "power-input", "power-outlet", "psu", "pdu", "breaker", "usb", "vga", "hdmi", "fan", "storage", "pcie", "cpu", "memory", "gpu", "raid", "hba", "module", "accessory", "console", "rj11", "other"]);

function extractLastNumber(value: string) {
  const matches = String(value || "").match(/[0-9]+/g);
  if (!matches || matches.length === 0) return null;
  return Number.parseInt(matches[matches.length - 1], 10);
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function compactName(value?: string | null) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function normalizeStatus(status?: string | null) {
  return normalizeText(status || "AVAILABLE");
}

function isAvailableStatus(status?: string | null) {
  return normalizeStatus(status) === "available";
}

function isConnectedStatus(status?: string | null) {
  return normalizeStatus(status) === "connected";
}

function normalizePortType(portType?: string | null) {
  return normalizeText(portType).replace(/\s+/g, "");
}

function getCanonicalDeviceType(value?: string | null) {
  const raw = String(value || "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    "ip-phone": "phone",
    ip_phone: "phone",
    voip: "phone",
    telephone: "phone",
    phone: "phone",
    ap: "access-point",
    accesspoint: "access-point",
    access_point: "access-point",
    wifi: "access-point",
    "access-point": "access-point",
    pc: "workstation",
    pcs: "workstation",
    computer: "workstation",
    computers: "workstation",
    desktop: "workstation",
    laptop: "workstation",
    workstation: "workstation",
    camera: "camera",
    cctv: "camera",
    "ip-camera": "camera",
    printer: "printer",
    server: "server",
    switch: "switch",
    patchpanel: "patch-panel",
    patch_panel: "patch-panel",
    "patch-panel": "patch-panel",
  };
  return aliases[raw] || raw;
}

function typeMatchesRange(rangeType?: string | null, deviceType?: string | null) {
  const canonicalRange = getCanonicalDeviceType(rangeType);
  const canonicalDevice = getCanonicalDeviceType(deviceType);
  return !canonicalRange || !canonicalDevice || canonicalRange === canonicalDevice;
}

function portSemanticText(port?: Partial<BackendPort | Port> | null) {
  if (!port) return "";
  return [
    port.port_type,
    (port as any).category,
    (port as any).role,
    (port as any).component_kind,
    port.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isPowerPort(port?: Partial<BackendPort | Port> | string | null) {
  if (!port) return false;
  if (typeof port === "string") {
    const type = normalizePortType(port);
    return POWER_PORT_TYPES.has(type) || type.includes("power") || type.includes("psu") || type.includes("pdu");
  }
  const type = normalizePortType(port.port_type);
  const text = portSemanticText(port);
  return Boolean(
    (port as any).power ||
      POWER_PORT_TYPES.has(type) ||
      text.includes("power") ||
      text.includes("psu") ||
      text.includes("pdu") ||
      text.includes("breaker"),
  );
}

function isNetworkCablePort(port?: Partial<BackendPort | Port> | string | null) {
  if (!port) return false;
  if (typeof port === "string") {
    const type = normalizePortType(port);
    return NETWORK_PORT_TYPES.has(type) && !isPowerPort(type);
  }
  if (isPowerPort(port)) return false;
  if ((port as any).data_port === false) return false;
  const type = normalizePortType(port.port_type);
  const text = portSemanticText(port);
  return (
    NETWORK_PORT_TYPES.has(type) ||
    text.includes("network") ||
    text.includes("ether") ||
    text.includes("lan") ||
    text.includes("uplink") ||
    text.includes("management") ||
    text.includes("mgmt")
  );
}

function isConnectablePort(port?: Partial<BackendPort | Port> | string | null) {
  return isNetworkCablePort(port) || isPowerPort(port);
}

function needsIpForPort(port?: Partial<BackendPort | Port> | null, deviceType?: string | null) {
  if (!port || !isNetworkCablePort(port)) return false;
  const deviceKind = getCanonicalDeviceType(deviceType);
  // Switch, patch-panel and pure infrastructure ports are cable endpoints, not IP endpoints.
  if (["switch", "patch-panel"].includes(deviceKind)) return false;
  return true;
}

function canUsePoeForConnection(source?: Partial<BackendPort | Port> | null, target?: Partial<BackendPort | Port> | null) {
  if (!source || !target) return false;
  const sourceType = normalizePortType(source.port_type);
  const targetType = normalizePortType(target.port_type);
  return (
    isNetworkCablePort(source) &&
    isNetworkCablePort(target) &&
    ["rj45", "ethernet", "lan", "network"].includes(sourceType) &&
    ["rj45", "ethernet", "lan", "network"].includes(targetType)
  );
}

function portsAreCompatible(source?: Partial<BackendPort | Port> | null, target?: Partial<BackendPort | Port> | null) {
  if (!source || !target) return false;
  if (isPowerPort(source) || isPowerPort(target)) return isPowerPort(source) && isPowerPort(target);
  if (isNetworkCablePort(source) || isNetworkCablePort(target)) return isNetworkCablePort(source) && isNetworkCablePort(target);
  return false;
}

function getPortDisplayName(port?: BackendPort | Port | null) {
  if (!port) return "-";
  return ("port_number" in port && port.port_number) || ("name" in port && port.name) || `Port ${port.id}`;
}

function getDeviceDisplayName(backendDevice?: BackendDevice | null) {
  if (!backendDevice) return "Unknown Device";
  return backendDevice.hostname || backendDevice.name || `Device ${backendDevice.id}`;
}

function canonicalPortName(name?: string | null) {
  const raw = normalizeText(name);
  const compact = compactName(raw);
  const number = extractLastNumber(raw);

  if (!raw) return "";

  if (raw.includes("patchpanelrear") || raw.includes("patch panel rear") || raw.includes("rear idc")) {
    return number !== null ? `patchpanelrear-${number}` : "patchpanelrear";
  }

  if (raw.includes("patchpanel") || raw.includes("patch panel")) {
    return number !== null ? `patchpanel-${number}` : "patchpanel";
  }

  if (
    raw.includes("fastethernet") ||
    raw.includes("gigabitethernet") ||
    raw.startsWith("fa") ||
    raw.startsWith("gi") ||
    raw.startsWith("port ") ||
    /^port[0-9]+$/.test(compact)
  ) {
    return number !== null ? `port-${number}` : "port";
  }

  if (raw.includes("uplink") || /^g[0-9]+$/.test(compact)) {
    return number !== null ? `uplink-${number}` : "uplink";
  }

  if (raw.includes("ether")) {
    return number !== null ? `ether-${number}` : "ether";
  }

  if (raw.includes("lan")) {
    return number !== null ? `lan-${number}` : "lan";
  }

  if (raw.includes("pdu outlet") || raw.includes("vertical pdu outlet")) {
    return number !== null ? `pdu-outlet-${number}` : "pdu-outlet";
  }

  if (raw.includes("power input")) {
    return number !== null ? `power-input-${number}` : "power-input";
  }

  if (raw.includes("power supply") || raw.includes("psu")) {
    return number !== null ? `power-input-${number}` : "power-input";
  }

  if (raw.includes("main power switch") || raw.includes("breaker")) return "main-power-switch";

  if (raw.includes("drive bay") || raw.includes("disk bay")) {
    return number !== null ? `drive-bay-${number}` : "drive-bay";
  }

  if (raw.includes("front usb")) {
    return number !== null ? `front-usb-${number}` : "front-usb";
  }

  if (raw.includes("rear usb")) {
    return number !== null ? `rear-usb-${number}` : "rear-usb";
  }

  if (raw.includes("usb")) {
    return number !== null ? `usb-${number}` : "usb";
  }

  if (raw.includes("ilo") || raw.includes("management")) return "management";
  if (raw.includes("vga")) return "vga";
  if (raw.includes("hdmi")) return "hdmi";
  if (raw.includes("serial") || raw.includes("console")) return raw.includes("usb") ? "console-usb" : "console-rj45";
  if (raw.includes("fan")) return number !== null ? `fan-${number}` : "fan";
  if (raw.includes("sd card")) return "sd-card";
  if (raw.includes("cableguide")) return number !== null ? `cable-guide-${number}` : "cable-guide";

  return raw.split(/ +/g).join("-");
}

function findMatchingPort(ports: Port[] | undefined, clickedPortName: string) {
  const list = ports || [];
  if (!clickedPortName || list.length === 0) return undefined;

  const clickedRaw = normalizeText(clickedPortName);
  const clickedCompact = compactName(clickedPortName);
  const clickedCanonical = canonicalPortName(clickedPortName);
  const clickedNumber = extractLastNumber(clickedPortName);

  const normalizedPorts = list.map((port) => ({
    port,
    raw: normalizeText(port.name),
    compact: compactName(port.name),
    canonical: canonicalPortName(port.name),
    number: extractLastNumber(port.name),
    type: normalizePortType(port.port_type),
  }));

  const exact = normalizedPorts.find((item) => item.raw === clickedRaw || item.compact === clickedCompact);
  if (exact) return exact.port;

  const canonical = normalizedPorts.find((item) => item.canonical === clickedCanonical);
  if (canonical) return canonical.port;

  if (clickedNumber !== null) {
    const categoryMatch = normalizedPorts.find((item) => {
      if (item.number !== clickedNumber) return false;
      if (clickedCanonical.startsWith("port-") && (item.canonical.startsWith("port-") || item.type === "rj45" || item.type === "sfp")) return true;
      if (clickedCanonical.startsWith("uplink-") && (item.canonical.startsWith("uplink-") || item.type === "sfp")) return true;
      if (clickedCanonical.startsWith("lan-") && (item.canonical.startsWith("lan-") || item.type === "rj45")) return true;
      if (clickedCanonical.startsWith("ether-") && (item.canonical.startsWith("ether-") || item.type === "rj45")) return true;
      if (clickedCanonical.startsWith("patchpanelrear-") && item.canonical.startsWith("patchpanelrear-")) return true;
      if (clickedCanonical.startsWith("patchpanel-") && item.canonical.startsWith("patchpanel-")) return true;
      if (clickedCanonical.startsWith("pdu-outlet-") && item.canonical.startsWith("pdu-outlet-")) return true;
      if (clickedCanonical.startsWith("power-input-") && (item.canonical.startsWith("power-input-") || item.type.includes("power"))) return true;
      if (clickedCanonical.startsWith("drive-bay-") && item.canonical.startsWith("drive-bay-")) return true;
      if (clickedCanonical.startsWith("usb-") && item.type === "usb") return true;
      if (clickedCanonical.startsWith("fan-") && item.type === "fan") return true;
      return false;
    });

    if (categoryMatch) return categoryMatch.port;
  }

  return undefined;
}

function getStencilClickName(data: any) {
  return String(data?.portName || data?.partName || data?.name || "").trim();
}

function FaceplateFrame({ title, side, url, buildStaticUrl, ports }: FaceplateFrameProps) {
  const isRear = side === "rear";
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [frameHeight, setFrameHeight] = useState(285);

  const sendPortStates = () => {
    if (!iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      {
        type: "APPLY_PORT_STATES",
        side,
        ports: ports.map((port) => ({
          id: port.id,
          name: port.name,
          port_type: port.port_type,
          status: normalizeStatus(port.status).toUpperCase(),
          connected_to_id: port.connected_to_id || null,
          poe: Boolean(port.poe),
          power: Boolean((port as any).power) || isPowerPort(port),
          data_port: Boolean((port as any).data_port) || isNetworkCablePort(port),
          component_kind: (port as any).component_kind || null,
          cable_type: (port as any).cable_type || null,
          cable_color: (port as any).cable_color || null,
          cable_length_m: (port as any).cable_length_m ?? null,
        })),
      },
      "*",
    );

    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      if (!doc.getElementById("network-plan-native-led-override")) {
        const style = doc.createElement("style");
        style.id = "network-plan-native-led-override";
        style.textContent = `
          .managed-port .live-led { display: none !important; }

          /* Generic connected state for non-switch components. */
          .managed-port.is-connected {
            transition: outline-color .18s ease, box-shadow .18s ease, border-color .18s ease, filter .18s ease;
          }

          /* Power/PDU/PSU connected state: green border around the exact socket/module. */
          .managed-port.is-power-port.is-connected,
          .managed-port.is-connected.power,
          .managed-port.is-connected.power-input,
          .managed-port.is-connected.power-output,
          .managed-port.is-connected.psu,
          .managed-port.is-connected.outlet-block,
          .managed-port.is-connected.power-supply,
          .managed-port.is-connected.power-module,
          .managed-port.is-connected.psu-slot {
            outline: 3px solid #22c55e !important;
            outline-offset: 2px !important;
            border-color: #22c55e !important;
            box-shadow: 0 0 0 3px rgba(34,197,94,.22), 0 0 18px rgba(34,197,94,.82) !important;
            filter: brightness(1.08) !important;
          }

          /* Fallback LAN LED for templates that do not have native LED elements. */
          .managed-port.is-data-port.is-connected:not(.port):not(.sfp):not(.console-rj45):not(.usb-mini)::after {
            content: "";
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #27e327;
            border: 1px solid #118011;
            box-shadow: 0 0 8px #27e327, 0 0 14px rgba(39,227,39,.85);
            top: -7px;
            right: -7px;
            z-index: 80;
            pointer-events: none;
            animation: stencil-port-blink 0.95s infinite !important;
          }

          /* Native switch-port LEDs: OFF state must be gray. */
          .managed-port .port-led::before,
          .managed-port .eth-leds .green,
          .managed-port .net-led.green,
          .managed-port .net-led.green-led,
          .managed-port .mini-led-dot.green {
            background: #5d5d5d !important;
            border-color: #2f2f2f !important;
            box-shadow: none !important;
            animation: none !important;
            filter: none !important;
            opacity: 1 !important;
          }

          .managed-port .port-led::after,
          .managed-port .eth-leds .amber,
          .managed-port .net-led.amber,
          .managed-port .net-led.orange,
          .managed-port .mini-led-dot.amber {
            background: #5d5d5d !important;
            border-color: #2f2f2f !important;
            box-shadow: none !important;
            animation: none !important;
            filter: none !important;
            opacity: 1 !important;
          }

          /* Link LED: green LED above the port. */
          .managed-port.is-connected .port-led::before,
          .managed-port.is-connected .eth-leds .green,
          .managed-port.is-connected .net-led.green,
          .managed-port.is-connected .net-led.green-led,
          .managed-port.is-connected .mini-led-dot.green {
            background: #27e327 !important;
            border-color: #118011 !important;
            box-shadow: 0 0 8px #27e327, 0 0 14px rgba(39,227,39,.85) !important;
            animation: stencil-port-blink 0.95s infinite !important;
            filter: brightness(1.35) !important;
          }

          /* PoE LED: amber/yellow LED above the port. */
          .managed-port.is-poe .port-led::after,
          .managed-port.is-poe .eth-leds .amber,
          .managed-port.is-poe .net-led.amber,
          .managed-port.is-poe .net-led.orange,
          .managed-port.is-poe .mini-led-dot.amber {
            background: #f2c230 !important;
            border-color: #946300 !important;
            box-shadow: 0 0 8px #facc15, 0 0 14px rgba(250,204,21,.85) !important;
            animation: stencil-port-blink 0.95s infinite !important;
            filter: brightness(1.45) !important;
          }
        `;
        doc.head.appendChild(style);
      }

      doc.querySelectorAll<HTMLElement>(".managed-port").forEach((el) => {
        const key = el.dataset.portKey || el.dataset.portName || el.getAttribute("title") || "";
        const port = findMatchingPort(ports, key);
        const connected = !!port && (isConnectedStatus(port.status) || !!port.connected_to_id);
        const dataPort = !!port && (Boolean((port as any).data_port) || isNetworkCablePort(port));
        const powerPort = !!port && (Boolean((port as any).power) || isPowerPort(port));

        el.classList.toggle("is-connected", connected);
        el.classList.toggle("is-poe", connected && Boolean(port?.poe));
        el.classList.toggle("is-data-port", dataPort);
        el.classList.toggle("is-power-port", powerPort);

        if (connected) {
          el.setAttribute("data-connected", "true");
          el.setAttribute("title", `${key || port?.name || "Port"} — Connected`);
        } else {
          el.removeAttribute("data-connected");
        }
      });
    } catch {
      // Same-origin iframe access can fail if a custom external stencil is used; ignore safely.
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(sendPortStates, 200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ports, url]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data || {};
      if (data.type !== "STENCIL_READY") return;

      const height = Number(data.height) || 285;
      setFrameHeight(Math.min(Math.max(height, 160), 720));
      window.setTimeout(sendPortStates, 50);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ports, url]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-background shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {isRear ? <MonitorDown className="h-4 w-4" /> : <MonitorUp className="h-4 w-4" />}
          {title}
        </div>
        <Badge variant="secondary" className="uppercase">
          {side}
        </Badge>
      </div>

      <div className="w-full overflow-x-auto overflow-y-hidden bg-transparent p-3">
        <iframe
          ref={iframeRef}
          src={buildStaticUrl(url)}
          title={title}
          className="block border-none bg-transparent mx-auto"
          style={{ width: "1360px", height: `${frameHeight}px`, maxWidth: "none" }}
          scrolling="no"
          onLoad={() => window.setTimeout(sendPortStates, 150)}
        />
      </div>
    </div>
  );
}

export default function DeviceFaceplate({ device, onUpdate }: DeviceFaceplateProps) {
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [allDevices, setAllDevices] = useState<BackendDevice[]>([]);
  const [allPorts, setAllPorts] = useState<BackendPort[]>([]);
  const [ipRanges, setIpRanges] = useState<IPRange[]>([]);
  const [ipRangeUsage, setIpRangeUsage] = useState<IPRangeUsageResponse | null>(null);
  const [selectedIpRangeId, setSelectedIpRangeId] = useState("");
  const [ipRangeLoading, setIpRangeLoading] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState<string>("");
  const [targetPortId, setTargetPortId] = useState<string>("");
  const [cableTag, setCableTag] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [vlan, setVlan] = useState("");
  const [poe, setPoe] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [clickedSide, setClickedSide] = useState<FaceplateSide | null>(null);
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);

  const API_BASE_URL =
    typeof window !== "undefined"
      ? `http://${window.location.hostname}:8000`
      : "http://127.0.0.1:8000";

  const preparedPorts = useMemo(
    () =>
      (device.ports || []).map((port) => ({
        ...port,
        status: normalizeStatus(port.status).toUpperCase(),
      })),
    [device.ports],
  );

  const buildStaticUrl = (url?: string) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}v=${device.id}`;
    }

    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE_URL}${cleanUrl}?v=${device.id}`;
  };

  const refreshConnectionData = async () => {
    setIsLoadingConnection(true);

    try {
      const [devicesResponse, portsResponse, rangesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/devices/`),
        fetch(`${API_BASE_URL}/ports/`),
        fetch(`${API_BASE_URL}/ip-ranges/`),
      ]);

      if (!devicesResponse.ok || !portsResponse.ok || !rangesResponse.ok) {
        throw new Error("Failed to fetch connection data");
      }

      setAllDevices(await devicesResponse.json());
      setAllPorts(await portsResponse.json());
      setIpRanges(await rangesResponse.json());
    } catch {
      toast.error("خطا در دریافت اطلاعات اتصال پورت‌ها");
    } finally {
      setIsLoadingConnection(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data || {};
      const isPortClick = data.type === "PORT_CLICK" || data.type === "PART_CLICK" || data.type === "STENCIL_PORT_CLICK";
      if (!isPortClick) return;

      const clickedPortName = getStencilClickName(data);
      if (!clickedPortName) return;

      const side: FaceplateSide = data.side === "rear" ? "rear" : data.side === "front" ? "front" : "front";
      const foundPort = findMatchingPort(preparedPorts, clickedPortName);

      setClickedSide(side);
      setCableTag("");
      setIpAddress("");
      setVlan("");
      setPoe(Boolean(foundPort?.poe || device.poe) && isNetworkCablePort(foundPort));
      setSelectedIpRangeId("");
      setIpRangeUsage(null);
      setTargetDeviceId("");
      setTargetPortId("");
      setShowConnectForm(false);

      if (foundPort) {
        setSelectedPort(foundPort);
      } else {
        setSelectedPort({
          id: "unknown",
          name: clickedPortName,
          port_type: "unknown",
          status: "AVAILABLE",
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [preparedPorts]);

  useEffect(() => {
    if (!selectedPort || selectedPort.id === "unknown") return;
    refreshConnectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPort?.id]);

  useEffect(() => {
    if (!showConnectForm) return;
    refreshConnectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConnectForm]);

  const selectedBackendPort = useMemo(() => {
    if (!selectedPort || selectedPort.id === "unknown") return null;
    const id = Number(selectedPort.id);
    return allPorts.find((p) => p.id === id) || null;
  }, [allPorts, selectedPort]);

  const currentSelectedStatus = selectedBackendPort?.status || selectedPort?.status;
  const connectedPortId = selectedBackendPort?.connected_to_id || selectedPort?.connected_to_id || null;

  const connectedBackendPort = useMemo(() => {
    if (!connectedPortId) return null;
    return allPorts.find((p) => p.id === connectedPortId) || null;
  }, [allPorts, connectedPortId]);

  const connectedBackendDevice = useMemo(() => {
    if (!connectedBackendPort) return null;
    return allDevices.find((d) => d.id === connectedBackendPort.device_id) || null;
  }, [allDevices, connectedBackendPort]);

  const currentBackendDevice = useMemo(() => {
    return allDevices.find((d) => String(d.id) === String(device.id)) || null;
  }, [allDevices, device.id]);

  const currentDeviceType = getCanonicalDeviceType(currentBackendDevice?.device_type || device.device_type);
  const currentSiteId = currentBackendDevice?.site_id ?? device.site_id ?? null;
  const selectedNeedsIp = needsIpForPort(selectedBackendPort || selectedPort, currentDeviceType);
  const selectedIsNetwork = isNetworkCablePort(selectedBackendPort || selectedPort);
  const selectedIsPower = isPowerPort(selectedBackendPort || selectedPort);

  const matchingIpRanges = useMemo(() => {
    return ipRanges
      .filter((range) => range.is_active !== false)
      .filter((range) => typeMatchesRange(range.device_type, currentDeviceType))
      .filter((range) => !range.site_id || !currentSiteId || range.site_id === currentSiteId)
      .sort((a, b) => {
        const aExact = getCanonicalDeviceType(a.device_type) === currentDeviceType ? 0 : 1;
        const bExact = getCanonicalDeviceType(b.device_type) === currentDeviceType ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [ipRanges, currentDeviceType, currentSiteId]);

  const selectedIpRange = useMemo(() => {
    if (!selectedIpRangeId) return matchingIpRanges[0] ?? null;
    return matchingIpRanges.find((range) => String(range.id) === selectedIpRangeId) ?? matchingIpRanges[0] ?? null;
  }, [matchingIpRanges, selectedIpRangeId]);

  useEffect(() => {
    if (!showConnectForm || !selectedNeedsIp) return;
    if (!matchingIpRanges.length) {
      setSelectedIpRangeId("");
      setIpRangeUsage(null);
      return;
    }
    setSelectedIpRangeId((current) => {
      if (current && matchingIpRanges.some((range) => String(range.id) === current)) return current;
      return String(matchingIpRanges[0].id);
    });
  }, [showConnectForm, matchingIpRanges, selectedNeedsIp]);

  useEffect(() => {
    if (!showConnectForm || !selectedNeedsIp || !selectedIpRange?.id) return;
    void fetchIpRangeUsage(selectedIpRange.id);
    if (selectedIpRange.vlan && !vlan) setVlan(selectedIpRange.vlan);
  }, [showConnectForm, selectedIpRange?.id, selectedNeedsIp]);

  async function fetchIpRangeUsage(rangeId: number) {
    setIpRangeLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ip-ranges/${rangeId}/usage`);
      if (!response.ok) throw new Error("failed");
      setIpRangeUsage(await response.json());
    } catch {
      setIpRangeUsage(null);
    } finally {
      setIpRangeLoading(false);
    }
  }

  async function assignNextAvailableIp() {
    if (!selectedNeedsIp) {
      toast.error("این قطعه IP نمی‌گیرد؛ فقط پورت‌های دیتای endpoint به IP نیاز دارند");
      return;
    }
    if (!selectedIpRange) {
      toast.error("برای نوع این دستگاه رنج IP تعریف نشده است");
      return;
    }
    const params = new URLSearchParams();
    if (currentDeviceType) params.set("device_type", currentDeviceType);
    if (currentSiteId) params.set("site_id", String(currentSiteId));
    if (selectedPort?.id && selectedPort.id !== "unknown") params.set("exclude_port_id", String(selectedPort.id));

    try {
      const response = await fetch(`${API_BASE_URL}/ip-ranges/${selectedIpRange.id}/next-available?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "خطا در دریافت IP آزاد");
      setIpAddress(data.ip_address);
      if (data.range?.vlan) setVlan(data.range.vlan);
      toast.success(`IP آزاد اختصاص داده شد: ${data.ip_address}`);
      await fetchIpRangeUsage(selectedIpRange.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در دریافت IP آزاد");
    }
  }

  async function checkIpAddress() {
    if (!selectedNeedsIp) {
      toast.error("برای این قطعه IP لازم نیست");
      return;
    }
    if (!ipAddress.trim()) {
      toast.error("اول IP را وارد کن");
      return;
    }
    const params = new URLSearchParams({ ip_address: ipAddress.trim() });
    if (currentDeviceType) params.set("device_type", currentDeviceType);
    if (currentSiteId) params.set("site_id", String(currentSiteId));
    if (selectedPort?.id && selectedPort.id !== "unknown") params.set("exclude_port_id", String(selectedPort.id));

    try {
      const response = await fetch(`${API_BASE_URL}/ip-check/?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "IP قابل استفاده نیست");
      toast.success("این IP آزاد است و داخل رنج مجاز قرار دارد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در بررسی IP");
    }
  }

  const connectionSummary = connectedBackendPort
    ? {
        deviceName: getDeviceDisplayName(connectedBackendDevice),
        deviceId: connectedBackendPort.device_id,
        portName: getPortDisplayName(connectedBackendPort),
        portType: connectedBackendPort.port_type || "-",
        cableTag:
          selectedBackendPort?.cable_tag ||
          selectedBackendPort?.cable_label ||
          connectedBackendPort.cable_tag ||
          connectedBackendPort.cable_label ||
          "-",
        ipAddress: selectedBackendPort?.ip_address || connectedBackendPort.ip_address || "-",
        vlan: selectedBackendPort?.vlan || connectedBackendPort.vlan || "-",
        cableType: selectedBackendPort?.cable_type || connectedBackendPort.cable_type || "-",
        cableColor: selectedBackendPort?.cable_color || connectedBackendPort.cable_color || "-",
        cableLength: selectedBackendPort?.cable_length_m ?? connectedBackendPort.cable_length_m ?? null,
      }
    : null;

  const handleConnectCable = async () => {
    if (!selectedPort || selectedPort.id === "unknown") {
      toast.error("خطا: این پورت/قطعه در دیتابیس ثبت نشده است!");
      return;
    }

    if (!isConnectablePort(selectedBackendPort || selectedPort)) {
      toast.error("این آیتم کابل‌خور نیست. نوع آن را در Template درست تعریف کن: Network/Data یا Power.");
      return;
    }

    if (!targetPortId) {
      toast.error("لطفاً پورت مقصد را انتخاب کنید.");
      return;
    }

    setIsConnecting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ports/${selectedPort.id}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_port_id: Number(targetPortId),
          cable_tag: cableTag.trim() || null,
          cable_label: cableTag.trim() || null,
          ip_address: selectedNeedsIp ? ipAddress.trim() || null : null,
          vlan: selectedIsNetwork ? vlan.trim() || null : null,
          poe: selectedIsNetwork && canUsePoeForConnection(selectedBackendPort || selectedPort, allPorts.find((p) => String(p.id) === targetPortId)) ? poe : false,
        }),
      });

      if (response.ok) {
        toast.success("کابل با موفقیت متصل شد! 🟢");
        setShowConnectForm(false);
        setTargetDeviceId("");
        setTargetPortId("");
        setCableTag("");
        setIpAddress("");
        setVlan("");
        setPoe(false);
        await refreshConnectionData();
        setSelectedPort((prev) =>
          prev
            ? {
                ...prev,
                status: "CONNECTED",
                connected_to_id: Number(targetPortId),
                cable_tag: cableTag,
                cable_label: cableTag,
                ip_address: selectedNeedsIp ? ipAddress : undefined,
                vlan: selectedIsNetwork ? vlan : undefined,
                poe: selectedIsNetwork ? poe : false,
              }
            : prev,
        );
        onUpdate?.();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.detail || "خطا در اتصال کابل");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectCable = async () => {
    if (!selectedPort || selectedPort.id === "unknown") {
      toast.error("این آیتم در دیتابیس ثبت نشده است.");
      return;
    }

    const ok = window.confirm("آیا از قطع اتصال این کابل مطمئن هستید؟");
    if (!ok) return;

    setIsDisconnecting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ports/${selectedPort.id}/disconnect`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("اتصال کابل قطع شد");
        await refreshConnectionData();
        setSelectedPort((prev) =>
          prev
            ? {
                ...prev,
                status: "AVAILABLE",
                connected_to_id: undefined,
                cable_tag: undefined,
                cable_label: undefined,
                ip_address: undefined,
                vlan: undefined,
                poe: undefined,
              }
            : prev,
        );
        onUpdate?.();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.detail || "خطا در قطع اتصال کابل");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const selectedCanConnect = isConnectablePort(selectedBackendPort || selectedPort);

  const availableTargetPorts = allPorts.filter((p) => {
    const sameTargetDevice = p.device_id.toString() === targetDeviceId;
    const isAvailable = isAvailableStatus(p.status);
    const isNotSelf = p.id.toString() !== selectedPort?.id.toString();

    if (!sameTargetDevice || !isAvailable || !isNotSelf) return false;
    return portsAreCompatible(selectedBackendPort || selectedPort, p);
  });

  const selectedTargetPort = allPorts.find((p) => String(p.id) === targetPortId) || null;
  const canUsePoe = canUsePoeForConnection(selectedBackendPort || selectedPort, selectedTargetPort);

  if (!device) return null;

  const hasFrontStencil = Boolean(device.front_stencil_url);
  const hasRearStencil = Boolean(device.back_stencil_url);

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold">{device.hostname || device.name}</h3>
        {(hasFrontStencil || hasRearStencil) && (
          <p className="text-xs text-muted-foreground mt-1">
            روی هر پورت کلیک کن تا اتصال، قطع اتصال و اطلاعات کابل مدیریت شود.
          </p>
        )}
      </div>

      {hasFrontStencil || hasRearStencil ? (
        <div className="w-full space-y-6">
          {device.front_stencil_url && (
            <FaceplateFrame
              title={`${device.hostname || device.name} — Front Panel`}
              side="front"
              url={device.front_stencil_url}
              buildStaticUrl={buildStaticUrl}
              ports={preparedPorts}
            />
          )}
          {device.back_stencil_url && (
            <FaceplateFrame
              title={`${device.hostname || device.name} — Rear Panel`}
              side="rear"
              url={device.back_stencil_url}
              buildStaticUrl={buildStaticUrl}
              ports={preparedPorts}
            />
          )}
        </div>
      ) : (
        <div
          className="relative bg-slate-800 rounded-lg shadow-2xl border-4 border-slate-900 flex items-center justify-center overflow-hidden"
          style={{
            width: "100%",
            maxWidth: "900px",
            height: "160px",
            backgroundImage: device.image_url ? `url(${device.image_url})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!device.image_url && (
            <span className="text-slate-500 font-bold tracking-widest">NETWORK DEVICE</span>
          )}
        </div>
      )}

      {selectedPort && (
        <Dialog
          open={!!selectedPort}
          onOpenChange={() => {
            setSelectedPort(null);
            setShowConnectForm(false);
            setTargetDeviceId("");
            setTargetPortId("");
            setCableTag("");
            setIpAddress("");
            setVlan("");
            setClickedSide(null);
          }}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[88vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cable className="h-5 w-5 text-blue-500" />
                تنظیمات {selectedPort.name}
              </DialogTitle>
            </DialogHeader>

            {!showConnectForm ? (
              <div className="space-y-4 py-4">
                {clickedSide && (
                  <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border">
                    <span className="text-sm font-medium">سمت دستگاه:</span>
                    <Badge variant="outline" className="uppercase">
                      {clickedSide === "rear" ? "Rear" : "Front"}
                    </Badge>
                  </div>
                )}

                <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border">
                  <span className="text-sm font-medium">وضعیت فعلی:</span>
                  <Badge
                    variant={isConnectedStatus(currentSelectedStatus) ? "default" : "secondary"}
                    className={isConnectedStatus(currentSelectedStatus) ? "bg-green-600" : ""}
                  >
                    {isConnectedStatus(currentSelectedStatus) ? "CONNECTED" : "AVAILABLE"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border">
                  <span className="text-sm font-medium">نوع:</span>
                  <span className="font-mono text-sm uppercase">{selectedPort.port_type}</span>
                </div>

                {isConnectedStatus(currentSelectedStatus) && (
                  <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-sm">
                      <ArrowRightLeft className="h-4 w-4" /> مقصد اتصال کابل
                    </div>

                    {isLoadingConnection ? (
                      <div className="text-sm text-muted-foreground">در حال دریافت اطلاعات اتصال...</div>
                    ) : connectionSummary ? (
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Server className="h-4 w-4" /> دستگاه مقصد
                          </span>
                          <span className="font-semibold">{connectionSummary.deviceName}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Hash className="h-4 w-4" /> پورت مقصد
                          </span>
                          <span className="font-mono font-semibold">{connectionSummary.portName}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                          <span className="text-muted-foreground">نوع پورت مقصد</span>
                          <span className="font-mono uppercase">{connectionSummary.portType}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="h-4 w-4" /> تگ کابل
                          </span>
                          <span className="font-mono">{connectionSummary.cableTag}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                            <div className="text-[11px] text-muted-foreground mb-1">نوع کابل</div>
                            <div className="font-mono text-sm">{connectionSummary.cableType}</div>
                          </div>
                          <div className="rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                            <div className="text-[11px] text-muted-foreground mb-1">رنگ کابل</div>
                            <div className="font-mono text-sm">{connectionSummary.cableColor}</div>
                          </div>
                          <div className="rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                            <div className="text-[11px] text-muted-foreground mb-1">طول کابل</div>
                            <div className="font-mono text-sm">{connectionSummary.cableLength ? `${connectionSummary.cableLength}m` : "-"}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                          <span className="text-muted-foreground">VLAN</span>
                          <span className="font-mono">{connectionSummary.vlan}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border px-3 py-2">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Network className="h-4 w-4" /> IP
                          </span>
                          <span className="font-mono">{connectionSummary.ipAddress}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        این پورت connected است، ولی مقصد اتصال در دیتابیس پیدا نشد.
                      </div>
                    )}
                  </div>
                )}

                {selectedPort.id === "unknown" && (
                  <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                    این آیتم در دیتابیس match نشد. اسم داخل HTML با اسم آیتم‌های template یکی نیست یا برای این template ساخته نشده.
                  </div>
                )}

                {selectedPort.id !== "unknown" && !selectedCanConnect && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    این آیتم کابل‌خور نیست. اگر باید وصل شود، در Settings نوع آن را Network/Data یا Power تعریف کن.
                  </div>
                )}

                {isAvailableStatus(currentSelectedStatus) && selectedPort.id !== "unknown" && selectedCanConnect && (
                  <div className="pt-4 border-t mt-4">
                    <Button onClick={() => setShowConnectForm(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Cable className="w-4 h-4 mr-2" /> اتصال کابل جدید
                    </Button>
                  </div>
                )}

                {isConnectedStatus(currentSelectedStatus) && (
                  <div className="pt-4 border-t mt-4">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDisconnectCable}
                      disabled={isDisconnecting}
                    >
                      <Unplug className="w-4 h-4 mr-2" />
                      {isDisconnecting ? "در حال قطع اتصال..." : "قطع کردن کابل"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 py-4 animate-in fade-in zoom-in duration-200">
                <div className="space-y-2">
                  <Label>دستگاه مقصد را انتخاب کنید</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={targetDeviceId}
                    onChange={(e) => {
                      setTargetDeviceId(e.target.value);
                      setTargetPortId("");
                    }}
                  >
                    <option value="">-- انتخاب دستگاه --</option>
                    {allDevices.map((d) => (
                      <option key={d.id} value={d.id} disabled={d.id.toString() === device.id.toString()}>
                        {getDeviceDisplayName(d)} {d.id.toString() === device.id.toString() ? "(همین دستگاه)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {targetDeviceId && (
                  <div className="space-y-2">
                    <Label>پورت آزاد مقصد</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={targetPortId}
                      onChange={(e) => setTargetPortId(e.target.value)}
                    >
                      <option value="">-- انتخاب پورت --</option>
                      {availableTargetPorts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getPortDisplayName(p)} ({p.port_type})
                        </option>
                      ))}
                    </select>
                    {availableTargetPorts.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">هیچ پورت آزادی در این دستگاه یافت نشد.</p>
                    )}
                  </div>
                )}

                {selectedNeedsIp ? (
                  <div className="rounded-xl border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">رنج IP خودکار برای این دستگاه</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          این پورت یک endpoint دیتاست و به IP نیاز دارد. نوع دستگاه: {currentDeviceType || "—"}
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => void refreshConnectionData()}>
                        بروزرسانی
                      </Button>
                    </div>

                    {matchingIpRanges.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-background p-3 text-xs text-muted-foreground">
                        برای این نوع دستگاه رنج IP تعریف نشده است. از IP Config رنج مناسب بساز.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <select
                          value={selectedIpRange?.id ? String(selectedIpRange.id) : ""}
                          onChange={(e) => setSelectedIpRangeId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {matchingIpRanges.map((range) => (
                            <option key={range.id} value={range.id}>
                              {range.name} — {range.cidr}{range.vlan ? ` / VLAN ${range.vlan}` : ""}{range.available_count != null ? ` / آزاد ${range.available_count}` : ""}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <Button type="button" onClick={() => void assignNextAvailableIp()}>گرفتن IP آزاد</Button>
                          <Button type="button" variant="outline" onClick={() => void checkIpAddress()}>چک IP</Button>
                        </div>
                        <div className="rounded-lg bg-background p-2 text-xs">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="font-semibold">IPهای مصرف‌شده همین رنج</span>
                            <Badge variant="secondary">{ipRangeLoading ? "..." : ipRangeUsage?.used?.length ?? 0}</Badge>
                          </div>
                          {ipRangeUsage?.used?.length ? (
                            <div className="max-h-20 overflow-y-auto space-y-1">
                              {ipRangeUsage.used.slice(0, 6).map((usage) => (
                                <div key={`${usage.source_type}-${usage.source_id}-${usage.ip_address}`} className="flex items-center justify-between gap-2 rounded border px-2 py-1">
                                  <span className="font-mono">{usage.ip_address}</span>
                                  <span className="truncate text-muted-foreground">{usage.name || usage.source_type}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">هنوز IPای مصرف نشده.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                    {selectedIsPower ? (
                      <span>این قطعه برق است؛ IP/VLAN و PoE لازم ندارد. فقط کابل برق و مقصد Power/PDU را انتخاب کن.</span>
                    ) : selectedIsNetwork ? (
                      <span>این پورت شبکه برای عبور کابل است، ولی برای این نوع دستگاه IP روی خود پورت لازم نیست.</span>
                    ) : (
                      <span>این قطعه IP نمی‌گیرد؛ کارکرد آن از نوع سخت‌افزاری/کمکی است.</span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>{selectedIsPower ? "تگ کابل برق" : "تگ / لیبل کابل"}</Label>
                    <Input
                      value={cableTag}
                      onChange={(e) => setCableTag(e.target.value)}
                      placeholder={selectedIsPower ? "مثال: PWR-PDU01-SRV01" : "مثال: CBL-SW01-SRV01-01"}
                    />
                  </div>

                  {selectedIsNetwork && (
                    <div className="space-y-2">
                      <Label>VLAN</Label>
                      <Input
                        value={vlan}
                        onChange={(e) => setVlan(e.target.value)}
                        placeholder="مثال: 10"
                        dir="ltr"
                      />
                    </div>
                  )}

                  {selectedNeedsIp && (
                    <div className="space-y-2">
                      <Label>IP Address</Label>
                      <Input
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        placeholder="مثال: 192.168.1.10"
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>

                {selectedIsNetwork && (
                  <label className={`flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2 text-sm ${canUsePoe ? "cursor-pointer" : "opacity-60"}`}>
                    <span>
                      PoE دارد / برق از سوئیچ می‌گیرد
                      <span className="block text-xs text-muted-foreground mt-1">
                        PoE فقط روی اتصال RJ45 شبکه فعال می‌شود. برای SFP، پاور یا کنسول خاموش می‌ماند.
                      </span>
                    </span>
                    <input type="checkbox" checked={poe && canUsePoe} disabled={!canUsePoe} onChange={(e) => setPoe(e.target.checked)} />
                  </label>
                )}

                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConnectForm(false)} type="button">
                    انصراف
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleConnectCable}
                    disabled={!targetPortId || isConnecting}
                    type="button"
                  >
                    {isConnecting ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4 animate-spin" /> در حال اتصال...
                      </span>
                    ) : (
                      "تایید اتصال"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
