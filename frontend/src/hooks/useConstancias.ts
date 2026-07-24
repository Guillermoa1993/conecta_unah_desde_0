import { useState, useEffect, useCallback } from 'react';
import { constanciasService } from '../services/constancias.service';
import type { Constancia } from '../types';
import { toast } from 'sonner';

export function useMisConstancias() {
  const [constancias, setConstancias] = useState<Constancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setConstancias(await constanciasService.getMisConstancias());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar constancias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { constancias, loading, error, recargar: cargar };
}

export function useConstanciasPendientes() {
  const [constancias, setConstancias] = useState<Constancia[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setConstancias(await constanciasService.getPendientes());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const aprobar = useCallback(async (id: string) => {
    try {
      await constanciasService.aprobar(id);
      toast.success('Constancia aprobada');
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al aprobar');
    }
  }, [cargar]);

  const rechazar = useCallback(async (id: string, motivo: string) => {
    try {
      await constanciasService.rechazar(id, motivo);
      toast.success('Constancia rechazada');
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al rechazar');
    }
  }, [cargar]);

  return { constancias, loading, aprobar, rechazar, recargar: cargar };
}
