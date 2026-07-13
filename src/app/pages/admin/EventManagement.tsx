import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  CalendarDays, PlusCircle, CheckCircle2, Eye, History,
  Clock, XCircle,
} from "lucide-react";

/* ─── Types (portadas del mock-data de Grupo 3) ─── */
type EventStatus =
  | "BORRADOR"
  | "PENDIENTE_APROBACION"
  | "RECHAZADO"
  | "PROGRAMADO"
  | "EN_CURSO"
  | "FINALIZADO";
type EventCategory = "ACADEMICO" | "CULTURAL" | "DEPORTIVO" | "SOCIAL";

interface UniEvent {
  id: string;
  tutor_id: string;
  tutor_nombre: string;
  titulo: string;
  descripcion: string;
  categoria: EventCategory;
  tipo_evento: "HORAS_VOAE" | "RECREACION";
  fecha_inicio: string;
  fecha_fin: string;
  duracion_horas: number;
  cupo_maximo: number;
  estado: EventStatus;
  lugar: string;
  created_at: string;
  tipo_actividad?: "Presencial" | "Virtual" | "Híbrido";
  entidad_organizadora?: string;
  centro_regional?: string;
  requiere_inscripcion: boolean;
  aprobado_por?: string;
  motivo_rechazo?: string;
  visibilidad?: "PUBLICO" | "PRIVADO";
}

