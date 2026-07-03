import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Ventana Modal de confirmación para aprobar evento
type Props = {
  open: boolean;
  eventTitle: string;
  onConfirm: (comentario?: string) => void;
  onCancel: () => void;
};

export function VoaeApproveModal({ open, eventTitle, onConfirm, onCancel }: Props) {
  const [comentario, setComentario] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-card shadow-elevated p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="size-10 rounded-full grid place-items-center"
            style={{ backgroundColor: "#22c55e20" }}
          >
            <CheckCircle2 className="size-6" style={{ color: "#22c55e" }} />
          </div>
          <h2 className="text-lg font-bold">¿Aprobar este evento?</h2>
        </div>
        <p className="text-sm font-semibold text-muted-foreground mb-3">{eventTitle}</p>
        <p className="text-sm text-muted-foreground mb-4">
          Al aprobar, el evento será visible para todos los estudiantes y el tutor recibirá una
          notificación.
        </p>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Comentario para el tutor (opcional)
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Ej: Excelente propuesta, recuerda confirmar el cupo final antes del evento."
          className="w-full h-24 resize-none rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-colors mb-6"
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className="text-white"
            style={{ backgroundColor: "#22c55e" }}
            onClick={() => onConfirm(comentario || undefined)}
          >
            Sí, aprobar
          </Button>
        </div>
      </div>
    </div>
  );
}
