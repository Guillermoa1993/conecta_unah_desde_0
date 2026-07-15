import { useState, useEffect, useCallback } from 'react';
import { eventosService } from '../services/eventos.service';
import type { Evento, FiltrosEvento } from '../types';

export function useEventos(filtrosIniciales?: FiltrosEvento) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (filtros?: FiltrosEvento) => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventosService.getAll(filtros ?? filtrosIniciales);
      setEventos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  }, [filtrosIniciales]);

  useEffect(() => { cargar(); }, [cargar]);

  return { eventos, loading, error, recargar: cargar };
}

export function useMisEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEventos(await eventosService.getMisEventos());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tus eventos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { eventos, loading, error, recargar: cargar };
}

export function useEventosPendientes() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEventos(await eventosService.getPendientes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar eventos pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return { eventos, loading, error, recargar: cargar };
}

export function useEvento(id: string | undefined) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    eventosService.getById(id)
      .then(setEvento)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  return { evento, loading, error };
}
