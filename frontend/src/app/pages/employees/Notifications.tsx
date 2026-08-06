import { useEffect, useState, useCallback } from "react";
import { Bell, Search, Plus, Filter, CheckCircle2, AlertTriangle, Info, Send, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { notificacionesService } from "../../../services/notificaciones.service";
import type { NotificacionEnviada, GrupoDestinatarioNotificacion, TipoNotificacion } from "../../../types";

type TipoAlerta = "info" | "warning" | "success";

const TIPO_ALERTA_A_TIPO_NOTIFICACION: Record<TipoAlerta, TipoNotificacion> = {
  info: "ANUNCIO_INFO",
  warning: "ANUNCIO_ADVERTENCIA",
  success: "ANUNCIO_EXITO",
};

const TIPO_NOTIFICACION_A_TIPO_ALERTA: Record<string, TipoAlerta> = {
  ANUNCIO_INFO: "info",
  ANUNCIO_ADVERTENCIA: "warning",
  ANUNCIO_EXITO: "success",
};

function tipoAlertaDe(tipo: string): TipoAlerta {
  return TIPO_NOTIFICACION_A_TIPO_ALERTA[tipo] ?? "info";
}

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificacionEnviada[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newRecipient, setNewRecipient] = useState<GrupoDestinatarioNotificacion>("Estudiantes");
  const [newType, setNewType] = useState<TipoAlerta>("info");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const enviadas = await notificacionesService.getEnviadas();
      setNotifications(enviadas);
    } catch {
      toast.error("No se pudo cargar el historial de notificaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filteredNotifications = notifications.filter((notif) => {
    const titulo = notif.titulo ?? "";
    const matchesSearch =
      titulo.toLowerCase().includes(search.toLowerCase()) ||
      notif.mensaje.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || tipoAlertaDe(notif.tipo) === filterType;
    return matchesSearch && matchesType;
  });

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error("El título y el mensaje son obligatorios.");
      return;
    }

    setEnviando(true);
    try {
      const enviada = await notificacionesService.enviarMasiva({
        titulo: newTitle,
        mensaje: newMessage,
        tipo: TIPO_ALERTA_A_TIPO_NOTIFICACION[newType],
        destinatario_grupo: newRecipient,
      });
      setNotifications((prev) => [enviada, ...prev]);
      setNewTitle("");
      setNewMessage("");
      setIsNewDialogOpen(false);
      toast.success(
        `Notificación enviada a ${enviada.total_destinatarios} usuario(s) de "${newRecipient}".`,
      );
    } catch {
      toast.error("No se pudo enviar la notificación.");
    } finally {
      setEnviando(false);
    }
  };

  const getIcon = (type: TipoAlerta) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default:
        return <Info className="h-5 w-5 text-[#004B87]" />;
    }
  };

  const getBadgeColor = (type: TipoAlerta) => {
    switch (type) {
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "success":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-[#004B87]/10 text-[#004B87] border-[#004B87]/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#004B87] flex items-center gap-2">
            <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-[#004B87] shrink-0" />
            Centro de Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Redacta y monitorea las alertas enviadas a la comunidad universitaria.
          </p>
        </div>
        <Button 
          className="bg-[#004B87] hover:bg-[#003366] text-white flex items-center gap-2"
          onClick={() => setIsNewDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nueva Notificación
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md border-none bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Notificaciones Enviadas</p>
                <h3 className="text-3xl font-black text-[#003366] mt-1">
                  {notifications.length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Send className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Destinatarios Alcanzados</p>
                <h3 className="text-3xl font-black text-[#003366] mt-1">
                  {notifications.reduce((acc, curr) => acc + curr.total_destinatarios, 0).toLocaleString()}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Bell className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Total Visualizaciones</p>
                <h3 className="text-3xl font-black text-[#003366] mt-1">
                  {notifications.reduce((acc, curr) => acc + curr.total_leidas, 0).toLocaleString()}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Eye className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and List Section */}
      <Card className="shadow-md border-none">
        <CardHeader className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Historial de Notificaciones</CardTitle>
            <CardDescription>Visualiza y busca notificaciones previas.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificación..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44 flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="info">Información</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="success">Éxito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando notificaciones...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No se encontraron notificaciones que coincidan con la búsqueda.
              </div>
            ) : (
              filteredNotifications.map((notif, idx) => {
                const tipoAlerta = tipoAlertaDe(notif.tipo);
                return (
                  <div key={`${notif.fecha_creacion}-${idx}`} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-4 items-start flex-1">
                      <div className="mt-1 p-2 rounded-lg bg-slate-100">
                        {getIcon(tipoAlerta)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-lg">{notif.titulo ?? "Notificación"}</h4>
                          <Badge className={`${getBadgeColor(tipoAlerta)} border font-medium`}>
                            {tipoAlerta === "warning" ? "Advertencia" : tipoAlerta === "success" ? "Éxito" : "Info"}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                            Para: {notif.destinatario_grupo}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">{notif.mensaje}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                          <span>Enviado el {new Date(notif.fecha_creacion).toLocaleString("es-HN")}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {notif.total_leidas} / {notif.total_destinatarios} leídas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Enviado
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Notification Modal */}
      {isNewDialogOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-xl shadow-2xl border-none">
            <CardHeader className="bg-[#004B87] text-white rounded-t-xl">
              <CardTitle className="text-xl flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Redactar Nueva Notificación
              </CardTitle>
              <CardDescription className="text-white/80">
                La notificación se publicará y se notificará de inmediato a los grupos seleccionados.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSendNotification}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="notif-title">Título de la Notificación</Label>
                  <Input
                    id="notif-title"
                    placeholder="Ej. Cambio de horario - Taller de SCRUM"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="recipient">Destinatarios</Label>
                    <Select value={newRecipient} onValueChange={(v) => setNewRecipient(v as GrupoDestinatarioNotificacion)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos los Usuarios</SelectItem>
                        <SelectItem value="Estudiantes">Solo Estudiantes</SelectItem>
                        <SelectItem value="Tutores">Solo Tutores / Facilitadores</SelectItem>
                        <SelectItem value="Personal VOAE">Solo Personal VOAE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notif-type">Tipo de Alerta</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as TipoAlerta)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Información (Azul)</SelectItem>
                        <SelectItem value="warning">Advertencia (Naranja)</SelectItem>
                        <SelectItem value="success">Éxito / Confirmación (Verde)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Cuerpo del Mensaje</Label>
                  <Textarea
                    id="message"
                    placeholder="Escribe el contenido detallado de la notificación..."
                    rows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)} disabled={enviando}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#004B87] hover:bg-[#003366] text-white" disabled={enviando}>
                  {enviando ? "Enviando..." : "Enviar Notificación"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
