import { useState } from "react";
import {
  Archive, Clock3, Database, Download, RefreshCcw, ShieldCheck, Upload,
  HardDrive, CheckCircle2, AlertTriangle, Loader2, CalendarClock,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "../../components/ui/alert-dialog";
import { toast } from "sonner";

type BackupEntry = {
  id: string;
  name: string;
  date: string;
  hour: string;
  size: string;
  type: "Completo" | "Incremental" | "Restauración";
  status: "Completado" | "Exitoso";
};

const initialHistory: BackupEntry[] = [
  { id: "bk-3", name: "Respaldo completo",     date: "06/07/2026", hour: "02:30", size: "1.8 GB", type: "Completo",      status: "Completado" },
  { id: "bk-2", name: "Respaldo incremental",  date: "05/07/2026", hour: "23:10", size: "240 MB", type: "Incremental",   status: "Completado" },
  { id: "bk-1", name: "Restauración parcial",  date: "04/07/2026", hour: "20:45", size: "—",      type: "Restauración",  status: "Exitoso" },
];

// Simula una tarea asíncrona con progreso (crear respaldo, sincronizar, verificar)
function runWithProgress(
  onProgress: (value: number) => void,
  onDone: () => void,
  durationMs = 2200,
) {
  const steps = 20;
  const stepTime = durationMs / steps;
  let current = 0;
  const interval = setInterval(() => {
    current += 1;
    onProgress(Math.min(100, Math.round((current / steps) * 100)));
    if (current >= steps) {
      clearInterval(interval);
      onDone();
    }
  }, stepTime);
}

export function BackupRestore() {
  const [history, setHistory] = useState<BackupEntry[]>(initialHistory);

  const [creating, setCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState(0);

  const [syncing, setSyncing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastVerification, setLastVerification] = useState<"ok" | null>("ok");

  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const storageUsedGb = 6.4;
  const storageTotalGb = 10;
  const storagePercent = Math.round((storageUsedGb / storageTotalGb) * 100);

  const handleCreateBackup = () => {
    if (creating) return;
    setCreating(true);
    setCreateProgress(0);
    runWithProgress(setCreateProgress, () => {
      const now = new Date();
      const newEntry: BackupEntry = {
        id: `bk-${Date.now()}`,
        name: "Respaldo completo",
        date: now.toLocaleDateString("es-HN"),
        hour: now.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" }),
        size: "1.9 GB",
        type: "Completo",
        status: "Completado",
      };
      setHistory((prev) => [newEntry, ...prev]);
      setCreating(false);
      toast.success("Respaldo creado exitosamente");
    });
  };

  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    runWithProgress(() => {}, () => {
      setSyncing(false);
      toast.success("Repositorio sincronizado correctamente");
    }, 1400);
  };

  const handleVerify = () => {
    if (verifying) return;
    setVerifying(true);
    setLastVerification(null);
    runWithProgress(() => {}, () => {
      setVerifying(false);
      setLastVerification("ok");
      toast.success("Integridad verificada: sin inconsistencias");
    }, 1600);
  };

  const askRestore = (entry: BackupEntry) => setRestoreTarget(entry);

  const confirmRestore = () => {
    if (!restoreTarget) return;
    const target = restoreTarget;
    setRestoreTarget(null);
    setRestoringId(target.id);
    runWithProgress(() => {}, () => {
      setRestoringId(null);
      toast.success(`Sistema restaurado desde "${target.name} · ${target.date}"`);
    }, 2000);
  };

  const handleDownload = (entry: BackupEntry) => {
    toast.success(`Descargando ${entry.name} · ${entry.date}`);
  };

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
                Gestiona copias de seguridad y recuperaciones del sistema institucional.
              </p>
            </div>
          </div>
          <Badge className="bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] w-fit">
            Protección de datos
          </Badge>
        </div>

        {/* Mini-métricas dentro del encabezado */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Último respaldo</p>
            <p className="text-sm font-bold">{history[0]?.date ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Próximo respaldo</p>
            <p className="text-sm font-bold">En 6 horas</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Retención</p>
            <p className="text-sm font-bold">30 días</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-[11px] text-slate-200">Respaldos guardados</p>
            <p className="text-sm font-bold">{history.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* ── Acciones rápidas ───────────────────────────────── */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#003366]">Acciones rápidas</CardTitle>
            <CardDescription>Herramientas principales para proteger y recuperar información crítica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className="justify-start bg-[#004B87] hover:bg-[#003366] text-white"
                onClick={handleCreateBackup}
                disabled={creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {creating ? `Creando… ${createProgress}%` : "Crear respaldo"}
              </Button>

              <Button
                variant="outline"
                className="justify-start border-[#004B87]/30 text-[#004B87] hover:bg-[#004B87]/10"
                onClick={() => history[0] && askRestore(history[0])}
                disabled={history.length === 0 || restoringId !== null}
              >
                <Upload className="h-4 w-4" />
                Restaurar última copia
              </Button>

              <Button
                variant="outline"
                className="justify-start border-[#FFD100]/60 text-[#003366] hover:bg-[#FFD100]/15"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                {syncing ? "Sincronizando…" : "Sincronizar repositorio"}
              </Button>

              <Button
                variant="outline"
                className="justify-start border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {verifying ? "Verificando…" : "Verificar integridad"}
              </Button>
            </div>

            {creating && (
              <div className="space-y-1.5">
                <Progress value={createProgress} className="h-2" />
                <p className="text-xs text-slate-500">Comprimiendo y cifrando datos institucionales…</p>
              </div>
            )}

            {lastVerification === "ok" && !verifying && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Última verificación: sin inconsistencias encontradas
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Estado del servicio + almacenamiento ───────────── */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#003366]">Estado del servicio</CardTitle>
            <CardDescription>Última verificación de los procesos de respaldo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Backups automáticos</p>
                <p className="text-xs text-emerald-600">Habilitados y ejecutándose correctamente</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarClock className="h-4 w-4 text-[#004B87]" />
              Próximo respaldo en 6 horas
            </div>

            <div className="space-y-2 rounded-lg border border-slate-150 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#003366]">
                  <HardDrive className="h-4 w-4 text-[#004B87]" />
                  Almacenamiento
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {storageUsedGb} GB / {storageTotalGb} GB
                </span>
              </div>
              <Progress value={storagePercent} className="h-2" />
              <p className="text-[11px] text-slate-400">{storagePercent}% del espacio asignado en uso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Historial ──────────────────────────────────────── */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#003366]">Historial reciente</CardTitle>
          <CardDescription>Registros de respaldos y restauraciones ejecutados en los últimos días.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-150 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Archive className="mt-0.5 h-4 w-4 text-[#004B87]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#003366]">{item.name}</p>
                    <Badge variant="outline" className="border-[#004B87]/20 text-[10px] font-bold uppercase text-[#004B87]">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    Tamaño: {item.size} · {item.date} {item.hour}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-fit border-emerald-200 text-emerald-700">
                  {item.status}
                </Badge>

                {item.size !== "—" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#004B87] hover:bg-[#004B87]/10"
                    onClick={() => handleDownload(item)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-amber-600 hover:bg-amber-50"
                  onClick={() => askRestore(item)}
                  disabled={restoringId !== null}
                >
                  {restoringId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Confirmación antes de restaurar (acción destructiva) ── */}
      <AlertDialog open={restoreTarget !== null} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#003366]">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ¿Restaurar este respaldo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás por restaurar <strong>{restoreTarget?.name}</strong> del{" "}
              <strong>{restoreTarget?.date} {restoreTarget?.hour}</strong>. Los datos actuales del sistema
              serán reemplazados por los de esta copia. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={confirmRestore}
            >
              Sí, restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
