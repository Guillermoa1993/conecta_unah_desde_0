import { useState } from "react";
import { X, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABEL } from "@/lib/mock-data";

type Props = {
  open: boolean;
  eventTitle: string;
  tutorName: string;
  eventDate: string;
  category: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function VoaeRejectModal({
  open,
  eventTitle,
  tutorName,
  eventDate,
  category,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  const isValid = reason.trim().length >= 30;
  const initials = tutorName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <div
              className="size-8 rounded-full grid place-items-center"
              style={{ backgroundColor: "#ef444420" }}
            >
              <AlertTriangle className="size-4" style={{ color: "#ef4444" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--puma-dark)" }}>
              Rechazar evento
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="size-8 rounded-full grid place-items-center hover:bg-red-50 transition"
            style={{ color: "#ef4444" }}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event info card */}
          <div
            className="rounded-xl p-5 space-y-2.5 text-sm"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <div className="font-bold text-base">{eventTitle}</div>
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded-full grid place-items-center text-[9px] font-semibold"
                style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
              >
                {initials}
              </div>
              <span className="font-medium">{tutorName}</span>
            </div>
            <div className="flex gap-4 text-muted-foreground">
              <span>{eventDate}</span>
              <span>{CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL] || category}</span>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label
              className="text-sm font-semibold flex items-center gap-1 mb-2"
              style={{ color: "#ef4444" }}
            >
              Motivo del rechazo <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Escribe el motivo detallado por el cual se rechaza este evento. El tutor recibirá este mensaje..."
              rows={6}
              className="w-full"
              style={{ borderColor: reason.trim().length > 0 && !isValid ? "#ef4444" : undefined }}
            />
            <div
              className="text-xs text-right mt-1"
              style={{ color: isValid ? "#22c55e" : "#9ca3af" }}
            >
              {reason.length}/30 caracteres mínimo
            </div>
          </div>

          {/* Info text */}
          <div
            className="rounded-lg p-3 text-xs flex items-start gap-2"
            style={{ backgroundColor: "#3b82f610", color: "#3b82f6" }}
          >
            <Info className="size-4 shrink-0 mt-0.5" />
            <span>
              El tutor recibirá una notificación con este motivo y podrá corregir el evento para
              reenviarlo.
            </span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="border-t p-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className="flex-1 text-white"
            style={{ backgroundColor: isValid ? "#ef4444" : "#9ca3af" }}
            disabled={!isValid}
            onClick={() => onConfirm(reason.trim())}
          >
            Confirmar rechazo
          </Button>
        </div>
      </div>
    </div>
  );
}
