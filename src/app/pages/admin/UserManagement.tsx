import { useState, type FormEvent } from "react";
import {
  UserPlus,
  Edit,
  Search,
  Ban,
  UserCheck,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Combobox } from "../../components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";

/* ======================================================================= */
/*  Catálogos de referencia (Roles, Módulos y Permisos)                    */
/*  En producción estos vendrían de los módulos M2 (Roles) y M3 (Permisos) */
/*  vía API; aquí se definen localmente para alimentar los combobox y la   */
/*  matriz de "nivel de detalle" de permisos.                              */
/* ======================================================================= */

type Accion = "Leer" | "Crear" | "Editar" | "Eliminar";
const ACCIONES: Accion[] = ["Leer", "Crear", "Editar", "Eliminar"];

const MODULOS_DISPONIBLES = [
  "Usuarios",
  "Roles",
  "Permisos",
  "Eventos",
  "Bitácora",
  "Reportes",
  "Mantenimiento",
];

const ROLES_DISPONIBLES = [
  { id: "1", nombre: "Administrador" },
  { id: "2", nombre: "Estudiante" },
  { id: "3", nombre: "Empleado" },
  { id: "4", nombre: "VOAE" },
];

const PERMISOS_DISPONIBLES = [
  { id: "1", nombre: "leer_roles", modulo: "Roles" },
  { id: "2", nombre: "crear_roles", modulo: "Roles" },
  { id: "3", nombre: "modificar_permisos", modulo: "Permisos" },
  { id: "4", nombre: "gestionar_usuarios", modulo: "Usuarios" },
  { id: "5", nombre: "crear_eventos", modulo: "Eventos" },
  { id: "6", nombre: "aprobar_eventos", modulo: "Eventos" },
  { id: "7", nombre: "ver_bitacora", modulo: "Bitácora" },
];

/** Nivel de detalle: qué ACCIONES otorga cada rol, agrupadas por MÓDULO. */
const PERMISOS_POR_ROL: Record<string, Record<string, Accion[]>> = {
  "1": {
    Usuarios: ["Leer", "Crear", "Editar", "Eliminar"],
    Roles: ["Leer", "Crear", "Editar", "Eliminar"],
    Permisos: ["Leer", "Crear", "Editar", "Eliminar"],
    Eventos: ["Leer", "Crear", "Editar", "Eliminar"],
    "Bitácora": ["Leer"],
    Reportes: ["Leer", "Crear"],
    Mantenimiento: ["Leer", "Crear", "Editar", "Eliminar"],
  },
  "2": {
    Eventos: ["Leer"],
    Reportes: ["Leer"],
  },
  "3": {
    Eventos: ["Leer", "Crear", "Editar"],
    Reportes: ["Leer", "Crear"],
    "Bitácora": ["Leer"],
  },
  "4": {
    Eventos: ["Leer", "Editar"],
    Reportes: ["Leer", "Crear"],
  },
};

function getRoleName(id: string) {
  return ROLES_DISPONIBLES.find((r) => r.id === id)?.nombre ?? id;
}

function getPermisoLabel(id: string) {
  const p = PERMISOS_DISPONIBLES.find((p) => p.id === id);
  return p ? `${p.nombre} (${p.modulo})` : id;
}

/** Une las acciones otorgadas por todos los roles seleccionados, por módulo. */
function calcularDetallePermisos(roleIds: string[]): Record<string, Set<Accion>> {
  const detalle: Record<string, Set<Accion>> = {};
  roleIds.forEach((rid) => {
    const porModulo = PERMISOS_POR_ROL[rid] ?? {};
    Object.entries(porModulo).forEach(([modulo, acciones]) => {
      if (!detalle[modulo]) detalle[modulo] = new Set();
      acciones.forEach((a) => detalle[modulo].add(a));
    });
  });
  return detalle;
}

