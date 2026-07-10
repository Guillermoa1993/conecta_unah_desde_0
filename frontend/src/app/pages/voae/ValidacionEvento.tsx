import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { CheckCircle2, XCircle, PenLine, RotateCcw, Stamp, ArrowLeft, AlertTriangle, MapPin } from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";

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

function DigitalCanvas({ onSigned }: { onSigned: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#003366"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";

    const getXY = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) { return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }; }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const {x,y} = getXY(e); ctx.beginPath(); ctx.moveTo(x,y); };
    const move  = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (!drawing.current) return; const {x,y} = getXY(e); ctx.lineTo(x,y); ctx.stroke(); setHasStrokes(true); };
    const stop  = () => { drawing.current = false; };

    canvas.addEventListener("mousedown", start); canvas.addEventListener("mousemove", move); canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive:false }); canvas.addEventListener("touchmove", move, { passive:false }); canvas.addEventListener("touchend", stop);
    return () => {
      canvas.removeEventListener("mousedown", start); canvas.removeEventListener("mousemove", move); canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchstart", start); canvas.removeEventListener("touchmove", move); canvas.removeEventListener("touchend", stop);
    };
  }, []);

  const clear = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0,0,c.width,c.height); setHasStrokes(false); };
  const confirm = () => { if (!hasStrokes) { toast.error("Firma antes de confirmar"); return; } onSigned(ref.current!.toDataURL()); };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-[#004B87]/30 rounded-xl overflow-hidden bg-white">
        <canvas ref={ref} width={480} height={120} className="w-full touch-none cursor-crosshair"/>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={clear} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-[#717182] hover:bg-gray-50 transition-colors">
          <RotateCcw className="h-3.5 w-3.5"/>Limpiar
        </button>
        <button type="button" onClick={confirm} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition-colors">
          <PenLine className="h-3.5 w-3.5"/>Confirmar firma
        </button>
      </div>
    </div>
  );
}

