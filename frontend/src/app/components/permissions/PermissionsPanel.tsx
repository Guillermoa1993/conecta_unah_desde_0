import { useEffect, useRef } from "react";
import { Bell, Mic, Camera, Shield, ChevronRight, RotateCcw, X } from "lucide-react";
import { usePermissions, type PermissionState } from "../../../hooks/usePermissions";

interface PermissionsPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

function statusLabel(state: PermissionState): string {
  switch (state) {
    case "granted":    return "Permitido";
    case "denied":     return "Bloqueado";
    case "prompt":     return "Pendiente";
    case "unavailable":return "No disponible";
  }
}

function StatusDot({ state }: { state: PermissionState }) {
  const colors: Record<PermissionState, string> = {
    granted:     "bg-emerald-500",
    denied:      "bg-red-500",
    prompt:      "bg-amber-400",
    unavailable: "bg-slate-400",
  };
  return <span className={`h-2 w-2 rounded-full flex-shrink-0 ${colors[state]}`} />;
}

function Toggle({ state, onRequest }: { state: PermissionState; onRequest: () => void }) {
  const on = state === "granted";
  const disabled = state === "denied" || state === "unavailable";

  return (
    <button
      type="button"
      onClick={!disabled && !on ? onRequest : undefined}
      disabled={disabled}
      title={disabled ? "Cambia el permiso desde la configuración del navegador" : undefined}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none
        ${on ? "bg-emerald-500" : disabled ? "bg-slate-300 cursor-not-allowed" : "bg-slate-300 hover:bg-slate-400 cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5
          ${on ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

interface PermRow {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  state: PermissionState;
  onRequest: () => void;
}

function PermissionRow({ icon, label, sublabel, state, onRequest }: PermRow) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-slate-300 flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-100 leading-tight">{label}</p>
          {sublabel && (
            <p className="text-xs text-slate-400 leading-tight mt-0.5">{sublabel}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusDot state={state} />
        <Toggle state={state} onRequest={onRequest} />
        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
      </div>
    </div>
  );
}

export function PermissionsPanel({ open, onClose, anchorRef }: PermissionsPanelProps) {
  const { permissions, refresh, requestNotifications, requestMicrophone, requestCamera, requestAll } = usePermissions();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const allGranted =
    permissions.notifications === "granted" &&
    permissions.microphone === "granted" &&
    permissions.camera === "granted";

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl shadow-2xl border border-white/10 overflow-hidden"
      style={{ background: "#1f2c34" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-slate-100">Permisos de la app</span>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Site badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
        <div className="h-5 w-5 rounded bg-[#FFD100] flex items-center justify-center text-[#003366] font-black text-[9px]">CP</div>
        <span className="text-xs text-slate-300 font-medium">localhost:5185 · Conecta Pumas</span>
      </div>

      {/* Permission rows */}
      <div className="divide-y divide-white/5">
        <PermissionRow
          icon={<Bell className="h-4 w-4" />}
          label="Notificaciones"
          state={permissions.notifications}
          onRequest={requestNotifications}
        />
        <PermissionRow
          icon={<Mic className="h-4 w-4" />}
          label="Micrófono"
          state={permissions.microphone}
          onRequest={requestMicrophone}
        />
        <PermissionRow
          icon={<Camera className="h-4 w-4" />}
          label="Cámara"
          sublabel={permissions.camera === "granted" ? "En uso para escaneo QR" : undefined}
          state={permissions.camera}
          onRequest={requestCamera}
        />
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Actualizar
        </button>
        {!allGranted && (
          <button
            type="button"
            onClick={requestAll}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Permitir todos
          </button>
        )}
        {allGranted && (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            ✓ Todos permitidos
          </span>
        )}
      </div>
    </div>
  );
}
