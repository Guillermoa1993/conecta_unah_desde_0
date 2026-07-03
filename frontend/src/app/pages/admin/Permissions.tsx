import React, { useState } from 'react';

// Interfaces para el flujo secuencial por persona
interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  cuenta: string;
  rol: string;
}

interface Permiso {
  id: number;
  nombre: string;
  modulo: string;
}

export function Permissions() {
  // CONTROL DE ACCESO (sessionStorage del manual institucional)
  const rolActivo = sessionStorage.getItem("unah_role");
  const esAdminValido = rolActivo === "admin" || rolActivo === "dev";

  if (!esAdminValido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div className="bg-red-50 text-[#003366] border border-red-200 p-4 rounded-lg font-bold max-w-md text-center shadow-xs">
          🛑 ACCESO RESTRINGIDO: El módulo de configuración de permisos individuales es de uso exclusivo para el rol de Administrador.
        </div>
      </div>
    );
  }

  // 1. Selector de Rol Base (Paso 1 del flujo)
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('tutor');
  
  // 2. Estado para el Usuario seleccionado de la lista (Paso 2 y 3 del flujo)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  // MOCK DE USUARIOS REGISTRADOS EN LA PLATAFORMA
  const [usuarios] = useState<Usuario[]>([
    { id_usuario: 101, nombre: 'Fabian Castillo', correo: 'fabian.castillo@unah.edu.hn', cuenta: '20211002345', rol: 'admin' },
    { id_usuario: 102, nombre: 'Carlos Mendoza', correo: 'carlos.mendoza@unah.edu.hn', cuenta: '20191005432', rol: 'tutor' },
    { id_usuario: 103, nombre: 'Ing. Elena Flores', correo: 'elena.flores@unah.edu.hn', cuenta: '01011985002', rol: 'tutor' },
    { id_usuario: 104, nombre: 'Andrea Paz', correo: 'andrea.paz@unah.edu.hn', cuenta: '20201001122', rol: 'voae' },
    { id_usuario: 105, nombre: 'Juan Pérez', correo: 'juan.perez@unah.hn', cuenta: '20231008899', rol: 'student' },
    { id_usuario: 106, nombre: 'María Rodríguez', correo: 'maria.rod@unah.hn', cuenta: '20221004455', rol: 'student' }
  ]);

  // CATÁLOGO DE ACCIONES MOCK POR MÓDULOS
  const [todosLosPermisos] = useState<Permiso[]>([
    { id: 1, nombre: 'Crear Eventos Universitarios', modulo: 'Eventos' },
    { id: 2, nombre: 'Aprobar/Rechazar Solicitudes VOAE', modulo: 'Eventos' },
    { id: 3, nombre: 'Escanear QR de Asistencia', modulo: 'Asistencia' },
    { id: 4, nombre: 'Control Manual de Lista', modulo: 'Asistencia' },
    { id: 5, nombre: 'Emitir Constancias Oficiales', modulo: 'Constancias' },
    { id: 6, nombre: 'Descargar Historial de Horas', modulo: 'Constancias' },
    { id: 7, nombre: 'Moderar Comentarios del Muro', modulo: 'Seguridad' },
    { id: 8, nombre: 'Alterar Configuración del Sistema', modulo: 'Seguridad' }
  ]);

  // MATRIZ DE PERMISOS ATÓMICOS POR ID DE USUARIO INDIVIDUAL
  const [permisosPorUsuario, setPermisosPorUsuario] = useState<{ [key: number]: number[] }>({
    101: [1, 2, 3, 4, 5, 6, 7, 8], // Fabian tiene todo por ser admin
    102: [1, 3],                   // Carlos solo crea y escanea
    103: [1, 3, 4],                // Elena maneja listas manuales también
    104: [2, 5, 6],                // Andrea (VOAE) aprueba y emite
    105: [3],                      // Juan (Estudiante) solo escanea su asistencia
    106: [3, 6]                    // María escanea y descarga historial
  });

  // Filtrar los usuarios según el rol de la caja desplegable superior
  const usuariosFiltrados = usuarios.filter(u => u.rol === rolSeleccionado);

  // Permisos activos del usuario que está seleccionado actualmente para edición
  const permisosActualesDelUsuario = usuarioSeleccionado ? (permisosPorUsuario[usuarioSeleccionado.id_usuario] || []) : [];

  // Manejar el toggle manual de cada switch asignado a la persona
  const handleTogglePermisoPersona = (idPermiso: number) => {
    if (!usuarioSeleccionado) return;

    const copiaMatriz = { ...permisosPorUsuario };
    const listaActual = copiaMatriz[usuarioSeleccionado.id_usuario] || [];

    if (listaActual.includes(idPermiso)) {
      copiaMatriz[usuarioSeleccionado.id_usuario] = listaActual.filter(id => id !== idPermiso);
    } else {
      copiaMatriz[usuarioSeleccionado.id_usuario] = [...listaActual, idPermiso];
    }

    setPermisosPorUsuario(copiaMatriz);
  };

  const handleGuardarCambiosExcepcion = () => {
    if (!usuarioSeleccionado) return;
    alert(`¡Permisos asignados manualmente a [${usuarioSeleccionado.nombre}] guardados con éxito en su ficha de usuario!`);
  };

  // Agrupar el catálogo por modulo
  const modulosAgrupados = todosLosPermisos.reduce((acc: { [key: string]: Permiso[] }, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = [];
    acc[p.modulo].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 max-w-5xl mx-auto space-y-6">
      
      {/* CABECERA */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">Asignación Manual de Permisos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Filtre por rol, elija un usuario y altere sus privilegios individuales de manera atómica.</p>
        </div>
        {usuarioSeleccionado && (
          <button
            onClick={handleGuardarCambiosExcepcion}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-xs transition-all active:scale-95"
          >
            💾 Guardar Permisos de {usuarioSeleccionado.nombre.split(' ')[0]}
          </button>
        )}
      </div>

      {/* BLOQUE DE FILTRO DE ROL */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#004B87] block mb-1">1. Seleccione Perfil de Rol</label>
          <p className="text-xs text-slate-400">Despliegue el listado de usuarios vinculados a este rol institucional.</p>
        </div>
        <select
          value={rolSeleccionado}
          onChange={(e) => {
            setRolSeleccionado(e.target.value);
            setUsuarioSeleccionado(null); // Resetear usuario al cambiar de rol
          }}
          className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004B87] shadow-xs min-w-[220px]"
        >
          <option value="admin">Administradores</option>
          <option value="tutor">Tutores / Empleados</option>
          <option value="voae">Personal VOAE</option>
          <option value="student">Estudiantes</option>
        </select>
      </div>

      {/* RESTRICCIÓN DE FLUJO: LISTA DE USUARIOS FILTRADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: LISTADO DE PERSONAS */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">2. Usuarios Disponibles ({usuariosFiltrados.length})</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-[380px] overflow-y-auto space-y-1">
            {usuariosFiltrados.map(user => {
              const esActivo = usuarioSeleccionado?.id_usuario === user.id_usuario;
              return (
                <button
                  key={user.id_usuario}
                  onClick={() => setUsuarioSeleccionado(user)}
                  className={`w-full text-left p-3 rounded-lg transition-all border ${
                    esActivo 
                      ? 'bg-[#004B87] text-white border-[#004B87] shadow-xs scale-[1.01]' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-bold truncate">{user.nombre}</p>
                  <p className={`text-xs ${esActivo ? 'text-blue-100' : 'text-slate-400'} font-mono mt-0.5`}>{user.cuenta}</p>
                  <p className={`text-[11px] ${esActivo ? 'text-blue-200' : 'text-slate-400'} truncate mt-1`}>{user.correo}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA: ASIGNACIÓN DE MATRIZ DE PERMISOS */}
        <div className="md:col-span-2">
          {usuarioSeleccionado ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold text-[#003366]">
                  Configurando Excepciones para: <strong className="text-[#004B87] font-bold">{usuarioSeleccionado.nombre}</strong>
                </span>
                <span className="text-[10px] bg-[#003366] text-white px-2 py-0.5 rounded font-mono">
                  ID_{usuarioSeleccionado.id_usuario}
                </span>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {Object.keys(modulosAgrupados).map(moduloKey => (
                  <div key={moduloKey} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#003366] px-4 py-2 text-white font-bold text-xs uppercase tracking-wider">
                      Módulo: {moduloKey}
                    </div>
                    
                    <div className="bg-white divide-y divide-slate-100 px-4 py-1">
                      {modulosAgrupados[moduloKey].map(permiso => {
                        const estaActivo = permisosActualesDelUsuario.includes(permiso.id);
                        return (
                          <div key={permiso.id} className="flex items-center justify-between py-2.5 hover:bg-slate-50/50 transition-colors">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{permiso.nombre}</p>
                              <p className="text-[10px] text-slate-400 font-mono">unah_action_0{permiso.id}</p>
                            </div>

                            {/* Switch iOS */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={estaActivo}
                                onChange={() => handleTogglePermisoPersona(permiso.id)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[250px] border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
              <span>👈 3. Selecciona un usuario del listado izquierdo para abrir sus llaves de control y configurarlo manualmente.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