/* ─── Mock data (igual al Grupo 3) ─── */
const EVENTS: UniEvent[] = [
  {
    id: "evt-001", tutor_id: "TUT-0034", tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Taller de Investigación Académica",
    descripcion: "Aprende metodologías modernas de investigación científica y redacción académica.",
    categoria: "ACADEMICO", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-06-12T09:00:00", fecha_fin: "2026-06-12T12:00:00",
    duracion_horas: 3, cupo_maximo: 50, estado: "PROGRAMADO",
    lugar: "Aula Magna - Edificio A1", created_at: "2026-06-01T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Facultad de Ciencias",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true,
    aprobado_por: "Lic. Roberto Fiallos", visibilidad: "PUBLICO",
  },
  {
    id: "evt-002", tutor_id: "TUT-0045", tutor_nombre: "Lic. Ana Sánchez",
    titulo: "Conferencia: Liderazgo Universitario",
    descripcion: "Sesión con líderes nacionales sobre el rol del estudiante universitario.",
    categoria: "SOCIAL", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-06-15T14:00:00", fecha_fin: "2026-06-15T16:00:00",
    duracion_horas: 2, cupo_maximo: 200, estado: "PROGRAMADO",
    lugar: "Auditorio Central", created_at: "2026-06-02T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Facultad de Ciencias Sociales",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
  },
  {
    id: "evt-003", tutor_id: "TUT-0034", tutor_nombre: "Prof. María Lagos",
    titulo: "Festival Cultural UNAH 2026",
    descripcion: "Celebración de la diversidad cultural con presentaciones artísticas.",
    categoria: "CULTURAL", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-06-09T16:00:00", fecha_fin: "2026-06-09T20:00:00",
    duracion_horas: 4, cupo_maximo: 500, estado: "PROGRAMADO",
    lugar: "Plaza Central", created_at: "2026-05-20T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Vicerrectoría de Cultura",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true,
    aprobado_por: "Lic. Roberto Fiallos", visibilidad: "PUBLICO",
  },
  {
    id: "evt-004", tutor_id: "TUT-0034", tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Jornada de Voluntariado Social",
    descripcion: "Servicio comunitario en colonias vulnerables de Tegucigalpa.",
    categoria: "SOCIAL", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-05-28T08:00:00", fecha_fin: "2026-05-28T14:00:00",
    duracion_horas: 6, cupo_maximo: 80, estado: "FINALIZADO",
    lugar: "Colonia Villanueva", created_at: "2026-05-10T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Vicerrectoría de Vinculación",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
  },
  {
    id: "evt-005", tutor_id: "TUT-0045", tutor_nombre: "Lic. Pedro Romero",
    titulo: "Torneo Interuniversitario de Ajedrez",
    descripcion: "Competencia académica deportiva entre facultades.",
    categoria: "DEPORTIVO", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-05-20T10:00:00", fecha_fin: "2026-05-20T15:00:00",
    duracion_horas: 5, cupo_maximo: 64, estado: "FINALIZADO",
    lugar: "Gimnasio Universitario", created_at: "2026-05-01T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Dirección de Deportes",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
  },
  {
    id: "evt-006", tutor_id: "TUT-0045", tutor_nombre: "Ing. Laura Paz",
    titulo: "Seminario: Inteligencia Artificial Aplicada",
    descripcion: "Aplicaciones de IA en la investigación universitaria.",
    categoria: "ACADEMICO", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-05-10T15:00:00", fecha_fin: "2026-05-10T18:00:00",
    duracion_horas: 3, cupo_maximo: 40, estado: "FINALIZADO",
    lugar: "Lab. Computación 3", created_at: "2026-04-15T00:00:00",
    tipo_actividad: "Virtual", entidad_organizadora: "Facultad de Ingeniería",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
  },
  {
    id: "evt-pend-001", tutor_id: "TUT-0034", tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Seminario: Ética en la Investigación",
    descripcion: "Seminario sobre principios éticos en la investigación académica universitaria.",
    categoria: "ACADEMICO", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-07-05T10:00:00", fecha_fin: "2026-07-05T13:00:00",
    duracion_horas: 3, cupo_maximo: 60, estado: "PENDIENTE_APROBACION",
    lugar: "Aula 301 - Edificio B", created_at: "2026-06-10T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Facultad de Ciencias",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
  },
  {
    id: "evt-007", tutor_id: "TUT-0034", tutor_nombre: "Lic. Ana Sánchez",
    titulo: "Charla de Ética Profesional",
    descripcion: "Reflexión sobre el ejercicio ético en las profesiones.",
    categoria: "ACADEMICO", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-04-22T11:00:00", fecha_fin: "2026-04-22T13:00:00",
    duracion_horas: 2, cupo_maximo: 60, estado: "FINALIZADO",
    lugar: "Aula 204", created_at: "2026-04-01T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Facultad de Humanidades",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
  },
  {
    id: "evt-pend-002", tutor_id: "TUT-0045", tutor_nombre: "Ing. Laura Paz",
    titulo: "Taller de Programación Web con React",
    descripcion: "Fundamentos de desarrollo frontend con React y TypeScript.",
    categoria: "ACADEMICO", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-07-20T08:00:00", fecha_fin: "2026-07-21T12:00:00",
    duracion_horas: 8, cupo_maximo: 40, estado: "PENDIENTE_APROBACION",
    lugar: "Lab de Cómputo 3", created_at: "2026-06-15T00:00:00",
    tipo_actividad: "Híbrido", entidad_organizadora: "Facultad de Ingeniería",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
  },
  {
    id: "evt-rech-001", tutor_id: "TUT-0034", tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Conferencia: Innovación en Ingeniería",
    descripcion: "Conferencia sobre innovación tecnológica en la ingeniería moderna.",
    categoria: "ACADEMICO", tipo_evento: "HORAS_VOAE",
    fecha_inicio: "2026-05-30T10:00:00", fecha_fin: "2026-05-30T13:00:00",
    duracion_horas: 3, cupo_maximo: 80, estado: "RECHAZADO",
    lugar: "Auditorio de Ingeniería", created_at: "2026-05-10T00:00:00",
    tipo_actividad: "Presencial", entidad_organizadora: "Facultad de Ingeniería",
    centro_regional: "Ciudad Universitaria", requiere_inscripcion: true, visibilidad: "PUBLICO",
    motivo_rechazo: "No cumple con los requisitos mínimos del Artículo 140 — actividad sin componente académico validable.",
  },
];

