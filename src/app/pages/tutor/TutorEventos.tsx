import { useState, useMemo } from "react";
import { Link } from "react-router";
import { CalendarDays, Users, Eye, AlertCircle, X } from "lucide-react";

type EventStatus =
  | "BORRADOR" | "PENDIENTE_APROBACION" | "RECHAZADO"
  | "PROGRAMADO" | "EN_CURSO" | "FINALIZADO";
type EventCategory = "ACADEMICO" | "CULTURAL" | "DEPORTIVO" | "SOCIAL";

interface UniEvent {
  id: string; tutor_id: string; tutor_nombre: string; titulo: string;
  categoria: EventCategory; tipo_evento: "HORAS_VOAE" | "RECREACION";
  fecha_inicio: string; duracion_horas: number; cupo_maximo: number;
  estado: EventStatus; lugar: string; created_at: string;
  motivo_rechazo?: string; aprobado_por?: string;
}

const EVENTS: UniEvent[] = [
  { id:"evt-001", tutor_id:"TUT-0034", tutor_nombre:"Dr. Carlos Mendoza",
    titulo:"Taller de Investigación Académica", categoria:"ACADEMICO", tipo_evento:"HORAS_VOAE",
    fecha_inicio:"2026-06-12T09:00:00", duracion_horas:3, cupo_maximo:50,
    estado:"PROGRAMADO", lugar:"Aula Magna - Edificio A1", created_at:"2026-06-01T00:00:00",
    aprobado_por:"Lic. Roberto Fiallos" },
  { id:"evt-003", tutor_id:"TUT-0034", tutor_nombre:"Dr. Carlos Mendoza",
    titulo:"Festival Cultural UNAH 2026", categoria:"CULTURAL", tipo_evento:"HORAS_VOAE",
    fecha_inicio:"2026-06-09T16:00:00", duracion_horas:4, cupo_maximo:500,
    estado:"PROGRAMADO", lugar:"Plaza Central", created_at:"2026-05-20T00:00:00",
    aprobado_por:"Lic. Roberto Fiallos" },
  { id:"evt-004", tutor_id:"TUT-0034", tutor_nombre:"Dr. Carlos Mendoza",
    titulo:"Jornada de Voluntariado Social", categoria:"SOCIAL", tipo_evento:"HORAS_VOAE",
    fecha_inicio:"2026-05-28T08:00:00", duracion_horas:6, cupo_maximo:80,
    estado:"FINALIZADO", lugar:"Colonia Villanueva", created_at:"2026-05-10T00:00:00" },
  { id:"evt-007", tutor_id:"TUT-0034", tutor_nombre:"Dr. Carlos Mendoza",
    titulo:"Charla de Ética Profesional", categoria:"ACADEMICO", tipo_evento:"HORAS_VOAE",
    fecha_inicio:"2026-04-22T11:00:00", duracion_horas:2, cupo_maximo:60,
    estado:"FINALIZADO", lugar:"Aula 204", created_at:"2026-04-01T00:00:00" },
  { id:"evt-pend-001", tutor_id:"TUT-0034", tutor_nombre:"Dr. Carlos Mendoza",
    titulo:"Seminario: Ética en la Investigación", categoria:"ACADEMICO", tipo_evento:"HORAS_VOAE",
    fecha_inicio:"2026-07-05T10:00:00", duracion_horas:3, cupo_maximo:60,
    estado:"PENDIENTE_APROBACION", lugar:"Aula 301 - Edificio B", created_at:"2026-06-10T00:00:00" },
  { id:"evt-pend-002", tutor_id:"TUT-0034", tutor_nombre:"Dr. Carlos Mendoza",
    titulo:"Taller de Programación Web con React", categoria:"ACADEMICO", tipo_evento:"HORAS_VOAE",
    fecha_inicio:"2026-07-20T08:00:00", duracion_horas:8, cupo_maximo:40,
    estado:"PENDIENTE_APROBACION", lugar:"Lab de Cómputo 3", created_at:"2026-06-15T00:00:00" },
  { id:"evt-rech-001", tutor_id:"TUT-0034", tutor_nombre:"Dr. Carlos Mendoza",
    titulo:"Conferencia: Innovación en Ingeniería", categoria:"ACADEMICO", tipo_evento:"HORAS_VOAE",
    fecha_inicio:"2026-05-30T10:00:00", duracion_horas:3, cupo_maximo:80,
    estado:"RECHAZADO", lugar:"Auditorio de Ingeniería", created_at:"2026-05-10T00:00:00",
    motivo_rechazo:"No cumple con los requisitos mínimos del Artículo 140 — actividad sin componente académico validable." },
];

const CATEGORY_LABEL: Record<EventCategory, string> = {
  ACADEMICO:"Académico", CULTURAL:"Cultural", DEPORTIVO:"Deportivo", SOCIAL:"Social",
};
const CATEGORY_COLORS: Record<EventCategory, string> = {
  ACADEMICO:"#6d28d9", CULTURAL:"#db2777", DEPORTIVO:"#059669", SOCIAL:"#ea580c",
};

