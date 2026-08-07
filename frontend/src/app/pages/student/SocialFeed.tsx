import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../../services/auth.service';
import { eventosService, comentarioService, reaccionPostService, publicacionService, grupo2EventosService, moderacionService } from '../../../services';
import { pumitasService, type Pumita } from '../../../services/pumitas.service';
import { useNotificaciones } from '../../../hooks/useNotificaciones';

interface Comment {
  id: number; author: string; authorInitials: string; text: string; time: string; replyTo?: string; parentId?: number; replyToText?: string; authorPic?: string;
  reactions?: { love?: number; like?: number; dislike?: number; haha?: number; wow?: number; sad?: number; angry?: number };
  userReaction?: "love"|"like"|"dislike"|"haha"|"wow"|"sad"|"angry"|null;
}
interface Post {
  id: number; author: string; initials: string; type: "Evento" | "Publicacion";
  scope: string; visibility: string; time: string; title: string; desc: string;
  tags: string[]; love: number; like: number; dislike: number; haha: number; wow: number; sad: number; angry: number;
  comments: Comment[];
  userReaction: "love"|"like"|"dislike"|"haha"|"wow"|"sad"|"angry"|null; saved: boolean; hidden: boolean;
  fecha?: string; lugar?: string; cupos?: number; inscrito?: boolean;
  voaeHoras?: number;
  topInscritos?: { initials: string; name: string }[];
  images?: string[];
  savedAt?: string;
  profilePic?: string;
  createdAt?: number;
  /* Flujo de aprobación: pendiente (Coordinación) -> en_revision_voae -> aprobado_voae -> publicado.
     "rechazado" puede pasar en el paso de Coordinación o de VOAE. Solo el autor ve sus
     propias publicaciones que no estén en "publicado". */
  estado?: "pendiente" | "en_revision_voae" | "aprobado_voae" | "publicado" | "rechazado";
  motivoRechazo?: string | null;
}

