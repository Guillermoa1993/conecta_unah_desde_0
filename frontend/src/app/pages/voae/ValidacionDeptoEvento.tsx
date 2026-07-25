import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { CheckCircle2, XCircle, ArrowLeft, AlertTriangle, Eye, Calendar, Clock, MapPin, Building2, User } from "lucide-react";
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
};

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

function formatDate(iso: string): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string, rawHora?: string): string {
  if (rawHora) return rawHora;
  if (!iso) return "N/A";
  return new Date(iso).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });
}

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
      toast.success("Propuesta aprobada por Coordinación y enviada a VOAE Dirección");
      navigate("/voae-depto");
    } catch (err: any) {
      toast.error("Error al aprobar el evento", { description: err.message });
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
      toast.success("Evento rechazado correctamente");
      setRejectDialogOpen(false);
      navigate("/voae-depto");
    } catch (err: any) {
      toast.error("Error al rechazar el evento", { description: err.message });
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
        <Link to="/voae-depto" className="text-xs text-[#004B87] underline mt-2 block">
          Volver al panel de Coordinación
        </Link>
      </div>
    );
  }

  const isRecreativo = event.tipo_evento === "RECREACION" || event.tipo_evento === "SIN_HORAS" || parseFloat(event.duracion_horas || "0") === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <Link
        to="/voae-depto"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#004B87] transition font-medium"
      >
        <ArrowLeft className="size-4" /> Volver al panel de Coordinación
      </Link>

      {/* Header Solicitante */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="size-12 rounded-full overflow-hidden bg-[#004B87]/15 text-[#004B87] font-bold text-lg flex items-center justify-center shrink-0 border border-slate-200">
          {(event.creador_foto || event.tutor_foto || event.foto_url) ? (
            <img
              src={event.creador_foto || event.tutor_foto || event.foto_url}
              alt="Foto del Solicitante"
              className="size-full object-cover"
            />
          ) : (
            (event.creador_nombre || event.tutor_nombre || "U").slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <span>Solicitante del Evento:</span>
            <span className="bg-blue-50 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Coordinación / Tutor
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 truncate">
            {event.creador_nombre || event.tutor_nombre || "Lic. Roberto Fiallos"}
          </h2>
        </div>
      </div>

      {/* Banner Portada */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 h-64 md:h-72 w-full flex items-center justify-center">
        {event.portada_url ? (
          <img
            src={event.portada_url}
            alt={event.titulo}
            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
            onClick={() => setSelectedImage(event.portada_url)}
          />
        ) : (
          <div className="text-center text-white p-6">
            <h1 className="text-2xl font-bold">{event.titulo}</h1>
          </div>
        )}
      </div>

      {/* Detalle del Evento */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#004B87]">
            {isRecreativo ? "🎉 Evento Recreativo" : `🎓 Horas VOAE — ${CATEGORY_LABEL[event.categoria] || event.categoria}`}
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">{event.titulo}</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{event.descripcion}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-[#004B87]" />
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Fecha</p>
              <p className="font-medium text-slate-800">{formatDate(event.fecha_inicio)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="size-5 text-[#004B87]" />
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Horario</p>
              <p className="font-medium text-slate-800">
                {formatTime(event.fecha_inicio, event.hora_inicio)} — {formatTime(event.fecha_fin, event.hora_fin)}
              </p>
            </div>
          </div>
        </div>

        {/* Mapa de Ubicación */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Ubicación del evento
          </h3>
          {(() => {
            const rawLoc = event.lugar || event.ubicacion || "";
            const [buildingName, rawCoords] = rawLoc.split("|");
            let lat = 14.0842;
            let lng = -87.1643;
            if (rawCoords) {
              const [clat, clng] = rawCoords.split(",").map(Number);
              if (!isNaN(clat) && !isNaN(clng)) { lat = clat; lng = clng; }
            } else if (buildingName) {
              const res = resolveExactBuildingCoords(buildingName);
              lat = res.lat; lng = res.lng;
            }
            return (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">{buildingName || "Instalaciones UNAH"}</p>
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "160px" }}>
                  <LocationPicker value={{ name: buildingName, lat, lng }} readOnly height="160px" />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 font-semibold"
            onClick={() => setRejectDialogOpen(true)}
          >
            <XCircle className="size-4 mr-1.5" /> Rechazar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            onClick={() => setApproveDialogOpen(true)}
          >
            <CheckCircle2 className="size-4 mr-1.5" /> Aprobar y enviar a VOAE
          </Button>
        </div>
      </div>

      {/* Confirm Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold">
              ¿Está seguro de aprobar y enviar este evento a VOAE Dirección?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Al aprobar esta solicitud por Coordinación, el evento pasará a revisión final de <strong>Dirección VOAE</strong> antes de su publicación en el Muro Social.
            </DialogDescription>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold">
              ¿Está seguro de rechazar esta propuesta?
            </DialogTitle>
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
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRechazar}>
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
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
