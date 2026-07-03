import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/student/survey")({
  component: SurveyPage,
});

const QUESTIONS = [
  "¿Cómo calificarías la organización del evento?",
  "¿El contenido fue relevante para tu formación?",
  "¿Qué tan claro fue el facilitador?",
  "¿Recomendarías este evento a otros estudiantes?",
];

function SurveyPage() {
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState<number[]>(Array(QUESTIONS.length).fill(0));
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  const pct = Math.round(((step + 1) / (QUESTIONS.length + 1)) * 100);
  const setRating = (v: number) => {
    const next = [...ratings];
    next[step] = v;
    setRatings(next);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border bg-card shadow-card p-10 text-center">
          <div className="size-16 mx-auto rounded-full bg-success/15 grid place-items-center mb-4">
            <CheckCircle2 className="size-9 text-success" />
          </div>
          <h2 className="text-2xl font-semibold">¡Gracias por tu retroalimentación!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Tu opinión ayuda a mejorar la calidad académica.
          </p>
          <Button
            className="mt-6 gradient-primary text-primary-foreground"
            onClick={() => {
              setStep(0);
              setRatings(Array(QUESTIONS.length).fill(0));
              setDone(false);
              setComment("");
            }}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const isCommentStep = step === QUESTIONS.length;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Encuesta de satisfacción"
        description="Festival Cultural UNAH 2026 — comparte tu experiencia."
      />

      <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>
              Paso {step + 1} de {QUESTIONS.length + 1}
            </span>
            <span className="font-medium text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="p-8 min-h-[280px]">
          {!isCommentStep ? (
            <div
              className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
              key={step}
            >
              <h3 className="text-xl font-semibold text-center">{QUESTIONS[step]}</h3>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setRating(v)}
                    className="p-2 rounded-lg hover:bg-secondary transition group"
                  >
                    <Star
                      className={`size-10 transition ${ratings[step] >= v ? "fill-gold text-gold" : "text-muted-foreground/40 group-hover:text-gold/60"}`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {ratings[step] === 0
                  ? "Selecciona una calificación"
                  : ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"][ratings[step] - 1]}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Comentarios adicionales</h3>
              <p className="text-sm text-muted-foreground">
                Opcional — comparte sugerencias o aspectos a mejorar.
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                placeholder="Escribe tu comentario aquí…"
                className="w-full p-4 rounded-lg border bg-card outline-none focus:border-ring text-sm resize-none"
              />
            </div>
          )}
        </div>

        <div className="p-5 border-t flex items-center justify-between gap-3 bg-secondary/30">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Anterior
          </Button>
          {!isCommentStep ? (
            <Button
              disabled={ratings[step] === 0}
              onClick={() => setStep((s) => s + 1)}
              className="gradient-primary text-primary-foreground"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={() => setDone(true)}
            >
              Enviar encuesta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
