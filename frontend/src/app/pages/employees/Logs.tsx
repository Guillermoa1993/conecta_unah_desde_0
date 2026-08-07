import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ShieldAlert, History, Database, User, Calendar, Loader2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
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

  const handleDownloadPdf = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      const doc = await PDFDocument.create();
      const pageSize = [595, 842];
      let page = doc.addPage(pageSize);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const margin = 40;
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const rowHeight = 20;
      const headerHeight = 24;
      let cursorY = pageHeight - margin;
      const columnWidths = [40, 130, 215, 90, 50];
      const contentWidth = columnWidths.reduce((sum, width) => sum + width, 0);

      const drawText = (text: string, x: number, y: number, size = 10, fontToUse = font, color = rgb(0.075, 0.1, 0.18)) => {
        page.drawText(text, { x, y, size, font: fontToUse, color });
      };

      const wrapText = (text: string, maxWidth: number, size = 10, fontToUse = font) => {
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = "";

        words.forEach((word) => {
          const candidate = currentLine ? `${currentLine} ${word}` : word;
          const width = fontToUse.widthOfTextAtSize(candidate, size);
          if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = candidate;
          }
        });
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      const addPage = () => {
        page = doc.addPage(pageSize);
        cursorY = pageHeight - margin;
      };

      const ensureSpace = (height: number) => {
        if (cursorY < margin + height) {
          addPage();
          addTableHeader();
        }
      };

      const addTableHeader = () => {
        ensureSpace(headerHeight + 4);
        page.drawRectangle({ x: margin, y: cursorY - headerHeight, width: contentWidth, height: headerHeight, color: rgb(0.0, 0.2, 0.45) });
        const headers = ["ID", "Usuario", "Acción", "Categoría", "Fecha"];
        let x = margin;
        headers.forEach((header, index) => {
          drawText(header, x + 2, cursorY - 16, 9, boldFont, rgb(1, 1, 1));
          x += columnWidths[index];
        });
        cursorY -= headerHeight;
      };

      const addRow = (row: string[]) => {
        const wrappedCells = row.map((cell, index) => wrapText(cell, columnWidths[index] - 6));
        const rowLines = Math.max(...wrappedCells.map((lines) => lines.length));
        const requiredHeight = Math.max(rowHeight, rowLines * 12 + 8);
        ensureSpace(requiredHeight + 4);

        const backgroundColor = rgb(0.96, 0.98, 1);
        page.drawRectangle({ x: margin, y: cursorY - requiredHeight + 4, width: contentWidth, height: requiredHeight, color: backgroundColor });

        let x = margin;
        wrappedCells.forEach((lines, index) => {
          lines.forEach((line, lineIndex) => {
            const y = cursorY - 12 - lineIndex * 12;
            drawText(line, x + 2, y, 9, font, rgb(0.08, 0.1, 0.18));
          });
          x += columnWidths[index];
        });

        cursorY -= requiredHeight;
      };

      page.drawRectangle({ x: 0, y: pageHeight - 92, width: pageWidth, height: 92, color: rgb(0.0, 0.29, 0.53) });
      drawText("Conecta Pumas · Bitácora", margin, pageHeight - 48, 18, boldFont, rgb(1, 1, 1));
      drawText("Reporte de auditoría | Registros de bitácora", margin, pageHeight - 68, 10, font, rgb(0.94, 0.94, 0.96));
      drawText(`Registros exportados: ${filteredLogs.length}`, margin, pageHeight - 88, 10, font, rgb(0.82, 0.88, 0.96));

      cursorY -= 40;
      addTableHeader();

      if (filteredLogs.length === 0) {
        addRow(["-", "-", "No hay registros para exportar.", "-", "-"]);
      } else {
        filteredLogs.forEach((log) => {
          addRow([
            `#${log.id_bitacora}`,
            log.usuario ?? `Usuario #${log.id_usuario}`,
            log.accion,
            categoriaDe(log.accion),
            new Date(log.fecha).toLocaleString("es-HN"),
          ]);
        });
      }

      ensureSpace(40);
      drawText("Documento generado por Conecta Pumas · Universidad Nacional Autónoma de Honduras.", margin, 40, 9, font, rgb(0.45, 0.52, 0.6));

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ConectaPumas_Bitacora.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setGeneratingPdf(false);
    } catch (err) {
      console.error(err);
      setGeneratingPdf(false);
    }
  }, [filteredLogs]);

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
        <CardHeader className="border-b pb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <CardTitle>Historial de Actividades</CardTitle>
            <CardDescription>Consulte los eventos registrados ordenados cronológicamente.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Button variant="outline" onClick={handleDownloadPdf} disabled={generatingPdf}>
                {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                {generatingPdf ? "Generando PDF…" : "Descargar PDF"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full table-auto">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[80px] hidden md:table-cell">ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead className="hidden lg:table-cell">Categoría</TableHead>
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
                      <TableCell className="font-mono text-xs text-slate-400 hidden md:table-cell">#{log.id_bitacora}</TableCell>
                      <TableCell className="min-w-0">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {log.usuario ?? `Usuario #${log.id_usuario}`}
                          </span>
                          {log.correo && <span className="text-[10px] text-[#004B87] font-semibold">{log.correo}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 break-words whitespace-normal max-w-[280px]">{log.accion}</TableCell>
                      <TableCell className="hidden lg:table-cell min-w-0">{badgeDeCategoria(categoriaDe(log.accion))}</TableCell>
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
