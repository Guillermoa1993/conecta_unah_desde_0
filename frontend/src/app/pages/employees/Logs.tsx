import { useState } from "react";
import { FileSpreadsheet, Search, Filter, ShieldAlert, History, Database, User, Calendar, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  category: "Seguridad" | "Eventos" | "Usuarios" | "Asistencia";
  date: string;
  ip: string;
  details: string;
  status: "Exitoso" | "Fallido";
}

const initialLogs: LogEntry[] = [
  {
    id: "LOG-001",
    user: "carlos.admin@unah.hn",
    role: "Administrador",
    action: "Inicio de sesión",
    category: "Seguridad",
    date: "2026-06-23 10:24 AM",
    ip: "192.168.10.114",
    details: "Autenticación OTP exitosa",
    status: "Exitoso",
  },
  {
    id: "LOG-002",
    user: "marta.tutor@unah.hn",
    role: "Tutor",
    action: "Creación de evento",
    category: "Eventos",
    date: "2026-06-23 09:45 AM",
    ip: "192.168.10.125",
    details: "Creado taller 'React y Vite para principiantes'",
    status: "Exitoso",
  },
  {
    id: "LOG-003",
    user: "carlos.admin@unah.hn",
    role: "Administrador",
    action: "Modificación de usuario",
    category: "Usuarios",
    date: "2026-06-23 08:30 AM",
    ip: "192.168.10.114",
    details: "Rol de 'tutor.juan@unah.hn' cambiado de Estudiante a Tutor",
    status: "Exitoso",
  },
  {
    id: "LOG-004",
    user: "sandra.voae@unah.hn",
    role: "Personal VOAE",
    action: "Validación de asistencia",
    category: "Asistencia",
    date: "2026-06-22 04:12 PM",
    ip: "192.168.12.204",
    details: "Validadas 12 asistencias para el evento 'Congreso de Informática'",
    status: "Exitoso",
  },
  {
    id: "LOG-005",
    user: "desconocido@unah.hn",
    role: "Ninguno",
    action: "Intento de inicio de sesión",
    category: "Seguridad",
    date: "2026-06-22 03:05 PM",
    ip: "200.13.94.10",
    details: "OTP incorrecto introducido 3 veces",
    status: "Fallido",
  },
];

export function Logs() {
  const [logs] = useState<LogEntry[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Seguridad":
        return <Badge className="bg-red-100 text-red-800 border border-red-200">Seguridad</Badge>;
      case "Eventos":
        return <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200">Eventos</Badge>;
      case "Usuarios":
        return <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Usuarios</Badge>;
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Asistencia</Badge>;
    }
  };

  const handleExport = () => {
    toast.success("Bitácora exportada correctamente a formato CSV.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87] flex items-center gap-2">
            <History className="h-8 w-8 text-[#004B87]" />
            Bitácora de Empleados
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro de auditoría del sistema para supervisar las acciones realizadas por el personal.
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-[#004B87] hover:bg-[#003366] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#004B87]/20 transition-all active:scale-95"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Log Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md border-none bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Eventos de Seguridad</p>
                <h3 className="text-3xl font-black text-red-600 mt-1">
                  {logs.filter(l => l.category === "Seguridad").length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Acciones Exitosas</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">
                  {logs.filter(l => l.status === "Exitoso").length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Total Registros hoy</p>
                <h3 className="text-3xl font-black text-[#003366] mt-1">
                  {logs.length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Database className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-md border-none">
        <CardHeader className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Historial de Actividades</CardTitle>
            <CardDescription>Consulte los eventos registrados ordenados cronológicamente.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario, acción..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="Seguridad">Seguridad</SelectItem>
                  <SelectItem value="Eventos">Eventos</SelectItem>
                  <SelectItem value="Usuarios">Usuarios</SelectItem>
                  <SelectItem value="Asistencia">Asistencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[110px]">ID de Registro</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha e IP</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      No se encontraron registros de bitácora.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs text-slate-400">{log.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {log.user}
                          </span>
                          <span className="text-[10px] text-[#004B87] font-semibold">{log.role}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{log.action}</TableCell>
                      <TableCell>{getCategoryBadge(log.category)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {log.date}
                          </span>
                          <span>IP: {log.ip}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[250px] truncate" title={log.details}>
                        {log.details}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          className={
                            log.status === "Exitoso" 
                              ? "bg-green-100 text-green-800 hover:bg-green-100 border border-green-200" 
                              : "bg-red-100 text-red-800 hover:bg-red-100 border border-red-200"
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