const CATEGORY_LABEL: Record<EventCategory, string> = {
  ACADEMICO: "Académico", CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo", SOCIAL: "Social",
};
const CATEGORY_COLORS: Record<EventCategory, string> = {
  ACADEMICO: "#6d28d9", CULTURAL: "#db2777",
  DEPORTIVO: "#059669", SOCIAL: "#ea580c",
};

/* ─── Helpers ─── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getInscripciones(eventId: string) {
  const seed = eventId.charCodeAt(eventId.length - 1);
  return 12 + (seed % 40);
}

function EstatusBadge({ estado }: { estado: EventStatus }) {
  const colores: Record<EventStatus, string> = {
    BORRADOR:             "#94a3b8",
    PROGRAMADO:           "#22c55e",
    EN_CURSO:             "#3b82f6",
    PENDIENTE_APROBACION: "#f59e0b",
    FINALIZADO:           "#64748b",
    RECHAZADO:            "#ef4444",
  };
  const labels: Record<EventStatus, string> = {
    BORRADOR: "Borrador", PROGRAMADO: "Programado", EN_CURSO: "En curso",
    PENDIENTE_APROBACION: "Pendiente", FINALIZADO: "Finalizado", RECHAZADO: "Rechazado",
  };
  return (
    <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
      style={{ backgroundColor: colores[estado] }}>
      {labels[estado]}
    </span>
  );
}

/* ─── Tutor / Empleado view (igual al Grupo 3) ─── */
function TutorGestion() {
  const navigate = useNavigate();
  const tutorEvents = useMemo(() => EVENTS.filter(e => e.tutor_id === "TUT-0034"), []);

  const counts = useMemo(() => ({
    activos:    tutorEvents.filter(e => e.estado === "PROGRAMADO" || e.estado === "EN_CURSO").length,
    pendientes: tutorEvents.filter(e => e.estado === "PENDIENTE_APROBACION").length,
    cerrados:   tutorEvents.filter(e => e.estado === "FINALIZADO" || e.estado === "RECHAZADO").length,
  }), [tutorEvents]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Panel de gestión</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de tus eventos</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { val: counts.activos,    label: "Activos",     color: "text-[#1e3a5f]", bg: "bg-green-100",  icon: CheckCircle2, iconCls: "text-green-600" },
          { val: counts.pendientes, label: "Pendientes",  color: "text-amber-500", bg: "bg-amber-100",  icon: Clock,        iconCls: "text-amber-500" },
          { val: counts.cerrados,   label: "Finalizados", color: "text-slate-500", bg: "bg-slate-100",  icon: History,      iconCls: "text-slate-500" },
        ].map(s => (
          <button key={s.label}
            onClick={() => navigate("/tutor/create-event")}
            className="rounded-xl border bg-card p-5 text-left hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
              <div className={`size-10 rounded-lg ${s.bg} grid place-items-center`}>
                <s.icon className={`size-5 ${s.iconCls}`}/>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-2">Acceso rápido</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crea un nuevo evento para que los estudiantes puedan inscribirse.
        </p>
        <Link to="/tutor/create-event"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-white text-sm font-bold rounded-lg transition-colors"
          style={{ backgroundColor: "#1e3a5f" }}>
          <PlusCircle className="size-4"/>Crear nuevo evento
        </Link>
      </div>

      {/* Mis eventos recientes */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground"/>Mis eventos recientes
        </h3>
        <div className="space-y-2">
          {tutorEvents.slice(0, 5).map(ev => (
            <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{ev.titulo}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(ev.fecha_inicio)} · {ev.duracion_horas}h · {ev.lugar}
                </p>
              </div>
              <EstatusBadge estado={ev.estado}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── VOAE / Admin view (igual al Grupo 3) ─── */
type VoaeTab = "aprobados" | "rechazados";

function VoaeGestion() {
  const [voaeTab, setVoaeTab] = useState<VoaeTab>("aprobados");

  const pendingEvents = useMemo(() =>
    EVENTS.filter(e => e.estado === "PENDIENTE_APROBACION")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  []);

  const closedEvents = useMemo(() =>
    EVENTS.filter(e => e.estado === "FINALIZADO" || e.estado === "EN_CURSO")
      .sort((a, b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime()),
  []);

  const approvedEvents = useMemo(() =>
    EVENTS.filter(e => ["PROGRAMADO", "EN_CURSO", "FINALIZADO"].includes(e.estado)), []);

  const rejectedEvents = useMemo(() =>
    EVENTS.filter(e => e.estado === "RECHAZADO"), []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Panel de gestión</h1>
        <p className="text-sm text-muted-foreground mt-1">Operaciones de validación y auditoría</p>
      </div>

      {/* Pendientes de aprobación */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="size-4 text-amber-500"/>Eventos por aprobar
        </h2>
        {pendingEvents.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <CheckCircle2 className="size-10 mx-auto text-green-400 mb-2"/>
            <p className="text-sm text-muted-foreground">No hay eventos pendientes de aprobación.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingEvents.map(ev => (
              <div key={ev.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{ev.titulo}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>Tutor: {ev.tutor_nombre}</span>
                    <span>Inicia: {formatDate(ev.fecha_inicio)}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[ev.categoria] }}>
                      {CATEGORY_LABEL[ev.categoria]}
                    </span>
                  </div>
                </div>
                <Link to="/voae/events/evt-001/validar"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                  <Eye className="size-3.5"/>Ver evento
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Eventos finalizados */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History className="size-4 text-slate-500"/>Eventos finalizados
        </h2>
        <div className="space-y-2">
          {closedEvents.slice(0, 5).map(ev => {
            const inscritos = getInscripciones(ev.id);
            return (
              <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ev.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ev.tutor_nombre} · {formatDate(ev.fecha_inicio)} · {inscritos} asistencias
                  </p>
                </div>
                <Link to="/voae/events/evt-001/validar"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                  <Eye className="size-3.5"/>Ver validación
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabs aprobados / rechazados */}
      <section>
        <div className="flex gap-1 border-b mb-3">
          {(["aprobados", "rechazados"] as VoaeTab[]).map(t => (
            <button key={t} onClick={() => setVoaeTab(t)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                voaeTab === t
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "aprobados" ? "Aprobados" : "Rechazados"}
            </button>
          ))}
        </div>

        {voaeTab === "aprobados" ? (
          approvedEvents.length === 0
            ? <p className="text-sm text-muted-foreground py-4">No hay eventos aprobados.</p>
            : (
              <div className="space-y-2">
                {approvedEvents.map(ev => (
                  <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ev.titulo}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {ev.tutor_nombre}
                        {ev.aprobado_por ? ` · Aprobado por ${ev.aprobado_por}` : ""}
                        {" · "}{formatDate(ev.created_at)}
                      </p>
                    </div>
                    <EstatusBadge estado={ev.estado}/>
                  </div>
                ))}
              </div>
            )
        ) : (
          rejectedEvents.length === 0
            ? <p className="text-sm text-muted-foreground py-4">No hay eventos rechazados.</p>
            : (
              <div className="space-y-2">
                {rejectedEvents.map(ev => (
                  <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ev.titulo}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {ev.tutor_nombre} · Rechazado
                      </p>
                      {ev.motivo_rechazo && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <XCircle className="size-3 flex-shrink-0"/>
                          Motivo: {ev.motivo_rechazo}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
        )}
      </section>
    </div>
  );
}

/* ─── Entry point: detecta rol y muestra la vista correcta ─── */
export function EventManagement() {
  const role = sessionStorage.getItem("unah_role") ?? "admin";
  if (role === "tutor") return <TutorGestion />;
  return <VoaeGestion />;
}
