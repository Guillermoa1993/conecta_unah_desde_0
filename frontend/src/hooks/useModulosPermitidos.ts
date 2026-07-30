import { useCallback, useEffect, useState } from "react";
import { rolesSeguridadService } from "../services/rolesSeguridad.service";
import { authService } from "../services/auth.service";

/**
 * Normaliza un texto para comparar módulos/roles sin importar
 * mayúsculas, tildes o espacios extra.
 * "Bitácora" y "bitacora" y "BITÁCORA " deben matchear igual.
 */
export function normalizarModulo(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface ResultadoModulosPermitidos {
  /** Set de nombres de módulo (normalizados) que el rol actual tiene habilitados. */
  modulos: Set<string>;
  /**
   * true solo si encontramos el rol del usuario en el módulo de Seguridad Y
   * ese rol tiene al menos un permiso asignado. Si es false, el rol todavía
   * no fue configurado ahí — quien use este hook debería caer a un listado
   * por defecto en vez de ocultar todo.
   */
  configurado: boolean;
  cargando: boolean;
  /** Vuelve a pedir los permisos al backend (útil después de editar la matriz). */
  recargar: () => void;
}

/**
 * Resuelve, en vivo, qué módulos puede ver el usuario autenticado según la
 * matriz Rol → Permisos que se administra en /admin/roles y /admin/permissions
 * (Módulo 4 · Seguridad). Así el menú deja de depender de una lista fija por
 * rol y refleja lo que un administrador configuró.
 */
export function useModulosPermitidos(): ResultadoModulosPermitidos {
  const [modulos, setModulos] = useState<Set<string>>(new Set());
  const [configurado, setConfigurado] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const usuario = authService.getUsuarioGuardado();
      const codigoRol = usuario?.rol ? normalizarModulo(String(usuario.rol)) : null;

      if (!codigoRol) {
        setModulos(new Set());
        setConfigurado(false);
        return;
      }

      const roles = await rolesSeguridadService.getAll();
      const rol = roles.find((r) => normalizarModulo(r.codigo_rol) === codigoRol);

      if (rol && rol.permisos.length > 0) {
        setModulos(new Set(rol.permisos.map((p) => normalizarModulo(p.modulo))));
        setConfigurado(true);
      } else {
        // Rol no encontrado en Seguridad, o encontrado pero sin permisos
        // asignados todavía: no hay nada configurado, que decida el fallback.
        setModulos(new Set());
        setConfigurado(false);
      }
    } catch {
      setModulos(new Set());
      setConfigurado(false);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { modulos, configurado, cargando, recargar: cargar };
}
