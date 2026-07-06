import React, { useState } from 'react';

interface PermisoEstado {
  crear: boolean;
  leer: boolean;
  editar: boolean;
  eliminar: boolean;
}

interface MatrizPermisos {
  [rol: string]: {
    [modulo: string]: PermisoEstado;
  };
}

export function Permissions() {
  // CONTROL DE ACCESO (sessionStorage institucional)
  const rolActivo = sessionStorage.getItem("unah_role");
  const esAdminValido = rolActivo === "admin" || rolActivo === "dev";

  if (!esAdminValido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div className="bg-red-50 text-[#003366] border border-red-200 p-4 rounded-lg font-bold max-w-md text-center shadow-xs">
          🛑 ACCESO RESTRINGIDO: El módulo de configuración de permisos es de uso exclusivo para el rol de Administrador.
        </div>
      </div>
    );
  }

  // 1. Estado para el Rol seleccionado de la caja superior
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('admin');

  // 2. Estado para controlar qué módulos están desplegados (Abiertos/Cerrados)
  const [modulosAbiertos, setModulosAbiertos] = useState<{ [key: string]: boolean }>({
    'Usuario': true,  // El primero abierto por defecto para dar feedback visual
    'Evento': false,
    'Bitácora': false,
    'Backup': false
  });

  // 3. MATRIZ BASE DE PERMISOS POR ROL Fijos e Interactivos
  const [matrizRoles, setMatrizRoles] = useState<MatrizPermisos>({
    admin: {
      Usuario:  { crear: true, leer: true, editar: true, eliminar: true },
      Evento:   { crear: true, leer: true, editar: true, eliminar: true },
      Bitácora: { crear: true, leer: true, editar: true, eliminar: true },
      Backup:   { crear: true, leer: true, editar: true, eliminar: true },
    },
    tutor: {
      Usuario:  { crear: false, leer: true, editar: false, eliminar: false },
      Evento:   { crear: true, leer: true, editar: true, eliminar: false },
      Bitácora: { crear: true, leer: true, editar: false, eliminar: false },
      Backup:   { crear: false, leer: false, editar: false, eliminar: false },
    },
    voae: {
      Usuario:  { crear: false, leer: true, editar: true, eliminar: false },
      Evento:   { crear: false, leer: true, editar: true, eliminar: false },
      Bitácora: { crear: false, leer: true, editar: false, eliminar: false },
      Backup:   { crear: false, leer: false, editar: false, eliminar: false },
    },
    student: {
      Usuario:  { crear: false, leer: true, editar: false, eliminar: false },
      Evento:   { crear: false, leer: true, editar: false, eliminar: false },
      Bitácora: { crear: false, leer: false, editar: false, eliminar: false },
      Backup:   { crear: false, leer: false, editar: false, eliminar: false },
    }
  });

  // Estructuras exigidas estrictamente
  const modulos = ['Usuario', 'Evento', 'Bitácora', 'Backup'];
  const acciones: (keyof PermisoEstado)[] = ['crear', 'leer', 'editar', 'eliminar'];

  // Alternar apertura de los bloques azules (Acordeón)
  const toggleModuloDesplegable = (modulo: string) => {
    setModulosAbiertos(prev => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  // Cambiar el switch de un permiso de forma interactiva para el rol completo
  const handleTogglePermiso = (modulo: string, accion: keyof PermisoEstado) => {
    setMatrizRoles(prev => {
      const nuevoEstadoRol = { ...prev[rolSeleccionado] };
      nuevoEstadoRol[modulo] = {
        ...nuevoEstadoRol[modulo],
        [accion]: !nuevoEstadoRol[modulo][accion]
      };
      return {
        ...prev,
        [rolSeleccionado]: nuevoEstadoRol
      };
    });
  };

  const handleGuardarCambiosRol = () => {
    alert(`¡Estructura de permisos para el rol seleccionado guardada con éxito!`);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 max-w-4xl mx-auto space-y-6">
      
      {/* CABECERA CORREGIDA */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">Configuración de Permisos de Administrador</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestione y altere las capacidades de los distintos perfiles del sistema.</p>
        </div>
        {/* BOTÓN SIMPLIFICADO A SOLICITUD */}
        <button
          onClick={handleGuardarCambiosRol}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-xs transition-all active:scale-95"
        >
          💾 Guardar
        </button>
      </div>

      {/* FILTRO DE ROL PRINCIPAL */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#004B87] block mb-1">Seleccione Perfil de Rol</label>
          <p className="text-xs text-slate-400">Los cambios afectarán automáticamente a todos los usuarios que pertenezcan a este grupo.</p>
        </div>
        <select
          value={rolSeleccionado}
          onChange={(e) => setRolSeleccionado(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004B87] shadow-xs min-w-[220px]"
        >
          <option value="admin">Administrador</option>
          <option value="tutor">Tutor / Empleado</option>
          <option value="voae">Personal VOAE</option>
          <option value="student">Estudiante</option>
        </select>
      </div>

      {/* SECCIÓN DE MÓDULOS EN AZUL FUERTE */}
      <div className="space-y-3">
        {modulos.map(modulo => {
          const isOpen = modulosAbiertos[modulo];
          const permisosModulo = matrizRoles[rolSeleccionado][modulo];

          return (
            <div key={modulo} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              
              {/* BOTÓN DEL MÓDULO (AZUL FUERTE) */}
              <button
                onClick={() => toggleModuloDesplegable(modulo)}
                className="w-full bg-[#003366] text-white px-5 py-3.5 font-bold text-sm flex items-center justify-between transition-colors hover:bg-[#002244]"
              >
                <span className="uppercase tracking-wider flex items-center gap-2">
                  📦 Módulo: {modulo}
                </span>
                <span className="text-xs font-mono bg-[#004B87] px-2.5 py-0.5 rounded-sm">
                  {isOpen ? '▲ OCULTAR' : '▼ DESPLEGAR'}
                </span>
              </button>
              
              {/* CUERPO DESPLEGABLE (ACCIONES LIMPIAS SOLICITADAS) */}
              {isOpen && (
                <div className="bg-white divide-y divide-slate-100 px-5 py-1">
                  {acciones.map(accion => {
                    const estaActivo = permisosModulo[accion];
                    return (
                      <div key={accion} className="flex items-center justify-between py-3 hover:bg-slate-50/50 transition-colors">
                        <div>
                          {/* Nombre del permiso limpio y directo */}
                          <p className="text-xs font-bold text-slate-700 capitalize">
                            {accion}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            unah_{modulo.toLowerCase()}_{accion}
                          </p>
                        </div>

                        {/* Switch iOS */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={estaActivo}
                            onChange={() => handleTogglePermiso(modulo, accion)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}