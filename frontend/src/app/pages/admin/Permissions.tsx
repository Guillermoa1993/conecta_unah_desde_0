import React, { useState } from 'react';

interface PermissionData {
  id_permisos?: number;
  nombre_permiso: string;
  modulo: string;
  descripcion?: string;
}

const MODULES = ['Roles', 'Permisos', 'Usuarios', 'Eventos', 'Bitácora', 'Reportes', 'Mantenimiento'];

const mockPermissions: PermissionData[] = [
  { id_permisos: 1, nombre_permiso: 'leer_roles', modulo: 'Roles', descripcion: 'Visualizar el listado de roles del sistema.' },
  { id_permisos: 2, nombre_permiso: 'crear_roles', modulo: 'Roles', descripcion: 'Añadir nuevos roles operativos al sistema.' },
  { id_permisos: 3, nombre_permiso: 'modificar_permisos', modulo: 'Permisos', descripcion: 'Acceso total para editar la matriz ACL.' },
  { id_permisos: 4, nombre_permiso: 'gestionar_usuarios', modulo: 'Usuarios', descripcion: 'Crear, editar y desactivar cuentas de usuario.' },
  { id_permisos: 5, nombre_permiso: 'crear_eventos', modulo: 'Eventos', descripcion: 'Publicar nuevos eventos académicos e institucionales.' },
  { id_permisos: 6, nombre_permiso: 'aprobar_eventos', modulo: 'Eventos', descripcion: 'Validar y aprobar eventos antes de publicarlos (solo VOAE).' },
  { id_permisos: 7, nombre_permiso: 'ver_bitacora', modulo: 'Bitácora', descripcion: 'Consultar el registro de actividad del sistema.' },
];

const moduleColor: Record<string, string> = {
  Roles: 'bg-blue-50 border-blue-100 text-[#004B87]',
  Permisos: 'bg-yellow-50 border-yellow-100 text-yellow-700',
  Usuarios: 'bg-purple-50 border-purple-100 text-purple-700',
  Eventos: 'bg-green-50 border-green-100 text-green-700',
  'Bitácora': 'bg-gray-50 border-gray-200 text-gray-600',
  Reportes: 'bg-orange-50 border-orange-100 text-orange-700',
  Mantenimiento: 'bg-slate-50 border-slate-200 text-slate-600',
};

export function Permissions() {
  const [permissions, setPermissions] = useState<PermissionData[]>(mockPermissions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionData | null>(null);
  const [nombrePermiso, setNombrePermiso] = useState('');
  const [modulo, setModulo] = useState('Roles');
  const [descripcion, setDescripcion] = useState('');

  const handleOpenCreate = () => {
    setSelectedPermission(null);
    setNombrePermiso('');
    setModulo('Roles');
    setDescripcion('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (perm: PermissionData) => {
    setSelectedPermission(perm);
    setNombrePermiso(perm.nombre_permiso);
    setModulo(perm.modulo);
    setDescripcion(perm.descripcion || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPermission?.id_permisos) {
      setPermissions(prev => prev.map(p =>
        p.id_permisos === selectedPermission.id_permisos
          ? { ...p, nombre_permiso: nombrePermiso, modulo, descripcion }
          : p
      ));
    } else {
      const newId = Math.max(0, ...permissions.map(p => p.id_permisos ?? 0)) + 1;
      setPermissions(prev => [...prev, { id_permisos: newId, nombre_permiso: nombrePermiso, modulo, descripcion }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este permiso?')) {
      setPermissions(prev => prev.filter(p => p.id_permisos !== id));
    }
  };

  const groupedByModule = MODULES.map(mod => ({
    mod,
    perms: permissions.filter(p => p.modulo === mod),
  })).filter(g => g.perms.length > 0);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
            🔑 Módulo de Permisos
          </h1>
          <p className="text-[#717182] text-sm mt-1">
            Gestiona los accesos por funcionalidad de la plataforma.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#FFD100] hover:bg-[#FFE766] text-[#003366] font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          + Nuevo Permiso
        </button>
      </div>

      {/* Agrupado por módulo */}
      <div className="space-y-6">
        {groupedByModule.map(({ mod, perms }) => (
          <div key={mod}>
            <h2 className="text-xs font-bold text-[#717182] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md border text-[10px] ${moduleColor[mod] ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                {mod}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {perms.map((perm) => (
                <div
                  key={perm.id_permisos}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-[#FFD100] hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-yellow-50 text-yellow-600 group-hover:scale-110 transition-transform text-lg">
                        🔑
                      </div>
                      <div>
                        <h3 className="font-bold text-[#003366] text-sm group-hover:text-[#1A6FBF] transition-colors truncate max-w-[140px]">
                          {perm.nombre_permiso}
                        </h3>
                        <p className="text-[#717182] text-[11px] font-mono">ID: #{perm.id_permisos ?? 'TEMP'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${moduleColor[perm.modulo] ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                      {perm.modulo}
                    </span>
                  </div>

                  <p className="text-[#717182] text-xs mb-4 min-h-[2.5rem] leading-relaxed">
                    {perm.descripcion || `Operaciones dentro del módulo ${perm.modulo}.`}
                  </p>

                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => handleOpenEdit(perm)}
                      className="flex-1 py-2 px-3 text-xs bg-[#F4F6F8] hover:bg-[#EEF4FF] text-[#003366] font-semibold rounded-xl transition-colors"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => perm.id_permisos && handleDelete(perm.id_permisos)}
                      className="py-2 px-3 bg-red-50 border border-red-100 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 shadow-2xl mx-4">
            <h3 className="text-lg font-bold mb-4 text-[#FFD100] drop-shadow-sm">
              {selectedPermission ? '✏️ Editar Permiso' : '🔑 Crear Nuevo Permiso'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1.5">
                  Nombre del Permiso
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. leer_bitacora"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm focus:outline-none focus:border-[#FFD100] transition-colors"
                  value={nombrePermiso}
                  onChange={(e) => setNombrePermiso(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1.5">
                  Módulo Destino
                </label>
                <select
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm focus:outline-none focus:border-[#FFD100] transition-colors"
                >
                  {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <textarea
                  placeholder="Describe qué habilita este permiso..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] text-sm focus:outline-none focus:border-[#FFD100] h-20 resize-none transition-colors"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#FFD100] hover:bg-[#FFE766] text-[#003366] text-sm font-bold rounded-xl transition-colors"
                >
                  {selectedPermission ? 'Actualizar' : 'Guardar'}
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
