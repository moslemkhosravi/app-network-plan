import React from "react";

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
  template_id?: number | null;
  template?: DeviceTemplate | null;
};

type Props = {
  device: Device;
  side: "front" | "rear";
  apiBaseUrl: string;
  previewVersion?: number;
};

export default function RackTemplateDevice({
  device,
  side,
  apiBaseUrl,
  previewVersion = Date.now(),
}: Props) {
  const template = device.template;

  const rawUrl =
    side === "front"
      ? template?.front_stencil_url
      : template?.back_stencil_url;

  const buildStaticUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}v=${previewVersion}`;
    }
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${apiBaseUrl}${cleanUrl}?v=${previewVersion}`;
  };

  const stencilUrl = buildStaticUrl(rawUrl);

  return (
    <div className="absolute inset-0 rounded-md overflow-hidden border border-slate-700 bg-black">
      {stencilUrl ? (
        <div className="relative w-full h-full bg-black">
          <div
            className="absolute top-1/2 left-1/2"
            style={{
              width: "1360px",
              height: "300px",
              transform: "translate(-50%, -50%) scale(var(--rack-device-scale, 0.18))",
              transformOrigin: "center",
            }}
          >
            <iframe
              src={stencilUrl}
              title={`${device.name}-${side}`}
              className="w-full h-full border-none pointer-events-none"
              scrolling="no"
              tabIndex={-1}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-300 text-sm font-medium">
          {device.name}
        </div>
      )}
    </div>
  );
}