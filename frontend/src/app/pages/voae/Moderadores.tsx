import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ShieldCheck, UserPlus, Pencil, UserX, AlertTriangle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

interface Moderador {
  id: string;
  nombre: string;
  email: string;
  permisos: string[];
  activo: boolean;
  motivo_desactivacion?: string;
  created_at: string;
}

const PERMISOS_MODERADOR = [
  "APROBAR_EVENTOS",
  "VALIDAR_ASISTENCIAS",
  "GESTIONAR_FEED",
  "VER_ANALITICA",
];

const PERMISO_LABELS: Record<string, string> = {
  APROBAR_EVENTOS: "Aprobar eventos",
  VALIDAR_ASISTENCIAS: "Validar asistencias",
  GESTIONAR_FEED: "Gestionar feed",
  VER_ANALITICA: "Revisar analíticas",
};

const MOCK_MODERADORES: Moderador[] = [
  { id: "m1", nombre: "Dr. Carlos Paz", email: "cpaz@unah.edu.hn", permisos: ["APROBAR_EVENTOS", "VALIDAR_ASISTENCIAS"], activo: true, created_at: "2026-01-15" },
  { id: "m2", nombre: "Lic. Ana Reyes", email: "areyes@unah.edu.hn", permisos: ["GESTIONAR_FEED", "VER_ANALITICA"], activo: true, created_at: "2026-02-01" },
  { id: "m3", nombre: "Ing. Roberto Sosa", email: "rsosa@unah.edu.hn", permisos: ["APROBAR_EVENTOS"], activo: false, motivo_desactivacion: "Cambio de funciones en marzo 2026.", created_at: "2025-09-10" },
  { id: "m4", nombre: "MSc. Diana Fuentes", email: "dfuentes@unah.edu.hn", permisos: ["APROBAR_EVENTOS", "VALIDAR_ASISTENCIAS", "GESTIONAR_FEED", "VER_ANALITICA"], activo: true, created_at: "2026-03-05" },
];

