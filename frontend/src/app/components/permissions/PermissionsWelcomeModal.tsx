import { useState } from "react";
import { Bell, Mic, Camera, Shield, CheckCircle2, ChevronRight } from "lucide-react";
import { usePermissions, type PermissionState } from "../../../hooks/usePermissions";

interface Props {
  open: boolean;
  onDone: () => void;
}

const PERMS = [
  {
    key: "notifications" as const,
    icon: <Bell className="h-5 w-5" />,
    label: "Notificaciones",
    desc: "Recibe alertas de nuevos eventos, recordatorios y confirmaciones de asistencia.",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    key: "microphone" as const,
    icon: <Mic className="h-5 w-5" />,
    label: "Micrófono",
    desc: "Requerido para funciones de accesibilidad y eventos con participación de audio.",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    key: "camera" as const,
    icon: <Camera className="h-5 w-5" />,
    label: "Cámara",
    desc: "Para escanear códigos QR de eventos y verificar tu identidad al registrarte.",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
];

function stateIcon(state: PermissionState) {
  if (state === "granted") return <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
  if (state === "denied")  return <span className="h-4 w-4 rounded-full border-2 border-red-400 flex-shrink-0" />;
  return <span className="h-4 w-4 rounded-full border-2 border-slate-500 flex-shrink-0" />;
}

export function PermissionsWelcomeModal({ open, onDone }: Props) {
  const { permissions, requestNotifications, requestMicrophone, requestCamera } = usePermissions();
  const [requesting, setRequesting] = useState<string | null>(null);

  if (!open) return null;

  const requestMap = {
    notifications: requestNotifications,
    microphone:    requestMicrophone,
    camera:        requestCamera,
  };

  const handleRequest = async (key: keyof typeof requestMap) => {
    setRequesting(key);
    await requestMap[key]();
    setRequesting(null);
  };

  const handleRequestAll = async () => {
    setRequesting("all");
    await Promise.allSettled([requestNotifications(), requestMicrophone(), requestCamera()]);
    setRequesting(null);
  };

  const allDone = PERMS.every(
    (p) => permissions[p.key] === "granted" || permissions[p.key] === "denied"
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#1f2c34" }}>

        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-white/10">
          <div className="h-14 w-14 rounded-2xl bg-[#FFD100]/10 border border-[#FFD100]/20 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-7 w-7 text-[#FFD100]" />
          </div>
          <h2 className="text-lg font-bold text-white">Permisos de Conecta Pumas</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Para una mejor experiencia, permite el acceso a los siguientes recursos.
          </p>
        </div>

        {/* Permission list */}
        <div className="p-4 space-y-3">
          {PERMS.map((p) => {
            const state = permissions[p.key];
            const isRequesting = requesting === p.key || requesting === "all";
            const canRequest = state === "prompt";

            return (
              <div
                key={p.key}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/4"
              >
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${p.color}`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{p.label}</p>
                  <p className="text-xs text-slate-400 leading-tight mt-0.5 truncate">{p.desc}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {stateIcon(state)}
                  {canRequest && (
                    <button
                      type="button"
                      onClick={() => handleRequest(p.key)}
                      disabled={!!requesting}
                      className="flex items-center gap-0.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                    >
                      {isRequesting ? "..." : <><span>Permitir</span><ChevronRight className="h-3 w-3" /></>}
                    </button>
                  )}
                  {state === "granted" && (
                    <span className="text-xs text-emerald-400 font-bold">Listo</span>
                  )}
                  {state === "denied" && (
                    <span className="text-xs text-red-400 font-bold">Bloqueado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-5 flex flex-col gap-2">
          {!allDone && (
            <button
              type="button"
              onClick={handleRequestAll}
              disabled={!!requesting}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {requesting === "all" ? (
                <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Solicitando...</>
              ) : (
                "Permitir todos"
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onDone}
            className="w-full h-10 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 font-semibold text-sm transition-colors"
          >
            {allDone ? "Continuar" : "Ahora no"}
          </button>
        </div>
      </div>
    </div>
  );
}