/* ─── SEGURIDAD Y VALIDACIONES (XSS & SQLi) ─── */
function sanitizeHTML(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function hasSQLi(text: string): boolean {
  if (!text) return false;
  // Bloquear palabras clave y patrones de Inyección SQL comunes
  const sqliRegex = /\b(select|union|drop|insert|delete|update|alter|create|truncate|from|where|or\s+\d+=\d+|--)\b/i;
  return sqliRegex.test(text);
}

function isValidInput(text: string): boolean {
  if (!text) return true;
  // Bloquear caracteres sospechosos de inyección de código/script
  const forbiddenChars = /[<>;=\\{}]/;
  return !forbiddenChars.test(text);
}

function parseSavedAt(savedAt?: string): number {
  if (!savedAt) return 0;
  const parts = savedAt.split(' ');
  const datePart = parts[0];
  const timePart = parts[1];
  const ampmPart = parts[2];

  const dateParts = datePart.split('/');
  if (dateParts.length !== 3) return 0;
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
  const year = parseInt(dateParts[2], 10);

  let hours = 0;
  let minutes = 0;
  if (timePart) {
    const timeParts = timePart.split(':');
    hours = parseInt(timeParts[0], 10);
    minutes = parseInt(timeParts[1], 10);
    if (ampmPart === 'PM' && hours < 12) hours += 12;
    if (ampmPart === 'AM' && hours === 12) hours = 0;
  }

  return new Date(year, month, day, hours, minutes).getTime();
}

/* Elimina publicaciones/eventos repetidos (mismo tipo + mismo título), conservando solo uno.
   Se usa al cargar desde localStorage y antes de insertar nuevos posts para evitar duplicados visibles. */
function dedupePosts(list: Post[]): Post[] {
  const seen = new Set<string>();
  const result: Post[] = [];
  for (const p of list) {
    const key = `${p.type}::${p.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}

const getPostUserAvatar = (post: Post): string => {
  if (post.profilePic && typeof post.profilePic === "string" && (post.profilePic.startsWith("http://") || post.profilePic.startsWith("https://") || post.profilePic.startsWith("data:image/") || post.profilePic.startsWith("/"))) {
    return post.profilePic;
  }
  if (post.author === "Camel García") return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
  if (post.author === "Valeria Rojas") return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80";
  if (post.author === "Carlos Mendoza") return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";
  if (post.author === "Puma Head") return "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80";
  if (post.author === "Miguel Torres") return "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80";
  if (post.author === "VOAE") return "/puma-icon.png";
  if (post.author === "Comunidad Académica UNAH") return "/puma-icon.png";
  if (post.author === "Conecta Puma") return "/puma-icon.png";
  return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
};

const getCommentUserAvatar = (comment: Comment): string => {
  const author = comment.author;
  if (author === "Camel García") return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
  if (author === "Valeria Rojas") return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80";
  if (author === "Carlos Mendoza") return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";
  if (author === "Puma Head") return "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80";
  if (author === "Miguel Torres") return "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80";
  if (author === "Laura Paz") return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80";
  if (author === "VOAE") return "/puma-icon.png";
  if (author === "Comunidad Académica UNAH") return "/puma-icon.png";
  if (author === "Conecta Puma") return "/puma-icon.png";
  if (author === "Yo") return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

  if (comment.authorPic && typeof comment.authorPic === "string" && (comment.authorPic.startsWith("http://") || comment.authorPic.startsWith("https://") || comment.authorPic.startsWith("data:image/") || comment.authorPic.startsWith("/"))) {
    return comment.authorPic;
  }
  return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
};

const getPostImages = (post: Post): string[] => {
  if (post.images && post.images.length > 0) {
    const validImages = post.images.filter(img => img && typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:image/") || img.startsWith("/")));
    if (validImages.length > 0) return validImages;
  }
  if (post.id === 1 || post.scope === "Academico") return ["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80"];
  if (post.id === 2) return ["https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"];
  if (post.id === 3 || post.scope === "Deportivo") return ["https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=600&q=80"];
  if (post.id === 4 || post.scope === "Cultural") return ["https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80"];
  return ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80"];
};

interface Notification { id: string; icon: string; text: string; time: string; unread: boolean; }

const ICONO_POR_TIPO_NOTIFICACION: Record<string, string> = {
  EVENTO_APROBADO: "📅",
  EVENTO_RECHAZADO: "📅",
  NUEVA_INSCRIPCION: "👤",
  EVENTO_CANCELADO: "📅",
  CONSTANCIA_EMITIDA: "📄",
  RECORDATORIO: "🔔",
  SISTEMA: "⚙️",
  REACCION_PUMITA: "❤️",
  SOLICITUD_PUMITA: "👤",
  EVENTO_DISPONIBLE: "📅",
};

function tiempoRelativoNotificacion(fechaIso: string): string {
  const diffMs = Date.now() - new Date(fechaIso).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return "Justo ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
}
type ActiveReaction = "love"|"like"|"dislike"|"angry"|"sad"|"haha"|"wow";

const EMOJIS: { key: ActiveReaction; icon: string; label: string }[] = [
  { key:"love",    icon:"/puma_love.png",    label:"Me encanta" },
  { key:"like",    icon:"/puma_like.png",    label:"Me gusta"   },
  { key:"haha",    icon:"/puma_haha.png",    label:"Jaja"        },
  { key:"wow",     icon:"/puma_wow.png",     label:"Asombro"     },
  { key:"sad",     icon:"/puma_sad.png",     label:"Triste"      },
  { key:"angry",   icon:"/puma_angry.png",   label:"Enojado"     },
  { key:"dislike", icon:"/puma_dislike.png", label:"No me gusta" },
];

const scopeIcons: Record<string,string>  = { Academico:"📖", Cultural:"🎭", Social:"🤝", Deportivo:"⚽" };
const scopeColors: Record<string,string> = { Academico:"scope-academico", Cultural:"scope-cultural", Social:"scope-social", Deportivo:"scope-deportivo" };

const initialPosts: Post[] = [];

interface PumitaRequest { id_conexion: number; id_usuario: number; nombre: string; }

/* Pools de contenido simulado para "Cargar más" — evita que se repita siempre el mismo evento/publicación */
const moreEventsPool: Omit<Post,"id"|"createdAt">[] = [];
const morePublicationsPool: Omit<Post,"id"|"createdAt">[] = [];

function getIniciales(nombre: string): string {
  return nombre.trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

const pumitasStories = [
  { name:"Tu estado", initials:"CA", online:true,  hasStory:false, isMe:true,  storyText:""                                  },
  { name:"Miguel",    initials:"MT", online:true,  hasStory:true,  isMe:false, storyText:"📚 Estudiando para el parcial..."   },
  { name:"Valeria",   initials:"VR", online:true,  hasStory:true,  isMe:false, storyText:"🎉 ¡Evento cultural mañana!"        },
  { name:"Ángela",    initials:"AR", online:false, hasStory:false, isMe:false, storyText:""                                  },
  { name:"Carlos",    initials:"CM", online:true,  hasStory:true,  isMe:false, storyText:"⚽ Torneo este viernes, ¡anímense!" },
  { name:"Puma Head", initials:"PH", online:true,  hasStory:false, isMe:false, storyText:""                                  },
];

/* ─── HELPERS ─── */
function getTotalReactions(post: Post) {
  return post.love + post.like + post.dislike + post.haha + post.wow + post.sad + post.angry;
}

function getReactionIcon(r: ActiveReaction | null): string {
  if (!r) return "🐾";
  return EMOJIS.find(e => e.key === r)?.icon || "🐾";
}

function getReactionLabel(r: ActiveReaction | null): string {
  if (!r) return "Reaccionar";
  return EMOJIS.find(e => e.key === r)?.label || "Reaccionar";
}

function getCommentTotalReactions(c: Comment) {
  const r = c.reactions || {};
  return (r.love||0)+(r.like||0)+(r.dislike||0)+(r.haha||0)+(r.wow||0)+(r.sad||0)+(r.angry||0);
}

/* ─── CONFETTI (no bloqueante) ───
   Overlay fijo, pointer-events:none: nunca intercepta clics ni navegación.
   Se desmonta automáticamente (el padre limpia confettiKey vía setTimeout),
   por lo que no requiere interacción del usuario ni recarga de pantalla. */
function ConfettiBurst({ confettiKey }: { confettiKey: number }) {
  const pieces = React.useMemo(() => {
    const colors = ["#FFD60A","#0B3D91","#1E88E5","#F2F2F2","#FFB703"];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1 + Math.random() * 0.6,
      rotate: Math.random() * 360,
      color: colors[i % colors.length],
    }));
  }, [confettiKey]);

  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:1200, overflow:"hidden" }}>
      {pieces.map(p => (
        <span key={p.id} style={{
          position:"absolute", top:-20, left:`${p.left}%`, width:8, height:14,
          background:p.color, borderRadius:2,
          animation:`confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          transform:`rotate(${p.rotate}deg)`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg);   opacity:1; }
          100% { transform: translateY(100vh) rotate(540deg); opacity:0; }
        }
      `}</style>
    </div>
  );
}

/* ─── STORIES BAR ─── */
function StoriesBar() {
  const [activeStory, setActiveStory] = useState<typeof pumitasStories[0] | null>(null);

  const handleClick = (p: typeof pumitasStories[0]) => {
    if (p.isMe) return; // "Tu estado" no abre nada por ahora
    if (!p.hasStory) return; // sin story no abre
    setActiveStory(p);
  };

  return (
    <>
      <div className="stories-bar">
        {pumitasStories.map((p,i)=>(
          <div key={i} className={`story-item${p.hasStory||p.isMe?" story-clickable":""}`}
            onClick={()=>handleClick(p)}>
            <div className={`story-ring${p.hasStory||p.isMe?" has-story":""}`}>
              <div className="story-ava">
                {p.isMe && <span className="story-plus">+</span>}
                {p.initials}
              </div>
            </div>
            <span className="story-name">{p.name}</span>
            {p.online && !p.isMe && <span className="story-online"/>}
          </div>
        ))}
      </div>

      {/* STORY VIEWER */}
      {activeStory && (
        <div className="story-overlay" onClick={()=>setActiveStory(null)}>
          <div className="story-viewer" onClick={e=>e.stopPropagation()}>
            <div className="story-viewer-bar"/>
            <button className="story-viewer-close" onClick={()=>setActiveStory(null)}>✕</button>
            <div className="story-viewer-ava">{activeStory.initials}</div>
            <div className="story-viewer-name">{activeStory.name}</div>
            <div className="story-viewer-text">{activeStory.storyText}</div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── TOAST ─── */
function Toast({ message }: { message: string }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, background:"var(--navy-mid)", color:"var(--white)",
      padding:"12px 20px", borderRadius:"var(--radius-sm)", borderLeft:"4px solid var(--yellow)",
      fontSize:13, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:999,
      border:"1px solid var(--navy-border)", transform:message?"translateY(0)":"translateY(80px)",
      opacity:message?1:0, transition:"all 0.3s" }}>
      {message}
    </div>
  );
}

/* ─── FLOATING REACTION BUTTON ─── */
function FloatingReactionBtn({ post, onReact }: {
  post: Post;
  onReact: (id: number, t: ActiveReaction) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = getTotalReactions(post);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
      {/* FLOATING EMOJI PICKER */}
      {open && (
        <div className="emoji-picker-float" style={{ padding: "8px 10px", gap: "4px" }}>
          {EMOJIS.map(e => (
            <button
              key={e.key}
              className={`emoji-pick-btn${post.userReaction === e.key ? " picked" : ""}`}
              onClick={() => { onReact(post.id, e.key); setOpen(false); }}
              title={e.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "4px 6px" }}
            >
              <span className="emoji-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px" }}>
                <img src={e.icon} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} alt={e.label} />
              </span>
              <span className="emoji-lbl" style={{ fontSize: "10px", fontWeight: "700" }}>{e.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* MAIN REACTION BUTTON */}
      <button
        className={`reaction-main-btn${post.userReaction ? " reacted" : ""}`}
        onClick={() => setOpen(v => !v)}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        {post.userReaction ? (
          <img src={getReactionIcon(post.userReaction)} style={{ width: "24px", height: "24px", objectFit: "contain", verticalAlign: "middle", mixBlendMode: "multiply" }} alt="reacción" />
        ) : (
          <span style={{ fontSize: "16px" }}>🐾</span>
        )}
        {post.userReaction && (
          <span className="reaction-btn-label" style={{ fontSize: "12px", fontWeight: "700", color: "#003366" }}>
            {getReactionLabel(post.userReaction)}
          </span>
        )}
        {total > 0 && <span className="reaction-count" style={{ marginLeft: "4px" }}>{total}</span>}
      </button>
    </div>
  );
}

function CommentReactionBtn({ comment, onReact }: {
  comment: Comment;
  onReact: (t: ActiveReaction) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = getCommentTotalReactions(comment);
  const userReaction = comment.userReaction || null;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {open && (
        <div className="emoji-picker-float" style={{ padding: "6px 8px", gap: "2px", bottom: "26px" }}>
          {EMOJIS.map(e => (
            <button
              key={e.key}
              className={`emoji-pick-btn${userReaction === e.key ? " picked" : ""}`}
              onClick={() => { onReact(e.key); setOpen(false); }}
              title={e.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "3px 4px" }}
            >
              <span className="emoji-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px" }}>
                <img src={e.icon} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} alt={e.label} />
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        className="comment-reply-btn"
        onClick={() => setOpen(v => !v)}
        style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: userReaction ? "#003366" : undefined, fontWeight: userReaction ? 800 : 700 }}
      >
        {userReaction ? (
          <>
            <img src={getReactionIcon(userReaction)} style={{ width: "13px", height: "13px", objectFit: "contain", mixBlendMode: "multiply" }} alt="reacción" />
            {getReactionLabel(userReaction)}
          </>
        ) : "Me gusta"}
        {total > 0 && <span className="reaction-count" style={{ marginLeft: "2px", fontSize: "9px", padding: "0 5px" }}>{total}</span>}
      </button>
    </div>
  );
}

/* ─── DETAIL MODAL — idéntico a imagen de referencia ─── */
function DetailModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const total = getTotalReactions(post);

  /* SVG icons que coinciden exactamente con la imagen */
  const IconPerson = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
  const IconFolder = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
  const IconMonitor = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
  const IconGlobe = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
  const IconThumb = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  );
  const IconClock = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  const IconCalendar = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
  const IconMapPin = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
  const IconUsers = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  const IconStopwatch = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 10"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
    </svg>
  );

  const metaItems = [
    { icon: <IconPerson />,  label: "RESPONSABLE", value: post.author.split(" ")[0] },
    { icon: <IconFolder />,  label: "CATEGORÍA",   value: post.type                  },
    { icon: <IconMonitor />, label: "ÁMBITO",       value: post.scope                 },
    { icon: <IconGlobe />,   label: "VISIBILIDAD",  value: post.visibility            },
    { icon: <IconThumb />,   label: "REACCIONES",   value: String(total)              },
    { icon: <IconClock />,   label: "PUBLICADO",    value: post.time                  },
  ];

  if (post.type === "Evento") {
    const hours = (post.voaeHoras && post.voaeHoras > 0) ? post.voaeHoras : ((post.id % 4) + 1);
    metaItems.push(
      { icon: <IconCalendar />, label: "FECHA", value: post.fecha || "No especificada" },
      { icon: <IconMapPin />,  label: "LUGAR", value: post.lugar || "No especificado" },
      { icon: <IconUsers />,   label: "CUPOS DISPONIBLES", value: post.cupos !== undefined ? `${post.cupos} disponibles` : "No especificados" },
      { icon: <IconStopwatch />, label: "HORAS A OBTENER", value: `${hours} horas` }
    );
  }

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-card" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="dmc-header">
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <IconMonitor />
            <span className="dmc-title">DETALLE DE LA ACTIVIDAD</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {post.saved && post.savedAt && (
              <span style={{ fontSize: 11, fontWeight: 800, background: "rgba(255, 209, 0, 0.18)", color: "#003366", padding: "5px 12px", borderRadius: 7 }}>
                🔖 Guardado: {post.savedAt}
              </span>
            )}
            <span className={`dmc-badge ${post.type==="Evento"?"dmc-badge-evento":"dmc-badge-pub"}`}>
              {post.type}
            </span>
            <button className="dmc-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Author row ── */}
        <div className="dmc-author-row">
          <div className="dmc-avatar">
            <img src={getPostUserAvatar(post)} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          </div>
          <div>
            <div className="dmc-post-title" style={{ fontSize: "18px", fontWeight: "900", color: "#003366" }}>{post.title}</div>
            <div className="dmc-post-meta" style={{ whiteSpace: "nowrap" }}>
              Publicado por <strong style={{color:"#003366"}}>{post.author}</strong> · {post.time}
            </div>
          </div>
        </div>

        {/* ── Imágenes adjuntas ── */}
        {getPostImages(post).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {getPostImages(post).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Imagen ${idx + 1}`}
                style={{
                  width: "100%",
                  maxHeight: "350px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0"
                }}
              />
            ))}
          </div>
        )}

        {/* ── Descripción ── */}
        <div className="dmc-section-label">DESCRIPCIÓN</div>
        <div className="dmc-desc-box" style={{ whiteSpace: "pre-wrap" }}>{post.desc}</div>

        {/* ── Tags ── */}
        <div className="dmc-tags">
          {post.tags.map(t => (
            <span key={t} className="dmc-tag">{t}</span>
          ))}
        </div>

        {/* ── Meta grid 2×3 ── */}
        <div className="dmc-meta-grid">
          {metaItems.map((m, i) => (
            <div key={i} className="dmc-meta-item">
              <div className="dmc-meta-icon-wrap">{m.icon}</div>
              <div>
                <div className="dmc-meta-label">{m.label}</div>
                <div className="dmc-meta-val">{m.value}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ─── EVENT DRAWER ─── */
function EventDrawer({ post, onClose, onInscribir, isLoggedIn }:
  { post:Post; onClose:()=>void; onInscribir:(id:number)=>void; isLoggedIn:boolean }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e=>e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span className={`drawer-scope ${scopeColors[post.scope]||""}`}>{scopeIcons[post.scope]} {post.scope}</span>
            <h2 className="drawer-title">{post.title}</h2>
            <p className="drawer-author">Por {post.author} · {post.time}</p>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          <p className="drawer-desc">{post.desc}</p>
          <div className="drawer-meta-grid">
            {post.fecha && <div className="drawer-meta-item"><span className="drawer-meta-icon">📅</span><div><div className="drawer-meta-label">Fecha</div><div className="drawer-meta-val">{post.fecha}</div></div></div>}
            {post.lugar && <div className="drawer-meta-item"><span className="drawer-meta-icon">📍</span><div><div className="drawer-meta-label">Lugar</div><div className="drawer-meta-val">{post.lugar}</div></div></div>}
            {post.cupos!==undefined && <div className="drawer-meta-item"><span className="drawer-meta-icon">👥</span><div><div className="drawer-meta-label">Cupos</div><div className="drawer-meta-val">{post.cupos} disponibles</div></div></div>}
          </div>
          <div className="drawer-tags">{post.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
          {post.topInscritos && post.topInscritos.length>0 && (
            <div className="drawer-top-inscritos">
              <div className="drawer-section-label">👑 Top inscritos</div>
              {post.topInscritos.map((u,i)=>(
                <div key={i} className="top-inscrito-item">
                  <div className="author-ava">{u.initials}</div>
                  <span className="top-inscrito-name">{u.name}</span>
                  {i===0&&<span>🥇</span>}{i===1&&<span>🥈</span>}{i===2&&<span>🥉</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="drawer-footer">
          {isLoggedIn
            ? <button className={`btn-inscribir${post.inscrito?" inscrito":""}`} onClick={()=>onInscribir(post.id)}>
                {post.inscrito?"✅ Inscrito":"📋 Inscribirme"}
              </button>
            : <p className="drawer-login-hint">🔒 <a href="#" className="drawer-login-link">Inicia sesión</a> para inscribirte</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── POST CARD ─── */
function PostCard({ post, onReact, onToggleComments, onAddComment, onReactComment, onReportComment, onReportPublicacion, onHide, onUnhide, onSave, onShare,
  onOpenDrawer, onInscribir, onOpenDetail, onEdit, openCommentIds, isLoggedIn, showOnlySaved, showHiddenOnly }:
  { post:Post; onReact:(id:number,t:ActiveReaction)=>void; onToggleComments:(id:number)=>void;
    onAddComment:(id:number,text:string,replyTo?:string,parentId?:number,replyToText?:string)=>void;
    onReactComment:(postId:number,commentId:number,t:ActiveReaction)=>void;
    onReportComment:(commentId:number)=>void;
    onReportPublicacion:(publicacionId:number)=>void;
    onHide:(id:number)=>void; onUnhide:(id:number)=>void; onSave:(id:number)=>void; onShare:(id:number)=>void;
    onOpenDrawer:(p:Post)=>void; onInscribir:(id:number)=>void; onOpenDetail:(p:Post)=>void;
    onEdit:(p:Post)=>void;
    openCommentIds:Set<number>; isLoggedIn:boolean; showOnlySaved?:boolean; showHiddenOnly?:boolean }) {

  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ author: string; parentId: number; text: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isEvento = post.type === "Evento";
  const commentsOpen = openCommentIds.has(post.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentName = authService.getUsuarioGuardado()?.nombre ?? sessionStorage.getItem('unah_display_name') ?? '';
  const esMiPublicacion = post.author === currentName || post.author === 'Valeria Estrada';

  // Cerrar menú al hacer click fuera
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const addComment = () => {
    const t = commentInput.trim(); if(!t) return;
    onAddComment(post.id, t, replyingTo?.author || undefined, replyingTo?.parentId || undefined, replyingTo?.text || undefined);
    setCommentInput(""); setReplyingTo(null); setShowEmojiPicker(false);
  };

  return (
    <div className="post-card" id={`card-${post.id}`}>
      {showOnlySaved && post.saved && post.savedAt && (
        <div className="saved-at-badge">
          <span>🔖</span> Guardado el: {post.savedAt}
        </div>
      )}

      <div className="post-header">
        <div className="post-avatar">
          <img src={getPostUserAvatar(post)} className="post-avatar-img" />
        </div>
        <div className="post-author">
          <div className="post-author-name">{post.author}</div>
          <div className="post-meta">
            <span className={scopeColors[post.scope]||""}>{scopeIcons[post.scope]}</span>
            <span style={{color:"var(--white)",marginLeft:4}}>{post.scope}</span>
            <span style={{color:"var(--navy-border)",margin:"0 4px"}}>·</span>
            <span>🕐 {post.time}</span>
          </div>
        </div>
        {/* ⋮ Menú vertical (solo Eventos) — oculta el post sin eliminarlo del DOM */}
        {showHiddenOnly ? (
          <button className="post-hide-btn" onClick={() => onUnhide(post.id)} title={isEvento ? "Restaurar evento" : "Restaurar publicación"}>♻️</button>
        ) : isEvento ? (
          <div ref={menuRef} style={{ position:"relative" }}>
            <button
              className="post-menu-btn post-dots-btn"
              onClick={() => setMenuOpen(v => !v)}
              title="Opciones"
            >⋮</button>
            {menuOpen && (
              <div className="post-menu open">
                {esMiPublicacion && (
                  <div className="post-menu-item" onClick={() => { onEdit(post); setMenuOpen(false); }}>
                    ✏️ Editar
                  </div>
                )}
                <div className="post-menu-item" onClick={() => { onHide(post.id); setMenuOpen(false); }}>
                  🙈 Ocultar evento
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="post-hide-btn" onClick={() => onHide(post.id)} title="Ocultar publicación">✕</button>
        )}
      </div>

      <div className="post-body">
        <span className={`post-type-badge ${isEvento?"badge-evento":"badge-publicacion"}`}>
          {isEvento?"📅 Evento":"📢 Publicación"}
        </span>
        {post.estado === "pendiente" && (
          <span className="post-type-badge" style={{background:"rgba(255,209,0,0.18)",color:"#8a6d00",marginLeft:6}}>
            ⏳ Pendiente de revisión (Coordinación)
          </span>
        )}
        {post.estado === "en_revision_voae" && (
          <span className="post-type-badge" style={{background:"rgba(0,75,135,0.15)",color:"#004B87",marginLeft:6}}>
            📨 En revisión de VOAE
          </span>
        )}
        {post.estado === "aprobado_voae" && (
          <span className="post-type-badge" style={{background:"rgba(34,197,94,0.15)",color:"#15803d",marginLeft:6}}>
            ✅ Aprobada por VOAE — esperando publicación
          </span>
        )}
        {post.estado === "rechazado" && (
          <span className="post-type-badge" style={{background:"rgba(239,68,68,0.12)",color:"#b91c1c",marginLeft:6}} title={post.motivoRechazo || undefined}>
            ✖️ Solicitud no aprobada
          </span>
        )}
        <div className="post-title" style={{ cursor: "pointer", color: "var(--white)" }} onClick={() => onOpenDetail(post)}>
          {post.title}
        </div>
        <div className="post-desc" style={{ whiteSpace: "pre-wrap" }}>{post.desc}</div>

        {getPostImages(post).length > 0 && (
          <div className={`post-images-grid grid-${getPostImages(post).length}`}>
            {getPostImages(post).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Imagen ${idx + 1}`}
                className="post-image-item"
                onClick={() => onOpenDetail(post)}
              />
            ))}
          </div>
        )}



        <div className="post-tags">{post.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>

        {/* ── BARRA DE ACCIONES ── */}
        {isEvento ? (
          /* ── BARRA EVENTO: diseño imagen de referencia ── */
          <div className="post-reactions post-reactions-evento">
            {/* Izquierda: Reaccionar + Comentario */}
            <FloatingReactionBtn post={post} onReact={onReact} />
            <button className={`action-icon-btn${commentsOpen?" active-comment":""}`} onClick={()=>onToggleComments(post.id)}>
              <span>💬</span>
              {post.comments.length > 0 && <span style={{fontSize:11}}>{post.comments.length}</span>}
            </button>

            <div className="reaction-spacer" />

            {/* Centro: botón + naranja circular */}
            <button
              className={`btn-evento-join${post.inscrito?" joined":""}`}
              onClick={()=>onInscribir(post.id)}
              title={post.inscrito?"Inscrito":"Inscribirse al evento"}
            >
              {post.inscrito ? "✓" : "+"}
            </button>

            {/* Derecha: Ver Detalle, guardar (lápiz), Compartir, WhatsApp */}
            

            <button className={`btn-evento-icon${post.saved?" saved":""}`} onClick={()=>onSave(post.id)} title={post.saved?"Guardado":"Guardar"}>
              🔖{post.saved && <span style={{color:"#B8860B", fontWeight:700, fontSize:12, marginLeft:4}}>Guardado</span>}
            </button>

            <button className="btn-evento-action" onClick={() => onShare(post.id)} title="Copiar enlace">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:3}}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Compartir
            </button>

            <button
              className="btn-evento-whatsapp"
              onClick={() => {
                const text = `¡Mira esta publicación en el muro de UNAH!: "${post.title}" - ${window.location.origin}/post/${post.id}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              title="Compartir por WhatsApp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
          </div>
        ) : (
          /* ── BARRA PUBLICACIÓN: diseño imagen referencia ── */
          <div className="post-reactions post-reactions-evento">
            <FloatingReactionBtn post={post} onReact={onReact} />
            <button className={`action-icon-btn${commentsOpen?" active-comment":""}`} onClick={()=>onToggleComments(post.id)}>
              <span>💬</span>
              {post.comments.length > 0 && <span style={{fontSize:11}}>{post.comments.length}</span>}
            </button>
            <button className="action-icon-btn" style={{ color: "#b91c1c" }} onClick={() => onReportPublicacion(post.id)}>
              <span>🚩</span>
            </button>
            <button
              className="btn-evento-whatsapp"
              onClick={() => {
                const text = `¡Mira esta publicación en el muro de UNAH!: "${post.title}" - https://mipumaapp.unah.edu.hn/post/${post.id}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
              }}
              title="Compartir por WhatsApp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button className="btn-evento-action" onClick={() => onShare(post.id)} title="Copiar enlace">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:3}}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Compartir
            </button>
            <button
              className={`btn-pub-save${post.saved?" saved":""}`}
              onClick={()=>onSave(post.id)}
              title={post.saved?"Guardado":"Guardar"}
            >
              🔖{post.saved && <span style={{color:"#B8860B", fontWeight:700, fontSize:12, marginLeft:4}}>Guardado</span>}
            </button>
          </div>
        )}
      </div>

      {commentsOpen && (
        <div className="comment-section">
          <div className="comment-list">
            {post.comments.filter(c => !c.parentId).map(parent => {
              const replies = post.comments.filter(c => c.parentId === parent.id);
              return (
                <div key={parent.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Parent Comment */}
                  <div className="comment-item">
                    <div className="comment-ava" style={{ overflow: "hidden" }}>
                      <img src={getCommentUserAvatar(parent)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div className="comment-bubble-wrap">
                      <div className="comment-bubble">
                        <div className="comment-author">{parent.author}</div>
                        <div className="comment-text">{parent.text}</div>
                        <div className="comment-time">{parent.time}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CommentReactionBtn comment={parent} onReact={(t) => onReactComment(post.id, parent.id, t)} />
                        <button className="comment-reply-btn" onClick={() => setReplyingTo({ author: parent.author, parentId: parent.id, text: parent.text })}>Responder</button>
                        <button className="comment-reply-btn" style={{ color: "#b91c1c" }} onClick={() => onReportComment(parent.id)}>Reportar</button>
                      </div>
                    </div>
                  </div>

                  {/* Replies (Nested Level 1) */}
                  {replies.map(reply => (
                    <div key={reply.id} className="comment-item" style={{ marginLeft: "36px", borderLeft: "2px dashed var(--navy-border)", paddingLeft: "10px", marginTop: "4px" }}>
                      <div className="comment-ava" style={{ width: "24px", height: "24px", fontSize: "9px", overflow: "hidden" }}>
                        <img src={getCommentUserAvatar(reply)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div className="comment-bubble-wrap">
                        <div className="comment-bubble" style={{ padding: "6px 10px" }}>
                          <div className="comment-author">{reply.author}</div>
                          {/* WhatsApp-Style Quote inside Bubble */}
                          {reply.replyTo && (
                            <div style={{
                              background: "rgba(0,51,102,0.04)",
                              borderLeft: "3px solid #003366",
                              padding: "6px 10px",
                              borderRadius: "4px",
                              marginBottom: "6px",
                              fontSize: "11px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px"
                            }}>
                              <strong style={{ color: "#003366" }}>{reply.replyTo}</strong>
                              <span style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: "#555"
                              }}>
                                {reply.replyToText || post.comments.find(c => c.author === reply.replyTo)?.text || "Mensaje original"}
                              </span>
                            </div>
                          )}
                          <div className="comment-text">{reply.text}</div>
                          <div className="comment-time">{reply.time}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <CommentReactionBtn comment={reply} onReact={(t) => onReactComment(post.id, reply.id, t)} />
                          <button className="comment-reply-btn" onClick={() => setReplyingTo({ author: reply.author, parentId: parent.id, text: reply.text })}>Responder</button>
                          <button className="comment-reply-btn" style={{ color: "#b91c1c" }} onClick={() => onReportComment(reply.id)}>Reportar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* WhatsApp-style reply preview bar */}
          {replyingTo && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(0,51,102,0.05)",
              borderLeft: "4px solid #003366",
              padding: "8px 12px",
              borderRadius: "6px",
              marginBottom: "8px",
              animation: "fadeScale 0.15s ease-out"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px", flex: 1, overflow: "hidden" }}>
                <strong style={{ color: "#003366" }}>Respondiendo a {replyingTo.author}</strong>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#666" }}>
                  {replyingTo.text}
                </span>
              </div>
              <button onClick={() => setReplyingTo(null)} style={{ background: "none", border: "none", fontSize: "14px", color: "#aaa", cursor: "pointer", marginLeft: "10px" }}>✕</button>
            </div>
          )}

          {/* Emoji Toolbar */}
          {showEmojiPicker && (
            <div className="comment-emojis-row" style={{ display: "flex", gap: "6px", marginBottom: "6px", overflowX: "auto", padding: "2px 0", animation: "fadeScale 0.15s ease-out" }}>
              {["😊", "😂", "❤️", "👍", "🎉", "🐾", "😻", "😹", "😿", "😾"].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setCommentInput(prev => prev + emoji)}
                  style={{
                    background: "var(--navy-light)",
                    border: "1.5px solid var(--navy-border)",
                    borderRadius: "50%",
                    width: "26px",
                    height: "26px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "transform 0.1s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="comment-input-row">
            <div className="comment-input-wrap" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                className="comment-emoji-toggle-btn"
                onClick={() => setShowEmojiPicker(v => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0 2px 2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#003366",
                  transition: "opacity 0.2s"
                }}
                title="Emojis"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: showEmojiPicker ? 1 : 0.6 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
              <input className="comment-input" value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder={replyingTo ? "Escribe una respuesta..." : "Escribe un comentario..."}
                onKeyDown={e => { if (e.key === "Enter") addComment(); }} />
            </div>
            <button className="comment-send" onClick={addComment}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── NEW POST MODAL ─── */
function NewPostModal({ onClose, onCreate }: {
  onClose:()=>void;
  onCreate:(d:{title:string;desc:string;type:"Evento"|"Publicacion";scope:string;tags:string[];fecha?:string;lugar?:string;cupos?:number;images?:string[]})=>void;
}) {
  const [title,setTitle]=useState(""); 
  const [desc,setDesc]=useState("");
  const [tagsRaw,setTagsRaw]=useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // Emoji visibility
  const [showTitleEmojis, setShowTitleEmojis] = useState(false);
  const [showDescEmojis, setShowDescEmojis] = useState(false);

  // Tag suggestions state
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagStartIndex, setTagStartIndex] = useState(-1);

  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  
  const CONNECTIONS = [
    { name: "Camel García", initials: "CG" },
    { name: "Valeria Rojas", initials: "VR" },
    { name: "Miguel Torres", initials: "MT" },
    { name: "Puma Head", initials: "PH" },
  ];

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTagsRaw(val);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const queryText = textBeforeCursor.substring(lastAtIdx + 1);
      if (!queryText.includes(' ') && !queryText.includes('\n') && !queryText.includes(',')) {
        setShowTagSuggestions(true);
        setTagSearchQuery(queryText.toLowerCase());
        setTagStartIndex(lastAtIdx);
        return;
      }
    }
    setShowTagSuggestions(false);
  };

  const handleSelectTag = (name: string) => {
    if (tagStartIndex === -1) return;
    const textBeforeAt = tagsRaw.substring(0, tagStartIndex);
    const textAfterAt = tagsRaw.substring(tagStartIndex + tagSearchQuery.length + 1);
    const newTags = `${textBeforeAt}@${name} ${textAfterAt}`;
    setTagsRaw(newTags);
    setShowTagSuggestions(false);
    
    setTimeout(() => {
      if (tagsRef.current) {
        tagsRef.current.focus();
        const newCursorPos = tagStartIndex + name.length + 2;
        tagsRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remaining = 3 - selectedImages.length;
    if (remaining <= 0) return;

    // Tomar solo la cantidad de imágenes permitida
    const filesToLoad = Array.from(files).slice(0, remaining);

    const newImagesPromise = filesToLoad.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImagesPromise).then(base64s => {
      setSelectedImages(prev => [...prev, ...base64s]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const create=()=>{
    if(!title.trim()){alert("⚠️ Título obligatorio");return;}
    onCreate({
      title: title.trim(),
      desc: desc.trim(),
      type: "Publicacion",
      scope: "Social",
      tags: tagsRaw.split(",").map(t=>t.trim()).filter(Boolean),
      images: selectedImages
    });
    onClose();
  };

  const inp: React.CSSProperties = { width:"100%", border:"1.5px solid var(--navy-border)", background:"var(--navy)",
    borderRadius:"var(--radius-sm)", padding:"9px 12px", fontSize:14, color:"var(--white)", outline:"none", marginBottom:12 };
  const lbl: React.CSSProperties = { fontSize:12, fontWeight:700, color:"var(--text-secondary)", display:"block", marginBottom:4 };

  return (
    <div style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,51,102,0.4)",zIndex:200,alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"var(--navy-mid)",borderRadius:"var(--radius)",padding:28,width:500,maxWidth:"95vw",
        boxShadow:"0 16px 48px rgba(0,0,0,0.15)",border:"1px solid var(--navy-border)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontSize:18,fontWeight:800,color:"var(--white)",marginBottom:6}}>+ Nueva Publicación</h2>
        <div style={{fontSize:12,color:"var(--text-secondary)",marginBottom:16,lineHeight:1.5}}>
          📨 Tu publicación no se muestra de inmediato: se envía como <b>solicitud a Coordinación</b>, quien la remite a <b>VOAE</b> para su autorización.
          Una vez aprobada, Coordinación la publica y te llega una notificación.
        </div>
        
        <label style={lbl}>TÍTULO</label>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: 12 }}>
          <input type="text" placeholder="Título..." value={title} onChange={e=>setTitle(e.target.value)} style={{ ...inp, marginBottom: 0, flex: 1 }} />
          <button
            type="button"
            onClick={() => setShowTitleEmojis(v => !v)}
            style={{
              background: "none",
              border: "1.5px solid var(--navy-border)",
              borderRadius: "var(--radius-sm)",
              padding: "9px 12px",
              cursor: "pointer",
              fontSize: 16
            }}
          >
            😊
          </button>
        </div>
        {showTitleEmojis && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            background: "var(--navy-light)",
            border: "1px solid var(--navy-border)",
            padding: "8px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "12px",
            marginTop: "-8px"
          }}>
            {["😊", "😂", "🤣", "❤️", "👍", "🎉", "🔥", "🚀", "🎓", "🙌", "✨", "👀", "💻", "📚", "💡", "🎨", "🌟", "👏", "✔️", "🚩"].map(emoji => (
              <button
                key={emoji}
                onClick={() => { setTitle(prev => prev + emoji); setShowTitleEmojis(false); }}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div>
          <label style={lbl}>DESCRIPCIÓN</label>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: 12 }}>
            <textarea
              ref={descRef}
              rows={3}
              placeholder="Describe..."
              value={desc}
              onChange={e=>setDesc(e.target.value)}
              style={{ ...inp, resize: "none", fontFamily: "inherit", marginBottom: 0, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowDescEmojis(v => !v)}
              style={{
                background: "none",
                border: "1.5px solid var(--navy-border)",
                borderRadius: "var(--radius-sm)",
                padding: "9px 12px",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              😊
            </button>
          </div>
          {showDescEmojis && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              background: "var(--navy-light)",
              border: "1px solid var(--navy-border)",
              padding: "8px",
              borderRadius: "var(--radius-sm)",
              marginBottom: "12px",
              marginTop: "-8px"
            }}>
              {["😊", "😂", "🤣", "❤️", "👍", "🎉", "🔥", "🚀", "🎓", "🙌", "✨", "👀", "💻", "📚", "💡", "🎨", "🌟", "👏", "✔️", "🚩"].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { setDesc(prev => prev + emoji); setShowDescEmojis(false); }}
                  style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <label style={lbl}>IMÁGENES (máx. 3)</label>
        <label
          htmlFor={selectedImages.length >= 3 ? undefined : "file-upload"}
          className="custom-file-upload"
          style={{
            opacity: selectedImages.length >= 3 ? 0.5 : 1,
            cursor: selectedImages.length >= 3 ? "not-allowed" : "pointer",
            pointerEvents: selectedImages.length >= 3 ? "none" : "auto",
            borderColor: selectedImages.length >= 3 ? "#cbd5e1" : undefined
          }}
        >
          <span>📤 Seleccionar imágenes...</span>
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
          disabled={selectedImages.length >= 3}
        />
        {selectedImages.length > 0 && (
          <div className="image-preview-grid">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="image-preview-container">
                <img src={img} alt={`Preview ${idx}`} className="image-preview-img" />
                <button type="button" onClick={() => handleRemoveImage(idx)} className="image-preview-remove">✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <label style={lbl}>ETIQUETAS (separadas por coma)</label>
          <input
            ref={tagsRef}
            type="text"
            placeholder="#Tema1, #Tema2"
            value={tagsRaw}
            onChange={handleTagsChange}
            style={{ ...inp, marginBottom: 18 }}
          />
          {showTagSuggestions && (
            <div className="tag-suggestions-dropdown" style={{ top: "calc(100% - 14px)" }}>
              {CONNECTIONS.filter(c => c.name.toLowerCase().includes(tagSearchQuery)).map(c => (
                <div
                  key={c.name}
                  className="tag-suggestion-item"
                  onClick={() => handleSelectTag(c.name)}
                >
                  <span className="tag-avatar">{c.initials}</span>
                  <span className="tag-name">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"none",border:"1.5px solid var(--navy-border)",borderRadius:"var(--radius-sm)",
            padding:"9px 18px",fontSize:13,fontWeight:600,color:"var(--text-secondary)",cursor:"pointer"}}>Cancelar</button>
          <button className="btn-primary" onClick={create}>Enviar solicitud</button>
        </div>
      </div>
    </div>

  );
}



/* ─── MAIN FEED ─── */
export default function Feed({ showOnlySaved = false }: { showOnlySaved?: boolean }) {
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("unah_posts");
    let loadedPosts: Post[] = saved ? JSON.parse(saved) : [...initialPosts];
    
    // Ensure mock profilePic and images are updated/synced from initialPosts
    loadedPosts = loadedPosts.map(p => {
      const initial = initialPosts.find(ip => ip.id === p.id);
      if (initial) {
        return {
          ...p,
          profilePic: initial.profilePic,
          images: p.images && p.images.length > 0 && p.images.every(img => img && img.trim() !== "" && img !== "undefined") ? p.images : initial.images
        };
      }
      if (p.author === "Miguel Torres") {
        return {
          ...p,
          profilePic: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
          images: p.images && p.images.length > 0 && p.images.every(img => img && img.trim() !== "" && img !== "undefined") ? p.images : ["https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80"]
        };
      }
      return p;
    });

    // Cleanup legacy saved state for ID 1 and ID 3 if they match the default legacy saved dates
    loadedPosts = loadedPosts.map(p => {
      if ((p.id === 1 && p.savedAt === "24/06/2026 07:30 PM") || 
          (p.id === 3 && p.savedAt === "24/06/2026 06:15 PM")) {
        return { ...p, saved: false, savedAt: undefined };
      }
      return p;
    });

    // Ensure the 3 mock saved publications from Perfil.tsx are present in the list
    const mockSavedIds = [101, 102, 103];
    mockSavedIds.forEach(id => {
      const mockPost = initialPosts.find(p => p.id === id);
      if (mockPost) {
        const index = loadedPosts.findIndex(lp => lp.id === id);
        if (index === -1) {
          loadedPosts.push(mockPost);
        } else {
          // Overwrite/update fields of mock posts to ensure they match initialPosts exactly
          loadedPosts[index] = {
            ...loadedPosts[index],
            saved: true,
            savedAt: mockPost.savedAt,
            createdAt: mockPost.createdAt,
            time: mockPost.time
          };
        }
      }
    });

    // Ensure all missing default posts from initialPosts are pushed/added to loadedPosts
    initialPosts.forEach(ip => {
      if (!loadedPosts.some(lp => lp.id === ip.id)) {
        loadedPosts.push(ip);
      }
    });

    // Migración de una sola vez: refresca reacciones/comentarios/voaeHoras de demo
    // en publicaciones/eventos "de fábrica" sin borrar interacciones reales del usuario
    // en posts ya modificados por él (solo aplica una vez por versión de datos semilla).
    const SEED_VERSION = "6";
    if (localStorage.getItem("unah_seed_version") !== SEED_VERSION) {
      localStorage.removeItem("unah_posts");
      loadedPosts = [];
      localStorage.setItem("unah_seed_version", SEED_VERSION);
    }

    // Sync with unah_events (AvailableEvents)
    const savedEvents = localStorage.getItem("unah_events");
    if (savedEvents) {
      try {
        const eventsList = JSON.parse(savedEvents);
        loadedPosts = loadedPosts.map(p => {
          if (p.type === "Evento") {
            const match = eventsList.find((ev: any) => ev.TITULO_EVENTO.trim().toLowerCase() === p.title.trim().toLowerCase());
            if (match) {
              return {
                ...p,
                inscrito: match.INSCRITO,
                cupos: match.CUPOS_DISPONIBLES
              };
            }
          }
          return p;
        });
      } catch(e) {}
    }

    return dedupePosts(loadedPosts);
  });

  const { notificaciones: notificacionesReales, marcarLeida: marcarNotificacionLeidaAPI, marcarTodasLeidas } = useNotificaciones();

  const notifications: Notification[] = notificacionesReales.map((n) => ({
    id: n.id,
    icon: ICONO_POR_TIPO_NOTIFICACION[n.tipo] ?? "🔔",
    text: n.mensaje,
    time: tiempoRelativoNotificacion(n.created_at),
    unread: !n.leida,
  }));

  const [mostrarHistorialNotificaciones, setMostrarHistorialNotificaciones] = useState(false);
  const [busquedaNotificaciones, setBusquedaNotificaciones] = useState("");

  const [activeFilter,setActiveFilter]=useState("Todas");
  const [sortValue,setSortValue]=useState("reciente");
  const [openCommentIds,setOpenCommentIds]=useState<Set<number>>(new Set());
  const [notiOpen,setNotiOpen]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [toast,setToast]=useState("");

  const [searchQuery,setSearchQuery]=useState("");
  const [drawerPost,setDrawerPost]=useState<Post|null>(null);
  const [detailPost,setDetailPost]=useState<Post|null>(null);   // modal detalle
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isLoggedIn]=useState(true);
  const [showHiddenOnly,setShowHiddenOnly]=useState(false);
  const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  // ── Pumitas Conectados: datos reales desde el backend ──
  const [connectedPumitas, setConnectedPumitas] = useState<Pumita[]>([]);
  const [pumitaRequests, setPumitaRequests] = useState<PumitaRequest[]>([]);
  // ids de solicitudes con una respuesta al servidor en curso (para deshabilitar solo esos botones)
  const [pumitaRequestLoading, setPumitaRequestLoading] = useState<Set<number>>(new Set());
  // controla la animación de celebración (confeti) — overlay no bloqueante
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargarPumitasReales = async () => {
    try {
      const [conexiones, pendientes] = await Promise.all([
        pumitasService.listarConexiones(),
        pumitasService.listarPendientes(),
      ]);
      setConnectedPumitas(conexiones);
      setPumitaRequests(
        pendientes.map((p) => ({ id_conexion: p.id_conexion!, id_usuario: p.id_usuario, nombre: p.nombre }))
      );
    } catch (error) {
      console.error('No se pudieron cargar los Pumitas conectados', error);
    }
  };

  useEffect(() => {
    cargarPumitasReales();
  }, []);

  // Cargar eventos, publicaciones, comentarios y reacciones reales de la base de datos
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [dbEvents, dbComments, dbReactions, dbPubs, myEvents] = await Promise.all([
          eventosService.getAll().catch(() => []),
          comentarioService.getComentarios().catch(() => []),
          reaccionPostService.getReacciones().catch(() => ({ counts: [], userReactions: [] })),
          publicacionService.getPublicaciones().catch(() => []),
          grupo2EventosService.obtenerMisEventos().catch(() => [])
        ]);

        const mapCategoryToScope = (cat: string): string => {
          const lower = cat.toLowerCase();
          if (lower === 'academico') return 'Academico';
          if (lower === 'cultural') return 'Cultural';
          if (lower === 'deportivo') return 'Deportivo';
          if (lower === 'social') return 'Social';
          return 'Academico';
        };

        setPosts(prevPosts => {
          const syncedPosts: Post[] = [];

          // 1. Mapear publicaciones reales
          if (Array.isArray(dbPubs)) {
            dbPubs.forEach(pub => {
              const pubId = Number(pub.id);
              const prev = prevPosts.find(p => p.id === pubId && p.type === "Publicacion");
              
              syncedPosts.push({
                ...pub,
                saved: prev ? prev.saved : false,
                hidden: prev ? prev.hidden : false,
                userReaction: prev ? prev.userReaction : pub.userReaction,
              });
            });
          }

          // 2. Mapear eventos reales (solo aprobados o activos)
          if (Array.isArray(dbEvents)) {
            const approvedEvents = dbEvents.filter(evt => {
              const est = evt.estado as string;
              return est === 'PROGRAMADO' || 
                     est === 'EN_CURSO' || 
                     est === 'EN_CURSO_SALIDA' || 
                     est === 'FINALIZADO';
            });
            approvedEvents.forEach(evt => {
              const dbId = 10000 + Number(evt.id);
              const prev = prevPosts.find(p => p.id === dbId && p.type === "Evento");
              const mappedScope = mapCategoryToScope(evt.categoria);
              const isUserInscrito = Array.isArray(myEvents) && myEvents.some(me => Number(me.EVENTO_ID) === Number(evt.id) && me.INSCRITO === true);
              const inscrito = isUserInscrito;

              const mappedPost: Post = {
                id: dbId,
                author: "Organizador UNAH",
                initials: "OU",
                type: "Evento",
                scope: mappedScope,
                visibility: "Público",
                time: evt.created_at ? new Date(evt.created_at).toLocaleDateString() : "Reciente",
                title: evt.titulo,
                desc: evt.descripcion,
                tags: ["#UNAH", `#${mappedScope}`],
                love: 0,
                like: 0,
                dislike: 0,
                haha: 0,
                wow: 0,
                sad: 0,
                angry: 0,
                comments: [],
                userReaction: null,
                saved: false,
                hidden: false,
                fecha: evt.fecha_inicio ? evt.fecha_inicio.split('T')[0] : "2026-07-20",
                lugar: evt.ubicacion || evt.centro_regional || "Ciudad Universitaria",
                cupos: evt.cupo_maximo,
                inscrito: false,
                voaeHoras: evt.duracion_horas,
                topInscritos: [],
                images: evt.portada_url ? [evt.portada_url] : [],
                createdAt: evt.created_at ? new Date(evt.created_at).getTime() : Date.now(),
                profilePic: "/puma-icon.png"
              };

              syncedPosts.push({
                ...mappedPost,
                saved: prev ? prev.saved : false,
                hidden: prev ? prev.hidden : false,
                inscrito: inscrito,
                cupos: inscrito ? Math.max(0, mappedPost.cupos! - 1) : mappedPost.cupos,
                userReaction: prev ? prev.userReaction : null
              });
            });
          }

          // 3. Integrar comentarios de la base de datos
          let finalPosts = syncedPosts.map(post => {
            const postComments = dbComments.filter(c => {
              if (post.type === "Evento") {
                const dbEventId = Number(post.id) - 10000;
                return Number(c.id_evento) === dbEventId;
              } else {
                return Number(c.id_publicacion) === Number(post.id);
              }
            }).map(c => ({
              id: c.id,
              author: c.author,
              authorInitials: c.authorInitials,
              text: c.text,
              time: c.time,
              replyTo: c.replyTo,
              parentId: c.parentId,
              replyToText: c.replyToText,
              authorPic: c.authorPic
            }));

            const prev = prevPosts.find(p => p.id === post.id && p.type === post.type);
            const mergedComments = prev ? [...prev.comments] : [];
            postComments.forEach(pc => {
              const exists = mergedComments.some(mc => mc.id === pc.id || (mc.text === pc.text && mc.author === pc.author));
              if (!exists) {
                mergedComments.push(pc);
              }
            });

            return { ...post, comments: mergedComments };
          });

          // 4. Integrar reacciones de la base de datos
          if (dbReactions && Array.isArray(dbReactions.counts)) {
            finalPosts = finalPosts.map(post => {
              const isDbEvent = post.type === "Evento" && Number(post.id) > 10000;
              const isDbPub = post.type === "Publicacion";
              const dbEventId = isDbEvent ? Number(post.id) - 10000 : null;
              const dbPubId = isDbPub ? Number(post.id) : null;

              const postReactions = dbReactions.counts.filter(r => {
                if (isDbEvent) return Number(r.id_evento) === dbEventId;
                if (isDbPub) return Number(r.id_publicacion) === dbPubId;
                return false;
              });

              const userReactObj = dbReactions.userReactions.find(r => {
                if (isDbEvent) return Number(r.id_evento) === dbEventId;
                if (isDbPub) return Number(r.id_publicacion) === dbPubId;
                return false;
              });

              if (postReactions.length > 0 || userReactObj) {
                const reactionCounts = {
                  love: 0,
                  like: 0,
                  dislike: 0,
                  haha: 0,
                  angry: 0,
                  wow: 0,
                  sad: 0
                };

                postReactions.forEach(pr => {
                  const key = pr.tipo as keyof typeof reactionCounts;
                  if (reactionCounts[key] !== undefined) {
                    reactionCounts[key] = pr.count;
                  }
                });

                const prev = prevPosts.find(p => p.id === post.id && p.type === post.type);
                const userReaction = prev && prev.userReaction !== undefined ? prev.userReaction : (userReactObj?.tipo || null) as any;

                return {
                  ...post,
                  ...reactionCounts,
                  userReaction
                };
              }

              return post;
            });
          }

          // Ordenar por fecha de creación (de más reciente a más antiguo)
          finalPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          return dedupePosts(finalPosts);
        });
      } catch (error) {
        console.error("Error al cargar datos del backend:", error);
      }
    };

    fetchBackendData();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("unah_posts", JSON.stringify(posts));
    } catch {
      localStorage.removeItem("unah_posts");
    }
  }, [posts]);

  const [hiddenPostIds, setHiddenPostIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("unah_hidden_posts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed.map(Number));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return new Set<number>();
  });

  useEffect(() => {
    localStorage.setItem("unah_hidden_posts", JSON.stringify(Array.from(hiddenPostIds)));
  }, [hiddenPostIds]);

  const [visibleCount, setVisibleCount] = useState<number>(8);

  useEffect(() => {
    setVisibleCount(8);
  }, [activeFilter, searchQuery, sortValue, showOnlySaved, showHiddenOnly]);

  const showToast=(msg:string)=>{
    setToast(msg);
    if(toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current=setTimeout(()=>setToast(""),2800);
  };

  // Dispara el confeti sin bloquear la navegación: es un overlay con pointer-events:none
  // que se desmonta solo tras la animación, así nunca intercepta clics ni recarga la pantalla.
  const fireConfetti = () => {
    setConfettiKey(Date.now());
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setConfettiKey(null), 1600);
  };

  // Acepta/rechaza una solicitud de "Pumita" real contra el backend. Mientras está
  // en vuelo solo se deshabilita esa tarjeta puntual (pumitaRequestLoading), nunca
  // toda la pantalla, y no hay recarga ni navegación bloqueada en ningún momento.
  const handlePumitaRequest = async (req: PumitaRequest, action: "accept"|"reject") => {
    if (pumitaRequestLoading.has(req.id_conexion)) return; // evita doble envío
    setPumitaRequestLoading(prev => new Set(prev).add(req.id_conexion));
    try {
      if (action === "accept") {
        await pumitasService.aceptar(req.id_conexion);
        showToast(`🎉 Ahora eres Pumita de ${req.nombre}`);
        fireConfetti();
      } else {
        await pumitasService.eliminar(req.id_conexion);
        showToast(`Solicitud de ${req.nombre} rechazada`);
      }
      setPumitaRequests(prev => prev.filter(r => r.id_conexion !== req.id_conexion));
      await cargarPumitasReales();
    } catch {
      showToast("No se pudo procesar la solicitud. Intenta de nuevo.");
    } finally {
      setPumitaRequestLoading(prev => {
        const next = new Set(prev);
        next.delete(req.id_conexion);
        return next;
      });
    }
  };

  useEffect(() => () => { if (confettiTimer.current) clearTimeout(confettiTimer.current); }, []);

  useEffect(()=>{
    const h=()=>{setNotiOpen(false);};
    document.addEventListener("click",h);
    return ()=>document.removeEventListener("click",h);
  },[]);

  const getFiltered=()=>{
    let f = showHiddenOnly
      ? posts.filter(p=>p.hidden || hiddenPostIds.has(Number(p.id)))
      : posts.filter(p=>!p.hidden && !hiddenPostIds.has(Number(p.id)));

    // Una publicación que no esté "publicado" (pendiente/en revisión/rechazada) solo la
    // debe ver su propio autor en su feed; el resto de estudiantes no la ve todavía.
    const nombreActual = authService.getUsuarioGuardado()?.nombre ?? '';
    f = f.filter(p => p.type !== "Publicacion" || !p.estado || p.estado === "publicado" || p.author === nombreActual);
    if (showOnlySaved) {
      f = f.filter(p => p.saved);
    } else if (!showHiddenOnly) {
      if(activeFilter==="Evento")      f=f.filter(p=>p.type==="Evento");
      else if(activeFilter==="Publicacion") f=f.filter(p=>p.type==="Publicacion");
    }
    if(searchQuery.trim()){
      const q=searchQuery.toLowerCase();
      f=f.filter(p=>(p.title||'').toLowerCase().includes(q)||(p.desc||'').toLowerCase().includes(q)||(p.author||'').toLowerCase().includes(q)||(p.tags||[]).some(t=>(t||'').toLowerCase().includes(q)));
    }
    if(sortValue==="popular")   f=[...f].sort((a,b)=>getTotalReactions(b)-getTotalReactions(a));
    else if(sortValue==="comentado") f=[...f].sort((a,b)=>b.comments.length-a.comments.length);
    else {
      if (showOnlySaved) {
        f = [...f].sort((a, b) => parseSavedAt(b.savedAt) - parseSavedAt(a.savedAt));
      } else {
        f = [...f].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Ordenar por hora de subida
      }
    }
    return f;
  };

  const handleReact = async (id: number, type: ActiveReaction) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const was = post.userReaction === type;
    const nextReaction = was ? null : type;

    // Actualización local rápida
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const u = { ...p };
      if (was) {
        (u as any)[type]--;
        u.userReaction = null;
      } else {
        if (p.userReaction) (u as any)[p.userReaction]--;
        (u as any)[type]++;
        u.userReaction = type;
      }
      return u;
    }));

    const e = EMOJIS.find(emoji => emoji.key === type);
    if (!was && e) {
      showToast(`Reaccionaste: ${e.label}`);
    }

    try {
      const payload: any = {
        tipo: nextReaction
      };

      if (post.type === "Evento") {
        payload.id_evento = id - 10000;
      } else {
        payload.id_publicacion = id;
      }

      await reaccionPostService.guardarReaccion(payload);
    } catch (err) {
      console.error("Error al guardar reacción:", err);
      // Revertir localmente si falla
      setPosts(prev => prev.map(p => {
        if (p.id !== id) return p;
        const u = { ...p };
        if (was) {
          (u as any)[type]++;
          u.userReaction = type;
        } else {
          (u as any)[type]--;
          if (post.userReaction) {
            (u as any)[post.userReaction]++;
            u.userReaction = post.userReaction;
          } else {
            u.userReaction = null;
          }
        }
        return u;
      }));
      showToast("Error al guardar reacción en servidor");
    }
  };

  const handleToggleComments=(id:number)=>setOpenCommentIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  const handleReportComment = async (commentId: number) => {
    const motivo = window.prompt("¿Por qué reportas este comentario? (spam, ofensivo, información falsa, etc.)");
    if (!motivo || !motivo.trim()) return;
    try {
      await moderacionService.reportarComentario(commentId, motivo.trim());
      alert("Comentario reportado. Un administrador lo revisará.");
    } catch (err) {
      alert((err as Error).message || "No se pudo enviar el reporte.");
    }
  };

  const handleReportPublicacion = async (publicacionId: number) => {
    const motivo = window.prompt("¿Por qué reportas esta publicación? (spam, ofensivo, información falsa, etc.)");
    if (!motivo || !motivo.trim()) return;
    try {
      await moderacionService.reportarPublicacion(publicacionId, motivo.trim());
      alert("Publicación reportada. Un administrador la revisará.");
    } catch (err) {
      alert((err as Error).message || "No se pudo enviar el reporte.");
    }
  };

  const handleAddComment = async (id: number, text: string, replyTo?: string, parentId?: number, replyToText?: string) => {
    // Validaciones de Seguridad para comentarios
    if (hasSQLi(text)) {
      alert("🚨 ¡Alerta de Seguridad! Se detectó un patrón de inyección SQL (SQLi) no permitido. El comentario ha sido bloqueado.");
      return;
    }
    if (!isValidInput(text)) {
      alert("⚠️ Entrada no válida: Se detectaron caracteres especiales no permitidos en el comentario.");
      return;
    }
    const cleanText = sanitizeHTML(text);

    const post = posts.find(p => p.id === id);
    if (!post) return;

    try {
      const payload: any = {
        contenido: cleanText,
        parent_id: parentId,
        reply_to: replyTo,
        reply_to_text: replyToText
      };

      if (post.type === "Evento") {
        payload.id_evento = id - 10000;
      } else {
        payload.id_publicacion = id;
      }

      // Guardar en la base de datos
      const savedComment = await comentarioService.crearComentario(payload);

      setPosts(prev => prev.map(p => {
        if (p.id !== id) return p;
        const newComments = [...p.comments, {
          id: savedComment.id,
          author: savedComment.author,
          authorInitials: savedComment.authorInitials,
          text: savedComment.text,
          time: savedComment.time,
          replyTo: savedComment.replyTo,
          parentId: savedComment.parentId,
          replyToText: savedComment.replyToText,
          authorPic: savedComment.authorPic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        }];
        return { ...p, comments: newComments };
      }));

      showToast(replyTo ? `↩ Respondiste a ${replyTo}` : "💬 Comentario agregado");
    } catch (err: any) {
      console.error("Error al guardar comentario:", err);
      // Fallback local por robustez en caso de error
      setPosts(prev => prev.map(p => p.id !== id ? p : {
        ...p,
        comments: [...p.comments, {
          id: Date.now(),
          author: "Yo",
          authorInitials: "YO",
          text: cleanText,
          time: "Ahora mismo",
          replyTo,
          parentId,
          replyToText,
          authorPic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        }]
      }));
      showToast("💬 Comentario agregado localmente");
    }
  };

  const handleReactComment = (postId: number, commentId: number, type: ActiveReaction) => {
    let nextReaction: ActiveReaction | null = null;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const newComments = p.comments.map(c => {
        if (c.id !== commentId) return c;
        const was = c.userReaction === type;
        nextReaction = was ? null : type;
        const reactions = { ...(c.reactions || {}) };
        if (was) {
          reactions[type] = Math.max((reactions[type] || 0) - 1, 0);
        } else {
          if (c.userReaction) reactions[c.userReaction] = Math.max((reactions[c.userReaction] || 0) - 1, 0);
          reactions[type] = (reactions[type] || 0) + 1;
        }
        return { ...c, reactions, userReaction: nextReaction };
      });
      return { ...p, comments: newComments };
    }));

    // Intenta persistir en el servidor si el servicio de comentarios ya soporta reacciones.
    // Se hace de forma silenciosa: si el endpoint aún no existe, la reacción queda guardada localmente.
    (async () => {
      try {
        const svc = comentarioService as any;
        if (typeof svc.reaccionarComentario === "function") {
          await svc.reaccionarComentario({ id_comentario: commentId, tipo: nextReaction });
        }
      } catch (err) {
        console.error("Error al guardar reacción de comentario:", err);
      }
    })();
  };

  const handleHide=(id:number)=>{
    const numId = Number(id);
    setPosts(prev=>prev.map(p=>p.id===numId?{...p,hidden:true}:p));
    setHiddenPostIds(prev => {
      const next = new Set(prev);
      next.add(numId);
      return next;
    });
    showToast("🚫 Publicación ocultada");
  };

  const handleEditPost = (p: Post) => {
    setEditDesc(p.desc);
    setEditTags((p.tags || []).join(', '));
    setEditPost(p);
  };

  const handleSaveEdit = () => {
    if (!editPost) return;
    const updated = {
      ...editPost,
      desc: editDesc,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setPosts(prev => prev.map(p => p.id === editPost.id ? updated : p));
    const saved = localStorage.getItem("unah_posts");
    if (saved) {
      try {
        const list = JSON.parse(saved).map((p: any) => p.id === editPost.id ? updated : p);
        localStorage.setItem("unah_posts", JSON.stringify(list));
      } catch {
        localStorage.removeItem("unah_posts");
      }
    }
    setEditPost(null);
    showToast("✅ Publicación actualizada");
  };

  const handleUnhide=(id:number)=>{
    const numId = Number(id);
    setPosts(prev=>prev.map(p=>p.id===numId?{...p,hidden:false}:p));
    setHiddenPostIds(prev => {
      const next = new Set(prev);
      next.delete(numId);
      return next;
    });
    showToast("👁️ Vuelta a mostrar");
  };
  
  const handleSave=(id:number)=>{
    const p=posts.find(x=>x.id===id);
    const now = new Date();
    const formattedDate = now.toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    setPosts(prev=>prev.map(p=>{
      if (p.id === id) {
        const newSaved = !p.saved;
        return {
          ...p,
          saved: newSaved,
          savedAt: newSaved ? formattedDate : undefined
        };
      }
      return p;
    }));
    showToast(p?.saved ? "🔖 Removido de Guardados" : "🔖 Publicación guardada");
  };

  const handleShare=(id:number)=>{
    const url=`${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(url)
      .then(() => showToast("🔗 Enlace copiado al portapapeles"))
      .catch(() => showToast("❌ Error al copiar enlace"));
  };

  const handleInscribir = async (id: number) => {
    const post = posts.find(x => x.id === id);
    if (!post) return;

    const was = post.inscrito;
    const nextInscritoState = !was;
    const isDbEvent = id > 10000;
    const dbEventId = isDbEvent ? id - 10000 : null;

    // Actualización local rápida
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const ins = was 
        ? (p.topInscritos || []).filter(u => u.name !== "Yo") 
        : [{ initials: "YO", name: "Yo" }, ...(p.topInscritos || [])];
      const nextCupos = p.cupos !== undefined 
        ? (was ? p.cupos + 1 : Math.max(0, p.cupos - 1)) 
        : undefined;
      return { ...p, inscrito: nextInscritoState, topInscritos: ins, cupos: nextCupos };
    }));

    showToast(nextInscritoState ? "✅ ¡Inscrito al evento!" : "❌ Desinscrito");

    try {
      if (dbEventId) {
        if (was) {
          await grupo2EventosService.cancelar(dbEventId);
        } else {
          await grupo2EventosService.inscribir(dbEventId);
        }
      }

      // Sincronización secundaria opcional con unah_events en localStorage
      const savedEvents = localStorage.getItem("unah_events");
      if (savedEvents && post.title) {
        try {
          const eventsList = JSON.parse(savedEvents);
          const exists = eventsList.some((ev: any) => ev.TITULO_EVENTO.trim().toLowerCase() === post.title.trim().toLowerCase());
          
          let updatedEvents;
          if (exists) {
            updatedEvents = eventsList.map((ev: any) => {
              if (ev.TITULO_EVENTO.trim().toLowerCase() === post.title.trim().toLowerCase()) {
                return {
                  ...ev,
                  INSCRITO: nextInscritoState,
                  CUPOS_DISPONIBLES: nextInscritoState 
                    ? Math.max(0, ev.CUPOS_DISPONIBLES - 1) 
                    : ev.CUPOS_DISPONIBLES + 1,
                  ESTADO_ACTIVIDAD: nextInscritoState ? 'Programado' : ''
                };
              }
              return ev;
            });
          } else {
            eventsList.push({
              EVENTO_ID: dbEventId || (id + 1000),
              TITULO_EVENTO: post.title,
              DESCRIPCION: post.desc,
              ESTADO_ACTIVIDAD: nextInscritoState ? 'Programado' : '',
              INSCRITO: nextInscritoState,
              CUPOS_DISPONIBLES: nextInscritoState 
                ? Math.max(0, (post.cupos !== undefined ? post.cupos - 1 : 49)) 
                : (post.cupos !== undefined ? post.cupos + 1 : 50),
              FECHA: post.fecha || '2026-07-20',
              INSTRUCTOR: post.author || 'Instructor Invitado',
              HORARIO: '10:00 AM - 12:00 PM',
              UBICACION: post.lugar || 'Ciudad Universitaria',
              CLASIFICACION: post.scope || 'General',
              HORAS_VOAE: post.voaeHoras || 2,
              AVATAR_URL: (post.images && post.images[0]) || '/puma-icon.png'
            });
            updatedEvents = eventsList;
          }
          localStorage.setItem("unah_events", JSON.stringify(updatedEvents));
        } catch (e) {
          console.error("Error al sincronizar localStorage:", e);
        }
      }
    } catch (err: any) {
      console.error("Error al actualizar inscripción en la base de datos:", err);
      // Revertir localmente si falla
      setPosts(prev => prev.map(p => {
        if (p.id !== id) return p;
        const ins = was 
          ? [{ initials: "YO", name: "Yo" }, ...(p.topInscritos || [])] 
          : (p.topInscritos || []).filter(u => u.name !== "Yo");
        const nextCupos = p.cupos !== undefined 
          ? (was ? Math.max(0, p.cupos - 1) : p.cupos + 1) 
          : undefined;
        return { ...p, inscrito: was, topInscritos: ins, cupos: nextCupos };
      }));
      showToast("❌ Error al actualizar inscripción en el servidor");
    }
  };

  const handleLoadMore=()=>{
    const totalFiltered = getFiltered().length;
    if (visibleCount < totalFiltered) {
      setVisibleCount(prev => prev + 1);
      showToast("📦 Más publicaciones cargadas");
      return;
    }
    // Ya no quedan más posts existentes que coincidan con el filtro: se agrega contenido nuevo del pool
    const wantEvento = activeFilter === "Evento";
    const pool = wantEvento ? moreEventsPool : morePublicationsPool;
    const existingTitles = new Set(posts.filter(p=>p.type===(wantEvento?"Evento":"Publicacion")).map(p=>p.title.trim().toLowerCase()));
    const next = pool.find(p=>!existingTitles.has(p.title.trim().toLowerCase()));
    if (!next) {
      showToast(wantEvento ? "📅 No hay más eventos nuevos por ahora" : "📦 No hay más publicaciones nuevas por ahora");
      return;
    }
    const newId = Math.max(...posts.map(p=>p.id), 0) + 1;
    const oldestCreatedAt = Math.min(...posts.map(p=>p.createdAt ?? Date.now()), Date.now());
    // Cada publicación/evento nuevo aparece entre 5 y 10 minutos "más viejo" que el anterior,
    // en vez de usar el texto fijo del pool (que decía "Hace X horas").
    const minutesAgo = 5 + Math.floor(Math.random() * 6); // 5 a 10 minutos
    const newCreatedAt = oldestCreatedAt - minutesAgo * 60 * 1000;
    const newTime = `Hace ${minutesAgo} min`;
    setPosts(prev=>dedupePosts([...prev,{ ...next, id:newId, createdAt: newCreatedAt, time: newTime }]));
    setVisibleCount(prev => prev + 1);
    showToast(wantEvento ? "📅 Más eventos cargados" : "📦 Más publicaciones cargadas");
  };

  const handleCreate = async (d:{title:string;desc:string;type:"Evento"|"Publicacion";scope:string;tags:string[];fecha?:string;lugar?:string;cupos?:number;images?:string[]}) => {
    // Validaciones de Seguridad
    if (hasSQLi(d.title) || hasSQLi(d.desc) || d.tags.some(hasSQLi)) {
      alert("🚨 ¡Alerta de Seguridad! Se detectó un patrón de inyección SQL (SQLi) no permitido. La publicación ha sido bloqueada por motivos de seguridad.");
      return;
    }
    if (!isValidInput(d.title) || !isValidInput(d.desc) || d.tags.some(t => !isValidInput(t))) {
      alert("⚠️ Entrada no válida: Se detectaron caracteres especiales no permitidos.");
      return;
    }

    const cleanTitle = sanitizeHTML(d.title);
    const cleanDesc = sanitizeHTML(d.desc);
    const cleanTags = d.tags.map(sanitizeHTML);

   if (d.type === "Publicacion") {
      try {
        const payload = {
          title: cleanTitle,
          desc: cleanDesc,
          scope: d.scope,
          tags: cleanTags,
          images: d.images || []
        };
        // El estudiante ya no publica directo: la solicitud queda "pendiente" hasta que
        // Coordinación la remita a VOAE, VOAE la autorice y Coordinación la publique.
        const savedPub = await publicacionService.crearPublicacion(payload);

        setPosts(prev => [{ ...savedPub, estado: savedPub.estado || "pendiente" }, ...prev]);
        showToast("📨 Tu solicitud fue enviada a Coordinación para su revisión");
      } catch (err: any) {
        console.error("Error al enviar la solicitud de publicación:", err);
        alert("Error al enviar la solicitud al servidor: " + err.message);
      }
    } else {
      setPosts(prev => {
        const newId = Math.max(...prev.map(p => p.id), 0) + 1;
        return [{
          id: newId,
          author: "Valeria Estrada",
          initials: "VE",
          type: d.type,
          scope: d.scope,
          visibility: "Público",
          time: "Ahora mismo",
          title: cleanTitle,
          desc: cleanDesc || "Sin descripción.",
          tags: cleanTags,
          love: 0,
          like: 0,
          dislike: 0,
          haha: 0,
          wow: 0,
          sad: 0,
          angry: 0,
          comments: [],
          userReaction: null,
          saved: false,
          hidden: false,
          fecha: d.fecha,
          lugar: d.lugar,
          cupos: d.cupos,
          voaeHoras: Math.floor(Math.random() * 4) + 1,
          inscrito: false,
          topInscritos: [],
          images: d.images || [],
          createdAt: Date.now()
        }, ...prev];
      });
      showToast("✅ Publicación creada");
    }
  };

  const unread=notifications.filter(n=>n.unread).length;
  const filtered=getFiltered();

  return (
    <>
      <style>{`
        :root{--navy:#F4F6F8;--navy-mid:#FFFFFF;--navy-light:#F4F6F8;--navy-border:#E2E8F0;
          --yellow:#FFD100;--yellow-hover:#FFE766;--yellow-soft:rgba(255,209,0,0.15);
          --white:#003366;--gray-mid:#717182;--text-primary:#003366;--text-secondary:#717182;
          --green-ok:#22c55e;--radius:14px;--radius-sm:8px;--shadow:0 4px 20px rgba(0,0,0,0.08);}
       
        .app *{box-sizing:border-box;}
        .app{display:flex;min-height:100vh;width:100%;}

        /* TOPBAR */
        .topbar{background:#004B87;border-bottom:1px solid #003366;padding:0 20px;height:60px;
          display:flex;align-items:center;justify-content:space-between;
          position:sticky;top:0;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,0.15);gap:12px;}
        .topbar-center{display:flex;align-items:center;gap:8px;flex:1;justify-content:center;}
        .topbar-right{display:flex;align-items:center;gap:8px;position:relative;}
        .search-wrap{position:relative;}
        .search-input{background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.2);
          border-radius:20px;padding:7px 14px 7px 34px;font-size:13px;color:#fff;outline:none;width:220px;}
        .search-input::placeholder{color:rgba(255,255,255,0.5);}
        .search-input:focus{border-color:var(--yellow);}
        .search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none;color:rgba(255,255,255,0.6);}
        .icon-btn{position:relative;width:44px;height:44px;border-radius:12px;
          border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);
          cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;}
        .icon-btn:hover{background:rgba(255,255,255,0.2);}
        .badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 4px;background:var(--yellow);
          color:#003366;border-radius:50%;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;}
        .avatar-btn{width:36px;height:36px;border-radius:50%;border:2.5px solid var(--yellow);
          background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:700;font-size:13px;cursor:pointer;}
        .btn-primary{background:var(--yellow);color:#003366;border:none;border-radius:var(--radius-sm);
          padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;}
        .btn-primary:hover{background:var(--yellow-hover);}

        /* NOTIFICATIONS — mismo estilo que el panel de notificaciones de Mi Perfil */
        .notifications-dropdown{position:absolute;top:52px;right:0;background:#fff;
          border:1px solid #E2E8F0;border-radius:12px;width:288px;
          box-shadow:0 12px 36px rgba(0,0,0,0.18);z-index:120;overflow:hidden;padding:12px;}
        .noti-header{padding:0 0 8px;display:flex;justify-content:space-between;align-items:center;}
        .noti-header h3{font-size:14px;font-weight:800;color:#003366;}
        .noti-clear-btn{background:none;border:none;color:#004B87;font-size:11px;cursor:pointer;font-weight:700;}
        .noti-clear-btn:hover{color:#003366;}
        .noti-list{max-height:320px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;}
        .noti-item{padding:12px;border-radius:8px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;
          background:#F4F6F8;transition:background 0.15s;}
        .noti-item:hover{background:rgba(255,209,0,0.10);}
        .noti-item.unread{background:#F4F6F8;border:1px dashed #FFD100;}
        .noti-icon-box{flex-shrink:0;width:32px;height:32px;border-radius:8px;background:#fff;
          display:flex;align-items:center;justify-content:center;font-size:14px;
          border:1px solid #E2E8F0;}
        .noti-text{font-size:12px;font-weight:700;color:#003366;line-height:1.35;}
        .noti-time{font-size:11px;color:#5b6472;margin-top:2px;font-weight:500;}
        .noti-viewall{display:block;text-align:center;margin-top:8px;padding-top:8px;font-size:12px;font-weight:700;
          color:#004B87;cursor:pointer;border-top:1px solid #F1F5F9;}
        .noti-viewall:hover{color:#003366;text-decoration:underline;}
/* MAIN LAYOUT */
.main-container{flex:1;padding:24px;display:grid;grid-template-columns:1fr 300px;gap:24px;max-width:1250px;margin-inline:auto;width:100%;}
.feed-column{display:flex;flex-direction:column;gap:20px;}
.widgets-column{display:flex;flex-direction:column;gap:24px;}

@media (max-width: 768px) {
  .main-container {
    grid-template-columns: 1fr;
    padding: 12px;
  }
  .widgets-column {
    display: none;
  }
  .topbar {
    padding: 0 12px;
    gap: 8px;
  }
  .search-input {
    width: 140px;
  }
  .btn-primary {
    font-size: 11px;
    padding: 6px 10px;
  }
  .stories-bar {
    padding: 10px;
    gap: 10px;
  }
}
        /* STORIES */
        .stories-bar{display:flex;gap:14px;background:var(--navy-mid);padding:16px;border-radius:var(--radius);border:1px solid var(--navy-border);overflow-x:auto;}
        .story-item{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;position:relative;flex-shrink:0;}
        .story-ring{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--navy-light);border:2px solid transparent;}
        .story-ring.has-story{border-color:var(--yellow);}
        .story-ava{width:44px;height:44px;background:#003366;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;position:relative;border:2px solid var(--navy-mid);}
        .story-plus{position:absolute;bottom:-2px;right:-2px;width:16px;height:16px;background:var(--yellow);color:#003366;border-radius:50%;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid var(--navy-mid);}
        .story-name{font-size:11px;font-weight:600;color:var(--text-primary);max-width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .story-online{position:absolute;top:34px;right:4px;width:10px;height:10px;background:var(--green-ok);border-radius:50%;border:2px solid var(--navy-mid);}
        .story-clickable{cursor:pointer;}
        .story-clickable:hover .story-ring{box-shadow:0 0 0 3px var(--yellow);}

        /* STORY VIEWER */
        .story-overlay{position:fixed;inset:0;background:rgba(0,20,60,0.7);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
        .story-viewer{width:320px;height:480px;background:linear-gradient(160deg,#003366,#004B87);border-radius:20px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          position:relative;padding:32px 24px;box-shadow:0 24px 64px rgba(0,0,0,0.4);
          animation:fadeScale 0.2s ease-out;}
        .story-viewer-bar{position:absolute;top:14px;left:16px;right:16px;height:3px;background:rgba(255,255,255,0.3);border-radius:2px;overflow:hidden;}
        .story-viewer-bar::after{content:'';display:block;height:100%;width:100%;background:var(--yellow);animation:storyProgress 4s linear forwards;}
        @keyframes storyProgress{from{width:0%;}to{width:100%;}}
        .story-viewer-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:0.8;}
        .story-viewer-close:hover{opacity:1;}
        .story-viewer-ava{width:72px;height:72px;background:var(--yellow);color:#003366;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;border:3px solid #fff;margin-bottom:14px;}
        .story-viewer-name{font-size:15px;font-weight:800;color:#fff;margin-bottom:20px;}
        .story-viewer-text{font-size:17px;font-weight:600;color:#fff;text-align:center;line-height:1.5;background:rgba(255,255,255,0.1);padding:16px 20px;border-radius:12px;}

        /* CONTROLS */
        .controls-row{display:flex;align-items:center;background:var(--navy-mid);padding:12px 16px;border-radius:var(--radius);border:1px solid var(--navy-border);gap:12px;}
        .filter-tabs{display:flex;gap:6px;background:var(--navy-light);padding:4px;border-radius:var(--radius-sm);border:1px solid var(--navy-border);}
        .filter-btn{background:none;border:none;padding:6px 14px;font-size:12px;font-weight:700;color:var(--text-secondary);cursor:pointer;border-radius:6px;transition:all 0.2s;}
        .filter-btn.active{background:var(--navy-mid);color:#003366;box-shadow:0 2px 6px rgba(0,0,0,0.05);}
        .sort-select{background:var(--navy-light);border:1px solid var(--navy-border);border-radius:var(--radius-sm);padding:6px 12px;font-size:12px;font-weight:600;color:var(--text-primary);outline:none;cursor:pointer;}

        /* POST CARD */
        .post-card{background:var(--navy-mid);border-radius:var(--radius);border:1px solid var(--navy-border);padding:20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 2px 12px rgba(0,0,0,0.02);}
        .post-header{display:flex;align-items:center;gap:12px;position:relative;}
        .post-avatar{width:40px;height:40px;background:#E2E8F0;color:#003366;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;}
        .post-author{display:flex;flex-direction:column;gap:2px;flex:1;}
        .post-author-name{font-size:13px;font-weight:700;color:var(--text-primary);}
        .post-meta{font-size:11px;color:var(--text-secondary);display:flex;align-items:center;}
        .post-menu-btn{background:none;border:none;font-size:16px;color:var(--text-secondary);cursor:pointer;padding:4px;}
        .post-menu{position:absolute;top:36px;right:0;background:var(--navy-mid);border:1px solid var(--navy-border);border-radius:var(--radius-sm);box-shadow:0 4px 16px rgba(0,0,0,0.1);z-index:10;display:none;flex-direction:column;width:120px;overflow:hidden;}
        .post-menu.open{display:flex;}
        .post-menu-item{padding:8px 12px;font-size:12px;font-weight:600;color:var(--text-primary);cursor:pointer;}
        .post-menu-item:hover{background:var(--navy-light);}
        .post-menu-item.danger{color:#ef4444;}

        .post-body{display:flex;flex-direction:column;gap:8px;}
        .post-type-badge{align-self:flex-start;font-size:10px;font-weight:800;padding:3px 8px;border-radius:5px;text-transform:uppercase;letter-spacing:0.3px;}
        .badge-publicacion{background:rgba(0,51,102,0.08);color:#003366;}
        .badge-evento{background:rgba(34,197,94,0.12);color:#16a34a;}
        .post-title{font-size:15px;font-weight:800;color:var(--text-primary);margin-top:2px;}
        .post-desc{font-size:13px;color:var(--text-primary);line-height:1.5;}
        .post-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}
        .tag{font-size:11px;font-weight:600;color:var(--text-secondary);background:var(--navy-light);padding:3px 8px;border-radius:6px;border:1px solid var(--navy-border);}

        /* ── FLOATING REACTION BUTTON ── */
        .post-reactions{display:flex;align-items:center;border-top:1px solid var(--navy-border);padding-top:12px;margin-top:6px;gap:8px;flex-wrap:wrap;}
        .reaction-spacer{flex:1;}

        .reaction-main-btn{
          display:flex;align-items:center;gap:6px;
          background:var(--navy-light);border:1.5px solid var(--navy-border);
          border-radius:20px;padding:6px 14px;font-size:13px;font-weight:700;
          color:var(--text-primary);cursor:pointer;transition:all 0.15s;
          position:relative;
        }
        .reaction-main-btn:hover{background:var(--navy-border);}
        .reaction-main-btn.reacted{background:var(--yellow-soft);border-color:var(--yellow);color:#003366;}
        .reaction-btn-label{font-size:12px;}
        .reaction-count{background:#003366;color:#fff;border-radius:10px;font-size:10px;font-weight:800;padding:1px 6px;}

        /* EMOJI PICKER FLOATING */
        .emoji-picker-float{
          position:absolute;bottom:calc(100% + 10px);left:0;
          background:var(--navy-mid);border:1.5px solid var(--navy-border);
          border-radius:var(--radius);padding:10px 12px;
          display:flex;gap:6px;
          box-shadow:0 8px 28px rgba(0,51,102,0.18);
          z-index:100;
          white-space:nowrap;
          animation:popUp 0.18s ease-out;
        }
        @keyframes popUp{from{opacity:0;transform:translateY(8px) scale(0.95);}to{opacity:1;transform:translateY(0) scale(1);}}
        .emoji-pick-btn{
          display:flex;flex-direction:column;align-items:center;gap:3px;
          background:none;border:2px solid transparent;border-radius:10px;
          padding:6px 8px;cursor:pointer;transition:all 0.13s;
        }
        .emoji-pick-btn:hover{background:var(--navy-light);transform:scale(1.15);}
        .emoji-pick-btn.picked{border-color:var(--yellow);background:var(--yellow-soft);}
        .emoji-icon{font-size:20px;line-height:1;}
        .emoji-lbl{font-size:9px;font-weight:700;color:var(--text-secondary);white-space:nowrap;}

        /* COMMENT / ACTION ICON BTN */
        .action-icon-btn{background:var(--navy-light);border:1.5px solid var(--navy-border);border-radius:20px;padding:6px 12px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-primary);transition:all 0.15s;}
        .action-icon-btn:hover{background:var(--navy-border);}
        .action-icon-btn.active-comment{background:var(--navy-border);}

        .btn-card-inscribir{background:#003366;color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;transition:background 0.2s;}
        .btn-card-inscribir:hover{background:#002244;}
        .btn-card-inscribir.inscrito{background:var(--green-ok);color:#fff;}

        .btn-card-join{width:28px;height:28px;min-width:28px;border-radius:50%;background:var(--yellow);color:#003366;border:none;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;box-shadow:0 2px 6px rgba(0,0,0,0.12);}
        .btn-card-join:hover{transform:scale(1.08);}
        .btn-card-join.joined{background:var(--green-ok);color:#fff;}
        .action-btn{background:none;border:1px solid var(--navy-border);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;color:var(--text-primary);cursor:pointer;}
        .action-btn:hover{background:var(--navy-light);}
        .save-btn{background:none;border:none;font-size:14px;cursor:pointer;padding:4px;opacity:0.6;}
        .save-btn:hover{opacity:1;}
        .save-btn.saved{opacity:1;color:var(--yellow);}

        /* ── BOTONES EVENTO (diseño imagen referencia) ── */
        .post-reactions-evento{gap:6px;flex-wrap:nowrap;}
        .btn-evento-join{
          width:32px;height:32px;min-width:32px;border-radius:50%;
          background:#9CA3AF;color:#fff;border:none;
          font-size:18px;font-weight:900;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(156,163,175,0.4);transition:all 0.15s;
        }
        .btn-evento-join:hover{transform:scale(1.1);background:#6B7280;}
        .btn-evento-join.joined{background:#22c55e;box-shadow:0 2px 8px rgba(34,197,94,0.4);}
        .btn-evento-action{
          background:none;border:1px solid var(--navy-border);border-radius:20px;
          padding:5px 11px;font-size:11px;font-weight:700;
          color:var(--text-primary);cursor:pointer;
          display:flex;align-items:center;gap:4px;
          transition:background 0.15s;white-space:nowrap;
        }
        .btn-evento-action:hover{background:var(--navy-light);}
        .btn-evento-icon{
          background:none;border:1px solid var(--navy-border);border-radius:20px;
          padding:5px 9px;font-size:13px;cursor:pointer;opacity:0.7;
          transition:all 0.15s;
        }
        .btn-evento-icon:hover{opacity:1;background:var(--navy-light);}
        .btn-evento-icon.saved{opacity:1;border-color:var(--yellow);background:var(--yellow-soft);}
        .btn-pub-save{
          background:none;border:1px solid var(--navy-border);border-radius:20px;
          padding:5px 11px;font-size:11px;font-weight:700;
          color:var(--text-primary);cursor:pointer;
          display:flex;align-items:center;gap:3px;
          transition:all 0.15s;white-space:nowrap;
        }
        .btn-pub-save:hover{background:var(--navy-light);}
        .btn-pub-save.saved{border-color:#B8860B;background:rgba(255,209,0,0.08);}
        .btn-evento-whatsapp{
          width:30px;height:30px;min-width:30px;border-radius:50%;
          background:#25D366;border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(37,211,102,0.4);transition:all 0.15s;
          padding:0;
        }
        .btn-evento-whatsapp:hover{transform:scale(1.08);background:#1ebe5d;}

        /* COMMENTS */
        .comment-section{border-top:1px solid var(--navy-border);padding-top:12px;display:flex;flex-direction:column;gap:12px;}
        .comment-list{display:flex;flex-direction:column;gap:10px;max-height:240px;overflow-y:auto;padding-right:4px;}
        .comment-item{display:flex;gap:10px;align-items:flex-start;}
        .comment-ava{width:28px;height:28px;background:var(--navy-light);border:1px solid var(--navy-border);color:var(--text-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;flex-shrink:0;margin-top:2px;}
        .comment-bubble-wrap{display:flex;flex-direction:column;gap:2px;flex:1;}
        .comment-bubble{background:var(--navy-light);border:1px solid var(--navy-border);border-radius:12px;padding:8px 12px;display:flex;flex-direction:column;gap:2px;}
        .comment-author{font-size:11px;font-weight:700;color:var(--text-primary);}
        .comment-text{font-size:12px;color:var(--text-primary);line-height:1.4;}
        .comment-time{font-size:9px;color:var(--text-secondary);align-self:flex-end;margin-top:2px;}
        .comment-reply-btn{background:none;border:none;font-size:10px;font-weight:700;color:var(--text-secondary);cursor:pointer;align-self:flex-start;padding:2px 4px;margin-left:4px;}
        .comment-reply-btn:hover{color:#003366;}
        .comment-reply-tag{font-size:10px;color:var(--text-secondary);margin-left:4px;font-style:italic;}
        .comment-input-row{display:flex;gap:8px;align-items:center;margin-top:4px;}
        .comment-input-wrap{flex:1;background:var(--navy-light);border:1px solid var(--navy-border);border-radius:20px;padding:4px 12px;display:flex;align-items:center;gap:6px;}
        .comment-input{background:none;border:none;outline:none;font-size:12px;color:var(--text-primary);width:100%;padding:4px 0;}
        .comment-send{background:none;border:none;font-size:14px;color:var(--text-secondary);cursor:pointer;padding:4px;}
        .comment-send:hover{color:#003366;}
        .reply-chip{background:var(--navy-border);font-size:10px;font-weight:700;padding:2px 6px;border-radius:12px;display:flex;align-items:center;gap:4px;}
        .reply-chip-close{background:none;border:none;font-size:9px;cursor:pointer;font-weight:900;}

        /* ── DETAIL MODAL ── */
        .detail-modal-overlay{
          position:fixed;inset:0;background:rgba(0,30,80,0.38);
          z-index:200;display:flex;align-items:center;justify-content:center;
          backdrop-filter:blur(3px);
        }
        .detail-modal-card{
          background:#fff;border-radius:18px;padding:28px 30px 30px;
          width:560px;max-width:96vw;max-height:92vh;overflow-y:auto;
          box-shadow:0 24px 64px rgba(0,51,102,0.22);
          border:1px solid #E2E8F0;
          animation:fadeScale 0.2s ease-out;
        }
        @keyframes fadeScale{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}

        /* header */
        .dmc-header{
          display:flex;justify-content:space-between;align-items:center;
          margin-bottom:20px;
        }
        .dmc-title{font-size:14px;font-weight:900;color:#003366;letter-spacing:0.5px;text-transform:uppercase;}
        .dmc-badge{font-size:12px;font-weight:800;padding:5px 16px;border-radius:7px;letter-spacing:0.2px;}
        .dmc-badge-evento{background:#FFD100;color:#003366;}
        .dmc-badge-pub{background:rgba(0,51,102,0.1);color:#003366;}
        .dmc-close{background:none;border:none;font-size:17px;color:#aaa;cursor:pointer;padding:2px 6px;border-radius:6px;line-height:1;}
        .dmc-close:hover{background:#F4F6F8;color:#555;}

        /* author */
        .dmc-author-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;}
        .dmc-avatar{
          width:50px;height:50px;background:#fff;color:#FFD100;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;
          border:3px solid #FFD100;flex-shrink:0;
          box-shadow:0 0 0 3px rgba(255,209,0,0.15);
        }
        .dmc-post-title{font-size:20px;font-weight:900;color:#003366;line-height:1.2;}
        .dmc-post-meta{font-size:12px;color:#888;margin-top:4px;}

        /* description */
        .dmc-section-label{
          font-size:10px;font-weight:800;color:#888;letter-spacing:0.8px;
          text-transform:uppercase;margin-bottom:8px;
        }
        .dmc-desc-box{
          background:#F7F9FB;border:1px solid #E8EDF3;border-radius:10px;
          padding:14px 16px;font-size:13px;line-height:1.6;color:#334;
          margin-bottom:16px;
        }

        /* tags */
        .dmc-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px;}
        .dmc-tag{
          font-size:12px;font-weight:700;color:#003366;
          background:#EEF3FB;border:1.5px solid #C8D8EE;
          padding:4px 12px;border-radius:20px;
        }

        /* meta grid */
        .dmc-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .dmc-meta-item{
          display:flex;align-items:center;gap:12px;
          background:#F7F9FB;border:1px solid #E8EDF3;border-radius:10px;
          padding:12px 14px;
        }
        .dmc-meta-icon-wrap{
          width:36px;height:36px;background:#EEF3FB;border-radius:50%;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .dmc-meta-label{font-size:9px;font-weight:800;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;}
        .dmc-meta-val{font-size:14px;font-weight:800;color:#003366;}

        /* WIDGETS */
        .panel{background:var(--navy-mid);border-radius:var(--radius);border:1px solid var(--navy-border);padding:16px;display:flex;flex-direction:column;gap:14px;}
        .panel-title{font-size:12px;font-weight:800;color:var(--text-primary);text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;}
        .pumitas-panel-list{display:flex;flex-direction:column;gap:10px;}
        .pumitas-panel-item{display:flex;align-items:center;gap:10px;padding:4px 0;}
        .pp-ava-wrap{position:relative;}
        .pp-ava{width:32px;height:32px;background:var(--navy-light);border:1px solid var(--navy-border);color:var(--text-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;}
        .pp-dot{position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;border:1.5px solid var(--navy-mid);}
        .pp-dot.activo{background:var(--green-ok);}
        .pp-dot.ausente{background:#94a3b8;}
        .pp-name{font-size:12px;font-weight:700;color:var(--text-primary);}
        .pp-status{font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:3px;margin-top:1px;}
        .pp-status.activo{color:var(--green-ok);}
        .pp-status.ausente{color:var(--text-secondary);}
        .pumitas-panel-section{font-size:10px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;margin-top:4px;border-bottom:1px solid var(--navy-border);padding-bottom:2px;}
        .pumitas-request-item .pp-status{font-size:11px;color:var(--text-secondary);}
        .pumita-request-actions{display:flex;gap:6px;align-items:center;}
        .pumita-btn{border:none;background:var(--navy-light);border-radius:6px;width:26px;height:26px;
          font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.15s, background 0.15s;}
        .pumita-btn:hover{transform:scale(1.08);}
        .pumita-btn-accept:hover{background:#1E8E3E22;}
        .pumita-btn-reject:hover{background:#D9303022;}
        .pumita-spinner{display:inline-block;width:16px;height:16px;border:2px solid var(--navy-border);
          border-top-color:var(--yellow);border-radius:50%;animation:pumitaSpin 0.7s linear infinite;}
        @keyframes pumitaSpin{to{transform:rotate(360deg);}}
        .voae-badge{
          display:inline-flex;align-items:center;gap:4px;
          background:rgba(0,51,102,0.08);color:#003366;
          border:1px solid #003366;border-radius:20px;
          padding:4px 10px;font-size:11px;font-weight:800;
          margin-top:2px;width:fit-content;
        }

        .switcher-header{display:flex;background:var(--navy-light);border:1px solid var(--navy-border);border-radius:var(--radius-sm);padding:2px;gap:2px;}
        .switcher-tab-btn{flex:1;background:none;border:none;padding:6px 4px;font-size:11px;font-weight:700;color:var(--text-secondary);cursor:pointer;border-radius:5px;transition:all 0.2s;text-align:center;}
        .switcher-tab-btn.active{background:var(--navy-mid);color:#003366;box-shadow:0 2px 5px rgba(0,0,0,0.05);}
        .switcher-content-box{font-size:12px;padding:4px 2px;color:var(--text-primary);}

        .scope-academico{color:#003366;}.scope-cultural{color:#ec4899;}.scope-social{color:#f59e0b;}.scope-deportivo{color:#10b981;}

        /* DRAWER */
        .drawer-overlay{position:fixed;inset:0;background:rgba(0,51,102,0.3);z-index:150;display:flex;justify-content:flex-end;}
        .drawer-panel{width:400px;background:var(--navy-mid);height:100%;box-shadow:-4px 0 24px rgba(0,0,0,0.15);padding:24px;display:flex;flex-direction:column;gap:20px;}
        .drawer-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--navy-border);padding-bottom:14px;}
        .drawer-title{font-size:18px;font-weight:800;color:var(--text-primary);margin-top:4px;}
        .drawer-author{font-size:11px;color:var(--text-secondary);margin-top:2px;}
        .drawer-scope{font-size:10px;font-weight:800;text-transform:uppercase;background:var(--navy-light);padding:2px 8px;border-radius:4px;border:1px solid var(--navy-border);}
        .drawer-close{background:none;border:none;font-size:16px;color:var(--text-secondary);cursor:pointer;}
        .drawer-body{flex:1;display:flex;flex-direction:column;gap:16px;overflow-y:auto;}
        .drawer-desc{font-size:13px;line-height:1.5;color:var(--text-primary);}
        .drawer-meta-grid{display:grid;grid-template-columns:1fr;gap:12px;background:var(--navy-light);padding:14px;border-radius:var(--radius-sm);border:1px solid var(--navy-border);}
        .drawer-meta-item{display:flex;gap:10px;align-items:center;}
        .drawer-meta-icon{font-size:18px;}
        .drawer-meta-label{font-size:10px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;}
        .drawer-meta-val{font-size:12px;font-weight:700;color:var(--text-primary);}
        .drawer-tags{display:flex;flex-wrap:wrap;gap:6px;}
        .drawer-top-inscritos{display:flex;flex-direction:column;gap:8px;}
        .drawer-section-label{font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.3px;}
        .top-inscrito-item{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;}
        .author-ava{width:28px;height:28px;background:var(--navy-light);border:1px solid var(--navy-border);color:var(--text-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;}
        .top-inscrito-name{font-size:12px;font-weight:600;color:var(--text-primary);}
        .drawer-footer{border-top:1px solid var(--navy-border);padding-top:16px;display:flex;flex-direction:column;gap:10px;}
        .btn-inscribir{width:100%;background:#003366;color:#fff;border:none;border-radius:var(--radius-sm);padding:12px;font-size:13px;font-weight:700;cursor:pointer;}
        .btn-inscribir.inscrito{background:var(--green-ok);}
        .drawer-login-hint{font-size:12px;color:var(--text-secondary);text-align:center;}
        .drawer-login-link{color:var(--text-primary);font-weight:700;}

        /* NUEVOS ESTILOS - IMÁGENES Y PREVIEW */
        .post-images-grid {
          display: grid;
          gap: 8px;
          margin-top: 10px;
          border-radius: 8px;
          overflow: hidden;
        }
        .post-images-grid.grid-1 {
          grid-template-columns: 1fr;
        }
        .post-images-grid.grid-2 {
          grid-template-columns: 1fr 1fr;
        }
        .post-images-grid.grid-3 {
          grid-template-columns: 2fr 1fr;
          grid-template-rows: 1fr 1fr;
        }
        .post-images-grid.grid-3 img:first-child {
          grid-row: span 2;
          height: 100%;
        }
        .post-image-item {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border: 1px solid var(--navy-border);
          transition: transform 0.2s;
        }
        .post-image-item:hover {
          transform: scale(1.01);
        }
        .image-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        .image-preview-container {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--navy-border);
        }
        .image-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-preview-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          cursor: pointer;
        }

        /* WHATSAPP Y HIDE BUTTONS */
        .action-btn-whatsapp {
          background: rgba(37,211,102,0.06);
          border: 1.5px solid #25D366;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #128C7E;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .action-btn-whatsapp:hover {
          background: rgba(37,211,102,0.12);
        }
        .post-hide-btn {
          background: none;
          border: none;
          font-size: 16px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .post-hide-btn:hover {
          background: rgba(0,0,0,0.05);
          color: #ef4444;
        }

        /* BADGES Y AUTOCOMPLETE */
        .saved-at-badge {
          background: rgba(255, 209, 0, 0.15);
          border: 1px dashed var(--yellow);
          color: #003366;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: flex-start;
        }
        .tag-suggestions-dropdown {
          position: absolute;
          background: #FFFFFF;
          border: 1.5px solid var(--navy-border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1000;
          max-height: 150px;
          overflow-y: auto;
          width: 100%;
          margin-top: 4px;
        }
        .tag-suggestion-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--navy-border);
        }
        .tag-suggestion-item:last-child {
          border-bottom: none;
        }
        .tag-suggestion-item:hover {
          background: var(--navy-light);
        }
        .tag-avatar {
          width: 24px;
          height: 24px;
          background: #003366;
          color: #FFD100;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tag-name {
          font-size: 13px;
          font-weight: 600;
          color: #003366;
        }
        .post-avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .custom-file-upload {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #F4F6F8;
          border: 1.5px dashed #C8D8EE;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          color: #003366;
          transition: all 0.2s;
          margin-bottom: 12px;
          width: 100%;
          justify-content: center;
        }
        .custom-file-upload:hover {
          background: #EEF3FB;
          border-color: #003366;
        }
      `}</style>
      <div className="app">
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {/* TOPBAR */}
          <header className="topbar">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* logo removido */}
            </div>
            <div className="topbar-center">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input type="text" className="search-input" placeholder="Buscar en el Muro..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="topbar-right" onClick={e=>e.stopPropagation()}>
              {!showOnlySaved && <button className="btn-primary" onClick={()=>setShowModal(true)}>+ Crear Post</button>}
              <div style={{position:"relative"}}>
                <button className="icon-btn" onClick={()=>{setNotiOpen(v=>!v);}}>
                  🔔 {unread>0 && <span className="badge">{unread}</span>}
                </button>
                {notiOpen && (
                  <div className="notifications-dropdown">
                    <div className="noti-header">
                      <h3>Notificaciones</h3>
                      <button className="noti-clear-btn" onClick={()=>{marcarTodasLeidas(); showToast("Notificaciones leídas"); setNotiOpen(false);}}>Marcar leídas</button>
                    </div>
                    <div className="noti-list">
                      {notifications.length === 0 && (
                        <p style={{fontSize:12, color:"var(--text-secondary)", fontWeight:600, padding:"4px 2px"}}>No tienes notificaciones.</p>
                      )}
                      {notifications.slice(0,5).map(n=>(
                        <div key={n.id} className={`noti-item${n.unread?" unread":""}`} onClick={()=>{ if(n.unread) marcarNotificacionLeidaAPI(n.id); }}>
                          <div className="noti-icon-box">{n.icon}</div>
                          <div>
                            <div className="noti-text">{n.text}</div>
                            <div className="noti-time">{n.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="noti-viewall" onClick={()=>{setNotiOpen(false); setMostrarHistorialNotificaciones(true);}}>
                      Ver todas las notificaciones
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN */}
          <main className="main-container">
            <div className="feed-column">
              <div className="controls-row">
                <div className="filter-tabs">
                  {["Todas","Publicacion","Evento"].map(t=>(
                    <button key={t} className={`filter-btn${activeFilter===t && !showHiddenOnly?" active":""}`} onClick={()=>{setActiveFilter(t);setShowHiddenOnly(false);}}>
                      {t==="Todas"?"🌐 Todas":t==="Publicacion"?"📢 Publicaciones":"📅 Eventos"}
                    </button>
                  ))}
                  {posts.some(p=>p.hidden) && (
                    <button className={`filter-btn${showHiddenOnly?" active":""}`} onClick={()=>setShowHiddenOnly(v=>!v)}>
                      🙈 Ocultos ({posts.filter(p=>p.hidden).length})
                    </button>
                  )}
                </div>
                <select className="sort-select" value={sortValue} onChange={e=>setSortValue(e.target.value)}>
                  <option value="reciente">⏱️ Más Recientes</option>
                  <option value="popular">🔥 Más Populares</option>
                  <option value="comentado">💬 Más Comentados</option>
                </select>
              </div>

              {filtered.length === 0 ? (
                <div style={{background:"var(--navy-mid)",padding:40,borderRadius:"var(--radius)",textAlign:"center",border:"1px solid var(--navy-border)"}}>
                  <div style={{fontSize:32,marginBottom:8}}>📦</div>
                  <div style={{fontSize:14,color:"var(--gray-mid)"}}>
                    {showHiddenOnly ? "No tienes publicaciones ni eventos ocultos."
                      : showOnlySaved ? "No tienes publicaciones guardadas."
                      : "No se encontraron publicaciones que coincidan."}
                  </div>
                </div>
              ) : (
                filtered.slice(0, visibleCount).map(p=>(
                  <PostCard key={p.id} post={p}
                    onReact={handleReact} onToggleComments={handleToggleComments}
                    onAddComment={handleAddComment}
                    onReactComment={handleReactComment}
                    onReportComment={handleReportComment}
                    onReportPublicacion={handleReportPublicacion}
                    onHide={handleHide} onUnhide={handleUnhide} onSave={handleSave} onShare={handleShare}
                    onOpenDrawer={setDrawerPost} onInscribir={handleInscribir}
                    onOpenDetail={setDetailPost} onEdit={handleEditPost}
                    openCommentIds={openCommentIds} isLoggedIn={isLoggedIn}
                    showOnlySaved={showOnlySaved} showHiddenOnly={showHiddenOnly} />
                ))
              )}

              {filtered.length > 0 && !showHiddenOnly && !showOnlySaved && (
                <button onClick={handleLoadMore}
                  style={{background:"var(--navy-mid)",border:"1.5px solid var(--navy-border)",borderRadius:"var(--radius)",
                    padding:"12px",fontSize:13,fontWeight:700,color:"#003366",cursor:"pointer",boxShadow:"var(--shadow)",transition:"background 0.2s", marginTop:"12px", width: "100%"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--navy-light)"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--navy-mid)"}>
                  Cargar más {activeFilter==="Evento" ? "eventos" : "publicaciones"}
                </button>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="widgets-column">
              <div className="panel">
                <div className="panel-title">🟢 Pumitas Conectados</div>
                <div className="pumitas-panel-list">
                  {pumitaRequests.length > 0 && (
                    <>
                      <div className="pumitas-panel-section">📨 Solicitudes</div>
                      {pumitaRequests.map(req => {
                        const loading = pumitaRequestLoading.has(req.id_conexion);
                        return (
                          <div key={req.id_conexion} className="pumitas-panel-item pumitas-request-item">
                            <div className="pp-ava-wrap">
                              <div className="pp-ava">{getIniciales(req.nombre)}</div>
                            </div>
                            <div style={{flex:1}}>
                              <div className="pp-name">{req.nombre}</div>
                              <div className="pp-status">Quiere conectar contigo</div>
                            </div>
                            <div className="pumita-request-actions">
                              {loading ? (
                                <span className="pumita-spinner" aria-label="Procesando" />
                              ) : (
                                <>
                                  <button className="pumita-btn pumita-btn-accept" title="Aceptar"
                                    onClick={()=>handlePumitaRequest(req,"accept")}>✔️</button>
                                  <button className="pumita-btn pumita-btn-reject" title="Rechazar"
                                    onClick={()=>handlePumitaRequest(req,"reject")}>✖️</button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <div className="pumitas-panel-section">🟢 Activos</div>
                  {connectedPumitas.length === 0 && (
                    <p style={{fontSize:11, color:"var(--text-secondary)", fontWeight:600}}>Aún no tienes Pumitas conectados.</p>
                  )}
                  {connectedPumitas.map((u)=>(
                    <div key={u.id_conexion ?? u.id_usuario} className="pumitas-panel-item">
                      <div className="pp-ava-wrap">
                        <div className="pp-ava">{getIniciales(u.nombre)}</div>
                        <span className="pp-dot activo"/>
                      </div>
                      <div><div className="pp-name">{u.nombre}</div><div className="pp-status activo">● Conectado</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* OVERLAYS */}
      {detailPost && (
        <DetailModal
          post={posts.find(p=>p.id===detailPost.id)||detailPost}
          onClose={()=>setDetailPost(null)}
        />
      )}

      {editPost && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50" onClick={() => setEditPost(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex justify-between items-center shrink-0">
              <h3 className="text-xs font-extrabold text-[#004B87] tracking-wider uppercase">✏️ Editar publicación</h3>
              <button onClick={() => setEditPost(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">DESCRIPCIÓN</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={5}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">TAGS (separados por coma)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="#tag1, #tag2"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3 shrink-0">
              <button onClick={() => setEditPost(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-6 py-2 bg-[#004B87] text-white rounded-xl text-sm font-bold hover:bg-[#003366]">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarHistorialNotificaciones && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,51,102,0.4)", zIndex:250, display:"flex", alignItems:"center", justifyContent:"center", padding:16}} onClick={()=>setMostrarHistorialNotificaciones(false)}>
          <div style={{background:"#fff", width:"100%", maxWidth:560, maxHeight:"86vh", overflowY:"auto", borderRadius:16, border:"1px solid #E2E8F0", boxShadow:"0 24px 64px rgba(0,0,0,0.25)", padding:20}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, gap:12}}>
              <div>
                <h3 style={{fontSize:19, fontWeight:800, color:"#003366"}}>Historial de notificaciones</h3>
                <p style={{fontSize:13, color:"#5b6472", marginTop:2}}>Busca y revisa tus notificaciones.</p>
              </div>
              <button onClick={()=>setMostrarHistorialNotificaciones(false)} style={{width:36, height:36, borderRadius:8, background:"#F4F6F8", border:"1px solid #E2E8F0", color:"#003366", cursor:"pointer", fontSize:14}}>✕</button>
            </div>

            <input
              value={busquedaNotificaciones}
              onChange={e=>setBusquedaNotificaciones(e.target.value)}
              placeholder="Buscar notificaciones..."
              style={{width:"100%", borderRadius:12, border:"1px solid #E2E8F0", background:"#F4F6F8", padding:"12px 14px", fontSize:13, outline:"none", marginBottom:14}}
            />

            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {notifications
                .filter(n => n.text.toLowerCase().includes(busquedaNotificaciones.toLowerCase()))
                .map(n => (
                  <button
                    key={`historial-${n.id}`}
                    onClick={()=>{ if(n.unread) marcarNotificacionLeidaAPI(n.id); }}
                    style={{
                      display:"flex", alignItems:"flex-start", gap:12, textAlign:"left",
                      borderRadius:12, padding:12, cursor:"pointer",
                      background: n.unread ? "#F4F6F8" : "#fff",
                      border: n.unread ? "1px dashed #FFD100" : "1px solid #E2E8F0",
                    }}
                  >
                    <span style={{width:36, height:36, borderRadius:8, background:"#fff", border:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0}}>{n.icon}</span>
                    <div style={{minWidth:0}}>
                      <p style={{fontSize:13, fontWeight:700, color:"#003366"}}>{n.text}</p>
                      <p style={{fontSize:11, color:"#5b6472", marginTop:2}}>{n.time}</p>
                    </div>
                  </button>
                ))}
              {notifications.filter(n => n.text.toLowerCase().includes(busquedaNotificaciones.toLowerCase())).length === 0 && (
                <p style={{fontSize:13, color:"#5b6472", fontWeight:600, padding:12, textAlign:"center"}}>No se encontraron notificaciones.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && <NewPostModal onClose={()=>setShowModal(false)} onCreate={handleCreate} />}
      <Toast message={toast} />
      {confettiKey !== null && <ConfettiBurst confettiKey={confettiKey} />}
    </>
  );
}
export { Feed as SocialFeed };