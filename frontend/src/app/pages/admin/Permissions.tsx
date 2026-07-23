import { useEffect, useState, useCallback } from 'react';
import { rolesSeguridadService } from '../../../services/rolesSeguridad.service';
import { permisosSeguridadService } from '../../../services/permisosSeguridad.service';
import type { RolSeguridad, PermisoSeguridad } from '../../../types';
import { toast } from 'sonner';

// Módulo 4 · Seguridad — Matriz ACL (rol × permiso), contra
// /api/seguridad/roles y /api/seguridad/permisos.
//
// Nota de diseño: la versión original de esta pantalla usaba una grilla FIJA
// de 4 acciones (crear/leer/editar/eliminar) por 4 módulos fijos. El catálogo
// real de la base de datos es más granular y no siempre encaja en ese patrón
// (p. ej. "Bitácora" solo tiene el permiso "ver"; "Respaldos" solo tiene
// "gestionar"; "Seguridad" tiene 8 permisos repartidos en dos subrecursos:
// roles y permisos). Por eso aquí cada módulo despliega la lista REAL de
// permisos que existen para él, en vez de forzar 4 casillas que no siempre
// aplican. Se conserva el mismo diseño visual (acordeón azul + switches).
//
// Cada switch llama de inmediato a la API (asignar/revocar permiso del rol);
// no existe un botón "Guardar" separado porque no hay nada pendiente que
// guardar: el cambio ya quedó aplicado en la base de datos.

export function Permissions() {
  const rolActivo = sessionStorage.getItem('unah_role');
  const esAdminValido = rolActivo === 'admin' || rolActivo === 'dev';

  const [roles, setRoles] = useState<RolSeguridad[]>([]);
  const [permisos, setPermisos] = useState<PermisoSeguridad[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modulosAbiertos, setModulosAbiertos] = useState<{ [key: string]: boolean }>({});
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [rolesData, permisosData] = await Promise.all([
        rolesSeguridadService.getAll(),
        permisosSeguridadService.getAll(),
      ]);
      setRoles(rolesData);
      setPermisos(permisosData);
      setRolSeleccionado((prev) => prev || String(rolesData[0]?.id_rol ?? ''));

      const modulos = Array.from(new Set(permisosData.map((p) => p.modulo)));
      setModulosAbiertos((prev) => {
        if (Object.keys(prev).length) return prev;
        return Object.fromEntries(modulos.map((m, i) => [m, i === 0]));
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la matriz de permisos';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (esAdminValido) cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdminValido]);

  if (!esAdminValido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div className="bg-red-50 text-[#003366] border border-red-200 p-4 rounded-lg font-bold max-w-md text-center shadow-xs">
          🛑 ACCESO RESTRINGIDO: El módulo de configuración de permisos es de uso exclusivo para el rol de Administrador.
        </div>
      </div>
    );
  }

  const rolActual = roles.find((r) => String(r.id_rol) === rolSeleccionado);
  const modulos = Array.from(new Set(permisos.map((p) => p.modulo)));

  const toggleModuloDesplegable = (modulo: string) => {
    setModulosAbiertos((prev) => ({ ...prev, [modulo]: !prev[modulo] }));
  };

  const tienePermiso = (idPermiso: number) =>
    !!rolActual?.permisos.some((p) => p.id_permiso === idPermiso);

  const handleTogglePermiso = async (permiso: PermisoSeguridad) => {
    if (!rolActual) return;
    setTogglingId(permiso.id_permiso);
    try {
      if (tienePermiso(permiso.id_permiso)) {
        await rolesSeguridadService.revocarPermiso(rolActual.id_rol, permiso.id_permiso);
      } else {
        await rolesSeguridadService.asignarPermiso(rolActual.id_rol, permiso.id_permiso);
      }
      // Solo se refresca el rol activo, no todo el catálogo.
      const actualizado = await rolesSeguridadService.getById(rolActual.id_rol);
      setRoles((prev) => prev.map((r) => (r.id_rol === actualizado.id_rol ? actualizado : r)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el permiso');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100 max-w-4xl mx-auto space-y-6">

      {/* CABECERA */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">Configuración de Permisos de Administrador</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestione y altere las capacidades de los distintos perfiles del sistema.</p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs px-4 py-2 rounded-lg">
          ✓ Los cambios se aplican de inmediato
        </span>
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
          {roles.map((rol) => (
            <option key={rol.id_rol} value={String(rol.id_rol)}>
              {rol.nombre_rol}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-center text-sm text-slate-400 py-10">Cargando matriz de permisos...</p>
      )}

      {!loading && loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4">
          <span><strong>No se pudo cargar la informacion.</strong> {loadError}</span>
          <button onClick={cargarDatos} className="shrink-0 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 text-xs font-bold">
            Reintentar
          </button>
        </div>
      )}

      {/* SECCIÓN DE MÓDULOS EN AZUL FUERTE */}
      {!loading && !loadError && rolActual && (
        <div className="space-y-3">
          {modulos.map((modulo) => {
            const isOpen = modulosAbiertos[modulo];
            const permisosModulo = permisos.filter((p) => p.modulo === modulo);

            return (
              <div key={modulo} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">

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

                {isOpen && (
                  <div className="bg-white divide-y divide-slate-100 px-5 py-1">
                    {permisosModulo.map((permiso) => {
                      const estaActivo = tienePermiso(permiso.id_permiso);
                      const isToggling = togglingId === permiso.id_permiso;
                      return (
                        <div key={permiso.id_permiso} className="flex items-center justify-between py-3 hover:bg-slate-50/50 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              {permiso.descripcion || permiso.nombre_permiso}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {permiso.nombre_permiso}
                            </p>
                          </div>

                          <label className={`relative inline-flex items-center ${isToggling ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                            <input
                              type="checkbox"
                              checked={estaActivo}
                              onChange={() => handleTogglePermiso(permiso)}
                              disabled={isToggling}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      );
                    })}
                    {permisosModulo.length === 0 && (
                      <p className="text-xs text-slate-400 py-3">Este módulo no tiene permisos registrados.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
