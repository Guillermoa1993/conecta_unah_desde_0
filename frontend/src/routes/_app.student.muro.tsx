import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/_app/student/muro")({
  component: MuroPage,
});

interface Comment { id: number; author: string; authorInitials: string; text: string; time: string; replyTo?: string; }
interface Post {
  id: number; author: string; initials: string; type: "Evento" | "Publicacion";
  scope: string; visibility: string; time: string; title: string; desc: string;
  tags: string[]; love: number; like: number; dislike: number; haha: number; wow: number; sad: number; angry: number;
  comments: Comment[];
  userReaction: "love"|"like"|"dislike"|"haha"|"wow"|"sad"|"angry"|null; saved: boolean; hidden: boolean;
  fecha?: string; lugar?: string; cupos?: number; inscrito?: boolean;
  topInscritos?: { initials: string; name: string }[];
  images?: string[];
  savedAt?: string;
  profilePic?: string;
  createdAt?: number;
}

function sanitizeHTML(text: string): string {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
}
function hasSQLi(text: string): boolean {
  if (!text) return false;
  return /\b(select|union|drop|insert|delete|update|alter|create|truncate|from|where|or\s+\d+=\d+|--)\b/i.test(text);
}
function isValidInput(text: string): boolean {
  if (!text) return true;
  return !/[<>;=\\{}]/.test(text);
}
function parseSavedAt(savedAt?: string): number {
  if (!savedAt) return 0;
  const parts = savedAt.split(" ");
  const dateParts = parts[0].split("/");
  if (dateParts.length !== 3) return 0;
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const year = parseInt(dateParts[2], 10);
  let hours = 0, minutes = 0;
  if (parts[1]) {
    const tp = parts[1].split(":");
    hours = parseInt(tp[0], 10); minutes = parseInt(tp[1], 10);
    if (parts[2] === "PM" && hours < 12) hours += 12;
    if (parts[2] === "AM" && hours === 12) hours = 0;
  }
  return new Date(year, month, day, hours, minutes).getTime();
}

interface Notification { id: number; icon: string; text: string; time: string; unread: boolean; }
type ActiveReaction = "love"|"like"|"dislike"|"angry"|"sad"|"haha"|"wow";

const EMOJIS: { key: ActiveReaction; icon: string; label: string }[] = [
  { key:"love", icon:"❤️", label:"Me encanta" }, { key:"like", icon:"👍", label:"Me gusta" },
  { key:"haha", icon:"😂", label:"Jaja" }, { key:"wow", icon:"😮", label:"Asombro" },
  { key:"sad", icon:"😢", label:"Triste" }, { key:"angry", icon:"😡", label:"Enojado" },
  { key:"dislike", icon:"👎", label:"No me gusta" },
];

const scopeIcons: Record<string,string> = { Academico:"📖", Cultural:"🎭", Social:"🤝", Deportivo:"⚽" };
const scopeColors: Record<string,string> = { Academico:"scope-academico", Cultural:"scope-cultural", Social:"scope-social", Deportivo:"scope-deportivo" };

const initialPosts: Post[] = [
  { id:1, author:"Camel García", initials:"CG", type:"Publicacion", scope:"Academico", visibility:"Público", time:"Hace 5 min", title:"Nuevo Tutorial de Base de Datos", desc:"Recursos y ejemplos prácticos para comprender SQL y modelado relacional.", tags:["#BaseDeDatos","#Tutorial","#SQL"], love:0, like:0, dislike:0, haha:0, wow:0, sad:0, angry:0, comments:[{ id:1, author:"Miguel Torres", authorInitials:"MT", text:"Excelente recurso, me ayudó mucho.", time:"Hace 3 min" }], userReaction:null, saved:false, hidden:false, createdAt: Date.now() - 5 * 60 * 1000 },
  { id:2, author:"Valeria Rojas", initials:"VR", type:"Evento", scope:"Academico", visibility:"Público", time:"Hace 2 horas", title:"Grupo de Estudio C++", desc:"Reunión para resolver ejercicios del curso de Programación II.", tags:["#C++","#Programación","#Estudio"], fecha:"2026-07-10", lugar:"Sala 3 – Ing.", cupos:20, inscrito:false, topInscritos:[{ initials:"MT", name:"Miguel Torres" },{ initials:"LP", name:"Laura Paz" }], love:0, like:0, dislike:0, haha:0, wow:0, sad:0, angry:0, comments:[{ id:2, author:"Laura Paz", authorInitials:"LP", text:"¡Cuenten conmigo!", time:"Hace 1 hora" }], userReaction:null, saved:false, hidden:false, createdAt: Date.now() - 120 * 60 * 1000 },
  { id:3, author:"Puma Head", initials:"PH", type:"Publicacion", scope:"Deportivo", visibility:"Público", time:"Hace 4 horas", title:"Resultados del Torneo Interclases", desc:"Resultados del torneo de fútbol. ¡Felicidades al equipo de Sistemas!", tags:["#Fútbol","#Deporte","#Torneo"], love:0, like:0, dislike:0, haha:0, wow:0, sad:0, angry:0, comments:[{ id:3, author:"Valeria Rojas", authorInitials:"VR", text:"Muy emocionante el partido final.", time:"Hace 2 horas" }], userReaction:null, saved:false, hidden:false, createdAt: Date.now() - 240 * 60 * 1000 },
  { id:4, author:"Carlos Mendoza", initials:"CM", type:"Evento", scope:"Cultural", visibility:"Público", time:"Hace 1 día", title:"Noche de Talentos UNAH 2026", desc:"Evento artístico estudiantil: música, danza, teatro y arte.", tags:["#Arte","#Cultura","#UNAH"], fecha:"2026-08-15", lugar:"Auditorio Central", cupos:150, inscrito:false, topInscritos:[{ initials:"CG", name:"Camel García" },{ initials:"PH", name:"Puma Head" }], love:0, like:0, dislike:0, haha:0, wow:0, sad:0, angry:0, comments:[], userReaction:null, saved:false, hidden:false, createdAt: Date.now() - 1440 * 60 * 1000 },
  { id:101, author:"Comunidad Académica UNAH", initials:"CA", type:"Publicacion", scope:"Academico", visibility:"Público", time:"18/06/2026", title:"Guía rápida para preparar una tutoría efectiva", desc:"Consejos breves para organizar materiales, objetivos y tiempos antes de una tutoría.", tags:["#Tutoría","#Estudio","#Academico"], love:0, like:0, dislike:0, haha:0, wow:0, sad:0, angry:0, comments:[], userReaction:null, saved:true, savedAt: "18/06/2026 12:00 PM", hidden:false, createdAt: new Date("2026-06-18T12:00:00").getTime() },
  { id:102, author:"VOAE", initials:"VO", type:"Publicacion", scope:"Social", visibility:"Público", time:"16/06/2026", title:"Convocatoria de voluntariado estudiantil", desc:"Información sobre apoyo estudiantil en actividades culturales y académicas.", tags:["#Voluntariado","#Apoyo","#UNAH"], love:0, like:0, dislike:0, haha:0, wow:0, sad:0, angry:0, comments:[], userReaction:null, saved:true, savedAt: "16/06/2026 12:00 PM", hidden:false, createdAt: new Date("2026-06-16T12:00:00").getTime() },
  { id:103, author:"Conecta Puma", initials:"CP", type:"Publicacion", scope:"Social", visibility:"Público", time:"12/06/2026", title:"Recursos para mejorar tu perfil universitario", desc:"Recomendaciones para mantener actualizada la información académica y tus conexiones.", tags:["#Perfil","#Conexiones","#Puma"], love:0, like:0, dislike:0, haha:0, wow:0, sad:0, angry:0, comments:[], userReaction:null, saved:true, savedAt: "12/06/2026 12:00 PM", hidden:false, createdAt: new Date("2026-06-12T12:00:00").getTime() },
];

