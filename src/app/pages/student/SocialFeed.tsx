import React, { useState, useEffect, useRef } from 'react';

/* ─── TYPES ─── */
interface Comment { id: number; author: string; authorInitials: string; text: string; time: string; replyTo?: string; }
interface Post {
  id: number; author: string; initials: string; type: "Evento" | "Publicacion";
  scope: string; visibility: string; time: string; title: string; desc: string;
  tags: string[]; love: number; like: number; dislike: number; haha: number; wow: number; sad: number; angry: number;
  comments: Comment[];
  userReaction: "love"|"like"|"dislike"|"haha"|"wow"|"sad"|"angry"|null; saved: boolean; hidden: boolean;
  fecha?: string; lugar?: string; cupos?: number; inscrito?: boolean;
  topInscritos?: { initials: string; name: string }[];
  images?: string[]; savedAt?: string; createdAt?: number;
}
interface Notification { id: number; icon: string; text: string; time: string; unread: boolean; }
type ActiveReaction = "love"|"like"|"dislike"|"angry"|"sad"|"haha"|"wow";

/* ─── SECURITY HELPERS ─── */
function sanitizeHTML(text: string): string {
  if (!text) return "";
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;");
}
function hasSQLi(text: string): boolean {
  return /\b(select|union|drop|insert|delete|update|alter|create|truncate|from|where|or\s+\d+=\d+|--)\b/i.test(text ?? "");
}
function isValidInput(text: string): boolean {
  return !/[<>;=\\{}]/.test(text ?? "");
}

/* ─── CONSTANTS ─── */
const EMOJIS: { key: ActiveReaction; icon: string; label: string }[] = [
  { key:"love", icon:"❤️", label:"Me encanta" },
  { key:"like", icon:"👍", label:"Me gusta" },
  { key:"haha", icon:"😂", label:"Jaja" },
  { key:"wow",  icon:"😮", label:"Asombro" },
  { key:"sad",  icon:"😢", label:"Triste" },
  { key:"angry",icon:"😡", label:"Enojado" },
  { key:"dislike",icon:"👎",label:"No me gusta" },
];
const scopeIcons: Record<string,string>  = { Academico:"📖", Cultural:"🎭", Social:"🤝", Deportivo:"⚽" };
const scopeColors: Record<string,string> = { Academico:"text-[#004B87]", Cultural:"text-pink-500", Social:"text-amber-500", Deportivo:"text-emerald-500" };

