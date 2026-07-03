import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  Info,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  LIMITE_POR_CATEGORIA,
  ACTIVIDADES,
  getStudentApprovedActivities,
  getConstanciaForActividad,
  findStudentByAccount,
} from "@/lib/mock-data";
import { downloadConstanciaPdf, MESES } from "@/lib/constancia-pdf";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/student/history")({
  component: MisActividades,
});

const CURRENT_STUDENT = "20211002345";

function MisActividades() {
  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      <PageHeader
        title="Mis Actividades"
        description="Consulta tus inscripciones, eventos en curso e historial."
      />
      <Tabs defaultValue="inscritas" className="space-y-4">
        <TabsList className="bg-secondary w-full flex-wrap h-auto">
          <TabsTrigger value="inscritas" className="text-xs">
            Inscritas
          </TabsTrigger>
          <TabsTrigger value="preinscritas" className="text-xs">
            Pre inscritas
          </TabsTrigger>
          <TabsTrigger value="endesarrollo" className="text-xs">
            En Desarrollo
          </TabsTrigger>
          <TabsTrigger value="historial" className="text-xs">
            Historial
          </TabsTrigger>
          <TabsTrigger value="canceladas" className="text-xs">
            Canceladas
          </TabsTrigger>
          <TabsTrigger value="comprobantes" className="text-xs">
            Comprobantes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inscritas">
          <InscritasTab />
        </TabsContent>
        <TabsContent value="preinscritas">
          <PreInscritasTab />
        </TabsContent>
        <TabsContent value="endesarrollo">
          <EnDesarrolloTab />
        </TabsContent>
        <TabsContent value="historial">
          <HistorialTab />
        </TabsContent>
        <TabsContent value="canceladas">
          <CanceladasTab />
        </TabsContent>
        <TabsContent value="comprobantes">
          <ComprobantesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ──────── Shared card ──────── */
function ActividadCard({
  event,
  badge,
  badgeStyle,
  position,
}: {
  event: (typeof EVENTS)[number];
  badge: string;
  badgeStyle: React.CSSProperties;
  position?: string;
}) {
  const color = CATEGORY_COLORS[event.categoria] || "#64748b";
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <div
        className="w-full h-32 grid place-items-center"
        style={{ backgroundColor: color + "20" }}
      >
        <div
          className="size-12 rounded-full grid place-items-center"
          style={{ backgroundColor: color + "30" }}
        >
          <div className="text-lg font-bold" style={{ color }}>
            {CATEGORY_LABEL[event.categoria]?.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
              {CATEGORY_LABEL[event.categoria]}
            </span>
            <h3 className="font-semibold leading-snug">{event.titulo}</h3>
          </div>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {event.fecha_inicio.slice(0, 10)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {event.fecha_inicio.slice(11, 16)} · {event.duracion_horas}h
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {event.lugar}
          </div>
        </div>
        {position && <div className="text-xs text-muted-foreground mb-2">{position}</div>}
        <span
          className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
          style={badgeStyle}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}

/* ──────── Inscritas ──────── */
function InscritasTab() {
  const inscritas = EVENTS.filter((e) => e.estado === "PROGRAMADO" && e.id !== "evt-004");
  if (inscritas.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Aún no tienes eventos inscritos"
        desc="Escanea un código QR o inscríbete desde la lista de eventos."
      />
    );
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {inscritas.map((e) => (
        <ActividadCard
          key={e.id}
          event={e}
          badge="Inscrito"
          badgeStyle={{ backgroundColor: "#dcfce7", color: "#166534" }}
        />
      ))}
    </div>
  );
}

/* ──────── Pre inscritas ──────── */
function PreInscritasTab() {
  const pre = EVENTS.filter((e) => e.id === "evt-002" || e.id === "evt-001");
  if (pre.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No hay pre inscripciones"
        desc="Cuando un evento esté lleno, puedes unirte a la lista de espera."
      />
    );
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pre.map((e, i) => (
        <ActividadCard
          key={e.id}
          event={e}
          badge="En lista de espera"
          badgeStyle={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          position={`Posición #${i + 1}`}
        />
      ))}
    </div>
  );
}

/* ──────── En Desarrollo ──────── */
function EnDesarrolloTab() {
  const enCurso = EVENTS.filter((e) => e.id === "evt-003");
  if (enCurso.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No tienes eventos en curso"
        desc="Los eventos a los que asistas aparecerán aquí."
      />
    );
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {enCurso.map((e) => (
        <ActividadCard
          key={e.id}
          event={e}
          badge="En curso"
          badgeStyle={{ backgroundColor: "#dbeafe", color: "#1e40af" }}
        />
      ))}
    </div>
  );
}

