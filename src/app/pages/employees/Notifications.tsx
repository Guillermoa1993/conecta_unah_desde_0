import { useState } from "react";
import { Bell, Search, Plus, Filter, CheckCircle2, AlertTriangle, Info, Send, Calendar, Users, Eye } from "lucide-react";
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

interface Notification {
  id: string;
  title: string;
  message: string;
  recipientGroup: string;
  type: "info" | "warning" | "success";
  date: string;
  status: "Enviado" | "Programado" | "Borrador";
  reads: number;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "Mantenimiento programado de la plataforma",
    message: "El sistema no estará disponible el sábado 27 de junio de 10:00 PM a 2:00 AM por actualización de servidores.",
    recipientGroup: "Todos",
    type: "warning",
    date: "2026-06-23 09:30 AM",
    status: "Enviado",
    reads: 1450,
  },
  {
    id: "2",
    title: "Nueva fecha límite para subir certificados",
    message: "Se ha extendido el plazo para subir los certificados de participación del Artículo 140 hasta el 30 de junio.",
    recipientGroup: "Estudiantes",
    type: "info",
    date: "2026-06-22 02:15 PM",
    status: "Enviado",
    reads: 982,
  },
  {
    id: "3",
    title: "Apertura de inscripciones para el Congreso de IA",
    message: "Ya se encuentran abiertas las inscripciones para el Congreso Latinoamericano de Inteligencia Artificial 2026.",
    recipientGroup: "Estudiantes y Tutores",
    type: "success",
    date: "2026-06-20 11:00 AM",
    status: "Enviado",
    reads: 1205,
  },
  {
    id: "4",
    title: "Recordatorio de validación de horas",
    message: "Recordatorio para tutores: Por favor validar las horas de asistencia del Taller de React antes del viernes.",
    recipientGroup: "Tutores",
    type: "info",
    date: "2026-06-24 08:00 AM",
    status: "Programado",
    reads: 0,
  }
];

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newRecipient, setNewRecipient] = useState("Estudiantes");
  const [newType, setNewType] = useState<"info" | "warning" | "success">("info");

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title.toLowerCase().includes(search.toLowerCase()) ||
      notif.message.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || notif.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error("El título y el mensaje son obligatorios.");
      return;
    }

    const newNotif: Notification = {
      id: String(Date.now()),
      title: newTitle,
      message: newMessage,
      recipientGroup: newRecipient,
      type: newType,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: "Enviado",
      reads: 0,
    };

    setNotifications([newNotif, ...notifications]);
    setNewTitle("");
    setNewMessage("");
    setIsNewDialogOpen(false);
    toast.success("Notificación enviada exitosamente a " + newRecipient);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default:
        return <Info className="h-5 w-5 text-[#004B87]" />;
    }
  };

  const getBadgeColor = (type: string) => {
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
          <h1 className="text-3xl font-bold text-[#004B87] flex items-center gap-2">
            <Bell className="h-8 w-8 text-[#004B87]" />
            Centro de Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Redacta, programa y monitorea las alertas enviadas a la comunidad universitaria.
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
                  {notifications.filter(n => n.status === "Enviado").length}
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
                <p className="text-sm font-semibold text-slate-500">Programadas</p>
                <h3 className="text-3xl font-black text-[#003366] mt-1">
                  {notifications.filter(n => n.status === "Programado").length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Calendar className="h-6 w-6" />
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
                  {notifications.reduce((acc, curr) => acc + curr.reads, 0).toLocaleString()}
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
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No se encontraron notificaciones que coincidan con la búsqueda.
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div key={notif.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4 items-start flex-1">
                    <div className="mt-1 p-2 rounded-lg bg-slate-100">
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-lg">{notif.title}</h4>
                        <Badge className={`${getBadgeColor(notif.type)} border font-medium`}>
                          {notif.type === "warning" ? "Advertencia" : notif.type === "success" ? "Éxito" : "Info"}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                          Para: {notif.recipientGroup}
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>Enviado el {notif.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {notif.reads} visualizaciones
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Badge 
                      className={
                        notif.status === "Enviado" 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }
                    >
                      {notif.status}
                    </Badge>
                  </div>
                </div>
              ))
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
                    <Select value={newRecipient} onValueChange={setNewRecipient}>
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
                    <Select value={newType} onValueChange={(v) => setNewType(v as "info" | "warning" | "success")}>
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
                <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#004B87] hover:bg-[#003366] text-white">
                  Enviar Notificación
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
