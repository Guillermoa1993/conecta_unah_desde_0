import { useState, useEffect, useCallback } from "react";
import {
  Archive, Clock3, Database, Download, Upload, AlertTriangle, Loader2,
  Trash2, RotateCcw,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "../../components/ui/alert-dialog";
import { toast } from "sonner";
import { backupsService, type HistoricoBackupRow } from "../../../services/backups.service";
import { authService } from "../../../services/auth.service";

const ESTADO_BADGE: Record<HistoricoBackupRow["estado"], string> = {
  exitoso: "border-emerald-200 bg-emerald-50 text-emerald-700",
  fallido: "border-red-200 bg-red-50 text-red-700",
  en_progreso: "border-amber-200 bg-amber-50 text-amber-700",
};

const ESTADO_LABEL: Record<HistoricoBackupRow["estado"], string> = {
  exitoso: "Exitoso",
  fallido: "Fallido",
  en_progreso: "En progreso",
};

export function BackupRestore() {
  const [historial, setHistorial] = useState<HistoricoBackupRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [creando, setCreando] = useState(false);
  const [descargando, setDescargando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<HistoricoBackupRow | null>(null);
  const [restaurando, setRestaurando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const rows = await backupsService.listar();
      setHistorial(rows);
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : "No se pudo cargar el historial de respaldos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async () => {
    if (creando) return;
    setCreando(true);
    try {
      const backup = await backupsService.crear();
      toast.success(`Respaldo creado: ${backup.nombre}`);
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el respaldo");
    } finally {
      setCreando(false);
    }
  };

  const handleDescargar = async (nombre: string) => {
    setDescargando(nombre);
    try {
      await backupsService.descargar(nombre);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo descargar el respaldo");
    } finally {
      setDescargando(null);
    }
  };

  const handleEliminar = async (nombre: string) => {
    setEliminando(nombre);
    try {
      await backupsService.eliminar(nombre);
      toast.success(`Respaldo ${nombre} eliminado`);
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el respaldo");
    } finally {
      setEliminando(null);
    }
  };

  const confirmarRestaurar = async () => {
    if (!restoreTarget) return;
    setRestaurando(true);
    try {
      const resultado = await backupsService.restaurar(restoreTarget.nombre_archivo);
      toast.success(resultado.mensaje);
      setRestoreTarget(null);

      // La restauración cierra TODAS las sesiones por mantenimiento,
      // incluida la de quien la ejecutó: se cierra sesión localmente también.
      setTimeout(() => {
        authService.logout();
        window.location.href = "/login";
      }, 1800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo restaurar el respaldo");
      setRestaurando(false);
    }
  };

  const ultimoBackup = historial[0];
  const totalExitosos = historial.filter((h) => h.estado === "exitoso").length;
  const totalFallidos = historial.filter((h) => h.estado === "fallido").length;

  return (
    <div className="space-y-6">
      {/* ── Encabezado ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-[#004B87] to-[#003366] p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Respaldo y Restauración</h1>
              <p className="text-sm text-slate-200">
                Copias de seguridad reales de la base de datos institucional.
              </p>
            </div>
          </div>
          <Badge className="bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] w-fit">
            Protección de datos
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Último respaldo</p>
            <p className="text-sm font-bold">
              {ultimoBackup ? new Date(ultimoBackup.fecha_inicio).toLocaleString("es-HN") : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Respaldos guardados</p>
            <p className="text-sm font-bold">{historial.length}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Exitosos</p>
            <p className="text-sm font-bold">{totalExitosos}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Fallidos</p>
            <p className="text-sm font-bold">{totalFallidos}</p>
          </div>
        </div>
      </div>

      {/* ── Acciones rápidas ───────────────────────────────── */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#003366]">Acciones rápidas</CardTitle>
          <CardDescription>
            Crear un respaldo ejecuta <code>pg_dump</code> real contra la base de datos. Restaurar
            cierra la sesión de todos los usuarios conectados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            className="justify-start bg-[#004B87] hover:bg-[#003366] text-white"
            onClick={handleCrear}
            disabled={creando}
          >
            {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {creando ? "Creando respaldo…" : "Crear respaldo"}
          </Button>

          <Button
            variant="outline"
            className="justify-start border-amber-400 text-amber-700 hover:bg-amber-50"
            onClick={() => ultimoBackup && setRestoreTarget(ultimoBackup)}
            disabled={!ultimoBackup || restaurando}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar última copia
          </Button>
        </CardContent>
      </Card>

      {/* ── Historial real ─────────────────────────────────── */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#003366]">Historial de respaldos</CardTitle>
          <CardDescription>Datos reales desde tabla_grupo_4_historico_backups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cargando && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial…
            </div>
          )}

          {!cargando && errorCarga && (
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <span className="text-sm text-red-700">No se pudo cargar la información. {errorCarga}</span>
              <Button size="sm" variant="outline" onClick={cargar}>Reintentar</Button>
            </div>
          )}

          {!cargando && !errorCarga && historial.length === 0 && (
            <p className="text-sm text-slate-500">Todavía no hay respaldos registrados.</p>
          )}

          {!cargando && !errorCarga && historial.map((item) => (
            <div
              key={item.id_backup}
              className="flex flex-col gap-3 rounded-lg border border-slate-150 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Archive className="mt-0.5 h-4 w-4 text-[#004B87]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#003366]">{item.nombre_archivo}</p>
                    <Badge variant="outline" className="border-[#004B87]/20 text-[10px] font-bold uppercase text-[#004B87]">
                      {item.categoria}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300 text-[10px] font-bold uppercase text-slate-500">
                      {item.tipo}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {item.tamanio} · {item.duracion} · {new Date(item.fecha_inicio).toLocaleString("es-HN")}
                    {item.iniciado_por ? ` · por ${item.iniciado_por}` : ""}
                  </p>
                  {item.estado === "fallido" && item.mensaje_error && (
                    <p className="text-xs text-red-600 mt-0.5">{item.mensaje_error}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`w-fit ${ESTADO_BADGE[item.estado]}`}>
                  {ESTADO_LABEL[item.estado]}
                </Badge>

                {item.estado === "exitoso" && (
                  <>
                    <Button
                      size="sm" variant="ghost" className="text-[#004B87] hover:bg-[#004B87]/10"
                      onClick={() => handleDescargar(item.nombre_archivo)}
                      disabled={descargando === item.nombre_archivo}
                    >
                      {descargando === item.nombre_archivo
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Download className="h-3.5 w-3.5" />}
                    </Button>

                    <Button
                      size="sm" variant="ghost" className="text-amber-600 hover:bg-amber-50"
                      onClick={() => setRestoreTarget(item)}
                      disabled={restaurando}
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}

                <Button
                  size="sm" variant="ghost" className="text-red-600 hover:bg-red-50"
                  onClick={() => handleEliminar(item.nombre_archivo)}
                  disabled={eliminando === item.nombre_archivo}
                >
                  {eliminando === item.nombre_archivo
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Confirmación antes de restaurar (acción destructiva) ── */}
      <AlertDialog open={restoreTarget !== null} onOpenChange={(open) => !open && !restaurando && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#003366]">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ¿Restaurar este respaldo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás por restaurar <strong>{restoreTarget?.nombre_archivo}</strong> del{" "}
              <strong>{restoreTarget && new Date(restoreTarget.fecha_inicio).toLocaleString("es-HN")}</strong>.
              Los datos actuales del sistema serán reemplazados por los de esta copia y{" "}
              <strong>se cerrará la sesión de todos los usuarios conectados</strong> por mantenimiento.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restaurando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={confirmarRestaurar}
              disabled={restaurando}
            >
              {restaurando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {restaurando ? "Restaurando…" : "Sí, restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