function roleBadgeColor(id: string) {
  switch (id) {
    case "1":
      return "bg-red-500";       // Administrador
    case "3":
      return "bg-[#004B87]";     // Tutor / Empleado
    case "4":
      return "bg-purple-500";    // VOAE
    default:
      return "bg-green-500";    // Estudiante
  }
}

/* ======================================================================= */
/*  Modelo de datos del usuario                                             */
/*  -> SIN campo de contraseña y SIN campo de usuario/username:             */
/*     el inicio de sesión institucional se gestiona fuera de este módulo. */
/*  -> "estado" reemplaza el borrado físico por inhabilitación (soft delete)*/
/* ======================================================================= */

type EstadoUsuario = "activo" | "inhabilitado";

interface UsuarioRow {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  roles: string[];              // ids de ROLES_DISPONIBLES (relación N:M)
  modulos: string[];            // módulos del sistema a los que tiene acceso
  permisosDirectos: string[];   // permisos puntuales además de los del rol
  estado: EstadoUsuario;
  motivoInhabilitacion?: string;
}

const initialUsers: UsuarioRow[] = [
  {
    id: "1", nombre: "Ana", apellido: "García", email: "ana.garcia@unah.hn",
    telefono: "9988-7766", roles: ["2"], modulos: ["Eventos"],
    permisosDirectos: [], estado: "activo",
  },
  {
    id: "2", nombre: "Juan", apellido: "Pérez", email: "juan.perez@unah.hn",
    telefono: "9911-2233", roles: ["3"], modulos: ["Eventos", "Reportes"],
    permisosDirectos: ["6"], estado: "activo",
  },
  {
    id: "3", nombre: "Carlos", apellido: "López", email: "carlos.lopez@unah.hn",
    telefono: "9955-4433", roles: ["2"], modulos: ["Eventos"],
    permisosDirectos: [], estado: "activo",
  },
  {
    id: "4", nombre: "María", apellido: "González", email: "maria.gonzalez@unah.hn",
    telefono: "9922-1100", roles: ["4"], modulos: ["Eventos", "Reportes"],
    permisosDirectos: [], estado: "inhabilitado",
    motivoInhabilitacion: "Egresó del cargo VOAE en mayo 2026.",
  },
  {
    id: "5", nombre: "Admin", apellido: "Sistema", email: "admin@unah.hn",
    telefono: "9900-0000", roles: ["1"], modulos: MODULOS_DISPONIBLES,
    permisosDirectos: [], estado: "activo",
  },
];

const emptyForm: Omit<UsuarioRow, "id"> = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  roles: [],
  modulos: [],
  permisosDirectos: [],
  estado: "activo",
};

/* ======================================================================= */
/*  Componente principal                                                    */
/* ======================================================================= */

