import { useState, useEffect, useCallback } from 'react';
import { inscripcionesService } from '../services/inscripciones.service';
import type { Inscripcion } from '../types';
import { toast } from 'sonner';

export function useMisInscripciones() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInscripciones(await inscripcionesService.getMisInscripciones());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { inscripciones, loading, error, recargar: cargar };
}

export function useInscripcion(eventoId: string | undefined) {
  const [procesando, setProcesando] = useState(false);

  const inscribirse = useCallback(async () => {
    if (!eventoId) return;
    setProcesando(true);
    try {
      await inscripcionesService.inscribirse(eventoId);
      toast.success('¡Te inscribiste al evento exitosamente!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al inscribirse');
    } finally {
      setProcesando(false);
    }
  }, [eventoId]);

  const cancelar = useCallback(async () => {
    if (!eventoId) return;
    setProcesando(true);
    try {
      await inscripcionesService.cancelar(eventoId);
      toast.success('Inscripción cancelada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setProcesando(false);
    }
  }, [eventoId]);

  return { procesando, inscribirse, cancelar };
}