const STORIES = [
  { name:"Tu estado",initials:"CA",online:true, hasStory:false,isMe:true, storyText:"" },
  { name:"Miguel",   initials:"MT",online:true, hasStory:true, isMe:false,storyText:"📚 Estudiando para el parcial..." },
  { name:"Valeria",  initials:"VR",online:true, hasStory:true, isMe:false,storyText:"🎉 ¡Evento cultural mañana!" },
  { name:"Ángela",   initials:"AR",online:false,hasStory:false,isMe:false,storyText:"" },
  { name:"Carlos",   initials:"CM",online:true, hasStory:true, isMe:false,storyText:"⚽ Torneo este viernes, ¡anímense!" },
];
const PUMITAS = [
  { name:"Miguel Torres",  initials:"MT", status:"Activo"  },
  { name:"Valeria Rojas",  initials:"VR", status:"Activo"  },
  { name:"Ángela Reyes",   initials:"AR", status:"Ausente" },
  { name:"Carlos Mendoza", initials:"CM", status:"Activo"  },
];
const INITIAL_POSTS: Post[] = [
  { id:1,  author:"Camel García",  initials:"CG", type:"Publicacion", scope:"Academico", visibility:"Público", time:"Hace 5 min",
    title:"Nuevo Tutorial de Base de Datos", desc:"Recursos y ejemplos prácticos para comprender SQL y modelado relacional.",
    tags:["#BaseDeDatos","#Tutorial","#SQL"], love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,
    comments:[{id:1,author:"Miguel Torres",authorInitials:"MT",text:"Excelente recurso, me ayudó mucho.",time:"Hace 3 min"}],
    userReaction:null,saved:false,hidden:false,createdAt:Date.now()-5*60*1000 },
  { id:2,  author:"Valeria Rojas",  initials:"VR", type:"Evento", scope:"Academico", visibility:"Público", time:"Hace 2 horas",
    title:"Grupo de Estudio C++", desc:"Reunión para resolver ejercicios del curso de Programación II.",
    tags:["#C++","#Programación","#Estudio"], fecha:"2026-07-10", lugar:"Sala 3 – Ing.", cupos:20, inscrito:false,
    topInscritos:[{initials:"MT",name:"Miguel Torres"},{initials:"LP",name:"Laura Paz"}],
    love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,
    comments:[{id:2,author:"Laura Paz",authorInitials:"LP",text:"¡Cuenten conmigo!",time:"Hace 1 hora"}],
    userReaction:null,saved:false,hidden:false,createdAt:Date.now()-120*60*1000 },
  { id:3,  author:"Puma Head",     initials:"PH", type:"Publicacion", scope:"Deportivo", visibility:"Público", time:"Hace 4 horas",
    title:"Resultados del Torneo Interclases", desc:"Resultados del torneo de fútbol. ¡Felicidades al equipo de Sistemas!",
    tags:["#Fútbol","#Deporte","#Torneo"], love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,
    comments:[{id:3,author:"Valeria Rojas",authorInitials:"VR",text:"Muy emocionante el partido final.",time:"Hace 2 horas"}],
    userReaction:null,saved:false,hidden:false,createdAt:Date.now()-240*60*1000 },
  { id:4,  author:"Carlos Mendoza",initials:"CM", type:"Evento", scope:"Cultural", visibility:"Público", time:"Hace 1 día",
    title:"Noche de Talentos UNAH 2026", desc:"Evento artístico estudiantil: música, danza, teatro y arte.",
    tags:["#Arte","#Cultura","#UNAH"], fecha:"2026-08-15", lugar:"Auditorio Central", cupos:150, inscrito:false,
    topInscritos:[{initials:"CG",name:"Camel García"},{initials:"PH",name:"Puma Head"}],
    love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,
    comments:[],userReaction:null,saved:false,hidden:false,createdAt:Date.now()-1440*60*1000 },
];
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id:1, icon:"💬", text:"<strong>Miguel Torres</strong> comentó tu publicación", time:"Hace 5 min",  unread:true },
  { id:2, icon:"❤️", text:"A <strong>Valeria</strong> le encanta tu tutorial",      time:"Hace 20 min", unread:true },
  { id:3, icon:"🎓", text:"Nuevo ámbito <strong>Académico</strong> habilitado",     time:"Hace 1 hora", unread:false },
];

function getTotalReactions(p: Post) {
  return p.love+p.like+p.dislike+p.haha+p.wow+p.sad+p.angry;
}
function getReactionIcon(r: ActiveReaction|null) { return r ? EMOJIS.find(e=>e.key===r)?.icon??'👍' : '👍'; }
function getReactionLabel(r: ActiveReaction|null) { return r ? EMOJIS.find(e=>e.key===r)?.label??'Reaccionar' : 'Reaccionar'; }

