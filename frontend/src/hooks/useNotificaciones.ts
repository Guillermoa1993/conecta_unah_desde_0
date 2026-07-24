import { useState, useEffect, useCallback } from 'react';
import { notificacionesService } from '../services/notificaciones.service';
import type { Notificacion } from '../types';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [todas, resumen] = await Promise.all([
        notificacionesService.getMias(),
        notificacionesService.getNoLeidas(),
      ]);
      setNotificaciones(todas);
      setNoLeidas(resumen.count);
    } catch {
      // Silencioso — las notificaciones no son críticas
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const marcarLeida = useCallback(async (id: string) => {
    await notificacionesService.marcarLeida(id);
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    setNoLeidas((c) => Math.max(0, c - 1));
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    await notificacionesService.marcarTodasLeidas();
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
  }, []);

  return { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas, recargar: cargar };
}
