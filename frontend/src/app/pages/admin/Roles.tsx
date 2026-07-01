import React, { useState } from 'react';

interface RoleData {
  id_roles?: number;
  nombre_rol: string;
  descripcion?: string;
}

const mockRoles: RoleData[] = [
  { id_roles: 1, nombre_rol: 'Administrador', descripcion: 'Acceso total al sistema: usuarios, eventos, configuración y reportes.' },
  { id_roles: 2, nombre_rol: 'Estudiante', descripcion: 'Puede ver y unirse a eventos, escanear QR, completar encuestas y ver historial.' },
  { id_roles: 3, nombre_rol: 'Tutor / Empleado', descripcion: 'Puede crear y gestionar eventos, ver reportes de asistencia de sus grupos.' },
  { id_roles: 4, nombre_rol: 'VOAE', descripcion: 'Aprueba eventos institucionales, genera reportes oficiales y gestiona centros regionales.' },
];

export function Roles() {
  const [roles, setRoles] = useState<RoleData[]>(mockRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [nombreRol, setNombreRol] = useState('');
  const [descripcion, setDescripcion] = useState('');

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

      {/* Grid de roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div
            key={role.id_roles}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-[#1A6FBF] hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#EEF4FF] text-[#004B87] group-hover:scale-110 transition-transform text-lg">
                  👤
                </div>
                <div>
                  <h3 className="font-bold text-[#003366] group-hover:text-[#1A6FBF] transition-colors">
                    {role.nombre_rol}
                  </h3>
                  <p className="text-[#717182] text-[11px] font-mono">ID: #{role.id_roles}</p>
                </div>
              </div>
              <span className="bg-[#EEF4FF] border border-[#C8D8EE] text-[#004B87] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Rol
              </span>
            </div>

            <p className="text-[#717182] text-xs mb-5 min-h-[3rem] leading-relaxed">
              {role.descripcion || 'Sin descripción asignada.'}
            </p>

            <div className="flex gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => handleOpenEdit(role)}
                className="flex-1 py-2 px-3 text-xs bg-[#F4F6F8] hover:bg-[#EEF4FF] text-[#003366] font-semibold rounded-xl transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => role.id_roles && handleDelete(role.id_roles)}
                className="py-2 px-3 bg-red-50 border border-red-100 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
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
                  type="text"
                  required
                  placeholder="Ej. Administrador"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm focus:outline-none focus:border-[#004B87] transition-colors"
                  value={nombreRol}
                  onChange={(e) => setNombreRol(e.target.value)}
                />
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
