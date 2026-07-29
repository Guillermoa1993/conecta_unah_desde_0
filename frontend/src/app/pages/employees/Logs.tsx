import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ShieldAlert, History, Database, User, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { bitacoraService, type BitacoraEntry } from "../../../services/bitacora.service";

type Categoria = "Seguridad" | "Usuarios" | "Respaldos" | "Otro";

// La bitácora real solo guarda id_usuario/usuario/correo/accion/fecha (no hay
// columna de categoría, IP ni estado). La categoría se deriva del texto de
// la acción, ya registrada por el backend en cada caso de uso real.
function categoriaDe(accion: string): Categoria {
  const texto = accion.toLowerCase();
  if (texto.includes("sesión") || texto.includes("rol")) return "Seguridad";
  if (texto.includes("usuario") || texto.includes("inhabilit") || texto.includes("habilit")) return "Usuarios";
  if (texto.includes("respaldo") || texto.includes("restaur")) return "Respaldos";
  return "Otro";
}

function badgeDeCategoria(categoria: Categoria) {
  switch (categoria) {
    case "Seguridad":
      return <Badge className="bg-red-100 text-red-800 border border-red-200">Seguridad</Badge>;
    case "Usuarios":
      return <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Usuarios</Badge>;
    case "Respaldos":
      return <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200">Respaldos</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-700 border border-slate-200">Otro</Badge>;
  }
}

export function Logs() {
  const [logs, setLogs] = useState<BitacoraEntry[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setLogs(await bitacoraService.listar(200));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la bitácora");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filteredLogs = logs.filter((log) => {
    const texto = `${log.usuario ?? ""} ${log.correo ?? ""} ${log.accion}`.toLowerCase();
    const matchesSearch = texto.includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || categoriaDe(log.accion) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalSeguridad = logs.filter((l) => categoriaDe(l.accion) === "Seguridad").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87] flex items-center gap-2">
            <History className="h-8 w-8 text-[#004B87]" />
            Bitácora del Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro real de auditoría: inicios de sesión, cambios de usuarios/roles y respaldos.
          </p>
        </div>
        <Button variant="outline" onClick={cargar} disabled={cargando}>
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {cargando ? "Actualizando…" : "Actualizar"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-none bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Eventos de Seguridad</p>
                <h3 className="text-3xl font-black text-red-600 mt-1">{totalSeguridad}</h3>
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
                <p className="text-sm font-semibold text-slate-500">Total registros mostrados</p>
                <h3 className="text-3xl font-black text-[#003366] mt-1">{logs.length}</h3>
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
                  <SelectItem value="Usuarios">Usuarios</SelectItem>
                  <SelectItem value="Respaldos">Respaldos</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
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
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Cargando bitácora…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-red-600">
                      No se pudo cargar la información. {error}
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      No se encontraron registros de bitácora.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id_bitacora} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs text-slate-400">#{log.id_bitacora}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {log.usuario ?? `Usuario #${log.id_usuario}`}
                          </span>
                          {log.correo && <span className="text-[10px] text-[#004B87] font-semibold">{log.correo}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{log.accion}</TableCell>
                      <TableCell>{badgeDeCategoria(categoriaDe(log.accion))}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.fecha).toLocaleString("es-HN")}
                        </span>
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