export function UserManagement() {
  const [users, setUsers] = useState<UsuarioRow[]>(initialUsers);
  const [search, setSearch] = useState("");

  // Dialog: crear / editar usuario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<UsuarioRow, "id">>(emptyForm);

  // Dialog: detalle de permisos (solo lectura, desde la tabla)
  const [detailUser, setDetailUser] = useState<UsuarioRow | null>(null);

  // AlertDialog: confirmación de inhabilitar (soft delete)
  const [userToDisable, setUserToDisable] = useState<UsuarioRow | null>(null);
  const [motivo, setMotivo] = useState("");

  const filteredUsers = users.filter((u) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      u.nombre.toLowerCase().includes(term) ||
      u.apellido.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function handleOpenEdit(user: UsuarioRow) {
    setEditingId(user.id);
    setForm({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      roles: user.roles,
      modulos: user.modulos,
      permisosDirectos: user.permisosDirectos,
      estado: user.estado,
      motivoInhabilitacion: user.motivoInhabilitacion,
    });
    setIsFormOpen(true);
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      toast.error("Nombre, apellido y correo son obligatorios");
      return;
    }

    if (editingId) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingId ? { ...u, ...form } : u)),
      );
      toast.success("Usuario actualizado correctamente");
    } else {
      const newId = String(Math.max(0, ...users.map((u) => Number(u.id))) + 1);
      setUsers((prev) => [...prev, { id: newId, ...form }]);
      toast.success("Usuario creado correctamente");
    }
    setIsFormOpen(false);
  }

  function handleConfirmDisable() {
    if (!userToDisable) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userToDisable.id
          ? { ...u, estado: "inhabilitado", motivoInhabilitacion: motivo }
          : u,
      ),
    );
    toast.success(`Usuario ${userToDisable.nombre} inhabilitado`);
    setUserToDisable(null);
    setMotivo("");
  }

  function handleEnable(user: UsuarioRow) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, estado: "activo", motivoInhabilitacion: undefined }
          : u,
      ),
    );
    toast.success(`Usuario ${user.nombre} habilitado nuevamente`);
  }

  const formDetalle = calcularDetallePermisos(form.roles);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra usuarios y permisos del sistema
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#004B87] hover:bg-[#003366]">
          <UserPlus className="mr-2 h-5 w-5" />
          Agregar Usuario
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todos los Usuarios</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead className="text-center">Rol(es)</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.nombre} {user.apellido}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {user.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">Sin rol</span>
                        )}
                        {user.roles.map((rid) => (
                          <Badge key={rid} className={roleBadgeColor(rid)}>
                            {getRoleName(rid)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.estado === "activo" ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-300 text-gray-700">
                          Inhabilitado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Ver detalle de permisos"
                          onClick={() => setDetailUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Editar usuario"
                          onClick={() => handleOpenEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.estado === "activo" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Inhabilitar usuario"
                            onClick={() => setUserToDisable(user)}
                          >
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Habilitar usuario"
                            onClick={() => handleEnable(user)}
                          >
                            <UserCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================
          Dialog: Crear / Editar usuario
          (sin campos de contraseña ni de usuario/username)
      ================================================================== */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Usuario" : "Agregar Usuario"}</DialogTitle>
            <DialogDescription>
              Los usuarios inician sesión con su correo institucional; este módulo no gestiona
              credenciales de acceso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Datos Generales</TabsTrigger>
                <TabsTrigger value="permisos">Roles y Permisos</TabsTrigger>
              </TabsList>

              {/* ---------------- Tab: Datos Generales ---------------- */}
              <TabsContent value="general" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      required
                      value={form.apellido}
                      onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    />
                  </div>

                  {editingId && (
                    <div className="space-y-1.5">
                      <Label>Estado actual</Label>
                      <div>
                        {form.estado === "activo" ? (
                          <Badge className="bg-green-500">Activo</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-300 text-gray-700">
                            Inhabilitado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Usa los botones de la tabla para inhabilitar o habilitar a este usuario.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ---------------- Tab: Roles y Permisos ---------------- */}
              <TabsContent value="permisos" className="space-y-5 pt-4">
                <div className="space-y-1.5">
                  <Label>Roles asignados</Label>
                  <Combobox
                    multiple
                    options={ROLES_DISPONIBLES.map((r) => ({ value: r.id, label: r.nombre }))}
                    value={form.roles}
                    onChange={(v) => setForm({ ...form, roles: v })}
                    placeholder="Seleccionar rol(es)..."
                    searchPlaceholder="Buscar rol..."
                    emptyText="No se encontraron roles."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Módulos con acceso</Label>
                  <Combobox
                    multiple
                    options={MODULOS_DISPONIBLES.map((m) => ({ value: m, label: m }))}
                    value={form.modulos}
                    onChange={(v) => setForm({ ...form, modulos: v })}
                    placeholder="Seleccionar módulo(s)..."
                    searchPlaceholder="Buscar módulo..."
                    emptyText="No se encontraron módulos."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Permisos directos adicionales</Label>
                  <Combobox
                    multiple
                    options={PERMISOS_DISPONIBLES.map((p) => ({
                      value: p.id,
                      label: p.nombre,
                      description: p.modulo,
                    }))}
                    value={form.permisosDirectos}
                    onChange={(v) => setForm({ ...form, permisosDirectos: v })}
                    placeholder="Seleccionar permiso(s)..."
                    searchPlaceholder="Buscar permiso..."
                    emptyText="No se encontraron permisos."
                  />
                  <p className="text-xs text-muted-foreground">
                    Permisos puntuales otorgados a este usuario además de los que ya incluye su rol.
                  </p>
                </div>

                {/* Nivel de detalle: matriz de permisos efectivos por módulo */}
                <div className="rounded-md border p-3 bg-muted/30">
                  <p className="text-xs font-semibold text-[#004B87] mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Detalle de permisos efectivos (según rol seleccionado)
                  </p>
                  {Object.keys(formDetalle).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Selecciona al menos un rol para ver el detalle de permisos.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(formDetalle).map(([modulo, acciones]) => (
                        <div key={modulo} className="flex items-center gap-2 text-xs">
                          <span className="font-medium w-28 shrink-0 text-[#003366]">
                            {modulo}
                          </span>
                          <div className="flex gap-1.5 flex-wrap">
                            {ACCIONES.map((accion) => (
                              <span
                                key={accion}
                                className={
                                  acciones.has(accion)
                                    ? "px-2 py-0.5 rounded-md bg-[#004B87] text-white text-[10px] font-semibold"
                                    : "px-2 py-0.5 rounded-md bg-gray-100 text-gray-400 text-[10px]"
                                }
                              >
                                {accion}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#004B87] hover:bg-[#003366]">
                {editingId ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =================================================================
          Dialog: Detalle de permisos (solo lectura, desde la tabla)
      ================================================================== */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Permisos</DialogTitle>
            <DialogDescription>
              {detailUser && `${detailUser.nombre} ${detailUser.apellido} — ${detailUser.email}`}
            </DialogDescription>
          </DialogHeader>

          {detailUser && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailUser.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sin rol asignado</span>
                  )}
                  {detailUser.roles.map((rid) => (
                    <Badge key={rid} className={roleBadgeColor(rid)}>
                      {getRoleName(rid)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Permisos efectivos por módulo
                </p>
                <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                  {Object.entries(calcularDetallePermisos(detailUser.roles)).map(
                    ([modulo, acciones]) => (
                      <div key={modulo} className="flex items-center gap-2 text-xs">
                        <span className="font-medium w-28 shrink-0 text-[#003366]">
                          {modulo}
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {ACCIONES.map((accion) => (
                            <span
                              key={accion}
                              className={
                                acciones.has(accion)
                                  ? "px-2 py-0.5 rounded-md bg-[#004B87] text-white text-[10px] font-semibold"
                                  : "px-2 py-0.5 rounded-md bg-gray-100 text-gray-400 text-[10px]"
                              }
                            >
                              {accion}
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {detailUser.permisosDirectos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Permisos directos adicionales
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailUser.permisosDirectos.map((pid) => (
                      <Badge key={pid} variant="outline">
                        {getPermisoLabel(pid)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailUser(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =================================================================
          AlertDialog: Inhabilitar usuario (soft delete con motivo)
      ================================================================== */}
      <AlertDialog
        open={!!userToDisable}
        onOpenChange={(open) => !open && setUserToDisable(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Inhabilitar a {userToDisable?.nombre}?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario no podrá iniciar sesión mientras esté inhabilitado, pero su información
              y su historial se conservarán en el sistema. Podrás habilitarlo de nuevo en
              cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="motivo">Motivo de inhabilitación</Label>
            <Textarea
              id="motivo"
              placeholder="Ej. Egresó de la institución, solicitud administrativa..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMotivo("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleConfirmDisable}
            >
              Inhabilitar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
