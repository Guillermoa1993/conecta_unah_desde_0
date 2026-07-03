import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, UserPlus, Pencil, UserX, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { MODERADORES, PERMISOS_MODERADOR } from "@/lib/mock-data";
import type { Moderador } from "@/lib/mock-data";
import { toast } from "sonner";

const PERMISO_LABELS: Record<string, string> = {
  APROBAR_EVENTOS: "Aprobar eventos",
  VALIDAR_ASISTENCIAS: "Validar asistencias",
  GESTIONAR_FEED: "Gestionar feed",
  VER_ANALITICA: "REVISAR_CONSTANCIAS",
};

export const Route = createFileRoute("/_app/voae/moderadores")({
  component: VoaeModeradores,
});

function VoaeModeradores() {
  const [moderadores, setModeradores] = useState(MODERADORES);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editPermisosModerador, setEditPermisosModerador] = useState<Moderador | null>(null);
  const [editPermisosSelected, setEditPermisosSelected] = useState<string[]>([]);

  const [desactivarModerador, setDesactivarModerador] = useState<Moderador | null>(null);
  const [desactivarMotivo, setDesactivarMotivo] = useState("");

  const openEditPermisos = (m: Moderador) => {
    setEditPermisosModerador(m);
    setEditPermisosSelected([...m.permisos]);
  };

  const savePermisos = () => {
    if (!editPermisosModerador) return;
    setModeradores((prev) =>
      prev.map((m) =>
        m.id === editPermisosModerador.id ? { ...m, permisos: [...editPermisosSelected] } : m,
      ),
    );
    toast.success("Permisos actualizados", {
      description: "Los permisos del moderador han sido modificados.",
    });
    setEditPermisosModerador(null);
  };

  const confirmDesactivar = () => {
    if (!desactivarModerador) return;
    setModeradores((prev) =>
      prev.map((m) =>
        m.id === desactivarModerador.id
          ? { ...m, activo: false, motivo_desactivacion: desactivarMotivo }
          : m,
      ),
    );
    toast.success("Moderador desactivado", {
      description: `${desactivarModerador.nombre} ha sido desactivado.`,
    });
    setDesactivarModerador(null);
    setDesactivarMotivo("");
  };

  const togglePermiso = (perm: string) => {
    setEditPermisosSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      <PageHeader
        title="Gestión de moderadores"
        description="Asigna y gestiona permisos de moderadores VOAE"
        actions={
          <Button
            className="text-white gap-1.5"
            style={{ backgroundColor: "var(--puma-blue)" }}
            onClick={() => setDialogOpen(true)}
          >
            <UserPlus className="size-4" /> Agregar moderador
          </Button>
        }
      />

      <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f1f5f9]" style={{ height: 48 }}>
              <TableHead className="text-[var(--puma-dark)] font-bold">Moderador</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold">Email</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold">Permisos</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold">Estado</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold">Fecha asignación</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moderadores.map((m, idx) => (
              <TableRow
                key={m.id}
                className={(idx % 2 === 0 ? "bg-[#f8f9fa]" : "bg-white") + " hover:bg-[#eff6ff]"}
                style={{ height: 48 }}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-7 rounded-full grid place-items-center text-[10px] font-semibold shrink-0"
                      style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
                    >
                      {m.nombre
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{m.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{m.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {m.permisos.map((p) => (
                      <span
                        key={p}
                        className="inline-block text-[11px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
                      >
                        {PERMISO_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {m.activo ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                    >
                      Activo
                    </span>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium cursor-default"
                            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                          >
                            Inactivo
                          </span>
                        </TooltipTrigger>
                        {m.motivo_desactivacion && (
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            {m.motivo_desactivacion}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell className="text-sm">{m.created_at.slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1.5 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
                      onClick={() => openEditPermisos(m)}
                    >
                      <Pencil className="size-3" /> Editar permisos
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      style={{ borderColor: "#ef4444", color: "#ef4444" }}
                      onClick={() => {
                        setDesactivarModerador(m);
                        setDesactivarMotivo("");
                      }}
                    >
                      <UserX className="size-3" /> Desactivar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddModeradorDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <Dialog
        open={!!editPermisosModerador}
        onOpenChange={(v) => !v && setEditPermisosModerador(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" style={{ color: "var(--puma-blue)" }} /> Editar
              permisos
            </DialogTitle>
            <DialogDescription>
              Modifica los permisos de {editPermisosModerador?.nombre}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {PERMISOS_MODERADOR.map((perm) => (
              <label key={perm} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={editPermisosSelected.includes(perm)}
                  onCheckedChange={() => togglePermiso(perm)}
                />
                <span className="text-sm">{PERMISO_LABELS[perm]}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermisosModerador(null)}>
              Cancelar
            </Button>
            <Button
              style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
              onClick={savePermisos}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!desactivarModerador} onOpenChange={(v) => !v && setDesactivarModerador(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5" style={{ color: "#ef4444" }} /> Desactivar moderador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Estás a punto de desactivar a {desactivarModerador?.nombre}.
            </p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Motivo de la desactivación</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ej: Cambio de funciones, finalización de período, etc."
                value={desactivarMotivo}
                onChange={(e) => setDesactivarMotivo(e.target.value)}
                minLength={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesactivarModerador(null)}>
              Cancelar
            </Button>
            <Button
              style={{ backgroundColor: "#ef4444", color: "white" }}
              disabled={desactivarMotivo.trim().length < 10}
              onClick={confirmDesactivar}
            >
              Confirmar desactivación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddModeradorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([]);

  const togglePermiso = (perm: string) => {
    setSelectedPermisos((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" style={{ color: "var(--puma-blue)" }} /> Agregar
            moderador
          </DialogTitle>
          <DialogDescription>Busca un usuario y asígnale permisos de moderación.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Usuario</label>
            <Input placeholder="Buscar usuario por nombre o correo…" className="h-11" />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3">Permisos</h4>
            <div className="space-y-3">
              {PERMISOS_MODERADOR.map((perm) => (
                <label key={perm} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={selectedPermisos.includes(perm)}
                    onCheckedChange={() => togglePermiso(perm)}
                  />
                  <span className="text-sm">{PERMISO_LABELS[perm]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
            onClick={() => {
              toast.success("Moderador asignado", {
                description: "Los permisos han sido configurados.",
              });
              onOpenChange(false);
            }}
          >
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
