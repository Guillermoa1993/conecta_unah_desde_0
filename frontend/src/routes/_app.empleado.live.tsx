import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Users, CheckCircle2, RefreshCw, StopCircle, QrCode } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/app/StatsCard";
import { getEnrollments, getEventInscripciones } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/empleado/live")({
  component: LiveEvent,
});

function LiveEvent() {
  const [seconds, setSeconds] = useState(30);
  const [enrollments] = useState(() => getEnrollments("evt-003", getEventInscripciones("evt-003")));
  const [attended, setAttended] = useState(18);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s <= 1 ? 30 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAttended((a) => Math.min(a + 1, enrollments.length)), 5000);
    return () => clearInterval(t);
  }, [enrollments.length]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Festival Cultural UNAH 2026"
        description="Sesión en vivo · Plaza Central · 16:00 - 20:00"
        actions={
          <Button variant="destructive">
            <StopCircle className="size-4" /> Finalizar evento
          </Button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatsCard label="Inscritos" value={enrollments.length} icon={Users} tone="primary" />
        <StatsCard
          label="Asistencia"
          value={attended}
          hint={`${Math.round((attended / enrollments.length) * 100)}% del total`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatsCard label="Tiempo activo" value="1h 23m" icon={Clock} tone="gold" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  <QrCode className="size-4 text-primary" /> Código QR dinámico
                </div>
                <div className="text-xs text-muted-foreground">Se renueva automáticamente</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSeconds(30)}>
                <RefreshCw className="size-3.5" /> Regenerar
              </Button>
            </div>
            <div className="p-6">
              <div className="aspect-square w-full max-w-md mx-auto rounded-xl bg-white border-2 border-dashed border-primary/30 p-5 grid place-items-center">
                <FakeQR />
              </div>
              <div className="mt-5 text-center">
                <div className="text-xs text-muted-foreground mb-2">Expira en</div>
                <div className="text-3xl font-semibold text-primary tabular-nums">
                  00:{String(seconds).padStart(2, "0")}
                </div>
                <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-gold transition-all duration-1000"
                    style={{ width: `${(seconds / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">Asistencia en tiempo real</div>
                <div className="text-xs text-muted-foreground">
                  {attended} de {enrollments.length} estudiantes presentes
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-success animate-pulse" />
                <span className="text-success font-medium">EN VIVO</span>
              </div>
            </div>
            <div className="max-h-[480px] overflow-y-auto divide-y">
              {enrollments.map((s, i) => (
                <div
                  key={s.id}
                  className="p-4 flex items-center gap-3 hover:bg-secondary/40 transition"
                >
                  <div className="size-9 rounded-full gradient-primary text-primary-foreground grid place-items-center text-xs font-semibold shrink-0">
                    {s.studentName
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.studentName}</div>
                    <div className="text-xs text-muted-foreground">{s.studentId}</div>
                  </div>
                  {i < attended ? (
                    <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                      <CheckCircle2 className="size-4" /> {s.attendanceTime}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pendiente</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FakeQR() {
  // simple visual QR
  const cells = Array.from({ length: 25 * 25 }, (_, i) => (i * 7919 + 31) % 7 < 3);
  return (
    <div className="w-full h-full grid" style={{ gridTemplateColumns: "repeat(25, 1fr)", gap: 2 }}>
      {cells.map((b, i) => (
        <div key={i} className={b ? "bg-primary-dark rounded-[1px]" : "bg-transparent"} />
      ))}
    </div>
  );
}
