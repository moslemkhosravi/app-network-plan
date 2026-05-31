import React from "react";
import RackTemplateDevice from "./RackTemplateDevice";

type DeviceTemplate = {
  id: number;
  manufacturer: string;
  model_name: string;
  category: string;
  form_factor: string;
  front_stencil_url?: string | null;
  back_stencil_url?: string | null;
};

type Device = {
  id: number;
  name: string;
  start_u: number;
  end_u: number;
  rack_side?: "front" | "rear" | "back" | string | null;
  side?: "front" | "rear" | "back" | string | null;
  rack_face?: "front" | "rear" | "back" | string | null;
  template_id?: number | null;
  template?: DeviceTemplate | null;
};

type Rack = {
  id: number;
  name: string;
  capacity_u: number;
};

type Props = {
  rack: Rack;
  devices: Device[];
  side: "front" | "rear";
  apiBaseUrl: string;
  previewVersion?: number;
};

const UNIT_HEIGHT = 28;

function normalizeRackSide(value?: string | null): "front" | "rear" {
  const normalized = String(value || "front").trim().toLowerCase().replace(/_/g, "-");
  return normalized === "rear" || normalized === "back" ? "rear" : "front";
}

function getDeviceRackSide(device: Device): "front" | "rear" {
  return normalizeRackSide(device.rack_side || device.side || device.rack_face || "front");
}

export default function RackFaceView({
  rack,
  devices,
  side,
  apiBaseUrl,
  previewVersion = Date.now(),
}: Props) {
  const capacity = rack.capacity_u || 42;
  const rackHeight = capacity * UNIT_HEIGHT;

  const faceDevices = devices.filter((device) => getDeviceRackSide(device) === side);
  const sortedDevices = [...faceDevices].sort((a, b) => a.start_u - b.start_u);

  const getDeviceTop = (startU: number, endU: number) => {
    return (capacity - endU) * UNIT_HEIGHT;
  };

  const getDeviceHeight = (startU: number, endU: number) => {
    return (endU - startU + 1) * UNIT_HEIGHT;
  };

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative bg-black rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
        style={{
          width: "340px",
          height: `${rackHeight + 30}px`,
          padding: "12px 10px",
        }}
      >
        <div className="text-center text-slate-300 text-sm mb-3 font-medium">
          {side === "front" ? "Front Rack View" : "Rear Rack View"} ({capacity}U)
        </div>

        <div
          className="relative mx-auto rounded-lg border border-slate-800 bg-[#111827]"
          style={{
            width: "250px",
            height: `${rackHeight}px`,
          }}
        >
          {/* Rail left */}
          <div className="absolute left-1 top-0 bottom-0 w-2 bg-slate-800 rounded-sm" />
          {/* Rail right */}
          <div className="absolute right-1 top-0 bottom-0 w-2 bg-slate-800 rounded-sm" />

          {/* U guides */}
          {Array.from({ length: capacity }).map((_, index) => {
            const uNumber = capacity - index;
            const top = index * UNIT_HEIGHT;

            return (
              <div
                key={uNumber}
                className="absolute left-0 right-0 border-t border-slate-800"
                style={{ top }}
              >
                <div className="absolute -left-10 top-1 text-[10px] text-slate-400">
                  U{uNumber}
                </div>
              </div>
            );
          })}

          {sortedDevices.length === 0 && (
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-lg border border-dashed border-slate-700 bg-slate-900/80 px-3 py-4 text-center text-xs text-slate-400">
              {side === "front" ? "جلوی رک خالی است" : "پشت رک خالی است"}
            </div>
          )}

          {/* Devices */}
          {sortedDevices.map((device) => {
            const top = getDeviceTop(device.start_u, device.end_u);
            const height = getDeviceHeight(device.start_u, device.end_u);

            return (
              <div
                key={`${side}-${device.id}`}
                className="absolute left-3 right-3 rounded-md overflow-hidden"
                style={{
                  top,
                  height,
                }}
              >
                <div
                  className="w-full h-full"
                  style={
                    {
                      ["--rack-device-scale" as any]:
                        height <= 28 ? 0.16 : height <= 56 ? 0.17 : 0.18,
                    }
                  }
                >
                  <RackTemplateDevice
                    device={device}
                    side={side}
                    apiBaseUrl={apiBaseUrl}
                    previewVersion={previewVersion}
                  />
                </div>

                <div className="absolute bottom-1 left-2 right-2 text-center text-[11px] font-semibold text-white bg-black/50 rounded">
                  {device.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}