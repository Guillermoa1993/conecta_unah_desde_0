import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { CheckCircle2, XCircle, ArrowLeft, AlertTriangle, MapPin, Camera, Eye, Building2 } from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { LocationPicker, resolveExactBuildingCoords } from "../../components/app/LocationPicker";

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
  RECREACION: "Recreativo",
};

function getCategoryLabelHeader(ev: any): string {
  const isRecreativo =
    ev.tipo_evento === "RECREACION" ||
    ev.tipo_evento === "SIN_HORAS" ||
    ev.categoria === "RECREACION" ||
    Number(ev.duracion_horas || 0) === 0;

  if (isRecreativo) return "Recreativo";

  if (ev.distribucion_horas && Array.isArray(ev.distribucion_horas) && ev.distribucion_horas.length > 0) {
    return ev.distribucion_horas
      .map((dh: any) => CATEGORY_LABEL[dh.categoria] || dh.categoria)
      .join(" / ");
  }

  return CATEGORY_LABEL[ev.categoria] || ev.categoria || "Académico";
}

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

export function ValidacionDeptoEvento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>(`/eventos/${id}`);
      setEvent(data);
    } catch (err: any) {
      toast.error("Error al cargar evento", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleAprobar = async () => {
    if (!event) return;
    try {
      await api.patch(`/eventos/${event.id}/aprobar`);
      toast.success("¡Propuesta aprobada por Coordinación y enviada a Dirección VOAE!");
      navigate("/voae-depto");
    } catch (err: any) {
      toast.error("Error al aprobar la propuesta", { description: err.message });
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      toast.error("Debes ingresar un motivo de rechazo");
      return;
    }
    if (!event) return;
    try {
      await api.patch(`/eventos/${event.id}/rechazar`, { motivo: motivoRechazo });
      toast.success("Propuesta rechazada correctamente");
      setRejectDialogOpen(false);
      navigate("/voae-depto");
    } catch (err: any) {
      toast.error("Error al rechazar la propuesta", { description: err.message });
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Cargando propuesta...</div>;
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="size-12 mx-auto text-red-500 mb-3" />
        <p className="text-sm font-semibold">Propuesta no encontrada.</p>
        <Link to="/voae-depto" className="text-xs text-[#004B87] underline mt-2 block">Volver al panel de Coordinación</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <Link
        to="/voae-depto"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel de Coordinación
      </Link>

      {/* Encabezado Principal (Idéntico a Imagen 211) */}
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full overflow-hidden bg-[#004B87]/15 text-[#004B87] font-bold text-lg flex items-center justify-center shrink-0 border border-slate-200">
          {(event.creador_foto || event.tutor_foto || event.foto_url) ? (
            <img src={event.creador_foto || event.tutor_foto || event.foto_url} alt="Foto del solicitante" className="w-full h-full object-cover" />
          ) : (
            <span>{(event.creador_nombre || event.tutor_nombre || "Puma")?.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">{event.titulo}</h1>
          <p className="text-xs text-slate-500 font-medium">
            {getCategoryLabelHeader(event)} · {new Date(event.fecha_inicio).toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" })} · {(event.lugar || event.ubicacion || "").split("|")[0]}
          </p>
          <div className="flex items-center gap-1 mt-1 font-medium text-slate-600 text-xs">
            <span>Solicitante: <strong className="text-slate-800 font-bold">{event.creador_nombre || event.tutor_nombre || event.solicitante || event.organizador || "Solicitante"}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid: Portada + Tarjeta de ubicación con Mini Preview del Mapa (Como en Imagen 211) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Portada del Evento */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm h-64 md:h-72 w-full flex items-center justify-center group">
          {event.portada_url || event.imagen_url ? (
            <img src={event.portada_url || event.imagen_url} alt="Banner del evento" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#003366] to-[#004B87] flex flex-col items-center justify-center text-white p-6 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FFD100] mb-2">{getCategoryLabelHeader(event)}</span>
              <h3 className="text-2xl font-black uppercase tracking-tight">{event.titulo}</h3>
              <p className="text-[11px] text-slate-300 mt-4 font-semibold">UNIVERSIDAD NACIONAL AUTÓNOMA DE HONDURAS • CONECTA PUMAS</p>
            </div>
          )}
        </div>

        {/* Ubicación y Mini Preview del Mapa Leaflet */}
        {(() => {
          const isVirtual = event.tipo_actividad === "Virtual";
          const isHybrid = event.tipo_actividad === "Híbrido";

          const { lat: latVal, lng: lngVal, buildingName: exactBuildingName } = resolveExactBuildingCoords(
            event.centro_regional,
            event.lugar || event.ubicacion,
            event.latitud,
            event.longitud
          );

          const fullLoc = event.lugar || event.ubicacion || "";
          const [bName] = fullLoc.includes("|") ? fullLoc.split("|") : [fullLoc || exactBuildingName];

          return (
            <div className="rounded-2xl border bg-white border-slate-200/80 p-4 flex flex-col justify-between shadow-sm relative space-y-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-[#004B87] font-semibold uppercase tracking-wider">
                  <MapPin className="size-4" /> {isVirtual ? "Ubicación Virtual" : isHybrid ? "Ubicación Híbrida" : "Ubicación Presencial"}
                </div>
                <h4 className="font-bold text-base text-slate-800 line-clamp-2" title={bName}>{bName || exactBuildingName}</h4>
                <p className="text-xs text-muted-foreground">{event.centro_regional || "Ciudad Universitaria"}</p>
              </div>

              {!isVirtual && (
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs font-sans" style={{ height: "160px" }}>
                  <LocationPicker
                    lat={latVal}
                    lng={lngVal}
                    titleBanner={`${bName || exactBuildingName} (${event.centro_regional || 'Ciudad Universitaria'})`}
                    height="160px"
                  />
                </div>
              )}

              {(isVirtual || isHybrid) && event.enlace_virtual && (
                <div className="pt-0.5">
                  <a
                    href={event.enlace_virtual}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="size-4" /> Enlace Virtual
                  </a>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Evidencias adicionales */}
      {event.imagenes_adicionales && event.imagenes_adicionales.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase text-[#003366]">
            <Camera className="size-4 text-[#004B87]" /> Imágenes adicionales del evento
          </h4>
          <div className="flex gap-3 flex-wrap">
            {event.imagenes_adicionales.map((img: string, idx: number) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(img)}
                className="border border-slate-200 rounded-xl overflow-hidden size-20 bg-slate-50 hover:opacity-85 transition-opacity shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
              >
                <img src={img} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ficha Técnica del Evento (Idéntico a Imagen 212) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-[#003366] text-sm border-b pb-2">Ficha Técnica del Evento</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-6 text-xs text-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Título del evento</span>
            <span className="font-semibold text-slate-800 text-xs leading-normal block">{event.titulo}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Categorías / Ámbitos</span>
            <span className="font-semibold text-slate-800 block leading-normal">
              {event.distribucion_horas && event.distribucion_horas.length > 0 ? (
                event.distribucion_horas.map((dh: any) => `${CATEGORY_LABEL[dh.categoria] || dh.categoria} (${dh.horas} hrs)`).join(", ")
              ) : (
                `${CATEGORY_LABEL[event.categoria] || event.categoria} (${event.duracion_horas} hrs)`
              )}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Tipo de Evento</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 block">
              🎓 {event.duracion_horas > 0 ? "Horas VOAE" : "Recreación / Sin Horas"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Fecha y Hora</span>
            <span className="font-semibold text-slate-800 block">
              {new Date(event.fecha_inicio).toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" })} 
              {` (${new Date(event.fecha_inicio).toLocaleTimeString("es-HN", { hour: "numeric", minute: "2-digit" })} - ${new Date(event.fecha_fin).toLocaleTimeString("es-HN", { hour: "numeric", minute: "2-digit" })})`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Tipo de Actividad</span>
            <span className="font-semibold text-slate-800 block">{event.tipo_actividad}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Centro Regional</span>
            <span className="font-semibold text-slate-800 block">{event.centro_regional || "Ciudad Universitaria"}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Ubicación / Lugar</span>
            {(() => {
              const loc = event.lugar || event.ubicacion || "No especificado";
              const [bName, bCoordsOrLink] = loc.split("|");
              const href = bCoordsOrLink
                ? (bCoordsOrLink.startsWith("http") ? bCoordsOrLink : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bCoordsOrLink)}`)
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bName)}`;

              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <MapPin className="size-3.5 shrink-0 text-[#004B87]" /> {bName || "No especificado"}
                </a>
              );
            })()}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Enlace de acceso</span>
            <span className="font-semibold text-slate-800 block truncate">
              {event.enlace_virtual ? (
                <a href={event.enlace_virtual} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {event.enlace_virtual}
                </a>
              ) : (
                "No aplica"
              )}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Cupo máximo</span>
            <span className="font-semibold text-slate-800 block">{event.cupo_maximo} estudiantes</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Audiencia</span>
            <span className="font-semibold text-slate-800 block">Todo público / Estudiantes UNAH</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Horas de Duración</span>
            <span className="font-semibold text-slate-800 block">{event.duracion_horas} hrs (totales)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Facultad del Solicitante</span>
            <span className="font-semibold text-slate-800 block">{event.facultad || "Facultad de Ciencias"}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Carrera / Departamento</span>
            <span className="font-semibold text-slate-800 block">{event.departamento || event.carrera || "Departamento General"}</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Descripción del evento</span>
          <div className="bg-slate-50 p-4 rounded-xl text-slate-650 leading-relaxed font-medium">
            {event.descripcion}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4 pt-2 justify-end">
        <Button
          variant="outline"
          className="px-6 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11 text-xs font-bold rounded-xl"
          onClick={() => setRejectDialogOpen(true)}
        >
          <XCircle className="size-4 mr-1.5" /> Rechazar
        </Button>
        {(() => {
          const isRecreativo = event.tipo_evento === "RECREACION" || Number(event.duracion_horas || 0) === 0;
          return (
            <Button
              className="px-6 bg-[#22c55e] hover:bg-emerald-600 h-11 text-xs font-bold rounded-xl text-white shadow-sm"
              onClick={() => setApproveDialogOpen(true)}
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              {isRecreativo ? "Aprobar y publicar evento" : "Aprobar y enviar a VOAE"}
            </Button>
          );
        })()}
      </div>

      {/* Approve dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            {(() => {
              const isRecreativo = event.tipo_evento === "RECREACION" || Number(event.duracion_horas || 0) === 0;
              return (
                <>
                  <DialogTitle className="text-[#003366] flex items-center gap-1.5 font-bold">
                    {isRecreativo
                      ? "¿Está seguro de aprobar y publicar este evento recreativo?"
                      : "¿Está seguro de aprobar y enviar este evento a VOAE Dirección?"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-1">
                    {isRecreativo
                      ? "Al ser un evento recreativo (sin horas VOAE), al ser aprobado por Coordinación de Departamento se publicará inmediatamente en el Muro Social sin requerir aprobación de Dirección VOAE."
                      : "Al aprobar esta propuesta en Coordinación, el evento pasará a revisión final de Dirección VOAE antes de su publicación en el Muro Social."}
                  </DialogDescription>
                </>
              );
            })()}
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => {
                setApproveDialogOpen(false);
                handleAprobar();
              }}
            >
              Confirmar Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold">¿Está seguro de rechazar esta propuesta?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Escribe detalladamente los motivos del rechazo. El tutor recibirá una notificación con este motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ingresa el motivo del rechazo del evento..."
              className="h-12"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRechazar}>Confirmar Rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(v: boolean) => !v && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-1 bg-black/10 border-none flex items-center justify-center">
          {selectedImage && (
            <div className="relative w-full max-h-[80vh] flex items-center justify-center bg-transparent">
              <img src={selectedImage} alt="Vista ampliada" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