const initialNotifications: Notification[] = [
  { id:1, icon:"💬", text:"<strong>Miguel Torres</strong> comentó tu publicación", time:"Hace 5 min", unread:true },
  { id:2, icon:"❤️", text:"A <strong>Valeria</strong> le encanta tu tutorial", time:"Hace 20 min", unread:true },
  { id:3, icon:"🎓", text:"Nuevo ámbito <strong>Académico</strong> habilitado", time:"Hace 1 hora", unread:true },
];

const pumitasStories = [
  { name:"Tu estado", initials:"CA", online:true, hasStory:false, isMe:true, storyText:"" },
  { name:"Miguel", initials:"MT", online:true, hasStory:true, isMe:false, storyText:"📚 Estudiando para el parcial..." },
  { name:"Valeria", initials:"VR", online:true, hasStory:true, isMe:false, storyText:"🎉 ¡Evento cultural mañana!" },
  { name:"Ángela", initials:"AR", online:false, hasStory:false, isMe:false, storyText:"" },
  { name:"Carlos", initials:"CM", online:true, hasStory:true, isMe:false, storyText:"⚽ Torneo este viernes, ¡anímense!" },
  { name:"Puma Head", initials:"PH", online:true, hasStory:false, isMe:false, storyText:"" },
];

function getTotalReactions(post: Post) { return post.love + post.like + post.dislike + post.haha + post.wow + post.sad + post.angry; }
function getReactionIcon(r: ActiveReaction | null): string { if (!r) return "👍"; return EMOJIS.find(e => e.key === r)?.icon || "👍"; }
function getReactionLabel(r: ActiveReaction | null): string { if (!r) return "Reaccionar"; return EMOJIS.find(e => e.key === r)?.label || "Reaccionar"; }

function StoriesBar({ onCreateStory }: { onCreateStory?: () => void }) {
  const [activeStory, setActiveStory] = useState<typeof pumitasStories[0] | null>(null);
  return (
    <>
      <div className="stories-bar">
        {pumitasStories.map((p,i)=>(
          <div key={i} className={`story-item${p.hasStory||p.isMe?" story-clickable":""}`} onClick={()=>{if(p.isMe&&onCreateStory)onCreateStory(); else if(p.hasStory)setActiveStory(p);}}>
            <div className={`story-ring${p.hasStory||p.isMe?" has-story":""}`}>
              <div className="story-ava">{p.isMe && <span className="story-plus">+</span>}{p.initials}</div>
            </div>
            <span className="story-name">{p.name}</span>
            {p.online && !p.isMe && <span className="story-online"/>}
          </div>
        ))}
      </div>
      {activeStory && (
        <div className="story-overlay" onClick={()=>setActiveStory(null)}>
          <div className="story-viewer" onClick={e=>e.stopPropagation()}>
            <div className="story-viewer-bar"/><button className="story-viewer-close" onClick={()=>setActiveStory(null)}>✕</button>
            <div className="story-viewer-ava">{activeStory.initials}</div>
            <div className="story-viewer-name">{activeStory.name}</div>
            {activeStory.storyImage && <img src={activeStory.storyImage} alt="Story" style={{width:"80%",maxHeight:200,borderRadius:8,marginBottom:12,objectFit:"cover"}} />}
          <div className="story-viewer-text">{activeStory.storyText}</div>
          </div>
        </div>
      )}
    </>
  );
}

function CreateStoryModal({ onClose, onPublish }: {
  onClose: () => void;
  onPublish: (image: string, text: string) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [storyText, setStoryText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
      alert("Solo se permiten imágenes JPG, PNG o GIF.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const publish = () => {
    if (!selectedImage) { alert("Debes seleccionar una imagen."); return; }
    onPublish(selectedImage, storyText.trim());
    onClose();
  };

  return (
    <div style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,20,60,0.6)", zIndex: 300, alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: 420, maxWidth: "95vw", boxShadow: "0 24px 64px rgba(0,0,0,0.25)", border: "1px solid #E2E8F0", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#003366", marginBottom: 20 }}>Crear historia</h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#FFD100" : "#C8D8EE"}`,
            borderRadius: 12, padding: 32, textAlign: "center", cursor: "pointer",
            background: dragOver ? "rgba(255,209,0,0.06)" : "#F7F9FB",
            transition: "all 0.2s", marginBottom: 16, minHeight: 180,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {selectedImage ? (
            <img src={selectedImage} alt="Preview" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 8, objectFit: "contain" }} />
          ) : (
            <div>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#003366" }}>Arrastra una imagen aquí o haz clic para seleccionar</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>JPG, PNG o GIF</div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif" onChange={handleFileSelect} style={{ display: "none" }} />
        <input type="text" placeholder="Escribe un texto opcional..." value={storyText} onChange={e => setStoryText(e.target.value)} style={{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#003366", outline: "none", marginBottom: 20, fontFamily: "inherit", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: "#717182", cursor: "pointer" }}>Cancelar</button>
          <button onClick={publish} style={{ background: "#FFD100", color: "#003366", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: selectedImage ? 1 : 0.5 }}>Publicar historia</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, background:"var(--navy-mid)", color:"var(--white)", padding:"12px 20px", borderRadius:"var(--radius-sm)", borderLeft:"4px solid var(--yellow)", fontSize:13, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:999, border:"1px solid var(--navy-border)", transform:message?"translateY(0)":"translateY(80px)", opacity:message?1:0, transition:"all 0.3s" }}>
      {message}
    </div>
  );
}

function FloatingReactionBtn({ post, onReact }: { post: Post; onReact: (id: number, t: ActiveReaction) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = getTotalReactions(post);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
      {open && (
        <div className="emoji-picker-float">
          {EMOJIS.map(e => (
            <button key={e.key} className={`emoji-pick-btn${post.userReaction === e.key ? " picked" : ""}`} onClick={() => { onReact(post.id, e.key); setOpen(false); }} title={e.label}>
              <span className="emoji-icon">{e.icon}</span><span className="emoji-lbl">{e.label}</span>
            </button>
          ))}
        </div>
      )}
      <button className={`reaction-main-btn${post.userReaction ? " reacted" : ""}`} onClick={() => setOpen(v => !v)}>
        <span>{getReactionIcon(post.userReaction)}</span><span className="reaction-btn-label">{getReactionLabel(post.userReaction)}</span>
        {total > 0 && <span className="reaction-count">{total}</span>}
      </button>
    </div>
  );
}

function DetailModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const total = getTotalReactions(post);
  const IconPerson = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
  const IconFolder = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>);
  const IconMonitor = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>);
  const IconGlobe = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>);
  const IconThumb = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>);
  const IconClock = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
  const metaItems = [
    { icon: <IconPerson />, label: "RESPONSABLE", value: post.author.split(" ")[0] },
    { icon: <IconFolder />, label: "CATEGORÍA", value: post.type },
    { icon: <IconMonitor />, label: "ÁMBITO", value: post.scope },
    { icon: <IconGlobe />, label: "VISIBILIDAD", value: post.visibility },
    { icon: <IconThumb />, label: "REACCIONES", value: String(total) },
    { icon: <IconClock />, label: "PUBLICADO", value: post.time },
  ];
  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-card" onClick={e => e.stopPropagation()}>
        <div className="dmc-header">
          <div style={{ display:"flex", alignItems:"center", gap:9 }}><IconMonitor /><span className="dmc-title">DETALLE DE LA ACTIVIDAD</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {post.saved && post.savedAt && <span style={{ fontSize:11, fontWeight:800, background:"rgba(255,209,0,0.18)", color:"#003366", padding:"5px 12px", borderRadius:7 }}>🔖 Guardado: {post.savedAt}</span>}
            <span className={`dmc-badge ${post.type==="Evento"?"dmc-badge-evento":"dmc-badge-pub"}`}>{post.type}</span>
            <button className="dmc-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="dmc-author-row">
          <div className="dmc-avatar">{post.profilePic ? <img src={post.profilePic} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}} /> : post.initials}</div>
          <div><div className="dmc-post-title" style={{fontSize:"18px",fontWeight:"900",color:"#003366"}}>{post.title}</div><div className="dmc-post-meta">Publicado por <strong style={{color:"#003366"}}>{post.author}</strong> · {post.time}</div></div>
        </div>
        {post.images && post.images.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
            {post.images.map((img,idx) => <img key={idx} src={img} alt={`Img ${idx+1}`} style={{width:"100%",maxHeight:"350px",objectFit:"cover",borderRadius:"10px",border:"1px solid #E2E8F0"}} />)}
          </div>
        )}
        <div className="dmc-section-label">DESCRIPCIÓN</div>
        <div className="dmc-desc-box" style={{whiteSpace:"pre-wrap"}}>{post.desc}</div>
        <div className="dmc-tags">{post.tags.map(t => <span key={t} className="dmc-tag">{t}</span>)}</div>
        <div className="dmc-meta-grid">{metaItems.map((m,i) => (<div key={i} className="dmc-meta-item"><div className="dmc-meta-icon-wrap">{m.icon}</div><div><div className="dmc-meta-label">{m.label}</div><div className="dmc-meta-val">{m.value}</div></div></div>))}</div>
      </div>
    </div>
  );
}

