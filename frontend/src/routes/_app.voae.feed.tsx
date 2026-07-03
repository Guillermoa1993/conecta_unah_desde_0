import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Bell, BellRing, ArrowRight, Trophy } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import {
  NOVEDADES,
  EVENTS,
  SUSCRIPCIONES,
  toggleSuscripcion,
  getStudentApprovedActivities,
  getConstanciaForActividad,
  CATEGORY_LABEL_LONG,
  LIMITE_POR_CATEGORIA,
  type Novedad,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/voae/feed")({
  component: VoaeFeed,
});

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`;
  return dateStr.slice(0, 10);
}

function VoaeFeed() {
  const { user } = useRole();
  const sorted = [...NOVEDADES].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const approved = getStudentApprovedActivities(user.id);
  const completadas: Record<string, number> = {};
  for (const a of approved) {
    completadas[a.categoria] = (completadas[a.categoria] || 0) + a.horas_acreditadas;
  }
  const fullCats = Object.entries(completadas)
    .filter(([, h]) => h >= LIMITE_POR_CATEGORIA)
    .map(([c]) => c);

  const nuevos = EVENTS.filter((e) => e.estado === "PROGRAMADO").slice(0, 2);

  const constanciasVerificadas = approved
    .map((a) => ({ a, c: getConstanciaForActividad(a.asistencia_id) }))
    .filter(({ c }) => c?.estado === "VERIFICADA");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Feed de Novedades" />
      <div className="space-y-3">
        {nuevos.map((e) => (
          <div
            key={e.id}
            className="rounded-xl border bg-card shadow-soft p-4 flex items-center gap-3"
            style={{ borderLeft: "3px solid #004B87" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Nuevo evento disponible: <span className="text-primary">{e.titulo}</span>
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="text-white gap-1 shrink-0"
              style={{ backgroundColor: "#004B87" }}
            >
              <Link to="/voae/events/$id" params={{ id: e.id }}>
                Ver evento <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ))}
        {constanciasVerificadas.map(({ a, c }) => {
          const ev = EVENTS.find((e) => e.id === a.asistencia_id?.split("-asist-")[0]);
          return (
            <div
              key={c!.id}
              className="rounded-xl border bg-card shadow-soft p-4 flex items-center gap-3"
              style={{ borderLeft: "3px solid #004B87" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Tu constancia de <span className="text-primary">{ev?.titulo || "evento"}</span>{" "}
                  fue verificada
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-1 shrink-0"
                style={{ borderColor: "#004B87", color: "#004B87" }}
              >
                <Link to="/voae/records">
                  Descargar <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          );
        })}
        {fullCats.map((cat) => (
          <div
            key={cat}
            className="rounded-xl border bg-card shadow-soft p-4 flex items-center gap-3"
            style={{ borderLeft: "3px solid #004B87" }}
          >
            <Trophy className="size-5 shrink-0" style={{ color: "#FFD100" }} />
            <p className="text-sm font-medium">
              ¡Completaste las 15h en {CATEGORY_LABEL_LONG[cat as keyof typeof CATEGORY_LABEL_LONG]}
              !
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {sorted.map((n) => (
          <NovedadCard key={n.id} novedad={n} />
        ))}
      </div>
    </div>
  );
}

function NovedadCard({ novedad: n }: { novedad: Novedad }) {
  const { user } = useRole();
  const [subscribed, setSubscribed] = useState(
    () =>
      !!n.evento_id &&
      SUSCRIPCIONES.some((s) => s.estudiante_id === user.id && s.evento_id === n.evento_id),
  );
  const initials = n.autor_nombre
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const eventoData = n.evento_id ? EVENTS.find((e) => e.id === n.evento_id) : null;

  return (
    <div className="rounded-xl border bg-card shadow-soft p-6">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="size-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
          style={{ backgroundColor: "#004B87" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{n.autor_nombre}</span>
            <span className="text-xs text-muted-foreground">{n.autor_rol}</span>
            <span className="text-xs text-muted-foreground ml-auto">{timeAgo(n.created_at)}</span>
          </div>
        </div>
      </div>
      <h3 className="font-bold text-base mb-1">{n.titulo}</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-line">{n.contenido}</p>
      {n.evento_id && event && (
        <Link
          to="/voae/events/$id"
          params={{ id: n.evento_id }}
          className="mt-3 block rounded-lg border p-3 bg-secondary/30 hover:bg-secondary/50 transition"
        >
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" style={{ color: "#004B87" }} />
            <span className="text-sm font-medium">{eventoData.titulo}</span>
          </div>
        </Link>
      )}
      {n.imagen_url && (
        <img src={n.imagen_url} alt="" className="mt-3 rounded-lg w-full object-cover max-h-64" />
      )}
      {n.evento_id && (
        <button
          onClick={() => setSubscribed(toggleSuscripcion(user.id, n.evento_id!))}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition"
          style={{
            backgroundColor: subscribed ? "#dbeafe" : "transparent",
            color: subscribed ? "#1e40af" : "#004B87",
            border: subscribed ? "1px solid #dbeafe" : "1px solid #004B87",
          }}
        >
          {subscribed ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
          {subscribed ? "Suscrito" : "Suscribirme"}
        </button>
      )}
    </div>
  );
}
