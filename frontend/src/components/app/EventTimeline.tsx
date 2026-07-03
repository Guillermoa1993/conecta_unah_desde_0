import { Check, X, Circle } from "lucide-react";
import type { EventStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface EventTimelineProps {
  status: EventStatus;
  createdAt: string;
  sentToVoaeAt?: string;
  approvedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  validatedAt?: string;
}

interface StepConfig {
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isRejected?: boolean;
  date?: string;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function EventTimeline({
  status,
  createdAt,
  sentToVoaeAt,
  approvedAt,
  startedAt,
  finishedAt,
  validatedAt,
}: EventTimelineProps) {
  const statusOrder: Record<EventStatus, number> = {
    BORRADOR: 0,
    PENDIENTE_APROBACION: 1,
    RECHAZADO: 1,
    PROGRAMADO: 2,
    EN_CURSO: 3,
    EN_CURSO_SALIDA: 3,
    FINALIZADO: 4,
  };

  const currentIdx = statusOrder[status] ?? 0;

  const steps: StepConfig[] = [
    {
      label: "Creado",
      isCompleted: true,
      isCurrent: currentIdx === 0 && status !== "RECHAZADO",
      date: createdAt,
    },
    {
      label: "Enviado a VOAE",
      isCompleted: currentIdx >= 1 && status !== "RECHAZADO",
      isCurrent: currentIdx === 1 && status !== "RECHAZADO",
      isRejected: status === "RECHAZADO",
      date: sentToVoaeAt,
    },
    {
      label: "Aprobado",
      isCompleted: currentIdx >= 2,
      isCurrent: currentIdx === 2,
      date: approvedAt,
    },
    {
      label: "En curso",
      isCompleted: currentIdx >= 3,
      isCurrent: currentIdx === 3,
      date: startedAt,
    },
    {
      label: "Finalizado",
      isCompleted: currentIdx >= 4,
      isCurrent: currentIdx === 4,
      date: finishedAt,
    },
    {
      label: "Validado por VOAE",
      isCompleted: status === "FINALIZADO" && !!validatedAt,
      isCurrent: false,
      date: validatedAt,
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between gap-0 flex-wrap">
        {steps.map((step, i) => (
          <div
            key={step.label}
            className={cn("flex flex-col items-center flex-1 min-w-[80px]", i > 0 && "relative")}
          >
            <div className="flex items-center w-full">
              {i > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 -mr-2.5 z-0",
                    step.isCompleted || steps[i - 1].isCompleted
                      ? "bg-[#22c55e]"
                      : "border-t-2 border-dashed border-[#e2e8f0]",
                  )}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    "size-10 rounded-full grid place-items-center transition-all duration-300",
                    step.isRejected && "bg-red-500",
                    !step.isRejected && step.isCompleted && "bg-[#22c55e]",
                    !step.isRejected &&
                      step.isCurrent &&
                      "bg-[var(--puma-blue)] ring-4 ring-[var(--puma-blue)]/20 animate-pulse",
                    !step.isRejected && !step.isCompleted && !step.isCurrent && "bg-[#e2e8f0]",
                  )}
                >
                  {step.isRejected ? (
                    <X className="size-5 text-white" />
                  ) : step.isCompleted ? (
                    <Check className="size-5 text-white" />
                  ) : step.isCurrent ? (
                    <Circle className="size-2.5 fill-white text-white" />
                  ) : (
                    <Circle className="size-2.5 fill-[#94a3b8] text-[#94a3b8]" />
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 -ml-2.5 z-0",
                    step.isCompleted ? "bg-[#22c55e]" : "border-t-2 border-dashed border-[#e2e8f0]",
                  )}
                />
              )}
            </div>
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-xs font-medium leading-tight",
                  step.isRejected && "text-red-500",
                  step.isCurrent && !step.isRejected && "text-[var(--puma-blue)] font-semibold",
                  !step.isCurrent && !step.isRejected && "text-muted-foreground",
                )}
              >
                {step.label}
              </div>
              <div
                className={cn(
                  "text-[10px] mt-0.5",
                  step.isRejected ? "text-red-400" : "text-muted-foreground",
                )}
              >
                {step.isRejected ? "Rechazado" : step.date ? formatDate(step.date) : "Pendiente"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