type Tab = "activos" | "pendientes" | "cerrados" | "rechazados";

const TAB_ESTADOS: Record<Tab, EventStatus[]> = {
  activos:    ["PROGRAMADO", "EN_CURSO"],
  pendientes: ["PENDIENTE_APROBACION"],
  cerrados:   ["FINALIZADO"],
  rechazados: ["RECHAZADO"],
};
const TAB_LABEL: Record<Tab, string> = {
  activos:"Activos", pendientes:"Pendiente de aprobación",
  cerrados:"Finalizados", rechazados:"Rechazados",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-HN", {
    day:"numeric", month:"short", year:"numeric",
  });
}

function getInscritos(id: string) {
  return 12 + (id.charCodeAt(id.length - 1) % 40);
}

function EstatusBadge({ estado }: { estado: EventStatus }) {
  const colors: Record<EventStatus, string> = {
    BORRADOR:"#94a3b8", PROGRAMADO:"#22c55e", EN_CURSO:"#3b82f6",
    PENDIENTE_APROBACION:"#f59e0b", FINALIZADO:"#64748b", RECHAZADO:"#ef4444",
  };
  const labels: Record<EventStatus, string> = {
    BORRADOR:"Borrador", PROGRAMADO:"Programado", EN_CURSO:"En curso",
    PENDIENTE_APROBACION:"Pendiente", FINALIZADO:"Finalizado", RECHAZADO:"Rechazado",
  };
  return (
    <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
      style={{ backgroundColor: colors[estado] }}>
      {labels[estado]}
    </span>
  );
}

/* ─── Modal de motivo ─── */
function MotivoModal({ event, onClose }: { event: UniEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#003366]">Motivo de rechazo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed">
          {event.motivo_rechazo ?? "El VOAE no especificó un motivo."}
        </div>
        <div className="flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-[#717182] hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export function TutorEventos() {
  const [tab, setTab] = useState<Tab>("activos");
  const [motivoEvent, setMotivoEvent] = useState<UniEvent | null>(null);

  // En producción vendría del session: tutor_id real
  const tutorId = "TUT-0034";
  const tutorEvents = useMemo(() => EVENTS.filter(e => e.tutor_id === tutorId), [tutorId]);

  const filteredEvents = useMemo(
    () => tutorEvents.filter(e => TAB_ESTADOS[tab].includes(e.estado)),
    [tutorEvents, tab],
  );

  const counts = useMemo(() => ({
    activos:    tutorEvents.filter(e => TAB_ESTADOS.activos.includes(e.estado)).length,
    pendientes: tutorEvents.filter(e => TAB_ESTADOS.pendientes.includes(e.estado)).length,
    cerrados:   tutorEvents.filter(e => TAB_ESTADOS.cerrados.includes(e.estado)).length,
    rechazados: tutorEvents.filter(e => TAB_ESTADOS.rechazados.includes(e.estado)).length,
  }), [tutorEvents]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mis Eventos</h1>
        <p className="text-sm text-muted-foreground">Gestiona y da seguimiento a tus eventos.</p>
      </div>

      {/* Aviso rechazados */}
      {tab === "rechazados" && counts.rechazados > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 shrink-0"/>
          <span>Los eventos rechazados pueden ser editados y reenviados a revisión.</span>
        </div>
      )}

      {/* Tabs — igual al Grupo 3: underline azul oscuro */}
      <div className="flex gap-1 border-b">
        {(Object.keys(TAB_ESTADOS) as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {TAB_LABEL[t]} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Lista */}
      {filteredEvents.length === 0 ? (
        <div className="py-20 text-center">
          <CalendarDays className="size-12 mx-auto text-muted-foreground/40 mb-3"/>
          <p className="text-sm text-muted-foreground">No hay eventos en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map(event => {
            const inscritos = getInscritos(event.id);
            const catColor  = CATEGORY_COLORS[event.categoria];
            return (
              <div key={event.id}
                className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm">
                {/* Ícono categoría */}
                <div className="size-12 rounded-lg grid place-items-center shrink-0"
                  style={{ backgroundColor: catColor + "20" }}>
                  <CalendarDays className="size-5" style={{ color: catColor }}/>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to="/tutor/live"
                      className="font-semibold text-sm hover:underline truncate">
                      {event.titulo}
                    </Link>
                    <EstatusBadge estado={event.estado}/>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>{CATEGORY_LABEL[event.categoria]}</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3"/>
                      {formatDate(event.fecha_inicio)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3"/>
                      {inscritos} inscritos
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  {event.estado === "RECHAZADO" && (
                    <button onClick={() => setMotivoEvent(event)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                      <AlertCircle className="size-3.5"/>Ver motivo
                    </button>
                  )}
                  <Link to="/tutor/live"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      event.estado === "RECHAZADO"
                        ? "text-muted-foreground hover:bg-gray-50"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}>
                    <Eye className="size-3.5"/>Ver detalle
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal motivo rechazo */}
      {motivoEvent && (
        <MotivoModal event={motivoEvent} onClose={() => setMotivoEvent(null)}/>
      )}
    </div>
  );
}
