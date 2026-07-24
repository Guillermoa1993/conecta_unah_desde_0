import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { estadosService, Estado } from '../../../services/estados.service';
import { authService } from '../../../services/auth.service';

function iniciales(nombre?: string): string {
  if (!nombre) return '??';
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

const EMOJIS_PUMA = [
  '🐆', '🐾', '😸', '😹', '😻', '🙀', '😾', '😿', '🐈‍⬛', '🐯',
  '💛', '💙', '🔥', '✨', '🎉', '🥳', '😂', '🤣', '🏆', '🎓',
  '📚', '☕', '😴', '💪',
];

export function StoriesBar() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [activeStory, setActiveStory] = useState<Estado | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const usuario = authService.getUsuarioGuardado();

  const cargarEstados = async () => {
    try {
      const data = await estadosService.obtenerActivos();
      setEstados(data);
    } catch {
      // silencioso: si falla, simplemente no se muestran estados
    }
  };

  useEffect(() => {
    cargarEstados();
    const interval = setInterval(cargarEstados, 60000); // refresca cada minuto
    return () => clearInterval(interval);
  }, []);

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('La imagen es muy pesada, usa una de menos de 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagenPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const insertarEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setTexto((t) => t + emoji);
      return;
    }
    const inicio = el.selectionStart ?? texto.length;
    const fin = el.selectionEnd ?? texto.length;
    const nuevoTexto = texto.slice(0, inicio) + emoji + texto.slice(fin);
    setTexto(nuevoTexto);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = inicio + emoji.length;
    });
  };

  const handlePublicar = async () => {
    if (!texto.trim() && !imagenPreview) {
      setError('Escribe algo o agrega una imagen');
      return;
    }
    setPublicando(true);
    setError('');
    try {
      await estadosService.crear({
        texto_estado: texto.trim() || undefined,
        foto_url: imagenPreview ?? undefined,
      });
      setModalAbierto(false);
      setTexto('');
      setImagenPreview(null);
      await cargarEstados();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el estado');
    } finally {
      setPublicando(false);
    }
  };

  return (
    <>
      <style>{`
        .stories-in-header {
          display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
          align-items: center; height: 100%; padding: 0 4px; flex: 1; min-width: 0;
        }
        .stories-in-header::-webkit-scrollbar { display: none; }
        .story-item-h {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; cursor: pointer; flex-shrink: 0; position: relative;
        }
        .story-ring-h {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,75,135,0.07); border: 2px solid transparent;
          transition: box-shadow 0.15s;
        }
        .story-ring-h.has-story-h { border-color: #FFD100; }
        .story-ring-h:hover { box-shadow: 0 0 0 2px #FFD100; }
        .story-ava-h {
          width: 28px; height: 28px; background: #003366; color: #fff;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-weight: 700; font-size: 9px;
          position: relative; border: 2px solid #004B87; overflow: hidden;
        }
        .story-ava-h img { width: 100%; height: 100%; object-fit: cover; }
        .story-plus-h {
          position: absolute; bottom: -2px; right: -2px;
          width: 12px; height: 12px; background: #FFD100; color: #003366;
          border-radius: 50%; font-size: 9px; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #004B87; line-height: 1;
        }
        .story-name-h {
          font-size: 8.5px; font-weight: 600; color: #5b6472;
          max-width: 38px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; text-align: center;
        }
        .story-overlay-h {
          position: fixed; inset: 0; background: rgba(0,20,60,0.75);
          z-index: 9999; display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
        }
        .story-viewer-h {
          width: 300px; min-height: 300px; max-height: 90vh;
          background: linear-gradient(160deg, #003366, #004B87);
          border-radius: 20px; display: flex; flex-direction: column;
          align-items: center; position: relative; padding: 28px 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: fadeScaleH 0.2s ease-out; z-index: 10000; overflow-y: auto;
        }
        @keyframes fadeScaleH { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .story-bar-h {
          position: absolute; top: 14px; left: 16px; right: 16px;
          height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;
        }
        .story-bar-h::after {
          content: ''; display: block; height: 100%; width: 100%;
          background: #FFD100; animation: storyProgH 5s linear forwards;
        }
        @keyframes storyProgH { from { width: 0%; } to { width: 100%; } }
        .story-close-h {
          position: absolute; top: 10px; right: 12px; background: none; border: none;
          color: #fff; font-size: 18px; cursor: pointer; opacity: 0.8;
        }
        .story-close-h:hover { opacity: 1; }
        .story-ava-big-h {
          width: 64px; height: 64px; background: #FFD100; color: #003366;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 20px; border: 3px solid #fff; margin: 20px 0 12px;
        }
        .story-vname-h { font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 12px; }
        .story-vimg-h { width: 100%; max-height: 260px; object-fit: cover; border-radius: 12px; margin-bottom: 12px; }
        .story-vtext-h {
          font-size: 16px; font-weight: 600; color: #fff; text-align: center;
          line-height: 1.5; background: rgba(255,255,255,0.1); padding: 14px 18px; border-radius: 12px;
        }
        .story-modal-h {
          width: 320px; background: #fff; border-radius: 16px; padding: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4); animation: fadeScaleH 0.2s ease-out; z-index: 10000;
        }
        .story-modal-title-h { font-weight: 800; color: #003366; margin-bottom: 12px; font-size: 15px; }
        .story-modal-textarea-h {
          width: 100%; min-height: 80px; border: 1px solid #d1d5db; border-radius: 8px;
          padding: 8px; font-size: 13px; resize: none; margin-bottom: 10px; font-family: inherit;
        }
        .story-modal-preview-h { width: 100%; max-height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; }
        .story-modal-error-h { color: #dc2626; font-size: 12px; margin-bottom: 8px; }
        .story-modal-actions-h { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
        .story-btn-h {
          padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: none;
        }
        .story-btn-cancel-h { background: #f1f5f9; color: #334155; }
        .story-btn-publicar-h { background: #003366; color: #fff; }
        .story-btn-publicar-h:disabled { opacity: 0.6; cursor: not-allowed; }
        .story-file-label-h {
          display: inline-block; font-size: 12px; font-weight: 700; color: #004B87;
          border: 1.5px dashed #004B87; border-radius: 8px; padding: 6px 10px;
          cursor: pointer; margin-bottom: 0;
        }
        .emoji-panel-h {
          display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 8px; margin-bottom: 10px;
        }
        .emoji-btn-h {
          background: none; border: none; font-size: 18px; cursor: pointer;
          padding: 4px; border-radius: 6px; line-height: 1;
        }
        .emoji-btn-h:hover { background: #FFD100; }
      `}</style>

      <div className="stories-in-header">
        <div className="story-item-h" onClick={() => setModalAbierto(true)}>
          <div className="story-ring-h">
            <div className="story-ava-h">
              <span className="story-plus-h">+</span>
              {usuario?.nombre ? iniciales(usuario.nombre) : 'TU'}
            </div>
          </div>
          <span className="story-name-h">Tu estado</span>
        </div>

        {estados.map((e) => (
          <div key={e.id_estado_temporal} className="story-item-h" onClick={() => setActiveStory(e)}>
            <div className="story-ring-h has-story-h">
              <div className="story-ava-h">
                {e.foto_url ? <img src={e.foto_url} alt={e.nombre_usuario} /> : iniciales(e.nombre_usuario)}
              </div>
            </div>
            <span className="story-name-h">{e.nombre_usuario}</span>
          </div>
        ))}
      </div>

      {activeStory && ReactDOM.createPortal(
        <div className="story-overlay-h" onClick={() => setActiveStory(null)}>
          <div className="story-viewer-h" onClick={(e) => e.stopPropagation()}>
            <div className="story-bar-h" />
            <button className="story-close-h" onClick={() => setActiveStory(null)}>✕</button>
            <div className="story-ava-big-h">{iniciales(activeStory.nombre_usuario)}</div>
            <div className="story-vname-h">{activeStory.nombre_usuario}</div>
            {activeStory.foto_url && (
              <img className="story-vimg-h" src={activeStory.foto_url} alt="" />
            )}
            {activeStory.texto_estado && <div className="story-vtext-h">{activeStory.texto_estado}</div>}
          </div>
        </div>,
        document.body,
      )}

      {modalAbierto && ReactDOM.createPortal(
        <div className="story-overlay-h" onClick={() => setModalAbierto(false)}>
          <div className="story-modal-h" onClick={(e) => e.stopPropagation()}>
            <div className="story-modal-title-h">Crear estado (dura 24 horas)</div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <label className="story-file-label-h">
                📷 Agregar imagen
                <input type="file" accept="image/*" onChange={handleImagenChange} style={{ display: 'none' }} />
              </label>
              <button
                type="button"
                className="story-file-label-h"
                onClick={() => setMostrarEmojis((v) => !v)}
              >
                😺 Emojis
              </button>
            </div>

            {mostrarEmojis && (
              <div className="emoji-panel-h">
                {EMOJIS_PUMA.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-btn-h"
                    onClick={() => insertarEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {imagenPreview && <img className="story-modal-preview-h" src={imagenPreview} alt="preview" />}

            <textarea
              ref={textareaRef}
              className="story-modal-textarea-h"
              placeholder="¿Qué está pasando?"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={300}
            />

            {error && <div className="story-modal-error-h">{error}</div>}

            <div className="story-modal-actions-h">
              <button className="story-btn-h story-btn-cancel-h" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button
                className="story-btn-h story-btn-publicar-h"
                onClick={handlePublicar}
                disabled={publicando}
              >
                {publicando ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}