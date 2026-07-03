import { useState, useEffect } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  "¿Cómo calificarías la organización del evento?",
  "¿Cómo evaluarías al tutor o facilitador?",
  "¿El contenido del evento cumplió tus expectativas?",
  "¿Recomendarías este evento a otros estudiantes?",
];

export function SurveyModal({
  open,
  eventTitle,
  onClose,
}: {
  open: boolean;
  eventTitle: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState<number[]>([0, 0, 0, 0]);
  const [hover, setHover] = useState<number[]>([0, 0, 0, 0]);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  const totalSteps = 5;
  const pct = Math.round(((step + 1) / totalSteps) * 100);

  const reset = () => {
    setStep(0);
    setRatings([0, 0, 0, 0]);
    setComment("");
    setDone(false);
  };
  const handleClose = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const allStarsFilled = ratings.every((r) => r > 0);
  const canNext = step < 4 ? ratings[step] > 0 : true;
  const canSubmit = allStarsFilled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50" onClick={(e) => e.preventDefault()} />
      <div className="relative w-full max-w-xl rounded-2xl bg-card shadow-elevated overflow-hidden animate-in zoom-in-95 duration-200">
        {done ? (
          <div className="p-10 text-center">
            <div className="size-20 mx-auto rounded-full bg-success/15 grid place-items-center mb-5 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="size-12 text-success" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--puma-dark)" }}>
              ¡Gracias por tu feedback!
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Tu opinión ayuda a mejorar los eventos futuros.
            </p>
            <Button
              className="mt-6"
              style={{ backgroundColor: "var(--puma-blue)" }}
              onClick={handleClose}
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <div className="h-1 bg-secondary">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: "var(--puma-blue)" }}
              />
            </div>

            <div className="p-7 pb-3 flex items-center justify-between">
              <div />
              <div className="text-xs text-muted-foreground">
                Pregunta {step + 1} de {totalSteps}
              </div>
            </div>

            <div className="px-7 py-5 min-h-[220px]">
              <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-300">
                {step < 4 ? (
                  <StarsQuestion
                    label={QUESTIONS[step]}
                    value={ratings[step]}
                    hover={hover[step]}
                    onChange={(v) =>
                      setRatings((prev) => {
                        const n = [...prev];
                        n[step] = v;
                        return n;
                      })
                    }
                    onHover={(v) =>
                      setHover((prev) => {
                        const n = [...prev];
                        n[step] = v;
                        return n;
                      })
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    <h3
                      className="text-base font-semibold text-center"
                      style={{ color: "#1e293b" }}
                    >
                      ¿Qué aspectos debería mejorar este evento?
                    </h3>
                    <p className="text-xs text-muted-foreground text-center">(Opcional)</p>
                    <textarea
                      value={comment}
                      maxLength={300}
                      onChange={(e) => setComment(e.target.value)}
                      rows={6}
                      placeholder="Escribe aquí tus comentarios y sugerencias..."
                      className="w-full p-3 rounded-lg border bg-card text-sm outline-none focus:border-ring resize-none"
                    />
                    <div className="text-right text-xs text-muted-foreground">
                      {comment.length}/300
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-7 py-4 border-t bg-secondary/30 flex items-center justify-between gap-3">
              <button
                onClick={handleClose}
                className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
              >
                Omitir por ahora
              </button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={step === 0}
                  onClick={() => setStep((s) => s - 1)}
                >
                  Anterior
                </Button>
                {step < totalSteps - 1 ? (
                  <Button
                    disabled={!canNext}
                    onClick={() => setStep((s) => s + 1)}
                    style={{ backgroundColor: "var(--puma-blue)" }}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    disabled={!canSubmit}
                    onClick={() => setDone(true)}
                    style={{ backgroundColor: canSubmit ? "#22c55e" : undefined }}
                    className={cn(!canSubmit && "opacity-50")}
                  >
                    Enviar encuesta
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StarsQuestion({
  label,
  value,
  hover,
  onChange,
  onHover,
}: {
  label: string;
  value: number;
  hover: number;
  onChange: (n: number) => void;
  onHover: (n: number) => void;
}) {
  const display = hover || value;
  const labels = ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"];
  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-center" style={{ color: "#1e293b" }}>
        {label}
      </h3>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onMouseEnter={() => onHover(v)}
            onMouseLeave={() => onHover(0)}
            onClick={() => onChange(v)}
            className="p-1.5 rounded-lg hover:bg-secondary transition"
          >
            <Star
              className={cn("size-11 transition-all", display >= v ? "scale-110" : "")}
              style={
                display >= v
                  ? { fill: "var(--puma-gold)", color: "var(--puma-gold)" }
                  : { fill: "#D1D5DB", color: "#D1D5DB" }
              }
            />
          </button>
        ))}
      </div>
      <div className="text-center text-sm text-muted-foreground h-5">
        {display > 0 ? labels[display - 1] : "Selecciona una calificación"}
      </div>
    </div>
  );
}
