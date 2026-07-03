import { useState } from "react";
import { CircleHelp, X, ChevronDown } from "lucide-react";
import { motion, type PanInfo } from "framer-motion";
import { useRole } from "@/lib/role-context";
import { useIsMobile } from "@/hooks/use-mobile";

const HELP_CONTENT = {
  empleado: [
    { q: "¿Cómo creo un evento?", a: 'Haz clic en "Crear evento" y completa los pasos.' },
    { q: "¿Cómo inicio el evento?", a: 'En "Gestionar evento" presiona "Iniciar evento".' },
    {
      q: "¿Cómo registro asistencia?",
      a: "Los estudiantes escanean el QR de finalización al terminar.",
    },
    { q: "¿Cuándo envío a VOAE?", a: 'Solo cuando presiones "Finalizar evento".' },
  ],
  voae: [
    { q: "¿Cómo apruebo un evento?", a: 'En "Panel de gestión → Revisar y aprobar".' },
    {
      q: "¿Cómo firmo un certificado?",
      a: 'En la tabla de asistencias, columna "Certificado", haz clic en "Ver PDF" y usa "Firma digital".',
    },
    {
      q: "¿Cómo acredito horas?",
      a: 'Firma primero el certificado, luego "Acreditar horas" se habilita.',
    },
    { q: "¿Dónde veo el historial?", a: 'En "Histórico de eventos".' },
  ],
} as const;

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { role } = useRole();
  const isMobile = useIsMobile();

  const dismiss = () => {
    setDismissed(true);
    setOpen(false);
  };

  if (dismissed) return null;

  const items = HELP_CONTENT[role];

  const dragProps = isMobile
    ? { direction: "y" as const, dragConstraints: { top: 0, bottom: 300 } as const }
    : { direction: "x" as const, dragConstraints: { left: 0, right: 300 } as const };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    if ((isMobile && info.offset.y > threshold) || (!isMobile && info.offset.x > threshold)) {
      dismiss();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 size-12 rounded-full bg-[var(--puma-blue)] text-white shadow-elevated hover:bg-[var(--puma-dark)] flex items-center justify-center transition-colors z-40"
        aria-label="Ayuda"
      >
        <CircleHelp className="size-6" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              drag
              {...dragProps}
              onDragEnd={handleDragEnd}
              dragSnapToOrigin
              className="pointer-events-auto bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              style={{ borderRadius: "var(--radius-lg, 12px)" }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <img
                    src="/mago.png"
                    alt="Mago"
                    className="size-[55px] object-contain shrink-0"
                    style={{ imageRendering: "auto" }}
                  />
                  <h2 className="text-lg font-bold" style={{ color: "var(--puma-dark)" }}>
                    Ayuda - {role === "empleado" ? "Empleado" : "VOAE"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Desliza →</span>
                  <span className="text-xs text-muted-foreground sm:hidden">Desliza ↓</span>
                  <ChevronDown className="size-4 text-muted-foreground sm:rotate-0 sm:hidden" />
                  <button
                    onClick={dismiss}
                    className="size-8 rounded-full grid place-items-center hover:bg-red-50 transition shrink-0"
                    style={{ color: "#ef4444" }}
                    title="Descartar ayuda"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-lg border p-4" style={{ borderColor: "#e2e8f0" }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--puma-dark)" }}>
                      {item.q}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </>
  );
}