/* ─── STORIES BAR ─── */
function StoriesBar() {
  const [active, setActive] = useState<typeof STORIES[0]|null>(null);
  return (
    <>
      <div className="flex gap-3 bg-white rounded-xl border border-gray-200 p-3 overflow-x-auto">
        {STORIES.map((s,i)=>(
          <div key={i} onClick={()=>{if(s.hasStory&&!s.isMe)setActive(s);}}
            className={`flex flex-col items-center gap-1 flex-shrink-0 ${s.hasStory||s.isMe?'cursor-pointer':''}`}>
            <div className={`relative w-13 h-13 rounded-full p-0.5 ${s.hasStory||s.isMe?'bg-gradient-to-tr from-[#FFD100] to-[#004B87]':'bg-gray-200'}`}>
              <div className="w-12 h-12 bg-[#004B87] text-white rounded-full flex items-center justify-center font-bold text-sm relative">
                {s.initials}
                {s.isMe && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#FFD100] text-[#003366] rounded-full text-[10px] font-black flex items-center justify-center border border-white">+</span>}
              </div>
            </div>
            {s.online&&!s.isMe&&<span className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-white" style={{marginTop:40,marginLeft:36}}/>}
            <span className="text-[10px] font-medium text-[#717182] max-w-[52px] truncate">{s.name}</span>
          </div>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 bg-[#003366]/70 z-[300] flex items-center justify-center backdrop-blur-sm" onClick={()=>setActive(null)}>
          <div className="w-72 h-96 bg-gradient-to-b from-[#003366] to-[#004B87] rounded-2xl flex flex-col items-center justify-center p-6 relative shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="absolute top-3 left-3 right-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#FFD100] rounded-full animate-[storybar_4s_linear_forwards]" style={{width:'100%',animation:'storybar 4s linear forwards'}}/>
            </div>
            <button className="absolute top-3 right-3 text-white/80 hover:text-white text-lg" onClick={()=>setActive(null)}>✕</button>
            <div className="w-16 h-16 bg-[#FFD100] text-[#003366] rounded-full flex items-center justify-center font-black text-xl border-4 border-white mb-3">{active.initials}</div>
            <p className="text-white font-bold mb-4">{active.name}</p>
            <p className="text-white text-center font-semibold bg-white/10 rounded-xl px-4 py-3">{active.storyText}</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── FLOATING REACTION ─── */
function FloatingReaction({ post, onReact }:{ post:Post; onReact:(id:number,t:ActiveReaction)=>void }) {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false); };
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);
  const total=getTotalReactions(post);
  return (
    <div ref={ref} className="relative inline-flex items-center">
      {open&&(
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl p-2 flex gap-1 shadow-xl z-50 animate-fade-in">
          {EMOJIS.map(e=>(
            <button key={e.key} onClick={()=>{onReact(post.id,e.key);setOpen(false);}}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 hover:scale-110 transition-all ${post.userReaction===e.key?'bg-yellow-50 border-2 border-[#FFD100]':''}`}>
              <span className="text-xl leading-none">{e.icon}</span>
              <span className="text-[9px] font-bold text-[#717182] whitespace-nowrap">{e.label}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={()=>setOpen(v=>!v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${post.userReaction?'bg-yellow-50 border-[#FFD100] text-[#003366]':'bg-gray-50 border-gray-200 text-[#717182] hover:bg-gray-100'}`}>
        <span>{getReactionIcon(post.userReaction)}</span>
        <span>{getReactionLabel(post.userReaction)}</span>
        {total>0&&<span className="bg-[#003366] text-white rounded-full px-1.5 py-0.5 text-[9px] font-black">{total}</span>}
      </button>
    </div>
  );
}

/* ─── POST CARD ─── */
function PostCard({ post,onReact,onToggle,onAddComment,onHide,onSave,onShare,onInscribir,onOpenDetail,openComments }:{
  post:Post; onReact:(id:number,t:ActiveReaction)=>void; onToggle:(id:number)=>void;
  onAddComment:(id:number,text:string,replyTo?:string)=>void;
  onHide:(id:number)=>void; onSave:(id:number)=>void; onShare:(id:number)=>void;
  onInscribir:(id:number)=>void; onOpenDetail:(p:Post)=>void; openComments:Set<number>;
}) {
  const [commentInput,setCommentInput]=useState("");
  const [replyingTo,setReplyingTo]=useState<string|null>(null);
  const isEvento=post.type==="Evento";
  const commentsOpen=openComments.has(post.id);

  const addComment=()=>{
    const t=commentInput.trim(); if(!t)return;
    onAddComment(post.id,t,replyingTo||undefined);
    setCommentInput(""); setReplyingTo(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#004B87] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{post.initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#003366] truncate">{post.author}</p>
          <p className="text-xs text-[#717182] flex items-center gap-1">
            <span className={scopeColors[post.scope]}>{scopeIcons[post.scope]}</span>
            <span>{post.scope}</span>
            <span className="text-gray-300">·</span>
            <span>🕐 {post.time}</span>
          </p>
        </div>
        <button onClick={()=>onHide(post.id)} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-400 transition-colors text-sm flex-shrink-0">✕</button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2">
        <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isEvento?'bg-green-50 text-green-700':'bg-blue-50 text-[#004B87]'}`}>
          {isEvento?'📅 Evento':'📢 Publicación'}
        </span>
        <h3 className="text-sm font-bold text-[#003366] cursor-pointer hover:text-[#1A6FBF] transition-colors leading-snug" onClick={()=>onOpenDetail(post)}>
          {post.title}
        </h3>
        <p className="text-sm text-[#717182] leading-relaxed whitespace-pre-wrap">{post.desc}</p>

        {isEvento&&(
          <div className="bg-[#F4F6F8] rounded-xl p-3 border border-gray-200 flex flex-col gap-1.5 text-xs">
            {post.fecha&&<span>📅 <strong>Fecha:</strong> {post.fecha}</span>}
            {post.lugar&&<span>📍 <strong>Lugar:</strong> {post.lugar}</span>}
            {post.cupos!==undefined&&<span>👥 <strong>Cupos:</strong> {post.cupos} disponibles</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {post.tags.map(t=><span key={t} className="text-[11px] font-medium text-[#1A6FBF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{t}</span>)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap border-t border-gray-100 pt-3">
        <FloatingReaction post={post} onReact={onReact}/>
        <button onClick={()=>onToggle(post.id)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${commentsOpen?'bg-blue-50 border-[#1A6FBF] text-[#003366]':'bg-gray-50 border-gray-200 text-[#717182] hover:bg-gray-100'}`}>
          💬{post.comments.length>0&&<span>{post.comments.length}</span>}
        </button>
        <div className="flex-1"/>
        {isEvento&&(
          <button onClick={()=>onInscribir(post.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${post.inscrito?'bg-green-500 text-white':'bg-[#003366] text-white hover:bg-[#004B87]'}`}>
            {post.inscrito?'✅ Inscrito':'Inscribirme'}
          </button>
        )}
        {!isEvento&&(
          <button onClick={()=>onSave(post.id)}
            className={`text-sm px-2 transition-opacity ${post.saved?'opacity-100 text-[#FFD100]':'opacity-50 hover:opacity-100'}`}>
            🔖
          </button>
        )}
        <button onClick={()=>onShare(post.id)} className="text-sm px-2 opacity-50 hover:opacity-100 transition-opacity">🔗</button>
      </div>

      {/* Comments */}
      {commentsOpen&&(
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {post.comments.map(c=>(
              <div key={c.id} className="flex gap-2">
                <div className="w-7 h-7 bg-gray-100 border border-gray-200 text-[#003366] rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{c.authorInitials}</div>
                <div className="flex-1">
                  {c.replyTo&&<p className="text-[10px] text-[#717182] italic mb-0.5">↩ respondiendo a <strong>{c.replyTo}</strong></p>}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-[#003366]">{c.author}</p>
                    <p className="text-xs text-[#717182] leading-snug">{c.text}</p>
                  </div>
                  <button onClick={()=>setReplyingTo(c.author)} className="text-[10px] font-bold text-[#717182] hover:text-[#003366] ml-2 mt-0.5">Responder</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 flex gap-2 items-center">
              {replyingTo&&(
                <span className="text-[10px] bg-gray-200 rounded-full px-2 py-0.5 flex items-center gap-1 whitespace-nowrap">
                  ↩ {replyingTo}
                  <button onClick={()=>setReplyingTo(null)} className="font-black text-[9px]">✕</button>
                </span>
              )}
              <input className="flex-1 bg-transparent text-xs text-[#003366] outline-none min-w-0" placeholder="Escribe un comentario..."
                value={commentInput} onChange={e=>setCommentInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addComment();}}/>
            </div>
            <button onClick={addComment} className="text-[#004B87] hover:text-[#003366] text-sm">➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── NEW POST MODAL ─── */
function NewPostModal({ onClose,onCreate }:{
  onClose:()=>void;
  onCreate:(d:{title:string;desc:string;type:"Evento"|"Publicacion";scope:string;tags:string[]})=>void;
}) {
  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const [tagsRaw,setTagsRaw]=useState("");
  const create=()=>{
    if(!title.trim()){alert("⚠️ Título obligatorio");return;}
    if(hasSQLi(title)||hasSQLi(desc)){alert("🚨 Contenido no permitido detectado.");return;}
    if(!isValidInput(title)||!isValidInput(desc)){alert("⚠️ Caracteres especiales no permitidos.");return;}
    onCreate({ title:sanitizeHTML(title.trim()), desc:sanitizeHTML(desc.trim()), type:"Publicacion", scope:"Social",
      tags:tagsRaw.split(",").map(t=>sanitizeHTML(t.trim())).filter(Boolean) });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-[#003366]/40 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[#003366] mb-4">+ Nueva Publicación</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1">Título</label>
            <input type="text" placeholder="Título..." value={title} onChange={e=>setTitle(e.target.value)}
              className="w-full border border-gray-200 bg-[#F4F6F8] rounded-xl px-4 py-2.5 text-sm text-[#003366] outline-none focus:border-[#004B87] transition-colors"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1">Descripción</label>
            <textarea rows={3} placeholder="Describe..." value={desc} onChange={e=>setDesc(e.target.value)}
              className="w-full border border-gray-200 bg-[#F4F6F8] rounded-xl px-4 py-2.5 text-sm text-[#003366] outline-none focus:border-[#004B87] resize-none transition-colors"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1">Etiquetas (separadas por coma)</label>
            <input type="text" placeholder="#Tema1, #Tema2" value={tagsRaw} onChange={e=>setTagsRaw(e.target.value)}
              className="w-full border border-gray-200 bg-[#F4F6F8] rounded-xl px-4 py-2.5 text-sm text-[#003366] outline-none focus:border-[#004B87] transition-colors"/>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-[#717182] hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={create} className="flex-1 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl py-2.5 text-sm font-bold transition-colors">Publicar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── DETAIL MODAL ─── */
function DetailModal({ post,onClose }:{ post:Post; onClose:()=>void }) {
  return (
    <div className="fixed inset-0 bg-[#003366]/40 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-black text-[#003366] uppercase tracking-wider">Detalle de la Actividad</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${post.type==="Evento"?'bg-[#FFD100] text-[#003366]':'bg-blue-50 text-[#003366]'}`}>{post.type}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none">✕</button>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#FFD100] text-[#003366] rounded-full flex items-center justify-center font-black text-base border-2 border-[#FFD100] shadow">{post.initials}</div>
          <div>
            <h2 className="text-lg font-black text-[#003366] leading-tight">{post.title}</h2>
            <p className="text-xs text-[#717182]">Por <strong>{post.author}</strong> · {post.time}</p>
          </div>
        </div>
        <p className="text-sm text-[#555] leading-relaxed bg-[#F7F9FB] rounded-xl p-4 border border-gray-200 mb-4 whitespace-pre-wrap">{post.desc}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(t=><span key={t} className="text-xs font-bold text-[#003366] bg-[#EEF3FB] border border-[#C8D8EE] px-3 py-1 rounded-full">{t}</span>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {label:"RESPONSABLE",value:post.author.split(" ")[0]},
            {label:"TIPO",value:post.type},
            {label:"ÁMBITO",value:post.scope},
            {label:"VISIBILIDAD",value:post.visibility},
            {label:"REACCIONES",value:String(getTotalReactions(post))},
            {label:"PUBLICADO",value:post.time},
          ].map((m,i)=>(
            <div key={i} className="bg-[#F7F9FB] border border-gray-200 rounded-xl p-3">
              <p className="text-[9px] font-black text-[#999] uppercase tracking-wider mb-0.5">{m.label}</p>
              <p className="text-sm font-bold text-[#003366]">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TOAST ─── */
function Toast({ message }:{ message:string }) {
  return (
    <div className={`fixed bottom-20 md:bottom-6 right-4 bg-[#003366] text-white px-4 py-3 rounded-xl border-l-4 border-[#FFD100] text-sm font-semibold shadow-xl z-[999] transition-all duration-300 ${message?'opacity-100 translate-y-0':'opacity-0 translate-y-4 pointer-events-none'}`}>
      {message}
    </div>
  );
}

/* ─── MAIN SOCIAL FEED ─── */
export function SocialFeed({ showOnlySaved=false }:{ showOnlySaved?:boolean }) {
  const [posts,setPosts]=useState<Post[]>(()=>{
    try { const s=localStorage.getItem("cp_posts"); return s ? JSON.parse(s) : [...INITIAL_POSTS]; } catch { return [...INITIAL_POSTS]; }
  });
  const [notifications,setNotifications]=useState<Notification[]>(()=>{
    try { const s=localStorage.getItem("cp_notifications"); return s ? JSON.parse(s) : INITIAL_NOTIFICATIONS; } catch { return INITIAL_NOTIFICATIONS; }
  });
  const [activeFilter,setActiveFilter]=useState("Todas");
  const [sortValue,setSortValue]=useState("reciente");
  const [openCommentIds,setOpenCommentIds]=useState(new Set<number>());
  const [notiOpen,setNotiOpen]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [toast,setToast]=useState("");
  const [nextId,setNextId]=useState(5);
  const [searchQuery,setSearchQuery]=useState("");
  const [detailPost,setDetailPost]=useState<Post|null>(null);
  const [activeRightTab,setActiveRightTab]=useState<"autores"|"leyenda">("autores");
  const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{ localStorage.setItem("cp_posts",JSON.stringify(posts)); },[posts]);
  useEffect(()=>{ localStorage.setItem("cp_notifications",JSON.stringify(notifications)); },[notifications]);

  const showToast=(msg:string)=>{
    setToast(msg);
    if(toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current=setTimeout(()=>setToast(""),2800);
  };

  const filtered=()=>{
    let f=posts.filter(p=>!p.hidden);
    if(showOnlySaved) f=f.filter(p=>p.saved);
    else if(activeFilter==="Evento") f=f.filter(p=>p.type==="Evento");
    else if(activeFilter==="Publicacion") f=f.filter(p=>p.type==="Publicacion");
    if(searchQuery.trim()){
      const q=searchQuery.toLowerCase();
      f=f.filter(p=>p.title.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)||p.tags.some(t=>t.toLowerCase().includes(q)));
    }
    if(sortValue==="popular") f=[...f].sort((a,b)=>getTotalReactions(b)-getTotalReactions(a));
    else if(sortValue==="comentado") f=[...f].sort((a,b)=>b.comments.length-a.comments.length);
    else f=[...f].sort((a,b)=>(b.createdAt??0)-(a.createdAt??0));
    return f;
  };

  const handleReact=(id:number,type:ActiveReaction)=>{
    setPosts(prev=>prev.map(p=>{
      if(p.id!==id)return p;
      const u={...p};const was=p.userReaction===type;
      if(was){(u as any)[type]--;u.userReaction=null;}
      else{if(p.userReaction)(u as any)[p.userReaction]--;(u as any)[type]++;u.userReaction=type;}
      return u;
    }));
    const e=EMOJIS.find(e=>e.key===type);showToast(`${e?.icon} ${e?.label}`);
  };
  const handleToggle=(id:number)=>setOpenCommentIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const handleAddComment=(id:number,text:string,replyTo?:string)=>{
    if(hasSQLi(text)){alert("🚨 Contenido no permitido.");return;}
    if(!isValidInput(text)){alert("⚠️ Caracteres especiales no permitidos.");return;}
    setPosts(prev=>prev.map(p=>p.id!==id?p:{...p,comments:[...p.comments,{id:Date.now(),author:"Yo",authorInitials:"YO",text:sanitizeHTML(text),time:"Ahora mismo",replyTo}]}));
  };
  const handleHide=(id:number)=>{ setPosts(prev=>prev.map(p=>p.id===id?{...p,hidden:true}:p)); showToast("🚫 Publicación ocultada"); };
  const handleSave=(id:number)=>{
    setPosts(prev=>prev.map(p=>p.id===id?{...p,saved:!p.saved}:p));
    showToast(posts.find(p=>p.id===id)?.saved?"🔖 Removido":"🔖 Guardado");
  };
  const handleShare=(id:number)=>{ navigator.clipboard.writeText(`https://conectapumas.unah.hn/post/${id}`).then(()=>showToast("🔗 Enlace copiado")); };
  const handleInscribir=(id:number)=>{
    setPosts(prev=>prev.map(p=>{if(p.id!==id)return p;const was=p.inscrito;return{...p,inscrito:!was};}));
    showToast(posts.find(p=>p.id===id)?.inscrito?"❌ Desinscrito":"✅ ¡Inscrito al evento!");
  };
  const handleCreate=(d:{title:string;desc:string;type:"Evento"|"Publicacion";scope:string;tags:string[]})=>{
    setPosts(prev=>[{id:nextId,author:"Yo",initials:"YO",type:d.type,scope:d.scope,visibility:"Público",time:"Ahora mismo",
      title:d.title,desc:d.desc,tags:d.tags,love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,
      comments:[],userReaction:null,saved:false,hidden:false,createdAt:Date.now()},...prev]);
    setNextId(n=>n+1); showToast("✅ Publicación creada");
  };
  const handleLoadMore=()=>{
    setPosts(prev=>[...prev,{id:nextId,author:"Miguel Torres",initials:"MT",type:"Publicacion",scope:"Deportivo",
      visibility:"Público",time:"Hace 3 días",title:"Torneo Interclases – Resumen",desc:"Resumen del torneo deportivo.",
      tags:["#Fútbol","#Deporte"],love:0,like:0,dislike:0,haha:0,wow:0,sad:0,angry:0,comments:[],userReaction:null,saved:false,hidden:false,createdAt:Date.now()-72*3600*1000}]);
    setNextId(n=>n+1); showToast("📦 Más publicaciones cargadas");
  };

  const unread=notifications.filter(n=>n.unread).length;
  const posts_=filtered();

  return (
    <>
      {/* Search + Actions bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Buscar en el muro..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-[#003366] outline-none focus:border-[#004B87] transition-colors"/>
        </div>
        <div className="relative">
          <button onClick={e=>{e.stopPropagation();setNotiOpen(v=>!v);}}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
            🔔
            {unread>0&&<span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD100] text-[#003366] rounded-full text-[9px] font-black flex items-center justify-center">{unread}</span>}
          </button>
          {notiOpen&&(
            <div className="absolute right-0 top-12 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-black text-[#FFD100] uppercase tracking-wider">Notificaciones</span>
                <button className="text-xs text-[#717182] hover:text-[#003366] font-semibold"
                  onClick={()=>{setNotifications(prev=>prev.map(n=>({...n,unread:false})));setNotiOpen(false);}}>
                  Marcar leídas
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n=>(
                  <div key={n.id} onClick={()=>setNotifications(prev=>prev.map(x=>x.id===n.id?{...x,unread:false}:x))}
                    className={`flex gap-3 items-start px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${n.unread?'bg-yellow-50/50 border-l-2 border-l-[#FFD100]':''}`}>
                    <span className="text-base">{n.icon}</span>
                    <div>
                      <p className="text-xs text-[#003366] leading-snug" dangerouslySetInnerHTML={{__html:n.text}}/>
                      <p className="text-[10px] text-[#717182] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {!showOnlySaved&&(
          <button onClick={()=>setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
            + Crear Post
          </button>
        )}
      </div>

      {/* Main grid */}
      <div className="flex gap-6">
        {/* Feed column */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <StoriesBar />

          {/* Filter + sort */}
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                {key:"Todas",label:"🌐 Todas"},
                {key:"Publicacion",label:"📢 Publicaciones"},
                {key:"Evento",label:"📅 Eventos"},
              ].map(tab=>(
                <button key={tab.key} onClick={()=>setActiveFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeFilter===tab.key?'bg-white text-[#003366] shadow-sm':'text-[#717182] hover:text-[#003366]'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <select value={sortValue} onChange={e=>setSortValue(e.target.value)}
              className="ml-auto bg-gray-100 border-none rounded-lg px-3 py-1.5 text-xs font-semibold text-[#003366] outline-none cursor-pointer">
              <option value="reciente">⏱️ Más Recientes</option>
              <option value="popular">🔥 Más Populares</option>
              <option value="comentado">💬 Más Comentados</option>
            </select>
          </div>

          {posts_.length===0?(
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm text-[#717182]">No se encontraron publicaciones.</p>
            </div>
          ):(
            <>
              {posts_.map(p=>(
                <PostCard key={p.id} post={p} onReact={handleReact} onToggle={handleToggle}
                  onAddComment={handleAddComment} onHide={handleHide} onSave={handleSave}
                  onShare={handleShare} onInscribir={handleInscribir} onOpenDetail={setDetailPost}
                  openComments={openCommentIds}/>
              ))}
              <button onClick={handleLoadMore}
                className="bg-white border border-gray-200 rounded-xl p-3 text-sm font-semibold text-[#003366] hover:bg-gray-50 transition-colors">
                Cargar más publicaciones
              </button>
            </>
          )}
        </div>

        {/* Widgets column — hidden on mobile */}
        <div className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-4">
          {/* Pumitas conectados */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-black text-[#003366] uppercase tracking-wider mb-3">🟢 Pumitas Conectados</p>
            <div className="flex flex-col gap-3">
              {['Activo','Ausente'].map(status=>(
                <div key={status}>
                  <p className="text-[10px] font-bold text-[#717182] uppercase mb-2">{status==='Activo'?'🟢':'⚫'} {status}</p>
                  {PUMITAS.filter(u=>u.status===status).map((u,i)=>(
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gray-100 border border-gray-200 text-[#003366] rounded-full flex items-center justify-center font-bold text-[11px]">{u.initials}</div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${u.status==='Activo'?'bg-green-500':'bg-gray-400'}`}/>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#003366]">{u.name}</p>
                        <p className={`text-[10px] ${u.status==='Activo'?'text-green-500':'text-[#717182]'}`}>{u.status==='Activo'?'● En línea':'● Ausente'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3">
              {([['autores','🏆 Autores'],['leyenda','🗺️ Leyenda']] as const).map(([k,l])=>(
                <button key={k} onClick={()=>setActiveRightTab(k)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeRightTab===k?'bg-white text-[#003366] shadow-sm':'text-[#717182]'}`}>
                  {l}
                </button>
              ))}
            </div>
            {activeRightTab==='autores'&&(
              <div className="flex flex-col gap-2 text-xs">
                {[['1. Camel García','12 posts'],['2. Carlos Mendoza','8 posts'],['3. Valeria Rojas','5 posts']].map(([n,c],i)=>(
                  <div key={i} className="flex justify-between"><span className="text-[#717182]">{n}</span><strong className="text-[#003366]">{c}</strong></div>
                ))}
              </div>
            )}
            {activeRightTab==='leyenda'&&(
              <div className="flex flex-col gap-2 text-xs text-[#717182]">
                <div>📖 Académico · Gestión y tareas</div>
                <div>🎭 Cultural · Arte y danza</div>
                <div>🤝 Social · Vinculación comunitaria</div>
                <div>⚽ Deportivo · Torneos y ligas</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlays */}
      {detailPost&&<DetailModal post={posts.find(p=>p.id===detailPost.id)||detailPost} onClose={()=>setDetailPost(null)}/>}
      {showModal&&<NewPostModal onClose={()=>setShowModal(false)} onCreate={handleCreate}/>}
      <Toast message={toast}/>
    </>
  );
}
