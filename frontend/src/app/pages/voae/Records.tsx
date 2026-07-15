import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { CalendarDays, Users, Star, Eye, ShieldCheck, XCircle, Search } from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedItems = items.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const goToPage = (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1)));
  return {
    page: safePage,
    pageSize,
    totalPages,
    totalItems: items.length,
    paginatedItems,
    goToPage,
    changePageSize: (size: number) => {
      setPageSize(size);
      setPage(0);
    },
  };
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i);
  if (totalItems === 0) return null;
  return (
    <div className="flex items-center justify-between pt-4 px-4 pb-2 border-t text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>
          {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, totalItems)} de {totalItems}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border rounded px-2 py-1 outline-none"
          >
            {[5, 10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s} por página
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="size-8 rounded-lg grid place-items-center hover:bg-secondary/50 transition disabled:opacity-30"
        >
          {"<<"}
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="size-8 rounded-lg grid place-items-center hover:bg-secondary/50 transition disabled:opacity-30"
        >
          {"<"}
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`size-8 rounded-lg grid place-items-center transition ${
              p === page
                ? "bg-[#004B87] text-white font-medium"
                : "hover:bg-secondary/50 text-[#717182]"
            }`}
          >
            {p + 1}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="size-8 rounded-lg grid place-items-center hover:bg-secondary/50 transition disabled:opacity-30"
        >
          {">"}
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="size-8 rounded-lg grid place-items-center hover:bg-secondary/50 transition disabled:opacity-30"
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}

export function VOAERecords() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectSearch, setRejectSearch] = useState("");

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/eventos');
      setEvents(data || []);
    } catch (err: any) {
      toast.error("Error al cargar historial institucional", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const completados = useMemo(() => events.filter((e) => e.estado === "FINALIZADO"), [events]);
  const activos = useMemo(() => events.filter((e) => e.estado === "ACTIVO" || e.estado === "EN_CURSO" || e.estado === "PROGRAMADO"), [events]);
  const rechazados = useMemo(() => events.filter((e) => e.estado === "RECHAZADO"), [events]);

  const filteredRechazados = useMemo(() => {
    if (!rejectSearch.trim()) return rechazados;
    return rechazados.filter((e) =>
      (e.motivo_rechazo || "").toLowerCase().includes(rejectSearch.toLowerCase())
    );
  }, [rechazados, rejectSearch]);

  const totalHoras = useMemo(() => {
    return completados.reduce((sum, e) => sum + Number(e.duracion_horas) * (e.inscritos_count || 0), 0);
  }, [completados]);

  const totalEstudiantes = useMemo(() => {
    return completados.reduce((sum, e) => sum + (e.inscritos_count || 0), 0);
  }, [completados]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#003366]">Historial Institucional</h1>
        <p className="text-sm text-muted-foreground">Consulta todos los eventos registrados, su estado y validaciones.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-blue-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#004B87]">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{completados.length}</p>
            <p className="text-xs text-[#717182] font-semibold">Eventos validados</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm border-yellow-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
            <Star className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{totalHoras}h</p>
            <p className="text-xs text-[#717182] font-semibold">Total horas acreditadas</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm border-green-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{totalEstudiantes}</p>
            <p className="text-xs text-[#717182] font-semibold">Estudiantes impactados</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="completed" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="completed" className="gap-2">
            <ShieldCheck className="size-3.5" /> Completados ({completados.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CalendarDays className="size-3.5" /> Activos ({activos.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="size-3.5" /> Rechazados ({rechazados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          <EventTable rows={completados} variant="completed" loading={loading} />
        </TabsContent>
        <TabsContent value="approved">
          <EventTable rows={activos} variant="approved" loading={loading} />
        </TabsContent>
        <TabsContent value="rejected">
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por motivo de rechazo..."
                value={rejectSearch}
                onChange={(e) => setRejectSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "#d1d5db" }}
              />
            </div>
            <EventTable rows={filteredRechazados} variant="rejected" loading={loading} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventTable({
  rows,
  variant,
  loading,
}: {
  rows: any[];
  variant: "completed" | "approved" | "rejected";
  loading: boolean;
}) {
  const pagination = usePagination(rows, 10);
  const displayedRows = pagination.paginatedItems;

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Cargando registros...</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed p-12 text-center text-sm text-muted-foreground bg-slate-50/50">
        Sin registros en esta categoría
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Evento</TableHead>
            <TableHead>Tutor</TableHead>
            <TableHead>Fecha</TableHead>
            {variant === "completed" && <TableHead className="text-center">Acreditados</TableHead>}
            {variant === "completed" && <TableHead className="text-center">Horas Otorgadas</TableHead>}
            {variant === "rejected" && <TableHead>Motivo</TableHead>}
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.map((e) => (
            <TableRow key={e.id} className="hover:bg-slate-50/50">
              <TableCell>
                <div className="font-semibold text-slate-800">{e.titulo}</div>
                <div className="text-xs text-muted-foreground">{e.lugar || e.ubicacion || "No especificado"}</div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium text-slate-700">{e.tutor_nombre || "Tutor"}</span>
              </TableCell>
              <TableCell className="text-xs font-mono text-slate-600">
                {new Date(e.fecha_inicio).toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })}
              </TableCell>
              {variant === "completed" && (
                <>
                  <TableCell className="text-center font-bold text-green-600">
                    {e.inscritos_count || 0}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700">
                    {e.duracion_horas}h
                  </TableCell>
                </>
              )}
              {variant === "rejected" && (
                <TableCell className="text-xs text-red-600 max-w-[200px] truncate font-medium">
                  {e.motivo_rechazo || "Sin motivo registrado"}
                </TableCell>
              )}
              <TableCell>
                {variant === "completed" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
                    Completado
                  </span>
                )}
                {variant === "approved" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">
                    Activo
                  </span>
                )}
                {variant === "rejected" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-50 border-red-200 text-red-700">
                    Rechazado
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-[#004B87] text-[#004B87] hover:bg-[#004B87]/5 hover:text-[#004B87]"
                >
                  <Link to={`/voae/events/${e.id}/validar`}>
                    <Eye className="size-3.5 mr-1" /> Validar
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        onPageChange={pagination.goToPage}
      />
    </div>
  );
}
