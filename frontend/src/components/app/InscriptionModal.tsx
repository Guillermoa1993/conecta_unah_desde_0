import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABEL_LONG, LIMITE_POR_CATEGORIA, type EventCategory } from "@/lib/mock-data";
import { toast } from "sonner";

export function InscriptionModal({
  open,
  onClose,
  eventTitle,
  tipoActividad,
  categoria,
  horasCompletadas,
  fecha,
  horario,
  horas,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  eventTitle: string;
  tipoActividad?: string;
  categoria?: EventCategory;
  horasCompletadas?: number;
  fecha?: string;
  horario?: string;
  horas?: number;
  onConfirm?: () => void;
}) {
  const [modalidad, setModalidad] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  if (!open) return null;

  const categoryFull = categoria && (horasCompletadas ?? 0) >= LIMITE_POR_CATEGORIA;

  const options: string[] =
    tipoActividad === "Híbrido"
      ? ["Presencial", "Virtual"]
      : tipoActividad === "Virtual"
        ? ["Virtual"]
        : ["Presencial"];

  const handleConfirm = () => {
    if (categoryFull && !showWarning) {
      setShowWarning(true);
      return;
    }
    toast.success(`Inscrito exitosamente a "${eventTitle}" en modalidad ${modalidad}`);
    setShowWarning(false);
    setModalidad("");
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    setShowWarning(false);
    setModalidad("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleCancel}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card shadow-elevated p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCancel}
          className="absolute top-3 right-3 size-7 rounded-full grid place-items-center hover:bg-red-50 transition"
          style={{ color: "#ef4444" }}
        >
          <X className="size-5" />
        </button>

        <h2 className="text-lg font-bold text-center mt-1" style={{ color: "var(--puma-dark)" }}>
          Inscribirse a la Actividad
        </h2>
        <p className="text-sm text-muted-foreground text-center mt-2">
          ¿Desea ingresar en la actividad?
        </p>

        <div className="mt-4 space-y-1.5 text-sm">
          {fecha && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Fecha:</span> {fecha}
            </div>
          )}
          {horario && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Horario:</span> {horario}
            </div>
          )}
          {horas !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Horas a acreditar:</span> {horas}h
            </div>
          )}
        </div>

        {showWarning && categoryFull && (
          <div
            className="mt-4 p-3 rounded-lg text-sm flex items-start gap-2"
            style={{ backgroundColor: "#fefce8", color: "#713f12" }}
          >
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <p>
              Ya completaste las 15 horas en {CATEGORY_LABEL_LONG[categoria!]}. Puedes inscribirte
              pero estas horas no contarán para tu Artículo 140.
            </p>
          </div>
        )}

        <div className="mt-5">
          <label className="text-sm font-medium block mb-1.5">
            Seleccione en qué modalidad ingresará
          </label>
          <Select value={modalidad} onValueChange={setModalidad}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar modalidad" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 mt-6">
          {showWarning && categoryFull ? (
            <>
              <Button
                className="flex-1 h-11 font-semibold"
                variant="outline"
                onClick={handleConfirm}
              >
                Inscribirme de todas formas
              </Button>
              <Button
                className="flex-1 h-11 text-white font-semibold"
                style={{ backgroundColor: "#6b7280" }}
                onClick={() => {
                  setShowWarning(false);
                  setModalidad("");
                  onClose();
                }}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                className="flex-1 h-11 text-white font-semibold"
                style={{ backgroundColor: "#22c55e" }}
                disabled={!modalidad}
                onClick={handleConfirm}
              >
                Confirmar
              </Button>
              <Button
                className="flex-1 h-11 text-white font-semibold"
                style={{ backgroundColor: "#ef4444" }}
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
