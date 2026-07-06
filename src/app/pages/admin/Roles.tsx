import React, { useState } from 'react';
 
interface RoleData {
  id_roles?: number;
  nombre_rol: string;
  descripcion?: string;
}
 
// Roles institucionales válidos para la plataforma Conecta Pumas.
// TODO: mover a una capa de dominio/constants compartida (p.ej. src/domain/roles.constants.ts)
// y sincronizar con el catálogo de roles del backend (tabla roles en MySQL).
const ROLES_DISPONIBLES = ['Administrador', 'Estudiante', 'Empleado', 'VOAE'] as const;
 
const mockRoles: RoleData[] = [
  { id_roles: 1, nombre_rol: 'Administrador', descripcion: 'Acceso total al sistema: usuarios, eventos, configuración y reportes.' },
  { id_roles: 2, nombre_rol: 'Estudiante', descripcion: 'Puede ver y unirse a eventos, escanear QR, completar encuestas y ver historial.' },
  { id_roles: 3, nombre_rol: 'Empleado', descripcion: 'Puede crear y gestionar eventos, ver reportes de asistencia de sus grupos.' },
  { id_roles: 4, nombre_rol: 'VOAE', descripcion: 'Aprueba eventos institucionales, genera reportes oficiales y gestiona centros regionales.' },
];
 
export function Roles() {
  const [roles, setRoles] = useState<RoleData[]>(mockRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [nombreRol, setNombreRol] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
 
  const filteredRoles = filterRole === 'Todos'
    ? roles
    : roles.filter((role) => role.nombre_rol === filterRole);
 
  const handleOpenCreate = () => {
    setSelectedRole(null);
    setNombreRol('');
    setDescripcion('');
    setIsModalOpen(true);
  };
 
  const handleOpenEdit = (role: RoleData) => {
    setSelectedRole(role);
    setNombreRol(role.nombre_rol);
    setDescripcion(role.descripcion || '');
    setIsModalOpen(true);
  };
 
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole?.id_roles) {
      setRoles(prev => prev.map(r =>
        r.id_roles === selectedRole.id_roles
          ? { ...r, nombre_rol: nombreRol, descripcion }
          : r
      ));
    } else {
      const newId = Math.max(0, ...roles.map(r => r.id_roles ?? 0)) + 1;
      setRoles(prev => [...prev, { id_roles: newId, nombre_rol: nombreRol, descripcion }]);
    }
    setIsModalOpen(false);
  };
 
  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      setRoles(prev => prev.filter(r => r.id_roles !== id));
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
              {ROLES_DISPONIBLES.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
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
                <th className="px-5 py-3 text-xs font-bold text-[#717182] uppercase tracking-wider">Descripción</th>
                <th className="px-5 py-3 text-xs font-bold text-[#717182] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoles.map((role) => (
                <tr key={role.id_roles} className="hover:bg-[#F9FBFF] transition-colors">
                  <td className="px-5 py-4 text-[#717182] font-mono text-xs align-top">
                    #{role.id_roles}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#EEF4FF] text-[#004B87] text-base">
                        👤
                      </div>
                      <div>
                        <p className="font-bold text-[#003366]">{role.nombre_rol}</p>
                        <span className="inline-block mt-1 bg-[#EEF4FF] border border-[#C8D8EE] text-[#004B87] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Rol
                        </span>
                      </div>
                    </div>
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
                        onClick={() => role.id_roles && handleDelete(role.id_roles)}
                        title="Eliminar"
                        className="p-2 rounded-lg bg-red-50 border border-red-100 hover:bg-red-500 text-red-500 hover:text-white transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
 
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-[#717182] text-sm">
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
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm focus:outline-none focus:border-[#004B87] transition-colors cursor-pointer"
                    value={nombreRol}
                    onChange={(e) => setNombreRol(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecciona un rol
                    </option>
                    {ROLES_DISPONIBLES.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
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
                  className="flex-1 py-2.5 px-4 bg-[#004B87] hover:bg-[#003366] text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {selectedRole ? 'Actualizar' : 'Crear'}
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