/* ──────── Historial ──────── */
function HistorialTab() {
  const [motivoOpen, setMotivoOpen] = useState<string | null>(null);
  const aprobadas = getStudentApprovedActivities(CURRENT_STUDENT);
  const hoursByCat: Record<string, number> = {};
  for (const a of aprobadas) {
    hoursByCat[a.categoria] = (hoursByCat[a.categoria] || 0) + a.horas_acreditadas;
  }
  const total = aprobadas.reduce((s, a) => s + a.horas_acreditadas, 0);
  const cats: Array<keyof typeof CATEGORY_LABEL_LONG> = [
    "ACADEMICO",
    "SOCIAL",
    "DEPORTIVO",
    "CULTURAL",
  ];
  const completedCats = cats.filter((c) => (hoursByCat[c] || 0) >= LIMITE_POR_CATEGORIA);

  const misActividades = ACTIVIDADES.filter((a) => a.estudiante_id === CURRENT_STUDENT);

  return (
    <div className="space-y-6">
      {/* Banner completed categories */}
      {completedCats.length > 0 && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "#FFD100" }}
        >
          <Trophy className="size-6 shrink-0" style={{ color: "#003366" }} />
          <p className="text-sm font-medium" style={{ color: "#003366" }}>
            Ya completaste las 15 horas en{" "}
            {completedCats.map((c) => CATEGORY_LABEL_LONG[c]).join(", ")}.
            {completedCats.length < 4
              ? " Este ámbito está cerrado."
              : " ¡Todos los ámbitos completados!"}
          </p>
        </div>
      )}

      {/* Info message when none completed */}
      {completedCats.length === 0 && (
        <div
          className="rounded-xl p-4 flex items-center gap-3 text-sm"
          style={{ backgroundColor: "#eff6ff", color: "#1e40af" }}
        >
          <Info className="size-5 shrink-0" />
          <p>
            Necesitas 15 horas en cada ámbito para cumplir el Artículo 140. Llevas {total} horas en
            total.
          </p>
        </div>
      )}

      {/* Progress bars */}
      {aprobadas.length > 0 && (
        <div className="rounded-xl border bg-card shadow-soft p-5 space-y-4">
          <h3 className="font-semibold text-sm">Progreso por ámbito</h3>
          {cats.map((c) => {
            const h = hoursByCat[c] || 0;
            const pct = Math.min((h / LIMITE_POR_CATEGORIA) * 100, 100);
            const complete = h >= LIMITE_POR_CATEGORIA;
            return (
              <div key={c} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0 flex items-center gap-1 font-medium">
                  {CATEGORY_LABEL_LONG[c]}
                  {complete && <Trophy className="size-4 shrink-0" style={{ color: "#FFD100" }} />}
                </span>
                <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: complete ? "#FFD100" : "#004B87" }}
                  />
                </div>
                <span className="text-sm w-20 text-right font-medium">
                  {h}h / {LIMITE_POR_CATEGORIA}h
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Activities list */}
      {misActividades.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aún no tienes actividades en tu historial"
          desc="Las actividades aprobadas por VOAE aparecerán aquí."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {misActividades.map((act) => {
            const eventId = act.asistencia_id.split("-asist-")[0];
            const ev = EVENTS.find((e) => e.id === eventId);
            if (!ev) return null;
            const badgeInfo = {
              APROBADO: {
                label: "Aprobado",
                style: { backgroundColor: "#dcfce7", color: "#166534" },
              },
              PENDIENTE: {
                label: "Pendiente",
                style: { backgroundColor: "#fef3c7", color: "#92400e" },
              },
              RECHAZADO: {
                label: "Rechazado",
                style: { backgroundColor: "#fee2e2", color: "#991b1b" },
              },
            }[act.estado] || {
              label: act.estado,
              style: { backgroundColor: "#f1f5f9", color: "#64748b" },
            };

            const isRejected = act.estado === "RECHAZADO";

            return (
              <div key={act.id} className="rounded-xl border bg-card shadow-soft overflow-hidden">
                <div
                  className="w-full h-32 grid place-items-center"
                  style={{ backgroundColor: CATEGORY_COLORS[act.categoria] + "20" }}
                >
                  <div
                    className="size-12 rounded-full grid place-items-center"
                    style={{ backgroundColor: CATEGORY_COLORS[act.categoria] + "30" }}
                  >
                    <div
                      className="text-lg font-bold"
                      style={{ color: CATEGORY_COLORS[act.categoria] }}
                    >
                      {CATEGORY_LABEL[act.categoria]?.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary">
                    {CATEGORY_LABEL[act.categoria]}
                  </span>
                  <h3 className="font-semibold mt-2">{ev.titulo}</h3>
                  <div className="space-y-1.5 text-xs text-muted-foreground my-3">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {ev.fecha_inicio.slice(0, 10)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {ev.fecha_inicio.slice(11, 16)} · {ev.duracion_horas}h
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {ev.lugar}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {act.horas_acreditadas}h acreditadas
                  </div>
                  {isRejected ? (
                    <button
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80"
                      style={badgeInfo.style}
                      onClick={() => setMotivoOpen(act.id)}
                    >
                      <AlertTriangle className="size-3" /> {badgeInfo.label}
                    </button>
                  ) : (
                    <span
                      className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                      style={badgeInfo.style}
                    >
                      {badgeInfo.label}
                    </span>
                  )}

                  {(() => {
                    const constancia = getConstanciaForActividad(act.id);
                    if (!constancia && act.estado === "APROBADO") return null;
                    if (!constancia) return null;
                    if (ev.tipo_evento !== "HORAS_VOAE") return null;
                    return (
                      <div className="mt-3 space-y-2">
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor:
                              constancia.estado === "VERIFICADA" ? "#dcfce7" : "#f1f5f9",
                            color: constancia.estado === "VERIFICADA" ? "#166534" : "#64748b",
                          }}
                        >
                          {constancia.estado === "VERIFICADA" ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <Clock className="size-3" />
                          )}
                          {constancia.estado === "VERIFICADA"
                            ? "Constancia verificada"
                            : "Constancia no verificada"}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs gap-1.5 w-full"
                                  disabled={constancia.estado !== "VERIFICADA"}
                                  style={{
                                    borderColor:
                                      constancia.estado === "VERIFICADA" ? "#22c55e" : undefined,
                                    color:
                                      constancia.estado === "VERIFICADA" ? "#22c55e" : undefined,
                                  }}
                                  onClick={() => {
                                    const student = findStudentByAccount(CURRENT_STUDENT);
                                    if (!student) return;
                                    const evDate = new Date(ev.fecha_inicio);
                                    const today = new Date();
                                    downloadConstanciaPdf({
                                      estudiante_nombre: student.nombre,
                                      estudiante_carrera: student.carrera,
                                      estudiante_cuenta: CURRENT_STUDENT,
                                      tutor_nombre: ev.tutor_nombre,
                                      evento_nombre: ev.titulo,
                                      evento_mes_anio: `${MESES[evDate.getMonth()]} ${evDate.getFullYear()}`,
                                      horas: act.horas_acreditadas,
                                      categoria: CATEGORY_LABEL[act.categoria],
                                      voae_nombre: "Lic. Roberto Fiallos",
                                      voae_cargo: "Vicerrector",
                                      voae_departamento: "Orientación y Asuntos Estudiantiles",
                                      voae_codigo: "ART.202606-18-S-CU",
                                      fecha_dia: today.getDate(),
                                      fecha_mes: MESES[today.getMonth()],
                                      fecha_anio: today.getFullYear(),
                                    });
                                  }}
                                >
                                  Descargar constancia
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {constancia.estado !== "VERIFICADA" && (
                              <TooltipContent>
                                <p>Esta constancia está pendiente de verificación por VOAE.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!motivoOpen} onOpenChange={(o) => !o && setMotivoOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2" style={{ color: "#991b1b" }}>
              <XCircle className="size-5" /> Actividad rechazada
            </AlertDialogTitle>
            <AlertDialogDescription>
              {motivoOpen &&
                (() => {
                  const act = ACTIVIDADES.find((a) => a.id === motivoOpen);
                  return act?.estado === "RECHAZADO"
                    ? "La actividad fue rechazada durante la validación de VOAE. Comunícate con el tutor del evento para más información."
                    : "No hay información disponible.";
                })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ──────── Canceladas ──────── */
function CanceladasTab() {
  const canceladas = EVENTS.filter((e) => e.id === "evt-004");
  if (canceladas.length === 0) {
    return (
      <EmptyState
        icon={XCircle}
        title="No hay cancelaciones"
        desc="Las inscripciones o eventos cancelados aparecerán aquí."
      />
    );
  }
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {canceladas.map((e) => (
        <ActividadCard
          key={e.id}
          event={e}
          badge="Cancelado"
          badgeStyle={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
        />
      ))}
    </div>
  );
}

/* ──────── COMPROBANTES ──────── */
function ComprobantesTab() {
  const asistidos = EVENTS.filter((e) => {
    const id = localStorage.getItem(`asistencia_registrada_${e.id}`);
    return id === "true" && e.tipo_evento === "HORAS_VOAE";
  });

  if (asistidos.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin comprobantes"
        desc="Los comprobantes de eventos a los que hayas asistido aparecerán aquí."
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#f1f5f9]" style={{ height: 48 }}>
            <TableHead className="text-[#003366] font-bold">Evento</TableHead>
            <TableHead className="text-[#003366] font-bold">Fecha</TableHead>
            <TableHead className="text-[#003366] font-bold">Estado</TableHead>
            <TableHead className="text-[#003366] font-bold text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asistidos.map((e) => {
            const aprobado = getConstanciaForActividad(e.id)?.estado === "VERIFICADA";
            return (
              <TableRow
                key={e.id}
                className="even:bg-[#f8f9fa] hover:bg-[#eff6ff]"
                style={{ height: 48 }}
              >
                <TableCell className="font-medium">{e.titulo}</TableCell>
                <TableCell className="text-sm">{e.fecha_inicio.slice(0, 10)}</TableCell>
                <TableCell>
                  {aprobado ? (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                    >
                      Aprobado
                    </span>
                  ) : (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                    >
                      Pendiente de aprobación VOAE
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {e.tipo_duracion === "DIARIAS" && e.fecha_inicio !== e.fecha_fin ? (
                    <div className="flex flex-col gap-1 items-end">
                      {(() => {
                        const start = new Date(e.fecha_inicio);
                        const end = new Date(e.fecha_fin);
                        const days = [];
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                          days.push(new Date(d));
                        }
                        return days.map((d, i) => (
                          <Button
                            key={i}
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            style={{ borderColor: "#004B87", color: "#004B87" }}
                            onClick={() => {
                              const today = new Date();
                              downloadConstanciaPdf({
                                estudiante_nombre: "María González",
                                estudiante_carrera: "Ingeniería en Sistemas",
                                estudiante_cuenta: CURRENT_STUDENT,
                                tutor_nombre: e.tutor_nombre,
                                evento_nombre: e.titulo,
                                evento_mes_anio: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
                                horas: e.duracion_horas,
                                categoria: CATEGORY_LABEL[e.categoria],
                                voae_nombre: "Lic. Roberto Fiallos",
                                voae_cargo: "Vicerrector",
                                voae_departamento: "Orientación y Asuntos Estudiantiles",
                                voae_codigo: "ART.202606-18-S-CU",
                                fecha_dia: today.getDate(),
                                fecha_mes: MESES[today.getMonth()],
                                fecha_anio: today.getFullYear(),
                                dia: i + 1,
                                total_dias: days.length,
                              });
                            }}
                          >
                            <FileText className="size-3.5" /> Descargar constancia — Día {i + 1}
                          </Button>
                        ));
                      })()}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      style={{ borderColor: "#004B87", color: "#004B87" }}
                      onClick={() => {
                        const evDate = new Date(e.fecha_inicio);
                        const today = new Date();
                        downloadConstanciaPdf({
                          estudiante_nombre: "María González",
                          estudiante_carrera: "Ingeniería en Sistemas",
                          estudiante_cuenta: CURRENT_STUDENT,
                          tutor_nombre: e.tutor_nombre,
                          evento_nombre: e.titulo,
                          evento_mes_anio: `${MESES[evDate.getMonth()]} ${evDate.getFullYear()}`,
                          horas: e.duracion_horas,
                          categoria: CATEGORY_LABEL[e.categoria],
                          voae_nombre: "Lic. Roberto Fiallos",
                          voae_cargo: "Vicerrector",
                          voae_departamento: "Orientación y Asuntos Estudiantiles",
                          voae_codigo: "ART.202606-18-S-CU",
                          fecha_dia: today.getDate(),
                          fecha_mes: MESES[today.getMonth()],
                          fecha_anio: today.getFullYear(),
                        });
                      }}
                    >
                      <FileText className="size-3.5" /> Ver comprobante
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed p-12 text-center">
      <Icon className="size-12 mx-auto text-muted-foreground/40 mb-3" />
      <div className="text-base font-medium">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
