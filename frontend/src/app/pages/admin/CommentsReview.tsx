import { useEffect, useState } from "react";
import { MessageSquare, Search, ShieldAlert, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { moderacionService, type ReporteModeracion, type TipoSancion } from "../../../services/moderacion.service";

const ETIQUETA_SANCION: Record<TipoSancion, { texto: string; clase: string }> = {
  suspension_72h: { texto: "Suspensión 72h", clase: "bg-yellow-100 text-yellow-700" },
  shadowban: { texto: "Shadowban", clase: "bg-orange-100 text-orange-700" },
  bloqueo_permanente: { texto: "Bloqueo permanente", clase: "bg-red-100 text-red-700" },
};

export function CommentsReview() {
  const [reportes, setReportes] = useState<ReporteModeracion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await moderacionService.listarReportesPendientes();
      setReportes(data);
    } catch (err) {
      toast.error((err as Error).message || "No se pudieron cargar los reportes");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = reportes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.autor.toLowerCase().includes(q) ||
      (r.titulo_publicacion ?? r.contenido ?? '').toLowerCase().includes(q) ||
      r.contenido.toLowerCase().includes(q) ||
      r.usuario_reporta.toLowerCase().includes(q) ||
      r.motivo.toLowerCase().includes(q)
    );
  });

  const handleAprobar = async (r: ReporteModeracion) => {
    setProcesando(r.id_reporte);
    try {
      const resultado = await moderacionService.aprobarReporte(r.id_reporte);
      const etiqueta = ETIQUETA_SANCION[resultado.tipoSancion]?.texto ?? resultado.tipoSancion;
      const entidadTexto = r.tipo_reporte === 'publicacion' ? 'Publicación' : 'Comentario';
      toast.success(`${entidadTexto} revisada. Sanción aplicada a ${r.autor}: ${etiqueta} (infracción #${resultado.nivel}).`);
      setReportes((prev) => prev.filter((x) => x.id_reporte !== r.id_reporte));
    } catch (err) {
      toast.error((err as Error).message || "No se pudo aprobar el reporte");
    } finally {
      setProcesando(null);
    }
  };

  const handleDescartar = async (r: ReporteModeracion) => {
    setProcesando(r.id_reporte);
    try {
      await moderacionService.descartarReporte(r.id_reporte);
      toast.success("Reporte descartado, el comentario se mantiene.");
      setReportes((prev) => prev.filter((x) => x.id_reporte !== r.id_reporte));
    } catch (err) {
      toast.error((err as Error).message || "No se pudo descartar el reporte");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Revisión de Comentarios</h1>
          <p className="text-muted-foreground mt-1">
            Reportes de comentarios levantados por los usuarios, pendientes de tu decisión
          </p>
        </div>
        {reportes.length > 0 && (
          <Badge className="bg-[#FFD100] text-[#003366] text-sm px-3 py-1">
            {reportes.length} pendiente{reportes.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por autor, comentario, quién reportó o motivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {cargando ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando reportes...
            </CardContent>
          </Card>
        ) : filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay reportes pendientes de revisión.
            </CardContent>
          </Card>
        ) : (
          filtrados.map((r) => (
            <Card key={r.id_reporte} className="border-l-4 border-l-yellow-400">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#004B87]">{r.autor}</span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.fecha_creacion).toLocaleString("es-HN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldAlert className="h-4 w-4 text-yellow-500" />
                      Reportado por <span className="font-medium">{r.usuario_reporta}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-400 text-red-600 hover:bg-red-50"
                      disabled={procesando === r.id_reporte}
                      onClick={() => handleAprobar(r)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Eliminar y sancionar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={procesando === r.id_reporte}
                      onClick={() => handleDescartar(r)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Descartar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {r.tipo_reporte === 'publicacion' ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-gray-50 rounded-md p-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700 font-semibold">{r.titulo_publicacion}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{r.contenido}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-gray-50 rounded-md p-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700 leading-relaxed">{r.contenido}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Motivo del reporte:</span> {r.motivo}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}