import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { eventosService } from '../../services/eventos.service';
import { publicacionService } from '../../services/publicacion.service';
import type { Evento } from '../../types';
import type { PublicacionResponse } from '../../services/publicacion.service';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [publicacion, setPublicacion] = useState<PublicacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      setLoading(true);
      setNotFound(false);
      // Un mismo enlace "/post/:id" puede ser un Evento o una Publicación,
      // así que probamos evento primero y si no existe, probamos publicación.
      const numId = Number(id);
      const esIdDeEventoConOffset = !Number.isNaN(numId) && numId > 10000;
      if (esIdDeEventoConOffset) {
        try {
          const ev = await eventosService.getById(String(numId - 10000));
          setEvento(ev);
          setLoading(false);
          return;
        } catch {
          // no era un evento válido, seguimos
        }
      }
      try {
        const pub = await publicacionService.getPorId(id);
        setPublicacion(pub);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <Link to="/student/feed" style={{ fontSize: 13, color: '#004B87', fontWeight: 700, textDecoration: 'none', marginBottom: 16, display: 'inline-block' }}>
          ← Volver al muro
        </Link>

        {loading && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: '#64748b' }}>
            Cargando...
          </div>
        )}

        {!loading && notFound && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#003366', marginBottom: 6 }}>No se encontró esta publicación</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>Puede que haya sido eliminada o que el enlace esté mal escrito.</p>
          </div>
        )}

        {!loading && evento && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            {evento.portada_url && (
              <img src={evento.portada_url} alt={evento.titulo} style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />
            )}
            <div style={{ padding: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#004B87', background: 'rgba(0,75,135,0.08)', padding: '3px 10px', borderRadius: 999 }}>
                📅 Evento
              </span>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#003366', margin: '10px 0 8px' }}>{evento.titulo}</h1>
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, marginBottom: 14 }}>{evento.descripcion}</p>
              <div style={{ fontSize: 13, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>🗓️ {evento.fecha_inicio} {evento.hora_inicio ? `· ${evento.hora_inicio}` : ''}</span>
                {evento.ubicacion && <span>📍 {evento.ubicacion}</span>}
                <span>🏫 {evento.centro_regional}</span>
              </div>
            </div>
          </div>
        )}

        {!loading && publicacion && (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            {publicacion.images?.[0] && (
              <img src={publicacion.images[0]} alt={publicacion.title} style={{ width: '100%', maxHeight: 260, objectFit: 'cover' }} />
            )}
            <div style={{ padding: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', background: 'rgba(234,88,12,0.08)', padding: '3px 10px', borderRadius: 999 }}>
                📢 Publicación
              </span>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#003366', margin: '10px 0 8px' }}>{publicacion.title}</h1>
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, marginBottom: 10 }}>{publicacion.desc}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Por {publicacion.author} · {publicacion.time}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}