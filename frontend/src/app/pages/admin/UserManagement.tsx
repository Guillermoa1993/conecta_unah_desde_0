import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  UserPlus,
  Edit,
  Search,
  Ban,
  UserCheck,
  Eye,
  ShieldCheck,
  Loader2,
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
import { usuariosSeguridadService } from "../../../services/usuariosSeguridad.service";
import { rolesSeguridadService } from "../../../services/rolesSeguridad.service";
import { permisosSeguridadService } from "../../../services/permisosSeguridad.service";
import type { UsuarioSeguridad, RolSeguridad, PermisoSeguridad } from "../../../types";

/* ======================================================================= */
/*  Módulo 4 · Seguridad — Gestión de Usuarios                              */
/*  Roles y Permisos ya NO son mocks locales: se consultan en vivo desde   */
/*  /api/seguridad/roles y /api/seguridad/permisos (endpoints públicos     */
/*  para cualquier usuario autenticado, así alimentan estos combobox).    */
/*  Los datos de "Todos los Usuarios" vienen de /api/seguridad/usuarios.  */
/* ======================================================================= */

function getRoleName(roles: RolSeguridad[], id: string) {
  return roles.find((r) => String(r.id_rol) === id)?.nombre_rol ?? id;
}

function getPermisoLabel(permisos: PermisoSeguridad[], id: string) {
  const p = permisos.find((p) => String(p.id_permiso) === id);
  return p ? `${p.nombre_permiso} (${p.modulo})` : id;
}

/** Colores conocidos por código de rol; cualquier rol nuevo cae en el gris neutro. */
function roleBadgeColor(codigoRol: string) {
  switch (codigoRol) {
    case "admin":
      return "bg-red-500";
    case "tutor":
      return "bg-[#004B87]";
    case "moderador":
      return "bg-purple-500";
    case "estudiante":
      return "bg-green-500";
    default:
      return "bg-slate-500";
  }
}

/**
 * Agrupa los permisos EFECTIVOS (de todos los roles seleccionados) por módulo.
 * A diferencia del mock anterior (una grilla fija Leer/Crear/Editar/Eliminar),
 * aquí se muestra el nombre real de cada permiso: el catálogo de la BD es más
 * granular (p.ej. "seguridad:ver_roles" y "seguridad:ver_permisos" son permisos
 * distintos dentro de un mismo módulo "Seguridad"), así que forzarlo a 4
 * columnas fijas perdería información. Se conserva el mismo estilo visual
 * (píldoras azules por módulo).
 */
function calcularDetallePermisos(
  rolesDisponibles: RolSeguridad[],
  roleIds: string[],
): Record<string, string[]> {
  const detalle: Record<string, Set<string>> = {};
  roleIds.forEach((rid) => {
    const rol = rolesDisponibles.find((r) => String(r.id_rol) === rid);
    rol?.permisos.forEach((p) => {
      if (!detalle[p.modulo]) detalle[p.modulo] = new Set();
      detalle[p.modulo].add(p.nombre_permiso);
    });
  });
  return Object.fromEntries(
    Object.entries(detalle).map(([modulo, nombres]) => [modulo, Array.from(nombres).sort()]),
  );
}

/* ======================================================================= */
/*  Modelo de formulario                                                    */
/*  -> SIN campo de contraseña y SIN campo de usuario/username: el inicio  */
/*     de sesión institucional se gestiona fuera de este módulo.          */
/*  -> "estado" reemplaza el borrado físico por inhabilitación (soft delete)*/
/* ======================================================================= */

interface UsuarioForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  roles: string[];             // ids como string, para el Combobox
  modulos: string[];
  permisosDirectos: string[];  // ids como string, para el Combobox
}

const emptyForm: UsuarioForm = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  roles: [],
  modulos: [],
  permisosDirectos: [],
};

/* ======================================================================= */
/*  Componente principal                                                    */
/* ======================================================================= */

