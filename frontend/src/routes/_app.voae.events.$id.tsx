import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, notFound, Outlet, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EVENTS,
  CATEGORY_LABEL,
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  getEventInscripciones,
  getAsistencias,
  type Asistencia,
} from "@/lib/mock-data";
import { eventRejectionReasons } from "@/lib/event-store";
import { VoaeApproveModal } from "@/components/app/VoaeApproveModal";
import { RejectModal } from "@/components/app/RejectModal";
import { EventTimeline } from "@/components/app/EventTimeline";
import { toast } from "sonner";

function ReadOnlyMap({
  lat,
  lng,
  lugar,
}: {
  lat?: number | null;
  lng?: number | null;
  lugar?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(() => leaflet);
    });
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current || lat == null || lng == null) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const map = L.map(mapRef.current, { zoomControl: false }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(lugar || "");
    mapInstanceRef.current = map;
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L, lat, lng, lugar]);

  if (lat == null || lng == null) {
    return (
      <div className="rounded-xl border bg-card shadow-soft h-52 flex items-center justify-center gap-2 text-muted-foreground">
        <MapPin className="size-5" />
        <span className="text-sm">Ubicaci\u00f3n no disponible</span>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-52 rounded-xl overflow-hidden border" />;
}

function PortadaMapSection({ event }: { event: (typeof EVENTS)[number] }) {
  const color = CATEGORY_COLORS[event.categoria] || "#64748b";
  const initials = CATEGORY_LABEL[event.categoria]?.slice(0, 2).toUpperCase();

  const portada = event.portada_url ? (
    <img src={event.portada_url} alt="" className="w-full h-52 object-cover rounded-xl" />
  ) : (
    <div
      className="w-full h-52 rounded-xl grid place-items-center"
      style={{ backgroundColor: color + "15" }}
    >
      <div
        className="size-20 rounded-full grid place-items-center"
        style={{ backgroundColor: color + "25" }}
      >
        <div className="text-3xl font-bold" style={{ color }}>
          {initials}
        </div>
      </div>
    </div>
  );

  const rawTipo: string = event.tipo_actividad || "Presencial";

  const rightContent = () => {
    const tipo = rawTipo.toLowerCase();
    if (tipo === "virtual") {
      return (
        <div
          className="rounded-xl h-52 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <Video className="size-8" style={{ color: "#3b82f6" }} />
          {event.enlace_virtual ? (
            <a
              href={event.enlace_virtual}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline"
              style={{ color: "#3b82f6" }}
            >
              {event.enlace_virtual}
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">Sin enlace disponible</span>
          )}
        </div>
      );
    }
    if (tipo === "híbrido" || tipo === "hibrido") {
      return (
        <div className="space-y-2">
          <div
            className="rounded-xl flex items-center gap-3 p-3"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
          >
            <Video className="size-5 shrink-0" style={{ color: "#3b82f6" }} />
            {event.enlace_virtual ? (
              <a
                href={event.enlace_virtual}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium underline"
                style={{ color: "#3b82f6" }}
              >
                {event.enlace_virtual}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">Sin enlace</span>
            )}
          </div>
          <ReadOnlyMap lat={event.latitud} lng={event.longitud} lugar={event.lugar} />
        </div>
      );
    }
    return <ReadOnlyMap lat={event.latitud} lng={event.longitud} lugar={event.lugar} />;
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-[55%]">{portada}</div>
      <div className="w-full md:w-[45%]">{rightContent()}</div>
    </div>
  );
}

export const Route = createFileRoute("/_app/voae/events/$id")({
  loader: ({ params }) => {
    const eventoData = EVENTS.find((e) => e.id === params.id);
    if (!eventoData) throw notFound();
    return { event: eventoData };
  },
  notFoundComponent: () => <div className="p-8">Evento no encontrado</div>,
  component: VoaeEventView,
});

function VoaeEventView() {
  const { event: eventoData } = Route.useLoaderData();
  const { location } = useRouterState();

  if (eventoData.estado === "PENDIENTE_APROBACION" || eventoData.estado === "RECHAZADO") {
    return <ApprovalView event={eventoData} />;
  }

  const isChildRoute = location.pathname.includes("/validacion");

  if (isChildRoute) return <Outlet />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información del evento</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <InfoView event={eventoData} />
        </TabsContent>
        <TabsContent value="asistencia">
          <AsistenciaTab event={eventoData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoView({ event }: { event: (typeof EVENTS)[number] }) {
  const color = CATEGORY_COLORS[event.categoria] || "#64748b";
  const initials = event.tutor_nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="rounded-xl border bg-card shadow-soft p-6">
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-full grid place-items-center text-sm font-bold shrink-0"
            style={{ backgroundColor: color + "20", color }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{event.titulo}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {CATEGORY_LABEL[event.categoria]} · {event.fecha_inicio.slice(0, 10)} · {event.lugar}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div
                className="size-6 rounded-full grid place-items-center text-[9px] font-semibold"
                style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
              >
                {initials}
              </div>
              <span className="text-sm font-medium">{event.tutor_nombre}</span>
              <span className="text-xs text-muted-foreground ml-2">
                · Solicitado por: {event.tutor_nombre}
              </span>
            </div>
          </div>
        </div>
      </div>

      <PortadaMapSection event={event} />

      <EventTimeline status={event.estado} createdAt={event.created_at} />

      <div className="grid lg:grid-cols-[65%_35%] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div
              className="px-5 py-3 border-b"
              style={{ backgroundColor: "var(--puma-light-gray)" }}
            >
              <h2 className="font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
                Información General
              </h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Código de actividad</div>
                <div className="font-medium mt-0.5">{event.codigo_actividad || event.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Horario</div>
                <div className="font-medium mt-0.5">
                  {event.fecha_inicio.slice(11, 16)} - {event.fecha_fin.slice(11, 16)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fecha de Inicio</div>
                <div className="font-medium mt-0.5">{event.fecha_inicio.slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fecha de Finalización</div>
                <div className="font-medium mt-0.5">{event.fecha_fin.slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tipo de actividad</div>
                <div className="font-medium mt-0.5">{event.tipo_actividad || "Presencial"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ubicación</div>
                <div className="font-medium mt-0.5">{event.lugar}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div
              className="px-5 py-3 border-b"
              style={{ backgroundColor: "var(--puma-light-gray)" }}
            >
              <h2 className="font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
                Modalidades de la Actividad
              </h2>
            </div>
            <div className="px-5 py-4 text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-2 font-medium">Modalidad</th>
                    <th className="pb-2 font-medium">Asistencias</th>
                    <th className="pb-2 font-medium">Ámbitos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3">{event.tipo_actividad || "Presencial"}</td>
                    <td className="py-3">{event.asistencias_requeridas || 1}</td>
                    <td className="py-3">
                      <span style={{ color: "var(--puma-blue)" }} className="font-medium">
                        {event.duracion_horas} horas en {CATEGORY_LABEL_LONG[event.categoria]}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div
              className="px-5 py-3 border-b"
              style={{ backgroundColor: "var(--puma-light-gray)" }}
            >
              <h2 className="font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
                Descripción
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground/80 leading-relaxed">{event.descripcion}</p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start space-y-4">
          <div className="rounded-xl border bg-card shadow-soft p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Cupos</div>
            <div className="text-lg font-bold" style={{ color: "#22c55e" }}>
              {event.cupo_maximo - getEventInscripciones(event.id)} disponibles
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Modalidad: {event.tipo_actividad || "Presencial"}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ─── APPROVAL VIEW (PENDIENTE_APROBACION / RECHAZADO) ─── */
function ApprovalView({ event }: { event: (typeof EVENTS)[number] }) {
  const [events, setEvents] = useState(EVENTS);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  const handleApprove = (comentario?: string) => {
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx === -1) return;
    const updated = [...events];
    updated[idx] = { ...updated[idx], estado: "PROGRAMADO" as const };
    setEvents(updated);
    toast.success("Evento aprobado", {
      description: `${event.titulo} ahora está visible para estudiantes.${comentario ? " Comentario: " + comentario : ""}`,
      style: { backgroundColor: "#22c55e", color: "white" },
    });
    setApproveOpen(false);
  };

  const handleReject = (reason: string) => {
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx === -1) return;
    const updated = [...events];
    updated[idx] = { ...updated[idx], estado: "RECHAZADO" as const };
    setEvents(updated);
    eventRejectionReasons[event.id] = reason;
    toast.success("Evento rechazado", {
      description: `VOAE rechazó ${event.titulo}.`,
      style: { backgroundColor: "#ef4444", color: "white" },
    });
    setRejectOpen(false);
  };

  const color = CATEGORY_COLORS[event.categoria] || "#64748b";
  const initials = event.tutor_nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>

      {/* Header with tutor */}
      <div className="rounded-xl border bg-card shadow-soft p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="size-14 rounded-full grid place-items-center text-sm font-bold shrink-0"
              style={{ backgroundColor: color + "20", color }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{event.titulo}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {CATEGORY_LABEL[event.categoria]} · {event.fecha_inicio.slice(0, 10)} ·{" "}
                {event.lugar}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="size-6 rounded-full grid place-items-center text-[9px] font-semibold"
                  style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
                >
                  {initials}
                </div>
                <span className="text-sm font-medium">{event.tutor_nombre}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  · Solicitado por: {event.tutor_nombre}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              className="text-white gap-1.5"
              style={{ backgroundColor: "#22c55e" }}
              onClick={() => setApproveOpen(true)}
            >
              <CheckCircle2 className="size-4" /> Aprobar evento
            </Button>
            <Button
              className="text-white gap-1.5"
              style={{ backgroundColor: "#ef4444" }}
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="size-4" /> Rechazar evento
            </Button>
          </div>
        </div>
      </div>

      <PortadaMapSection event={event} />

      {/* Timeline */}
      <EventTimeline status={event.estado} createdAt={event.created_at} />

      {/* Info grid */}
      <div className="grid lg:grid-cols-[65%_35%] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div
              className="px-5 py-3 border-b"
              style={{ backgroundColor: "var(--puma-light-gray)" }}
            >
              <h2 className="font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
                Información General
              </h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Código de actividad</div>
                <div className="font-medium mt-0.5">{event.codigo_actividad || event.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Horario</div>
                <div className="font-medium mt-0.5">
                  {event.fecha_inicio.slice(11, 16)} - {event.fecha_fin.slice(11, 16)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fecha de Inicio</div>
                <div className="font-medium mt-0.5">{event.fecha_inicio.slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fecha de Finalización</div>
                <div className="font-medium mt-0.5">{event.fecha_fin.slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tipo de actividad</div>
                <div className="font-medium mt-0.5">{event.tipo_actividad || "Presencial"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Ubicación</div>
                <div className="font-medium mt-0.5">{event.lugar}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div
              className="px-5 py-3 border-b"
              style={{ backgroundColor: "var(--puma-light-gray)" }}
            >
              <h2 className="font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
                Modalidades de la Actividad
              </h2>
            </div>
            <div className="px-5 py-4 text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-2 font-medium">Modalidad</th>
                    <th className="pb-2 font-medium">Asistencias</th>
                    <th className="pb-2 font-medium">Ámbitos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3">{event.tipo_actividad || "Presencial"}</td>
                    <td className="py-3">{event.asistencias_requeridas || 1}</td>
                    <td className="py-3">
                      <span style={{ color: "var(--puma-blue)" }} className="font-medium">
                        {event.duracion_horas} horas en {CATEGORY_LABEL_LONG[event.categoria]}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div
              className="px-5 py-3 border-b"
              style={{ backgroundColor: "var(--puma-light-gray)" }}
            >
              <h2 className="font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
                Descripción
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground/80 leading-relaxed">{event.descripcion}</p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start space-y-4">
          <div className="rounded-xl border bg-card shadow-soft p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Cupos</div>
            <div className="text-lg font-bold" style={{ color: "#22c55e" }}>
              {event.cupo_maximo - getEventInscripciones(event.id)} disponibles
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Modalidad: {event.tipo_actividad || "Presencial"}
            </div>
          </div>

          <ImageCarousel event={event} currentImg={currentImg} setCurrentImg={setCurrentImg} />

          {event.estado === "RECHAZADO" && eventRejectionReasons[event.id] && (
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: "#ef4444", backgroundColor: "#fef2f2" }}
            >
              <div className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-2">
                Motivo de rechazo
              </div>
              <p className="text-sm text-red-700">{eventRejectionReasons[event.id]}</p>
            </div>
          )}
        </aside>
      </div>

      <VoaeApproveModal
        open={approveOpen}
        eventTitle={event.titulo}
        onConfirm={handleApprove}
        onCancel={() => setApproveOpen(false)}
      />

      <RejectModal
        open={rejectOpen}
        estudianteNombre=""
        onConfirm={handleReject}
        onCancel={() => setRejectOpen(false)}
      />
    </div>
  );
}

/* ─── ASISTENCIA TAB ─── */
function AsistenciaTab({ event }: { event: (typeof EVENTS)[number] }) {
  const asistencias = getAsistencias(event.id, Math.max(getEventInscripciones(event.id), 10));
  const color = CATEGORY_COLORS[event.categoria] || "#64748b";

  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead>Estudiante</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Salida</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asistencias.map((a) => (
            <TableRow key={a.id} className="hover:bg-secondary/30">
              <TableCell>
                <div className="flex items-center gap-2.5 min-w-[160px]">
                  <div
                    className="size-8 rounded-full grid place-items-center text-[10px] font-semibold shrink-0"
                    style={{ backgroundColor: color, color: "white" }}
                  >
                    {a.estudiante_nombre
                      .split(" ")
                      .map((p: string) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <span className="font-medium text-sm">{a.estudiante_nombre}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{a.estudiante_id}</TableCell>
              <TableCell className="text-sm">
                {a.hora_llegada ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    {new Date(a.hora_llegada).toLocaleTimeString("es-HN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {a.hora_salida ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    {new Date(a.hora_salida).toLocaleTimeString("es-HN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {a.estado_validacion === "APROBADO" ? (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                    style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                  >
                    Acreditado
                  </span>
                ) : a.estado_validacion === "RECHAZADO" ? (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                    style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                  >
                    Rechazado
                  </span>
                ) : (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                    style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                  >
                    Pendiente
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ImageCarousel({
  event,
  currentImg,
  setCurrentImg,
}: {
  event: (typeof EVENTS)[number];
  currentImg: number;
  setCurrentImg: React.Dispatch<React.SetStateAction<number>>;
}) {
  const allImages = [event.imagen_url, ...(event.imagenes_adicionales || [])].filter(
    Boolean,
  ) as string[];
  const color = CATEGORY_COLORS[event.categoria] || "#64748b";

  if (allImages.length === 0) {
    return (
      <div
        className="rounded-xl border bg-card shadow-card overflow-hidden"
        style={{ backgroundColor: color + "15" }}
      >
        <div className="w-full h-40 grid place-items-center">
          <div
            className="size-14 rounded-full grid place-items-center"
            style={{ backgroundColor: color + "25" }}
          >
            <div className="text-xl font-bold" style={{ color }}>
              {CATEGORY_LABEL[event.categoria]?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5 border-t text-center">
          <p className="text-xs text-muted-foreground">Imagen por categoría</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="relative">
        <img src={allImages[currentImg]} alt="" className="w-full h-40 object-cover" />
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImg((p) => (p === 0 ? allImages.length - 1 : p - 1))}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/80 grid place-items-center shadow hover:bg-white transition"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={() => setCurrentImg((p) => (p === allImages.length - 1 ? 0 : p + 1))}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/80 grid place-items-center shadow hover:bg-white transition"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.map((_, i) => (
                <div
                  key={i}
                  className={`size-1.5 rounded-full ${i === currentImg ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