export function Moderadores() {
  const [moderadores, setModeradores] = useState<Moderador[]>(MOCK_MODERADORES);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editPermisosModerador, setEditPermisosModerador] = useState<Moderador | null>(null);
  const [editPermisosSelected, setEditPermisosSelected] = useState<string[]>([]);

  const [desactivarModerador, setDesactivarModerador] = useState<Moderador | null>(null);
  const [desactivarMotivo, setDesactivarMotivo] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);

  const openEditPermisos = (m: Moderador) => {
    setEditPermisosModerador(m);
    setEditPermisosSelected([...m.permisos]);
  };

  const savePermisos = () => {
    if (!editPermisosModerador) return;
    setModeradores((prev) =>
      prev.map((m) =>
        m.id === editPermisosModerador.id ? { ...m, permisos: [...editPermisosSelected] } : m
      )
    );
    toast.success("Permisos actualizados", {
      description: "Los permisos del moderador han sido modificados con éxito.",
    });
    setEditPermisosModerador(null);
  };

  const confirmDesactivar = () => {
    if (!desactivarModerador) return;
    setModeradores((prev) =>
      prev.map((m) =>
        m.id === desactivarModerador.id
          ? { ...m, activo: false, motivo_desactivacion: desactivarMotivo }
          : m
      )
    );
    toast.success("Moderador desactivado", {
      description: `${desactivarModerador.nombre} ha sido desactivado.`,
    });
    setDesactivarModerador(null);
    setDesactivarMotivo("");
  };

  const handleAddModerador = () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    const nuevo: Moderador = {
      id: `m-${Date.now()}`,
      nombre: newName.trim(),
      email: newEmail.trim(),
      permisos: newPerms,
      activo: true,
      created_at: new Date().toISOString(),
    };
    setModeradores((prev) => [...prev, nuevo]);
    toast.success("Moderador agregado correctamente");
    setDialogOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPerms([]);
  };

  const togglePermiso = (perm: string) => {
    setEditPermisosSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleNewPermiso = (perm: string) => {
    setNewPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
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
      
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#003366]">Gestión de Moderadores</h1>
          <p className="text-sm text-muted-foreground font-medium">Asigna y gestiona permisos de moderadores del VOAE.</p>
        </div>
        <Button
          className="text-white gap-1.5"
          style={{ backgroundColor: "#004B87" }}
          onClick={() => setDialogOpen(true)}
        >
          <UserPlus className="size-4" /> Agregar Moderador
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f1f5f9]">
              <TableHead className="text-[#003366] font-bold">Moderador</TableHead>
              <TableHead className="text-[#003366] font-bold">Email</TableHead>
              <TableHead className="text-[#003366] font-bold">Permisos</TableHead>
              <TableHead className="text-[#003366] font-bold">Estado</TableHead>
              <TableHead className="text-[#003366] font-bold">Fecha Asignación</TableHead>
              <TableHead className="text-[#003366] font-bold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moderadores.map((m) => (
              <TableRow
                key={m.id}
                className="even:bg-slate-50/50 hover:bg-slate-100/50"
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-7 rounded-full grid place-items-center text-[10px] font-semibold shrink-0 bg-[#004B87] text-white"
                    >
                      {m.nombre
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-slate-800">{m.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-700">{m.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {m.permisos.map((p) => (
                      <span
                        key={p}
                        className="inline-block text-[10px] px-2 py-0.5 rounded font-medium bg-[#f1f5f9] text-[#004B87]"
                      >
                        {PERMISO_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {m.activo ? (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-50 border border-green-200 text-green-700"
                    >
                      Activo
                    </span>
                  ) : (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 border border-red-200 text-red-700 cursor-help"
                      title={m.motivo_desactivacion}
                    >
                      Inactivo
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-600">{m.created_at.slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1.5 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs text-[#004B87] border-[#004B87] hover:bg-[#004B87]/5"
                      onClick={() => openEditPermisos(m)}
                    >
                      <Pencil className="size-3" /> Permisos
                    </Button>
                    {m.activo && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setDesactivarModerador(m);
                          setDesactivarMotivo("");
                        }}
                      >
                        <UserX className="size-3" /> Desactivar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Moderador Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#003366]">Agregar nuevo moderador</DialogTitle>
            <DialogDescription>Asigna permisos VOAE a un nuevo docente o moderador institucional.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Nombre Completo</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Lic. Ana Reyes"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Correo Institucional</label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="correo@unah.edu.hn"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Permisos asignados</label>
              <div className="space-y-2">
                {PERMISOS_MODERADOR.map((perm) => (
                  <label key={perm} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={newPerms.includes(perm)}
                      onCheckedChange={() => toggleNewPermiso(perm)}
                    />
                    <span className="text-sm text-slate-800">{PERMISO_LABELS[perm]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddModerador} style={{ backgroundColor: "#004B87" }}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permisos Dialog */}
      <Dialog
        open={!!editPermisosModerador}
        onOpenChange={(v) => !v && setEditPermisosModerador(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#003366]">
              <ShieldCheck className="size-5" /> Editar permisos
            </DialogTitle>
            <DialogDescription>
              Modifica los permisos asignados a {editPermisosModerador?.nombre}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {PERMISOS_MODERADOR.map((perm) => (
              <label key={perm} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={editPermisosSelected.includes(perm)}
                  onCheckedChange={() => togglePermiso(perm)}
                />
                <span className="text-sm text-slate-800">{PERMISO_LABELS[perm]}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPermisosModerador(null)}>
              Cancelar
            </Button>
            <Button onClick={savePermisos} style={{ backgroundColor: "#004B87" }}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desactivar Dialog */}
      <Dialog
        open={!!desactivarModerador}
        onOpenChange={(v) => !v && setDesactivarModerador(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" /> Desactivar moderador
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas desactivar a {desactivarModerador?.nombre}? Podrás reactivarlo en el futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="text-xs font-semibold text-slate-700">Especifica el motivo de la desactivación</label>
            <Input
              value={desactivarMotivo}
              onChange={(e) => setDesactivarMotivo(e.target.value)}
              placeholder="Ej. Fin de período, cambio de área..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesactivarModerador(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDesactivar}>
              Confirmar Desactivación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
