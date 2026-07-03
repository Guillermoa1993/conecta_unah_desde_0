import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Star,
  Eye,
  ShieldCheck,
  XCircle,
  FileCheck,
  Pencil,
  ChevronDown,
  ChevronRight,
  Download,
  X,
} from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/app/PageHeader";
import { StatsCard } from "@/components/app/StatsCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EVENTS,
  CATEGORY_LABEL,
  CATEGORY_COLORS,
  getEventInscripciones,
  getEventAsistencias,
  getAsistencias,
  getEnrollments,
} from "@/lib/mock-data";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { eventRejectionReasons } from "@/lib/event-store";
import { MarqueeText } from "@/components/app/MarqueeText";
import { generateConstanciaHtmlWithQr, MESES } from "@/lib/constancia-pdf";

export const Route = createFileRoute("/_app/voae/records")({
  component: Records,
});

function getFirmadosStore(eventId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`certificados_firmados_${eventId}`) || "[]");
  } catch {
    return [];
  }
}

function getCertificadosStore(eventId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`certificados_${eventId}`) || "[]");
  } catch {
    return [];
  }
}

function Records() {
  const completados = EVENTS.filter(
    (e) => e.estado === "FINALIZADO" && getEventAsistencias(e.id) > 0,
  );
  const activos = EVENTS.filter((e) => e.estado === "PROGRAMADO" || e.estado === "EN_CURSO");
  const rechazados = EVENTS.filter((e) => e.estado === "RECHAZADO");

  const totalHoras = completados.reduce(
    (sum, e) => sum + e.duracion_horas * getEventAsistencias(e.id),
    0,
  );
  const totalEstudiantes = completados.reduce((sum, e) => sum + getEventInscripciones(e.id), 0);

  const eventosConCertificados = completados.filter((e) => (typeof window !== "undefined" ? getCertificadosStore(e.id).length > 0 : false));

  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<(typeof EVENTS)[number] | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      <PageHeader
        title="Histórico de eventos"
        description="Consulta todos los eventos registrados, su estado y validaciones."
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatsCard
          label="Total eventos validados este semestre"
          value={completados.length}
          icon={CalendarDays}
          tone="primary"
        />
        <StatsCard
          label="Total horas acreditadas a estudiantes"
          value={`${totalHoras}h`}
          icon={Star}
          tone="gold"
        />
        <StatsCard
          label="Total estudiantes impactados"
          value={totalEstudiantes}
          icon={Users}
          tone="success"
        />
      </div>

      <Tabs defaultValue="completed" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="completed" className="gap-2">
            <ShieldCheck className="size-3.5" /> Completados ({completados.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CalendarDays className="size-3.5" /> Aprobados ({activos.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="size-3.5" /> Rechazados ({rechazados.length})
          </TabsTrigger>
          <TabsTrigger value="firmados" className="gap-2">
            <FileCheck className="size-3.5" /> Certificados firmados (
            {eventosConCertificados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          <EventTable
            rows={completados}
            variant="completed"
            onViewDetail={(e) => setDetailEvent(e)}
          />
        </TabsContent>
        <TabsContent value="approved">
          <EventTable rows={activos} variant="approved" onViewDetail={(e) => setDetailEvent(e)} />
        </TabsContent>
        <TabsContent value="rejected">
          <EventTable
            rows={rechazados}
            variant="rejected"
            onViewDetail={(e) => setDetailEvent(e)}
          />
        </TabsContent>
        <TabsContent value="firmados">
          {eventosConCertificados.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-12 text-center">
              <FileCheck className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-1">Certificados firmados</h3>
              <p className="text-sm text-muted-foreground">
                Aún no hay certificados firmados. Los certificados aparecerán aquí cuando VOAE
                complete la validación de un evento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventosConCertificados.map((e) => {
                const estudiantes = getEnrollments(e.id, getEventInscripciones(e.id));
                const firmados = getFirmadosStore(e.id);
                return (
                  <div key={e.id} className="rounded-xl border bg-card shadow-soft overflow-hidden">
                    <button
                      onClick={() => setExpandedEvent(expandedEvent === e.id ? null : e.id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition text-left"
                    >
                      <div>
                        <h3 className="font-semibold">{e.titulo}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.fecha_inicio.slice(0, 10)} · {e.lugar} · {CATEGORY_LABEL[e.categoria]}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium" style={{ color: "#22c55e" }}>
                          {firmados.length} certificados
                        </span>
                        {expandedEvent === e.id ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {expandedEvent === e.id && (
                      <div className="border-t">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-secondary/50">
                              <TableHead>Estudiante</TableHead>
                              <TableHead>Cuenta</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {estudiantes
                              .filter((s) => firmados.includes(s.studentId))
                              .map((s) => (
                                <TableRow key={s.id} className="hover:bg-secondary/30">
                                  <TableCell>
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className="size-8 rounded-full grid place-items-center text-[10px] font-semibold text-white shrink-0"
                                        style={{ backgroundColor: "var(--puma-blue)" }}
                                      >
                                        {s.studentName
                                          .split(" ")
                                          .map((p) => p[0])
                                          .slice(0, 2)
                                          .join("")
                                          .toUpperCase()}
                                      </div>
                                      <span className="font-medium">{s.studentName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                                  <TableCell>
                                    <span
                                      className="text-xs px-2 py-1 rounded-full font-medium"
                                      style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                                    >
                                      Firmado
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      className="gap-1.5 text-white"
                                      style={{ backgroundColor: "var(--puma-blue)" }}
                                      onClick={async () => {
                                        const now = new Date();
                                        const html = await generateConstanciaHtmlWithQr({
                                          estudiante_nombre: s.studentName,
                                          estudiante_carrera: s.email,
                                          estudiante_cuenta: s.studentId,
                                          tutor_nombre: e.tutor_nombre,
                                          evento_nombre: e.titulo,
                                          evento_mes_anio: `${MESES[now.getMonth()]} ${now.getFullYear()}`,
                                          horas: e.duracion_horas,
                                          categoria: e.categoria,
                                          voae_nombre: "VOAE",
                                          voae_cargo: "Vicerrector",
                                          voae_departamento: "Orientación y Asuntos Estudiantiles",
                                          voae_codigo: "ART.202606-18-S-CU",
                                          fecha_dia: now.getDate(),
                                          fecha_mes: MESES[now.getMonth()],
                                          fecha_anio: now.getFullYear(),
                                        });
                                        const win = window.open("", "_blank");
                                        if (win) {
                                          win.document.write(html);
                                          win.document.close();
                                          win.focus();
                                          setTimeout(() => win.print(), 500);
                                        }
                                      }}
                                    >
                                      <Download className="size-3.5" /> Descargar PDF
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
    </div>
  );
}

function EventTable({
  rows,
  variant,
  onViewDetail,
}: {
  rows: typeof EVENTS;
  variant: "completed" | "approved" | "rejected";
  onViewDetail?: (event: (typeof EVENTS)[number]) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed p-12 text-center text-sm text-muted-foreground">
        Sin registros
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50">
            <TableHead>Evento</TableHead>
            <TableHead>Tutor</TableHead>
            <TableHead>Fecha</TableHead>
            {variant === "completed" && <TableHead className="text-center">Acreditados</TableHead>}
            {variant === "completed" && <TableHead className="text-center">Rechazados</TableHead>}
            {variant === "completed" && (
              <TableHead className="text-center">Horas otorgadas</TableHead>
            )}
            {variant === "rejected" && <TableHead>Motivo</TableHead>}
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <TableRow key={e.id} className="hover:bg-secondary/30">
              <TableCell>
                <div className="font-medium">{e.titulo}</div>
                <div className="text-xs text-muted-foreground">{e.lugar}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="size-7 rounded-full grid place-items-center text-[10px] font-semibold shrink-0"
                    style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
                  >
                    {e.tutor_nombre
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <span className="text-sm">{e.tutor_nombre}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">{e.fecha_inicio.slice(0, 10)}</TableCell>
              {variant === "completed" && (
                <>
                  <TableCell className="text-center font-semibold" style={{ color: "#22c55e" }}>
                    {getEventAsistencias(e.id)}
                  </TableCell>
                  <TableCell className="text-center">{0}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {e.duracion_horas * getEventAsistencias(e.id)}h
                  </TableCell>
                </>
              )}
              {variant === "rejected" && (
                <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                  {eventRejectionReasons[e.id] || "Sin motivo registrado"}
                </TableCell>
              )}
              <TableCell>
                {variant === "completed" && (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                  >
                    Completado
                  </span>
                )}
                {variant === "approved" && (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}
                  >
                    Activo
                  </span>
                )}
                {variant === "rejected" && (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                  >
                    Rechazado
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1.5 justify-end">
                  {variant === "completed" &&
                    (e.pdf_respaldo_url ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.open(e.pdf_respaldo_url, "_blank")}
                      >
                        <Pencil className="size-3.5" /> Ver asistencia escrita
                      </Button>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                style={{
                                  borderColor: "#9ca3af",
                                  color: "#9ca3af",
                                  cursor: "not-allowed",
                                }}
                                disabled
                              >
                                <Pencil className="size-3.5" /> Ver asistencia escrita
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Este evento no tiene PDF de respaldo.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  <Button
                    size="sm"
                    variant="outline"
                    style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
                    onClick={() => onViewDetail?.(e)}
                  >
                    <Eye className="size-3.5 mr-1" /> Ver detalle
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DetailModal({
  event,
  onClose,
}: {
  event: (typeof EVENTS)[number] | null;
  onClose: () => void;
}) {
  if (!event) return null;

  const asistencias = getAsistencias(event.id, Math.max(getEventInscripciones(event.id), 10));
  const acreditados = asistencias.filter((a) => a.estado_validacion === "APROBADO").length;
  const rechazados = asistencias.filter((a) => a.estado_validacion === "RECHAZADO").length;
  const color = CATEGORY_COLORS[event.categoria] || "#64748b";

  return (
    <AlertDialog
      open={!!event}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <AlertDialogTitle className="text-xl font-semibold" style={{ color: "#1e3a5f" }}>
                {event.titulo}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Tutor:</strong> {event.tutor_nombre}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {event.fecha_inicio.slice(0, 10)} ·{" "}
                    <strong>Lugar:</strong> {event.lugar} · <strong>Categoría:</strong>{" "}
                    {CATEGORY_LABEL[event.categoria]}
                  </p>
                </div>
              </AlertDialogDescription>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full grid place-items-center hover:bg-secondary/50 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </AlertDialogHeader>

        {/* Stats */}
        <div className="flex gap-4 flex-wrap mb-4">
          <div className="rounded-lg border px-4 py-2.5 bg-card shadow-soft">
            <div className="text-xs text-muted-foreground">Acreditados</div>
            <div className="text-lg font-bold" style={{ color: "#22c55e" }}>
              {acreditados}
            </div>
          </div>
          <div className="rounded-lg border px-4 py-2.5 bg-card shadow-soft">
            <div className="text-xs text-muted-foreground">Rechazados</div>
            <div className="text-lg font-bold" style={{ color: "#ef4444" }}>
              {rechazados}
            </div>
          </div>
          <div className="rounded-lg border px-4 py-2.5 bg-card shadow-soft">
            <div className="text-xs text-muted-foreground">Horas otorgadas</div>
            <div className="text-lg font-bold" style={{ color: "#d4a017" }}>
              {acreditados * event.duracion_horas}h
            </div>
          </div>
        </div>

        {/* Student table */}
        <div className="rounded-xl border bg-card shadow-soft overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Estudiante</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Carrera</TableHead>
                <TableHead>Horas acreditadas</TableHead>
                <TableHead>Categoría</TableHead>
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
                  <TableCell className="text-sm min-w-0">
                    <MarqueeText text={a.estudiante_carrera} maxWidth={140} />
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {a.estado_validacion === "APROBADO" ? event.duracion_horas : 0}h
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORY_LABEL[event.categoria]}</TableCell>
                  <TableCell>
                    {a.estado_validacion === "APROBADO" ? (
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                      >
                        Acreditado
                      </span>
                    ) : a.estado_validacion === "RECHAZADO" ? (
                      <div>
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                          style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                        >
                          Rechazado
                        </span>
                        {a.motivo_rechazo && (
                          <div className="text-xs mt-1" style={{ color: "#ef4444" }}>
                            Motivo: {a.motivo_rechazo}
                          </div>
                        )}
                      </div>
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

        {/* PDF button */}
        <div className="flex justify-end pt-2">
          {event.pdf_respaldo_url ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => window.open(event.pdf_respaldo_url, "_blank")}
            >
              <Pencil className="size-3.5" /> Ver asistencia escrita
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      style={{ borderColor: "#9ca3af", color: "#9ca3af", cursor: "not-allowed" }}
                      disabled
                    >
                      <Pencil className="size-3.5" /> Ver asistencia escrita
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Este evento no tiene PDF de respaldo.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