export function UserManagement() {
  const [users, setUsers] = useState<UsuarioSeguridad[]>([]);
  const [roles, setRoles] = useState<RolSeguridad[]>([]);
  const [permisos, setPermisos] = useState<PermisoSeguridad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Dialog: crear / editar usuario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UsuarioForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Dialog: detalle de permisos (solo lectura, desde la tabla)
  const [detailUser, setDetailUser] = useState<UsuarioSeguridad | null>(null);

  // AlertDialog: confirmación de inhabilitar (soft delete)
  const [userToDisable, setUserToDisable] = useState<UsuarioSeguridad | null>(null);
  const [motivo, setMotivo] = useState("");

  // Módulos disponibles = módulos distintos que aparecen en el catálogo de permisos
  const modulosDisponibles = Array.from(new Set(permisos.map((p) => p.modulo))).sort();

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [usuariosData, rolesData, permisosData] = await Promise.all([
        usuariosSeguridadService.getAll(search ? { busqueda: search } : undefined),
        rolesSeguridadService.getAll(),
        permisosSeguridadService.getAll(),
      ]);
      setUsers(usuariosData);
      setRoles(rolesData);
      setPermisos(permisosData);
    } catch (err) {
      // Importante: un error de carga (backend caído, sin permiso, tabla sin
      // migrar, etc.) NUNCA debe verse igual que "no hay usuarios". Se guarda
      // el mensaje real para mostrarlo en un banner visible en la tabla.
      const message = err instanceof Error ? err.message : "No se pudo cargar la información";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(cargarTodo, 300); // debounce de la búsqueda
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function handleOpenEdit(user: UsuarioSeguridad) {
    setEditingId(user.id_usuario);
    setForm({
      nombre: user.nombre,
      apellido: user.apellido ?? "",
      email: user.correo,
      telefono: user.telefono ?? "",
      roles: user.roles.map((r) => String(r.id_rol)),
      modulos: user.modulos_acceso,
      permisosDirectos: user.permisos_directos.map((p) => String(p.id_permiso)),
    });
    setIsFormOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      toast.error("Nombre, apellido y correo son obligatorios");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // 1) Datos generales
        await usuariosSeguridadService.actualizar(editingId, {
          nombre: form.nombre,
          apellido: form.apellido,
          telefono: form.telefono || undefined,
          modulos_acceso: form.modulos,
        });

        // 2) Reconciliar roles y permisos directos contra el estado previo
        const usuarioPrevio = users.find((u) => u.id_usuario === editingId);
        const rolesPrevios = new Set(usuarioPrevio?.roles.map((r) => String(r.id_rol)) ?? []);
        const permisosPrevios = new Set(
          usuarioPrevio?.permisos_directos.map((p) => String(p.id_permiso)) ?? [],
        );

        const rolesNuevos = new Set(form.roles);
        const permisosNuevos = new Set(form.permisosDirectos);

        await Promise.all([
          ...form.roles
            .filter((rid) => !rolesPrevios.has(rid))
            .map((rid) => usuariosSeguridadService.asignarRol(editingId, Number(rid))),
          ...[...rolesPrevios]
            .filter((rid) => !rolesNuevos.has(rid))
            .map((rid) => usuariosSeguridadService.revocarRol(editingId, Number(rid))),
          ...form.permisosDirectos
            .filter((pid) => !permisosPrevios.has(pid))
            .map((pid) => usuariosSeguridadService.asignarPermiso(editingId, Number(pid))),
          ...[...permisosPrevios]
            .filter((pid) => !permisosNuevos.has(pid))
            .map((pid) => usuariosSeguridadService.revocarPermiso(editingId, Number(pid))),
        ]);

        toast.success("Usuario actualizado correctamente");
      } else {
        await usuariosSeguridadService.crear({
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.email,
          telefono: form.telefono || undefined,
          modulos_acceso: form.modulos,
          roles: form.roles.map(Number),
          permisos_directos: form.permisosDirectos.map(Number),
        });
        toast.success("Usuario creado correctamente");
      }
      setIsFormOpen(false);
      await cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDisable() {
    if (!userToDisable) return;
    try {
      await usuariosSeguridadService.inhabilitar(userToDisable.id_usuario, motivo);
      toast.success(`Usuario ${userToDisable.nombre} inhabilitado`);
      setUserToDisable(null);
      setMotivo("");
      await cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo inhabilitar al usuario");
    }
  }

  async function handleEnable(user: UsuarioSeguridad) {
    try {
      await usuariosSeguridadService.habilitar(user.id_usuario);
      toast.success(`Usuario ${user.nombre} habilitado nuevamente`);
      await cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo habilitar al usuario");
    }
  }

  const formDetalle = calcularDetallePermisos(roles, form.roles);

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
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && loadError && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-4">
                      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-4">
                        <span><strong>No se pudo cargar la informacion.</strong> {loadError}</span>
                        <Button size="sm" variant="outline" className="shrink-0 border-red-300 text-red-700 hover:bg-red-100" onClick={cargarTodo}>
                          Reintentar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !loadError && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && users.map((user) => (
                  <TableRow key={user.id_usuario}>
                    <TableCell className="font-medium">
                      {user.nombre} {user.apellido}
                    </TableCell>
                    <TableCell>{user.correo}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {user.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">Sin rol</span>
                        )}
                        {user.roles.map((r) => (
                          <Badge key={r.id_rol} className={roleBadgeColor(r.codigo_rol)}>
                            {r.nombre_rol}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.estado === 1 ? (
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
                        {user.estado === 1 ? (
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
                    disabled={!!editingId}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {editingId && (
                    <p className="text-xs text-muted-foreground">
                      El correo no se puede modificar una vez creado el usuario.
                    </p>
                  )}
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
                        {users.find((u) => u.id_usuario === editingId)?.estado === 1 ? (
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
                    options={roles.map((r) => ({ value: String(r.id_rol), label: r.nombre_rol }))}
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
                    options={modulosDisponibles.map((m) => ({ value: m, label: m }))}
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
                    options={permisos.map((p) => ({
                      value: String(p.id_permiso),
                      label: p.nombre_permiso,
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

                {/* Nivel de detalle: permisos efectivos por módulo */}
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
                      {Object.entries(formDetalle).map(([modulo, nombresPermisos]) => (
                        <div key={modulo} className="flex items-start gap-2 text-xs">
                          <span className="font-medium w-28 shrink-0 text-[#003366]">
                            {modulo}
                          </span>
                          <div className="flex gap-1.5 flex-wrap">
                            {nombresPermisos.map((nombre) => (
                              <span
                                key={nombre}
                                className="px-2 py-0.5 rounded-md bg-[#004B87] text-white text-[10px] font-semibold"
                              >
                                {nombre}
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
              <Button type="submit" className="bg-[#004B87] hover:bg-[#003366]" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              {detailUser && `${detailUser.nombre} ${detailUser.apellido ?? ""} — ${detailUser.correo}`}
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
                  {detailUser.roles.map((r) => (
                    <Badge key={r.id_rol} className={roleBadgeColor(r.codigo_rol)}>
                      {r.nombre_rol}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Permisos efectivos por módulo
                </p>
                <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                  {Object.entries(
                    calcularDetallePermisos(roles, detailUser.roles.map((r) => String(r.id_rol))),
                  ).map(([modulo, nombresPermisos]) => (
                    <div key={modulo} className="flex items-start gap-2 text-xs">
                      <span className="font-medium w-28 shrink-0 text-[#003366]">{modulo}</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {nombresPermisos.map((nombre) => (
                          <span
                            key={nombre}
                            className="px-2 py-0.5 rounded-md bg-[#004B87] text-white text-[10px] font-semibold"
                          >
                            {nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {detailUser.permisos_directos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Permisos directos adicionales
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailUser.permisos_directos.map((p) => (
                      <Badge key={p.id_permiso} variant="outline">
                        {getPermisoLabel(permisos, String(p.id_permiso))}
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