function EventDrawer({ post, onClose, onInscribir, isLoggedIn }: { post:Post; onClose:()=>void; onInscribir:(id:number)=>void; isLoggedIn:boolean }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e=>e.stopPropagation()}>
        <div className="drawer-header">
          <div><span className={`drawer-scope ${scopeColors[post.scope]||""}`}>{scopeIcons[post.scope]} {post.scope}</span><h2 className="drawer-title">{post.title}</h2><p className="drawer-author">Por {post.author} · {post.time}</p></div>
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
              {post.topInscritos.map((u,i)=>(<div key={i} className="top-inscrito-item"><div className="author-ava">{u.initials}</div><span className="top-inscrito-name">{u.name}</span>{i===0&&<span>🥇</span>}{i===1&&<span>🥈</span>}{i===2&&<span>🥉</span>}</div>))}
            </div>
          )}
        </div>
        <div className="drawer-footer">
          {isLoggedIn ? <button className={`btn-inscribir${post.inscrito?" inscrito":""}`} onClick={()=>onInscribir(post.id)}>{post.inscrito?"✅ Inscrito":"📋 Inscribirme"}</button> : <p className="drawer-login-hint">🔒 <a href="#" className="drawer-login-link">Inicia sesión</a> para inscribirte</p>}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, onReact, onToggleComments, onAddComment, onHide, onSave, onShare, onOpenDrawer, onInscribir, onOpenDetail, openCommentIds, isLoggedIn, showOnlySaved }: {
  post:Post; onReact:(id:number,t:ActiveReaction)=>void; onToggleComments:(id:number)=>void;
  onAddComment:(id:number,text:string,replyTo?:string)=>void; onHide:(id:number)=>void; onSave:(id:number)=>void; onShare:(id:number)=>void;
  onOpenDrawer:(p:Post)=>void; onInscribir:(id:number)=>void; onOpenDetail:(p:Post)=>void;
  openCommentIds:Set<number>; isLoggedIn:boolean; showOnlySaved?:boolean }) {
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<string|null>(null);
  const isEvento = post.type === "Evento";
  const commentsOpen = openCommentIds.has(post.id);
  const addComment = () => { const t = commentInput.trim(); if(!t) return; onAddComment(post.id, t, replyingTo || undefined); setCommentInput(""); setReplyingTo(null); };
  return (
    <div className="post-card" id={`card-${post.id}`}>
      {showOnlySaved && post.saved && post.savedAt && <div className="saved-at-badge"><span>🔖</span> Guardado el: {post.savedAt}</div>}
      <div className="post-header">
        <div className="post-avatar">{post.profilePic ? <img src={post.profilePic} className="post-avatar-img" /> : post.initials}</div>
        <div className="post-author"><div className="post-author-name">{post.author}</div><div className="post-meta"><span className={scopeColors[post.scope]||""}>{scopeIcons[post.scope]}</span><span style={{color:"var(--white)",marginLeft:4}}>{post.scope}</span><span style={{color:"var(--navy-border)",margin:"0 4px"}}>·</span><span>🕐 {post.time}</span></div></div>
        <button className="post-hide-btn" onClick={() => onHide(post.id)} title="Ocultar">✕</button>
      </div>
      <div className="post-body">
        <span className={`post-type-badge ${isEvento?"badge-evento":"badge-publicacion"}`}>{isEvento?"📅 Evento":"📢 Publicación"}</span>
        <div className="post-title" style={{cursor:"pointer",color:"var(--white)"}} onClick={() => onOpenDetail(post)}>{post.title}</div>
        <div className="post-desc" style={{whiteSpace:"pre-wrap"}}>{post.desc}</div>
        {post.images && post.images.length > 0 && (
          <div className={`post-images-grid grid-${post.images.length}`}>
            {post.images.map((img,idx) => <img key={idx} src={img} alt={`Img ${idx+1}`} className="post-image-item" onClick={() => onOpenDetail(post)} />)}
          </div>
        )}
        {isEvento && (
          <div style={{margin:"14px 0",padding:"16px",background:"rgba(0,51,102,0.03)",borderRadius:"var(--radius-sm)",border:"1px solid var(--navy-border)",display:"flex",flexDirection:"column",gap:"10px"}}>
            {post.fecha && <div style={{fontSize:13,color:"var(--text-primary)"}}>📅 <strong>Fecha:</strong> {post.fecha}</div>}
            {post.lugar && <div style={{fontSize:13,color:"var(--text-primary)"}}>📍 <strong>Lugar:</strong> {post.lugar}</div>}
            {post.cupos !== undefined && <div style={{fontSize:13,color:"var(--gray-mid)"}}>👥 <strong>Cupos:</strong> {post.cupos} disponibles</div>}
          </div>
        )}
        <div className="post-tags">{post.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
        <div className="post-reactions post-reactions-evento">
          <FloatingReactionBtn post={post} onReact={onReact} />
          <button className={`action-icon-btn${commentsOpen?" active-comment":""}`} onClick={()=>onToggleComments(post.id)}><span>💬</span>{post.comments.length > 0 && <span style={{fontSize:11}}>{post.comments.length}</span>}</button>
          <div className="reaction-spacer" />
          {isEvento && (
            <button className={`btn-evento-join${post.inscrito?" joined":""}`} onClick={()=>onInscribir(post.id)} title={post.inscrito?"Inscrito":"Inscribirse"}>{post.inscrito ? "✓" : "+"}</button>
          )}
          <button className={`btn-evento-icon${post.saved?" saved":""}`} onClick={()=>onSave(post.id)} title={post.saved?"Guardado":"Guardar"}>🔖</button>
          <button className="btn-evento-action" onClick={() => onShare(post.id)} title="Copiar enlace">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:3}}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Compartir
          </button>
          <button className="btn-evento-whatsapp" onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`¡Mira esta publicación en el muro de UNAH!: "${post.title}" - https://mipumaapp.unah.edu.hn/post/${post.id}`)}`, "_blank"); }} title="WhatsApp">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
        </div>
      </div>
      {commentsOpen && (
        <div className="comment-section">
          <div className="comment-list">
            {post.comments.map(c=>(
              <div key={c.id} className="comment-item">
                <div className="comment-ava">{c.authorInitials}</div>
                <div className="comment-bubble-wrap">
                  {c.replyTo && <div className="comment-reply-tag">↩ respondiendo a <strong>{c.replyTo}</strong></div>}
                  <div className="comment-bubble"><div className="comment-author">{c.author}</div><div className="comment-text">{c.text}</div><div className="comment-time">{c.time}</div></div>
                  <button className="comment-reply-btn" onClick={()=>setReplyingTo(c.author)}>Responder</button>
                </div>
              </div>
            ))}
          </div>
          <div className="comment-input-row">
            <div className="comment-input-wrap">
              {replyingTo && (<div className="reply-chip">↩ {replyingTo}<button onClick={()=>setReplyingTo(null)} className="reply-chip-close">✕</button></div>)}
              <input className="comment-input" value={commentInput} onChange={e=>setCommentInput(e.target.value)} placeholder={replyingTo?`Respondiendo a ${replyingTo}...`:"Escribe un comentario..."} onKeyDown={e=>{if(e.key==="Enter")addComment();}} />
            </div>
            <button className="comment-send" onClick={addComment}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewPostModal({ onClose, onCreate }: {
  onClose:()=>void; onCreate:(d:{title:string;desc:string;type:"Evento"|"Publicacion";scope:string;tags:string[];fecha?:string;lugar?:string;cupos?:number;images?:string[]})=>void;
}) {
  const [title,setTitle]=useState(""); const [desc,setDesc]=useState(""); const [tagsRaw,setTagsRaw]=useState(""); const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showTitleEmojis, setShowTitleEmojis] = useState(false); const [showDescEmojis, setShowDescEmojis] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false); const [tagSearchQuery, setTagSearchQuery] = useState(""); const [tagStartIndex, setTagStartIndex] = useState(-1);
  const descRef = useRef<HTMLTextAreaElement>(null); const fileInputRef = useRef<HTMLInputElement>(null); const tagsRef = useRef<HTMLInputElement>(null);
  const CONNECTIONS = [{name:"Camel García",initials:"CG"},{name:"Valeria Rojas",initials:"VR"},{name:"Miguel Torres",initials:"MT"},{name:"Puma Head",initials:"PH"}];
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setTagsRaw(val);
    const cursorPos = e.target.selectionStart || 0; const textBeforeCursor = val.substring(0, cursorPos); const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx !== -1) { const queryText = textBeforeCursor.substring(lastAtIdx + 1); if (!queryText.includes(" ") && !queryText.includes("\n") && !queryText.includes(",")) { setShowTagSuggestions(true); setTagSearchQuery(queryText.toLowerCase()); setTagStartIndex(lastAtIdx); return; } }
    setShowTagSuggestions(false);
  };
  const handleSelectTag = (name: string) => {
    if (tagStartIndex === -1) return;
    const textBeforeAt = tagsRaw.substring(0, tagStartIndex); const textAfterAt = tagsRaw.substring(tagStartIndex + tagSearchQuery.length + 1);
    setTagsRaw(`${textBeforeAt}@${name} ${textAfterAt}`); setShowTagSuggestions(false);
    setTimeout(() => { if (tagsRef.current) { tagsRef.current.focus(); const ncp = tagStartIndex + name.length + 2; tagsRef.current.setSelectionRange(ncp, ncp); } }, 50);
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    const remaining = 3 - selectedImages.length; if (remaining <= 0) return;
    Promise.all(Array.from(files).slice(0, remaining).map(f => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result as string); reader.readAsDataURL(f); }))).then(base64s => { setSelectedImages(prev => [...prev, ...base64s]); if (fileInputRef.current) fileInputRef.current.value = ""; });
  };
  const handleRemoveImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const create=()=>{ if(!title.trim()){alert("⚠️ Título obligatorio");return;} onCreate({title:title.trim(),desc:desc.trim(),type:"Publicacion",scope:"Social",tags:tagsRaw.split(",").map(t=>t.trim()).filter(Boolean),images:selectedImages}); onClose(); };
  const inp: React.CSSProperties = {width:"100%",border:"1.5px solid var(--navy-border)",background:"var(--navy)",borderRadius:"var(--radius-sm)",padding:"9px 12px",fontSize:14,color:"var(--white)",outline:"none",marginBottom:12};
  const lbl: React.CSSProperties = {fontSize:12,fontWeight:700,color:"var(--text-secondary)",display:"block",marginBottom:4};
  return (
    <div style={{display:"flex",position:"fixed",inset:0,background:"rgba(0,51,102,0.4)",zIndex:200,alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"var(--navy-mid)",borderRadius:"var(--radius)",padding:28,width:500,maxWidth:"95vw",boxShadow:"0 16px 48px rgba(0,0,0,0.15)",border:"1px solid var(--navy-border)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <h2 style={{fontSize:18,fontWeight:800,color:"var(--white)",marginBottom:18}}>+ Nueva Publicación</h2>
        <label style={lbl}>TÍTULO</label>
        <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:12}}><input type="text" placeholder="Título..." value={title} onChange={e=>setTitle(e.target.value)} style={{...inp,marginBottom:0,flex:1}} /><button type="button" onClick={()=>setShowTitleEmojis(v=>!v)} style={{background:"none",border:"1.5px solid var(--navy-border)",borderRadius:"var(--radius-sm)",padding:"9px 12px",cursor:"pointer",fontSize:16}}>😊</button></div>
        {showTitleEmojis && (<div style={{display:"flex",flexWrap:"wrap",gap:"6px",background:"var(--navy-light)",border:"1px solid var(--navy-border)",padding:"8px",borderRadius:"var(--radius-sm)",marginBottom:"12px",marginTop:"-8px"}}>{["😊","😂","🤣","❤️","👍","🎉","🔥","🚀","🎓","🙌","✨","👀","💻","📚","💡","🎨","🌟","👏","✔️","🚩"].map(emoji=>(<button key={emoji} onClick={()=>{setTitle(prev=>prev+emoji);setShowTitleEmojis(false);}} style={{background:"none",border:"none",fontSize:18,cursor:"pointer"}}>{emoji}</button>))}</div>)}
        <label style={lbl}>DESCRIPCIÓN</label>
        <div style={{display:"flex",gap:"8px",alignItems:"flex-start",marginBottom:12}}><textarea ref={descRef} rows={3} placeholder="Describe..." value={desc} onChange={e=>setDesc(e.target.value)} style={{...inp,resize:"none",fontFamily:"inherit",marginBottom:0,flex:1}} /><button type="button" onClick={()=>setShowDescEmojis(v=>!v)} style={{background:"none",border:"1.5px solid var(--navy-border)",borderRadius:"var(--radius-sm)",padding:"9px 12px",cursor:"pointer",fontSize:16}}>😊</button></div>
        {showDescEmojis && (<div style={{display:"flex",flexWrap:"wrap",gap:"6px",background:"var(--navy-light)",border:"1px solid var(--navy-border)",padding:"8px",borderRadius:"var(--radius-sm)",marginBottom:"12px",marginTop:"-8px"}}>{["😊","😂","🤣","❤️","👍","🎉","🔥","🚀","🎓","🙌","✨","👀","💻","📚","💡","🎨","🌟","👏","✔️","🚩"].map(emoji=>(<button key={emoji} onClick={()=>{setDesc(prev=>prev+emoji);setShowDescEmojis(false);}} style={{background:"none",border:"none",fontSize:18,cursor:"pointer"}}>{emoji}</button>))}</div>)}
        <label style={lbl}>IMÁGENES (máx. 3)</label>
        <label htmlFor={selectedImages.length >= 3 ? undefined : "file-upload"} className="custom-file-upload" style={{opacity:selectedImages.length >= 3 ? 0.5 : 1,cursor:selectedImages.length >= 3 ? "not-allowed" : "pointer",pointerEvents:selectedImages.length >= 3 ? "none" : "auto",borderColor:selectedImages.length >= 3 ? "#cbd5e1" : undefined}}><span>📤 Seleccionar imágenes...</span></label>
        <input id="file-upload" ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageChange} style={{display:"none"}} disabled={selectedImages.length >= 3} />
        {selectedImages.length > 0 && (<div className="image-preview-grid">{selectedImages.map((img,idx)=>(<div key={idx} className="image-preview-container"><img src={img} alt={`Preview ${idx}`} className="image-preview-img" /><button type="button" onClick={()=>handleRemoveImage(idx)} className="image-preview-remove">✕</button></div>))}</div>)}
        <div style={{position:"relative"}}><label style={lbl}>ETIQUETAS (separadas por coma)</label><input ref={tagsRef} type="text" placeholder="#Tema1, #Tema2" value={tagsRaw} onChange={handleTagsChange} style={{...inp,marginBottom:18}} />{showTagSuggestions && (<div className="tag-suggestions-dropdown" style={{top:"calc(100% - 14px)"}}>{CONNECTIONS.filter(c=>c.name.toLowerCase().includes(tagSearchQuery)).map(c=>(<div key={c.name} className="tag-suggestion-item" onClick={()=>handleSelectTag(c.name)}><span className="tag-avatar">{c.initials}</span><span className="tag-name">{c.name}</span></div>))}</div>)}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button onClick={onClose} style={{background:"none",border:"1.5px solid var(--navy-border)",borderRadius:"var(--radius-sm)",padding:"9px 18px",fontSize:13,fontWeight:600,color:"var(--text-secondary)",cursor:"pointer"}}>Cancelar</button><button className="btn-primary" onClick={create}>Publicar</button></div>
      </div>
    </div>
  );
}

function MuroPage() {
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("unah_posts") : null;
    let loadedPosts: Post[] = saved ? JSON.parse(saved) : [...initialPosts];
    loadedPosts = loadedPosts.map(p => { if ((p.id === 1 && p.savedAt === "24/06/2026 07:30 PM") || (p.id === 3 && p.savedAt === "24/06/2026 06:15 PM")) return { ...p, saved: false, savedAt: undefined }; return p; });
    const mockSavedIds = [101, 102, 103];
    mockSavedIds.forEach(id => { const mockPost = initialPosts.find(p => p.id === id); if (mockPost) { const index = loadedPosts.findIndex(lp => lp.id === id); if (index === -1) loadedPosts.push(mockPost); else loadedPosts[index] = { ...loadedPosts[index], saved: true, savedAt: mockPost.savedAt, createdAt: mockPost.createdAt, time: mockPost.time }; } });
    return loadedPosts;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => { const saved = typeof window !== "undefined" ? localStorage.getItem("unah_notifications") : null; return saved ? JSON.parse(saved) : initialNotifications; });
  const [activeFilter,setActiveFilter]=useState("Todas"); const [sortValue,setSortValue]=useState("reciente");
  const [openCommentIds,setOpenCommentIds]=useState<Set<number>>(new Set()); const [notiOpen,setNotiOpen]=useState(false); const [showModal,setShowModal]=useState(false);
  const [toast,setToast]=useState("");   const [nextId, setNextId] = useState<number>(() => { const saved = typeof window !== "undefined" ? localStorage.getItem("unah_next_id") : null; return saved ? Number(saved) : 5; });
  const [searchQuery,setSearchQuery]=useState(""); const [drawerPost,setDrawerPost]=useState<Post|null>(null); const [detailPost,setDetailPost]=useState<Post|null>(null);
  const [isLoggedIn]=useState(true); const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(() => { localStorage.setItem("unah_posts", JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem("unah_notifications", JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem("unah_next_id", String(nextId)); }, [nextId]);
  const showToast=(msg:string)=>{ setToast(msg); if(toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(""),2800); };
  useEffect(()=>{ const h=()=>{setNotiOpen(false);}; document.addEventListener("click",h); return ()=>document.removeEventListener("click",h); },[]);
  const getFiltered=()=>{ let f=posts.filter(p=>!p.hidden); if(!searchQuery.trim()&&activeFilter==="Todas"&&sortValue==="reciente") return f; if(searchQuery.trim()){const q=searchQuery.toLowerCase();f=f.filter(p=>p.title.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)||p.author.toLowerCase().includes(q)||p.tags.some(t=>t.toLowerCase().includes(q)));} if(activeFilter==="Evento") f=f.filter(p=>p.type==="Evento"); else if(activeFilter==="Publicacion") f=f.filter(p=>p.type==="Publicacion"); if(sortValue==="popular") f=[...f].sort((a,b)=>getTotalReactions(b)-getTotalReactions(a)); else if(sortValue==="comentado") f=[...f].sort((a,b)=>b.comments.length-a.comments.length); else f=[...f].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)); return f; };
  const handleReact=(id:number,type:ActiveReaction)=>{ setPosts(prev=>prev.map(p=>{ if(p.id!==id) return p; const u={...p}; const was=p.userReaction===type; if(was){(u as any)[type]--;u.userReaction=null;} else{if(p.userReaction)(u as any)[p.userReaction]--;(u as any)[type]++;u.userReaction=type;} return u; })); const e=EMOJIS.find(e=>e.key===type); showToast(`${e?.icon} ${e?.label}`); };
  const handleToggleComments=(id:number)=>setOpenCommentIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const handleAddComment=(id:number,text:string,replyTo?:string)=>{ if(hasSQLi(text)){alert("🚨 ¡Alerta de Seguridad! Se detectó un patrón de inyección SQL (SQLi).");return;} if(!isValidInput(text)){alert("⚠️ Entrada no válida.");return;} const cleanText=sanitizeHTML(text); setPosts(prev=>prev.map(p=>p.id!==id?p:{...p,comments:[...p.comments,{id:Date.now(),author:"Yo",authorInitials:"YO",text:cleanText,time:"Ahora mismo",replyTo}]})); showToast(replyTo?`↩ Respondiste a ${replyTo}`:"💬 Comentario agregado"); };
  const handleHide=(id:number)=>{setPosts(prev=>prev.map(p=>p.id===id?{...p,hidden:true}:p));showToast("🚫 Publicación ocultada");};
  const handleSave=(id:number)=>{ const p=posts.find(x=>x.id===id); const now=new Date(); const formattedDate=now.toLocaleDateString("es-HN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}); setPosts(prev=>prev.map(p=>{if(p.id===id){const newSaved=!p.saved;return{...p,saved:newSaved,savedAt:newSaved?formattedDate:undefined};} return p;})); showToast(p?.saved?"🔖 Removido de Guardados":"🔖 Publicación guardada"); };
  const handleShare=(id:number)=>{ navigator.clipboard.writeText(`https://mipumaapp.unah.edu.hn/post/${id}`).then(()=>showToast("🔗 Enlace copiado")).catch(()=>showToast("❌ Error al copiar enlace")); };
  const handleInscribir=(id:number)=>{ setPosts(prev=>prev.map(p=>{if(p.id!==id)return p;const was=p.inscrito;const ins=was?(p.topInscritos||[]).filter(u=>u.name!=="Yo"):[{initials:"YO",name:"Yo"},...(p.topInscritos||[])];return{...p,inscrito:!was,topInscritos:ins};})); const p=posts.find(x=>x.id===id);showToast(p?.inscrito?"❌ Desinscrito":"✅ ¡Inscrito al evento!"); };
  const handleLoadMore=()=>{ setPosts(prev=>[...prev,{id:nextId,author:"Miguel Torres",initials:"MT",type:"Publicacion",scope:"Deportivo",visibility:"Público",time:"Hace 3 días",title:"Torneo Interclases – Resumen",desc:"Resumen del torneo deportivo.",tags:["#Fútbol","#Deporte"],love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,comments:[],userReaction:null,saved:false,hidden:false,createdAt:Date.now()-3*24*60*60*1000}]); setNextId(n=>n+1); showToast("📦 Más publicaciones cargadas"); };
  const handleCreate=(d:{title:string;desc:string;type:"Evento"|"Publicacion";scope:string;tags:string[];fecha?:string;lugar?:string;cupos?:number;images?:string[]})=>{ if(hasSQLi(d.title)||hasSQLi(d.desc)||d.tags.some(hasSQLi)){alert("🚨 ¡Alerta de Seguridad! SQLi detectado.");return;} if(!isValidInput(d.title)||!isValidInput(d.desc)||d.tags.some(t=>!isValidInput(t))){alert("⚠️ Entrada no válida.");return;} const cleanTitle=sanitizeHTML(d.title);const cleanDesc=sanitizeHTML(d.desc);const cleanTags=d.tags.map(sanitizeHTML); setPosts(prev=>[{id:nextId,author:"Yo",initials:"YO",type:d.type,scope:d.scope,visibility:"Público",time:"Ahora mismo",title:cleanTitle,desc:cleanDesc||"Sin descripción.",tags:cleanTags,love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,comments:[],userReaction:null,saved:false,hidden:false,fecha:d.fecha,lugar:d.lugar,cupos:d.cupos,inscrito:false,topInscritos:[],images:d.images||[],createdAt:Date.now()},...prev]); setNextId(n=>n+1); showToast("✅ Publicación creada"); };
  const [stories, setStories] = useState<typeof pumitasStories>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("unah_student_stories") : null;
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return [...pumitasStories];
  });
  const [showCreateStory, setShowCreateStory] = useState(false);
  useEffect(() => { localStorage.setItem("unah_student_stories", JSON.stringify(stories)); }, [stories]);
  const handlePublishStory = (image: string, text: string) => {
    setStories(prev => prev.map(s => s.isMe ? { ...s, hasStory: true, storyText: text, storyImage: image, createdAt: Date.now() } : s));
  };
  const unread=notifications.filter(n=>n.unread).length;
  const filtered=getFiltered();
  return (
    <div className="muro-page">
      <style>{`
        .muro-page{--navy:#F4F6F8;--navy-mid:#FFFFFF;--navy-light:#F4F6F8;--navy-border:#E2E8F0;
          --yellow:#FFD100;--yellow-hover:#FFE766;--yellow-soft:rgba(255,209,0,0.15);
          --white:#003366;--gray-mid:#717182;--text-primary:#003366;--text-secondary:#717182;
          --green-ok:#22c55e;--shadow:0 4px 20px rgba(0,0,0,0.08);}
        .muro-page .btn-primary{background:var(--yellow);color:#003366;border:none;border-radius:var(--radius-sm);padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;}
        .muro-page .btn-primary:hover{background:var(--yellow-hover);}
        .notifications-dropdown{position:absolute;top:54px;right:0;background:var(--navy-mid);border:1.5px solid var(--navy-border);border-radius:var(--radius-sm);width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:120;overflow:hidden;}
        .noti-header{padding:12px 16px;background:var(--navy);border-bottom:1px solid var(--navy-border);display:flex;justify-content:space-between;align-items:center;}
        .noti-header h3{font-size:12px;font-weight:800;color:var(--yellow);text-transform:uppercase;}
        .noti-clear-btn{background:none;border:none;color:var(--text-secondary);font-size:11px;cursor:pointer;font-weight:600;}
        .noti-list{max-height:260px;overflow-y:auto;}
        .noti-item{padding:10px 14px;border-bottom:1px solid var(--navy-border);display:flex;gap:10px;cursor:pointer;}
        .noti-item:hover{background:var(--navy-light);}
        .noti-item.unread{background:rgba(255,209,0,0.04);border-left:3px solid var(--yellow);}
        .noti-text{font-size:12px;color:var(--text-primary);line-height:1.4;}
        .noti-time{font-size:10px;color:var(--text-secondary);margin-top:2px;}
        @media (max-width:768px){.btn-primary{font-size:11px;padding:6px 10px;}}
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
        .story-overlay{position:fixed;inset:0;background:rgba(0,20,60,0.7);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
        .story-viewer{width:320px;height:480px;background:linear-gradient(160deg,#003366,#004B87);border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;padding:32px 24px;box-shadow:0 24px 64px rgba(0,0,0,0.4);animation:fadeScale 0.2s ease-out;}
        .story-viewer-bar{position:absolute;top:14px;left:16px;right:16px;height:3px;background:rgba(255,255,255,0.3);border-radius:2px;overflow:hidden;}
        .story-viewer-bar::after{content:'';display:block;height:100%;width:100%;background:var(--yellow);animation:storyProgress 4s linear forwards;}
        @keyframes storyProgress{from{width:0%;}to{width:100%;}}
        .story-viewer-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:0.8;}
        .story-viewer-close:hover{opacity:1;}
        .story-viewer-ava{width:72px;height:72px;background:var(--yellow);color:#003366;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;border:3px solid #fff;margin-bottom:14px;}
        .story-viewer-name{font-size:15px;font-weight:800;color:#fff;margin-bottom:20px;}
        .story-viewer-text{font-size:17px;font-weight:600;color:#fff;text-align:center;line-height:1.5;background:rgba(255,255,255,0.1);padding:16px 20px;border-radius:12px;}
        .controls-row{display:flex;align-items:center;background:var(--navy-mid);padding:12px 16px;border-radius:var(--radius);border:1px solid var(--navy-border);gap:12px;}
        .filter-tabs{display:flex;gap:6px;background:var(--navy-light);padding:4px;border-radius:var(--radius-sm);border:1px solid var(--navy-border);}
        .filter-btn{background:none;border:none;padding:6px 14px;font-size:12px;font-weight:700;color:var(--text-secondary);cursor:pointer;border-radius:6px;transition:all 0.2s;}
        .filter-btn.active{background:var(--navy-mid);color:#003366;box-shadow:0 2px 6px rgba(0,0,0,0.05);}
        .sort-select{background:var(--navy-light);border:1px solid var(--navy-border);border-radius:var(--radius-sm);padding:6px 12px;font-size:12px;font-weight:600;color:var(--text-primary);outline:none;cursor:pointer;}
        .post-card{background:var(--navy-mid);border-radius:var(--radius);border:1px solid var(--navy-border);padding:20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 2px 12px rgba(0,0,0,0.02);}
        .post-header{display:flex;align-items:center;gap:12px;position:relative;}
        .post-avatar{width:40px;height:40px;background:#E2E8F0;color:#003366;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;}
        .post-author{display:flex;flex-direction:column;gap:2px;flex:1;}
        .post-author-name{font-size:13px;font-weight:700;color:var(--text-primary);}
        .post-meta{font-size:11px;color:var(--text-secondary);display:flex;align-items:center;}
        .post-body{display:flex;flex-direction:column;gap:8px;}
        .post-type-badge{align-self:flex-start;font-size:10px;font-weight:800;padding:3px 8px;border-radius:5px;text-transform:uppercase;letter-spacing:0.3px;}
        .badge-publicacion{background:rgba(0,51,102,0.08);color:#003366;}
        .badge-evento{background:rgba(34,197,94,0.12);color:#16a34a;}
        .post-title{font-size:15px;font-weight:800;color:var(--text-primary);margin-top:2px;}
        .post-desc{font-size:13px;color:var(--text-primary);line-height:1.5;}
        .post-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}
        .tag{font-size:11px;font-weight:600;color:var(--text-secondary);background:var(--navy-light);padding:3px 8px;border-radius:6px;border:1px solid var(--navy-border);}
        .post-reactions{display:flex;align-items:center;border-top:1px solid var(--navy-border);padding-top:12px;margin-top:6px;gap:8px;flex-wrap:wrap;}
        .reaction-spacer{flex:1;}
        .reaction-main-btn{display:flex;align-items:center;gap:6px;background:var(--navy-light);border:1.5px solid var(--navy-border);border-radius:20px;padding:6px 14px;font-size:13px;font-weight:700;color:var(--text-primary);cursor:pointer;transition:all 0.15s;position:relative;}
        .reaction-main-btn:hover{background:var(--navy-border);}
        .reaction-main-btn.reacted{background:var(--yellow-soft);border-color:var(--yellow);color:#003366;}
        .reaction-btn-label{font-size:12px;}
        .reaction-count{background:#003366;color:#fff;border-radius:10px;font-size:10px;font-weight:800;padding:1px 6px;}
        .emoji-picker-float{position:absolute;bottom:calc(100% + 10px);left:0;background:var(--navy-mid);border:1.5px solid var(--navy-border);border-radius:var(--radius);padding:10px 12px;display:flex;gap:6px;box-shadow:0 8px 28px rgba(0,51,102,0.18);z-index:100;white-space:nowrap;animation:popUp 0.18s ease-out;}
        @keyframes popUp{from{opacity:0;transform:translateY(8px) scale(0.95);}to{opacity:1;transform:translateY(0) scale(1);}}
        .emoji-pick-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:2px solid transparent;border-radius:10px;padding:6px 8px;cursor:pointer;transition:all 0.13s;}
        .emoji-pick-btn:hover{background:var(--navy-light);transform:scale(1.15);}
        .emoji-pick-btn.picked{border-color:var(--yellow);background:var(--yellow-soft);}
        .emoji-icon{font-size:20px;line-height:1;}
        .emoji-lbl{font-size:9px;font-weight:700;color:var(--text-secondary);white-space:nowrap;}
        .action-icon-btn{background:var(--navy-light);border:1.5px solid var(--navy-border);border-radius:20px;padding:6px 12px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-primary);transition:all 0.15s;}
        .action-icon-btn:hover{background:var(--navy-border);}
        .action-icon-btn.active-comment{background:var(--navy-border);}
        .post-reactions-evento{gap:6px;flex-wrap:nowrap;}
        .btn-evento-join{width:32px;height:32px;min-width:32px;border-radius:50%;background:#F97316;color:#fff;border:none;font-size:18px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(249,115,22,0.4);transition:all 0.15s;}
        .btn-evento-join:hover{transform:scale(1.1);background:#ea6c0a;}
        .btn-evento-join.joined{background:#22c55e;box-shadow:0 2px 8px rgba(34,197,94,0.4);}
        .btn-evento-action{background:none;border:1px solid var(--navy-border);border-radius:20px;padding:5px 11px;font-size:11px;font-weight:700;color:var(--text-primary);cursor:pointer;display:flex;align-items:center;gap:4px;transition:background 0.15s;white-space:nowrap;}
        .btn-evento-action:hover{background:var(--navy-light);}
        .btn-evento-icon{background:none;border:1px solid var(--navy-border);border-radius:20px;padding:5px 9px;font-size:13px;cursor:pointer;opacity:0.7;transition:all 0.15s;}
        .btn-evento-icon:hover{opacity:1;background:var(--navy-light);}
        .btn-evento-icon.saved{opacity:1;border-color:var(--yellow);background:var(--yellow-soft);}
        .btn-evento-whatsapp{width:30px;height:30px;min-width:30px;border-radius:50%;background:#25D366;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(37,211,102,0.4);transition:all 0.15s;padding:0;}
        .btn-evento-whatsapp:hover{transform:scale(1.08);background:#1ebe5d;}
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
        .detail-modal-overlay{position:fixed;inset:0;background:rgba(0,30,80,0.38);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);}
        .detail-modal-card{background:#fff;border-radius:18px;padding:28px 30px 30px;width:560px;max-width:96vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,51,102,0.22);border:1px solid #E2E8F0;animation:fadeScale 0.2s ease-out;}
        @keyframes fadeScale{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}
        .dmc-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
        .dmc-title{font-size:14px;font-weight:900;color:#003366;letter-spacing:0.5px;text-transform:uppercase;}
        .dmc-badge{font-size:12px;font-weight:800;padding:5px 16px;border-radius:7px;letter-spacing:0.2px;}
        .dmc-badge-evento{background:#FFD100;color:#003366;}
        .dmc-badge-pub{background:rgba(0,51,102,0.1);color:#003366;}
        .dmc-close{background:none;border:none;font-size:17px;color:#aaa;cursor:pointer;padding:2px 6px;border-radius:6px;line-height:1;}
        .dmc-close:hover{background:#F4F6F8;color:#555;}
        .dmc-author-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;}
        .dmc-avatar{width:50px;height:50px;background:#fff;color:#FFD100;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;border:3px solid #FFD100;flex-shrink:0;box-shadow:0 0 0 3px rgba(255,209,0,0.15);}
        .dmc-post-title{font-size:20px;font-weight:900;color:#003366;line-height:1.2;}
        .dmc-post-meta{font-size:12px;color:#888;margin-top:4px;}
        .dmc-section-label{font-size:10px;font-weight:800;color:#888;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:8px;}
        .dmc-desc-box{background:#F7F9FB;border:1px solid #E8EDF3;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.6;color:#334;margin-bottom:16px;}
        .dmc-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px;}
        .dmc-tag{font-size:12px;font-weight:700;color:#003366;background:#EEF3FB;border:1.5px solid #C8D8EE;padding:4px 12px;border-radius:20px;}
        .dmc-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .dmc-meta-item{display:flex;align-items:center;gap:12px;background:#F7F9FB;border:1px solid #E8EDF3;border-radius:10px;padding:12px 14px;}
        .dmc-meta-icon-wrap{width:36px;height:36px;background:#EEF3FB;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dmc-meta-label{font-size:9px;font-weight:800;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;}
        .dmc-meta-val{font-size:14px;font-weight:800;color:#003366;}
        .scope-academico{color:#003366;}.scope-cultural{color:#ec4899;}.scope-social{color:#f59e0b;}.scope-deportivo{color:#10b981;}
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
        .post-images-grid{display:grid;gap:8px;margin-top:10px;border-radius:8px;overflow:hidden;}
        .post-images-grid.grid-1{grid-template-columns:1fr;}
        .post-images-grid.grid-2{grid-template-columns:1fr 1fr;}
        .post-images-grid.grid-3{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;}
        .post-images-grid.grid-3 img:first-child{grid-row:span 2;height:100%;}
        .post-image-item{width:100%;height:200px;object-fit:cover;border:1px solid var(--navy-border);transition:transform 0.2s;}
        .post-image-item:hover{transform:scale(1.01);}
        .image-preview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;margin-bottom:12px;}
        .image-preview-container{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;border:1px solid var(--navy-border);}
        .image-preview-img{width:100%;height:100%;object-fit:cover;}
        .image-preview-remove{position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;}
        .feed-wrapper{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:16px;}
        .feed-topbar{display:flex;align-items:center;gap:10px;background:#fff;padding:12px 16px;border-radius:var(--radius);border:1px solid var(--navy-border);box-shadow:0 2px 8px rgba(0,0,0,0.04);}
        .feed-topbar .search-wrap{flex:1;position:relative;}
        .feed-topbar .search-wrap .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none;color:#94a3b8;}
        .feed-topbar .search-wrap input{width:100%;background:var(--navy-light);border:1.5px solid var(--navy-border);border-radius:20px;padding:8px 14px 8px 36px;font-size:13px;color:var(--text-primary);outline:none;}
        .feed-topbar .search-wrap input:focus{border-color:var(--yellow);}
        .feed-topbar .icon-btn{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--navy-border);background:var(--navy-light);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;position:relative;flex-shrink:0;}
        .feed-topbar .icon-btn:hover{background:var(--navy-border);}
        .feed-topbar .avatar-btn{width:36px;height:36px;border-radius:50%;border:2.5px solid var(--yellow);background:#003366;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;cursor:pointer;flex-shrink:0;}
        .feed-topbar .badge{position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:var(--yellow);color:#003366;border-radius:50%;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;}
        .noti-position{position:relative;}
        .feed-content{display:flex;flex-direction:column;gap:20px;}
        .post-hide-btn{background:none;border:none;font-size:16px;color:var(--text-secondary);cursor:pointer;padding:6px;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;transition:background 0.2s,color 0.2s;}
        .post-hide-btn:hover{background:rgba(0,0,0,0.05);color:#ef4444;}
        .saved-at-badge{background:rgba(255,209,0,0.15);border:1px dashed var(--yellow);color:#003366;font-size:11px;font-weight:700;padding:6px 10px;border-radius:6px;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;align-self:flex-start;}
        .tag-suggestions-dropdown{position:absolute;background:#FFFFFF;border:1.5px solid var(--navy-border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:1000;max-height:150px;overflow-y:auto;width:100%;margin-top:4px;}
        .tag-suggestion-item{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--navy-border);}
        .tag-suggestion-item:last-child{border-bottom:none;}
        .tag-suggestion-item:hover{background:var(--navy-light);}
        .tag-avatar{width:24px;height:24px;background:#003366;color:#FFD100;border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;}
        .tag-name{font-size:13px;font-weight:600;color:#003366;}
        .post-avatar-img{width:100%;height:100%;border-radius:50%;object-fit:cover;}
        .custom-file-upload{display:inline-flex;align-items:center;gap:8px;background:#F4F6F8;border:1.5px dashed #C8D8EE;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;color:#003366;transition:all 0.2s;margin-bottom:12px;width:100%;justify-content:center;}
        .custom-file-upload:hover{background:#EEF3FB;border-color:#003366;}
      `}</style>
      <div className="feed-wrapper">
        <div className="feed-topbar">
          <div className="search-wrap"><span className="search-icon">🔍</span><input type="text" placeholder="Buscar en el Muro..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} /></div>
          <button className="btn-primary" onClick={()=>setShowModal(true)}>+ Crear Post</button>

          <div className="avatar-btn" onClick={()=>showToast("Configuración de Perfil")}>MP</div>
        </div>
        <StoriesBar onCreateStory={() => setShowCreateStory(true)} />
        <div className="feed-content">
          <div className="controls-row">
            <div className="filter-tabs">{["Todas","Publicacion","Evento"].map(t=>(<button key={t} className={`filter-btn${activeFilter===t?" active":""}`} onClick={()=>setActiveFilter(t)}>{t==="Todas"?"🌐 Todas":t==="Publicacion"?"📢 Publicaciones":"📅 Eventos"}</button>))}</div>
            <select className="sort-select" value={sortValue} onChange={e=>setSortValue(e.target.value)}><option value="reciente">⏱️ Más Recientes</option><option value="popular">🔥 Más Populares</option><option value="comentado">💬 Más Comentados</option></select>
          </div>
          {filtered.length === 0 ? (
            <div style={{background:"var(--navy-mid)",padding:40,borderRadius:"var(--radius)",textAlign:"center",border:"1px solid var(--navy-border)"}}><div style={{fontSize:32,marginBottom:8}}>📦</div><div style={{fontSize:14,color:"var(--gray-mid)"}}>No se encontraron publicaciones que coincidan.</div></div>
          ) : (
            filtered.map(p=>(
              <PostCard key={p.id} post={p} onReact={handleReact} onToggleComments={handleToggleComments} onAddComment={handleAddComment} onHide={handleHide} onSave={handleSave} onShare={handleShare} onOpenDrawer={setDrawerPost} onInscribir={handleInscribir} onOpenDetail={setDetailPost} openCommentIds={openCommentIds} isLoggedIn={isLoggedIn} />
            ))
          )}
          {filtered.length > 0 && (
            <button onClick={handleLoadMore} style={{background:"var(--navy-mid)",border:"1.5px solid var(--navy-border)",borderRadius:"var(--radius)",padding:"12px",fontSize:13,fontWeight:700,color:"#003366",cursor:"pointer",boxShadow:"var(--shadow)",transition:"background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--navy-light)"} onMouseLeave={e=>e.currentTarget.style.background="var(--navy-mid)"}>Cargar más publicaciones</button>
          )}
        </div>
      </div>
      {detailPost && <DetailModal post={posts.find(p=>p.id===detailPost.id)||detailPost} onClose={()=>setDetailPost(null)} />}
      {showModal && <NewPostModal onClose={()=>setShowModal(false)} onCreate={handleCreate} />}
      {drawerPost && <EventDrawer post={drawerPost} onClose={()=>setDrawerPost(null)} onInscribir={handleInscribir} isLoggedIn={isLoggedIn} />}
      <Toast message={toast} />
      {showCreateStory && <CreateStoryModal onClose={()=>setShowCreateStory(false)} onPublish={handlePublishStory} />}
    </div>
  );
}