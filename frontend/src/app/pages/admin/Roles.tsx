import React, { useEffect, useState, useCallback } from 'react';
import { rolesSeguridadService } from '../../../services/rolesSeguridad.service';
import type { RolSeguridad } from '../../../types';
import { toast } from 'sonner';

// Módulo 4 · Seguridad — catálogo de roles, ahora contra /api/seguridad/roles.
// El nombre y código del rol ya NO están restringidos a una lista fija:
// el backend permite crear cualquier rol nuevo (nombre_rol + codigo_rol),
// que es justamente lo que habilita el botón "+ Nuevo Rol".

export function Roles() {
  const [roles, setRoles] = useState<RolSeguridad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RolSeguridad | null>(null);
  const [nombreRol, setNombreRol] = useState('');
  const [codigoRol, setCodigoRol] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [saving, setSaving] = useState(false);

  const cargarRoles = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRoles(await rolesSeguridadService.getAll());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los roles';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarRoles(); }, [cargarRoles]);

  const filteredRoles = filterRole === 'Todos'
    ? roles
    : roles.filter((role) => role.nombre_rol === filterRole);

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setNombreRol('');
    setCodigoRol('');
    setDescripcion('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RolSeguridad) => {
    setSelectedRole(role);
    setNombreRol(role.nombre_rol);
    setCodigoRol(role.codigo_rol);
    setDescripcion(role.descripcion || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedRole) {
        await rolesSeguridadService.actualizar(selectedRole.id_rol, {
          nombre_rol: nombreRol,
          codigo_rol: codigoRol,
          descripcion,
        });
        toast.success('Rol actualizado correctamente');
      } else {
        await rolesSeguridadService.crear({ nombre_rol: nombreRol, codigo_rol: codigoRol, descripcion });
        toast.success('Rol creado correctamente');
      }
      setIsModalOpen(false);
      await cargarRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este rol?')) return;
    try {
      await rolesSeguridadService.eliminar(id);
      toast.success('Rol eliminado correctamente');
      await cargarRoles();
    } catch (err) {
      // p.ej. "No puedes eliminar este rol: todavía tiene 3 usuario(s) asignado(s)"
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el rol');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
            👥 Módulo de Roles
          </h1>
          <p className="text-[#717182] text-sm mt-1">
            Gestiona los roles institucionales de la plataforma Conecta Pumas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          + Nuevo Rol
        </button>
      </div>

      {/* Lista de roles */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#003366]">Todos los Roles</h2>
          <div className="relative w-full sm:w-64">
            <select
              className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm font-semibold focus:outline-none focus:border-[#004B87] transition-colors cursor-pointer"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="Todos">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol.id_rol} value={rol.nombre_rol}>
                  {rol.nombre_rol}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F6F8] text-left">
                <th className="px-5 py-3 text-xs font-bold text-[#717182] uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-xs font-bold text-[#717182] uppercase tracking-wider">Nombre del Rol</th>
                <th className="px-5 py-3 text-xs font-bold text-[#717182] uppercase tracking-wider">Código</th>
                <th className="px-5 py-3 text-xs font-bold text-[#717182] uppercase tracking-wider">Descripción</th>
                <th className="px-5 py-3 text-xs font-bold text-[#717182] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#717182] text-sm">
                    Cargando roles...
                  </td>
                </tr>
              )}
              {!loading && loadError && (
                <tr>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4">
                      <span><strong>No se pudo cargar la informacion.</strong> {loadError}</span>
                      <button onClick={cargarRoles} className="shrink-0 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 text-xs font-bold">
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !loadError && filteredRoles.map((role) => (
                <tr key={role.id_rol} className="hover:bg-[#F9FBFF] transition-colors">
                  <td className="px-5 py-4 text-[#717182] font-mono text-xs align-top">
                    #{role.id_rol}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#EEF4FF] text-[#004B87] text-base">
                        👤
                      </div>
                      <div>
                        <p className="font-bold text-[#003366]">{role.nombre_rol}</p>
                        <span className="inline-block mt-1 bg-[#EEF4FF] border border-[#C8D8EE] text-[#004B87] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {role.permisos.length} permiso{role.permisos.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#717182] font-mono text-xs align-top">
                    {role.codigo_rol}
                  </td>
                  <td className="px-5 py-4 text-[#717182] text-xs leading-relaxed align-top max-w-md">
                    {role.descripcion || 'Sin descripción asignada.'}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(role)}
                        title="Editar"
                        className="p-2 rounded-lg bg-[#F4F6F8] hover:bg-[#EEF4FF] text-[#003366] transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(role.id_rol)}
                        title="Eliminar"
                        className="p-2 rounded-lg bg-red-50 border border-red-100 hover:bg-red-500 text-red-500 hover:text-white transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !loadError && filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#717182] text-sm">
                    No hay roles para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 shadow-2xl mx-4">
            <h3 className="text-lg font-bold mb-4 text-[#004B87] flex items-center gap-1.5">
              {selectedRole ? '✏️ Editar Rol' : '👥 Crear Nuevo Rol'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1.5">
                  Nombre del Rol
                </label>
                <input
                  required
                  placeholder="Ej. Coordinador de Centro Regional"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm focus:outline-none focus:border-[#004B87] transition-colors"
                  value={nombreRol}
                  onChange={(e) => setNombreRol(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1.5">
                  Código del Rol
                </label>
                <input
                  required
                  placeholder="Ej. coordinador_centro"
                  pattern="[a-z0-9_]+"
                  title="Solo minúsculas, números y guion bajo"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm font-mono focus:outline-none focus:border-[#004B87] transition-colors"
                  value={codigoRol}
                  onChange={(e) => setCodigoRol(e.target.value.toLowerCase())}
                />
                <p className="text-[10px] text-[#717182] mt-1">
                  Identificador interno (minúsculas, sin espacios). Se usa para validar el acceso.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <textarea
                  placeholder="Describe el alcance o responsabilidades de este rol..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm focus:outline-none focus:border-[#004B87] h-24 resize-none transition-colors"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-[#004B87] hover:bg-[#003366] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {saving ? 'Guardando...' : selectedRole ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-[#F4F6F8] hover:bg-gray-200 text-[#003366] text-sm font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