export function ValidacionEvento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signatureUrl, setSignatureUrl] = useState<string|null>(null);
  const [showSigning, setShowSigning] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const fetchEventDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.get<any>(`/eventos/${id}`);
      setEvent(data);
    } catch (err: any) {
      toast.error("Error al obtener los detalles del evento", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleSign = (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    setShowSigning(false);
    toast.success("Firma guardada — ya puedes validar o rechazar el evento");
  };

  const handleAprobar = async () => {
    if (!signatureUrl) {
      toast.error("Primero debes firmar digitalmente");
      return;
    }
    if (!event) return;
    try {
      await api.patch(`/eventos/${event.id}/aprobar`);
      toast.success("¡Evento aprobado con éxito!");
      navigate("/voae");
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
      navigate("/voae");
    } catch (err: any) {
      toast.error("Error al rechazar el evento", { description: err.message });
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Cargando evento...</div>;
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="size-12 mx-auto text-red-500 mb-3" />
        <p className="text-sm font-semibold">Evento no encontrado.</p>
        <Link to="/voae" className="text-xs text-[#004B87] underline mt-2 block">Volver al panel</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver a solicitudes pendientes
      </Link>

      <div>
        <h1 className="text-xl font-bold text-[#003366]">Validación de Solicitud de Evento</h1>
        <p className="text-sm text-[#717182]">Revisa la información técnica, firma digitalmente y emite resolución.</p>
      </div>

      {/* Info del evento */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        {event.imagen_url && (
          <div className="w-full h-44 rounded-xl overflow-hidden border bg-slate-50 shadow-inner">
            <img src={event.imagen_url} alt="Banner del evento" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#004B87] text-[#FFD100] rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
            {event.categoria[0]}
          </div>
          <div>
            <h2 className="font-bold text-[#003366]">{event.titulo}</h2>
            <p className="text-xs text-[#717182]">{event.tutor_nombre} · {event.centro_regional}</p>
          </div>
          <span className="ml-auto text-xs bg-[#FFD100]/20 border border-[#FFD100]/40 text-[#003366] font-bold px-2.5 py-1 rounded-lg">
            {event.duracion_horas}h VOAE
          </span>
        </div>

        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-xs text-slate-700">
          <div>
            <span className="text-[10px] text-[#717182] uppercase font-bold block">Ubicación / Lugar</span>
            {(() => {
              const loc = event.lugar || event.ubicacion || "No especificado";
              if (loc.includes("|")) {
                const [bName, bCoordsOrLink] = loc.split("|");
                const href = bCoordsOrLink.startsWith("http")
                  ? bCoordsOrLink
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bCoordsOrLink)}`;
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#004B87] hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <MapPin className="size-3.5 text-[#004B87] shrink-0" /> {bName} <span className="text-[10px] text-blue-500 font-normal hover:underline">(Ver mapa)</span>
                  </a>
                );
              }
              return <span className="font-semibold text-slate-800">{loc}</span>;
            })()}
          </div>
          <div>
            <span className="text-[10px] text-[#717182] uppercase font-bold block">Fecha</span>
            <span className="font-semibold text-slate-800">
              {new Date(event.fecha_inicio).toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#717182] uppercase font-bold block">Cupos / Capacidad</span>
            <span className="font-semibold text-slate-800">{event.cupo_maximo} estudiantes máximo</span>
          </div>
          <div>
            <span className="text-[10px] text-[#717182] uppercase font-bold block">Tipo de Actividad</span>
            <span className="font-semibold text-slate-800">{event.tipo_actividad}</span>
          </div>

          <div className="col-span-2">
            <span className="text-[10px] text-[#717182] uppercase font-bold block">Descripción Técnica</span>
            <p className="mt-1 leading-relaxed text-slate-600">{event.descripcion}</p>
          </div>

          {event.imagenes_adicionales && event.imagenes_adicionales.length > 0 && (
            <div className="col-span-2 pt-2 border-t">
              <span className="text-[10px] text-[#717182] uppercase font-bold block mb-1.5">Imágenes adicionales / Evidencias</span>
              <div className="flex gap-2.5 flex-wrap">
                {event.imagenes_adicionales.map((img: string, idx: number) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-slate-200 rounded-xl overflow-hidden size-20 bg-slate-50 hover:opacity-85 transition-opacity shadow-sm flex items-center justify-center"
                  >
                    <img src={img} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Firma digital */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#003366] flex items-center gap-2">
              <PenLine className="h-4 w-4 text-[#004B87]"/>Firma digital del coordinador VOAE
            </h3>
            <p className="text-xs text-[#717182]">Requerida antes de proceder con la aprobación</p>
          </div>
          {signatureUrl && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Firmado ✓</span>}
        </div>

        {signatureUrl ? (
          <div className="space-y-2">
            <div className="border border-dashed border-[#004B87]/20 rounded-xl p-3 bg-gray-50">
              <img src={signatureUrl} alt="Firma" className="h-20 w-auto mx-auto opacity-80"/>
            </div>
            <button onClick={()=>{setSignatureUrl(null);setShowSigning(true);}}
              className="text-xs text-[#717182] underline hover:text-[#003366] transition-colors">
              Volver a firmar
            </button>
          </div>
        ) : showSigning ? (
          <DigitalCanvas onSigned={handleSign}/>
        ) : (
          <button onClick={()=>setShowSigning(true)}
            className="w-full py-8 border-2 border-dashed border-[#004B87]/30 rounded-xl hover:border-[#004B87] hover:bg-blue-50/30 transition-all group">
            <PenLine className="h-8 w-8 text-gray-300 group-hover:text-[#004B87] mx-auto mb-2 transition-colors"/>
            <p className="text-sm font-semibold text-[#717182] group-hover:text-[#003366]">Haz clic aquí para firmar</p>
            <p className="text-xs text-gray-400">Traza tu firma digital en pantalla</p>
          </button>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 text-sm font-bold rounded-xl"
          onClick={() => setRejectDialogOpen(true)}
        >
          <XCircle className="size-4 mr-2" /> Rechazar Solicitud
        </Button>
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-sm font-bold rounded-xl text-white disabled:opacity-40"
          onClick={() => setApproveDialogOpen(true)}
          disabled={!signatureUrl}
        >
          <CheckCircle2 className="size-4 mr-2" /> Aprobar e Instalar Evento
        </Button>
      </div>

      {/* Approve dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#003366] flex items-center gap-1.5 font-bold">
              ¿Está seguro de aprobar este evento?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Al aprobar esta solicitud, el evento pasará al estado <strong>PROGRAMADO</strong> y estará disponible para que el tutor inicie el registro de asistencia. Los estudiantes podrán inscribirse.
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

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold">¿Está seguro de rechazar esta propuesta?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Escribe detalladamente los motivos del rechazo. El tutor recibirá una notificación con este motivo para poder corregir su propuesta.
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
    </div>
  );
}
