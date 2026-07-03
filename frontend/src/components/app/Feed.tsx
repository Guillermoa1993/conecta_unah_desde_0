import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Calendar,
  Clock,
  MapPin,
  Users,
  Send,
  Plus,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EVENTS, CATEGORY_LABEL, CATEGORY_COLORS, getEventInscripciones } from "@/lib/mock-data";
import type { Role } from "@/lib/role-context";
import { useRole } from "@/lib/role-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

/* ─── Story types ─── */
type StoryContent =
  | { type: "text"; text: string; bgColor: string }
  | { type: "image"; imageUrl: string };

interface Story {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  content: StoryContent;
  created_at: number;
  expires_at: number;
}

interface StoryUser {
  userId: string;
  userName: string;
  initials: string;
}

const STORY_COLORS = ["#1e3a5f", "#d4a017", "#22c55e", "#3b82f6", "#f59e0b"];

const STORY_USERS: StoryUser[] = [
  { userId: "STU-001", userName: "Dr. Carlos Mendoza", initials: "CM" },
  { userId: "STU-002", userName: "Lic. Ana Sánchez", initials: "AS" },
  { userId: "STU-003", userName: "Prof. María Lagos", initials: "ML" },
  { userId: "STU-004", userName: "Dr. Roberto Hernández", initials: "RH" },
  { userId: "STU-005", userName: "M.Sc. Laura Jiménez", initials: "LJ" },
  { userId: "STU-006", userName: "Dr. Ricardo Paz", initials: "RP" },
  { userId: "STU-007", userName: "Lic. Sofía Vega", initials: "SV" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ─── Helper functions ─── */
let storyCounter = 100;
function generateStoryId(): string {
  return `story-${++storyCounter}`;
}

/* ─── CreateStoryModal ─── */
function CreateStoryModal({
  open,
  onClose,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (content: StoryContent) => void;
}) {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState(STORY_COLORS[0]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePublish = () => {
    if (mode === "text") {
      if (!text.trim()) return;
      onPublish({ type: "text", text: text.trim(), bgColor });
    } else {
      if (!imagePreview) return;
      onPublish({ type: "image", imageUrl: imagePreview });
    }
    setText("");
    setImagePreview(null);
    setMode("text");
    setBgColor(STORY_COLORS[0]);
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setImagePreview(null);
          setText("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear historia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("text")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === "text" ? "bg-[#1e3a5f] text-white" : "bg-muted text-muted-foreground"}`}
            >
              Texto
            </button>
            <button
              onClick={() => setMode("image")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === "image" ? "bg-[#1e3a5f] text-white" : "bg-muted text-muted-foreground"}`}
            >
              Imagen
            </button>
          </div>

          {mode === "text" ? (
            <>
              <div
                className="rounded-xl p-6 min-h-[160px] flex items-center justify-center transition"
                style={{ backgroundColor: bgColor }}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 120))}
                  placeholder="Escribe algo..."
                  className="w-full bg-transparent text-white text-center text-lg font-semibold resize-none outline-none placeholder-white/60"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {STORY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    className={`size-8 rounded-full transition ${bgColor === c ? "ring-2 ring-offset-2 ring-[#1e3a5f]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/40 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="" className="max-h-48 rounded object-contain" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="size-8 text-muted-foreground/60" />
                  <span className="text-sm text-muted-foreground">
                    Haz clic para subir una imagen
                  </span>
                  <span className="text-xs text-muted-foreground/50">JPG, PNG o GIF</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              style={{ backgroundColor: "var(--puma-blue)" }}
              onClick={handlePublish}
              disabled={mode === "text" ? !text.trim() : !imagePreview}
            >
              Publicar historia
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── StoryViewer ─── */
function StoryViewer({
  stories,
  initialIndex,
  onClose,
}: {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION = 5000;

  const advance = useCallback(() => {
    if (currentIdx < stories.length - 1) {
      setCurrentIdx((i) => i + 1);
      setProgress(0);
      progressRef.current = 0;
      startTimeRef.current = null;
    } else {
      onClose();
    }
  }, [currentIdx, stories.length, onClose]);

  const goBack = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setProgress(0);
      progressRef.current = 0;
      startTimeRef.current = null;
    }
  }, [currentIdx]);

  useEffect(() => {
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      progressRef.current = pct;
      setProgress(pct);
      if (elapsed >= DURATION) {
        advance();
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [currentIdx, advance]);

  const story = stories[currentIdx];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center select-none"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg mx-4">
        {/* Progress bar */}
        <div className="flex gap-1 mb-3">
          {stories.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[3px] rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: i < currentIdx ? "100%" : i === currentIdx ? `${progress}%` : "0%",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="size-9 rounded-full bg-white/20 grid place-items-center text-xs font-bold text-white shrink-0">
            {story.userInitials}
          </div>
          <span className="text-sm font-medium text-white">{story.userName}</span>
        </div>

        {/* Content */}
        <div className="rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
          {story.content.type === "text" ? (
            <div
              className="w-full min-h-[300px] flex items-center justify-center p-8"
              style={{ backgroundColor: story.content.bgColor }}
            >
              <p className="text-white text-center text-xl font-semibold leading-relaxed">
                {story.content.text}
              </p>
            </div>
          ) : (
            <img
              src={story.content.imageUrl}
              alt=""
              className="w-full max-h-[70vh] object-contain"
            />
          )}
        </div>
      </div>

      {/* Left arrow */}
      {currentIdx > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goBack();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full grid place-items-center transition hover:bg-white/25"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          <ChevronLeft className="size-5 text-white" />
        </button>
      )}

      {/* Right arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          advance();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full grid place-items-center transition hover:bg-white/25"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
      >
        <ChevronRight className="size-5 text-white" />
      </button>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 size-10 rounded-full grid place-items-center text-white hover:bg-white/10 transition"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

/* ─── Existing types ─── */
interface Reply {
  id: string;
  autor_nombre: string;
  autor_rol: string;
  texto: string;
  created_at: string;
  likes: number;
  liked: boolean;
}

interface Comment {
  id: string;
  autor_nombre: string;
  autor_rol: string;
  texto: string;
  created_at: string;
  likes: number;
  liked: boolean;
  respuestas: Reply[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-HN", { day: "numeric", month: "short" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEnrolledCount(eventId: string): number {
  try {
    return JSON.parse(localStorage.getItem(`enrolled_${eventId}`) || "false") ? 1 : 0;
  } catch {
    return 0;
  }
}

const MOCK_NAMES = [
  { nombre: "María García", rol: "TUTOR" },
  { nombre: "Juan Pérez", rol: "VOAE" },
  { nombre: "Ana López", rol: "MODERADOR" },
  { nombre: "Pedro Martínez", rol: "ESTUDIANTE" },
  { nombre: "Laura Sánchez", rol: "TUTOR" },
  { nombre: "Carlos Rodríguez", rol: "VOAE" },
  { nombre: "Sofía Torres", rol: "MODERADOR" },
  { nombre: "Diego Ramírez", rol: "ESTUDIANTE" },
];

const MOCK_TEXTS = [
  "Excelente evento, muy bien organizado.",
  "Me gustó mucho la dinámica del taller.",
  "¿Habrá una segunda edición?",
  "Aprendí muchísimo, gracias al tutor.",
  "Buen contenido, aunque el tiempo fue corto.",
  "Muy recomendado para todos los estudiantes.",
  "La sala estaba bien equipada.",
  "Espero que repitan pronto esta actividad.",
  "El horario fue perfecto.",
  "Gran oportunidad de aprendizaje.",
];

const MOCK_RESPUESTAS = [
  "¡Gracias por tu comentario!",
  "Totalmente de acuerdo.",
  "Así es, estuvo genial.",
  "Sí, yo también opino lo mismo.",
  "Gracias a ti por participar.",
];

function seedComments(eventId: string): Comment[] {
  const count = Math.floor(Math.random() * 4) + 1;
  const comments: Comment[] = [];
  for (let i = 0; i < count; i++) {
    const author = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
    const replyCount = Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : 0;
    const respuestas: Reply[] = [];
    for (let j = 0; j < replyCount; j++) {
      const replyAuthor = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      respuestas.push({
        id: `r-${eventId}-${i}-${j}`,
        autor_nombre: replyAuthor.nombre,
        autor_rol: replyAuthor.rol,
        texto: MOCK_RESPUESTAS[Math.floor(Math.random() * MOCK_RESPUESTAS.length)],
        created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
        likes: Math.floor(Math.random() * 5),
        liked: false,
      });
    }
    comments.push({
      id: `c-${eventId}-${i}`,
      autor_nombre: author.nombre,
      autor_rol: author.rol,
      texto: MOCK_TEXTS[Math.floor(Math.random() * MOCK_TEXTS.length)],
      created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      likes: Math.floor(Math.random() * 10),
      liked: false,
      respuestas,
    });
  }
  return comments;
}

function RoleBadge({ rol }: { rol: string }) {
  const upper = rol.toUpperCase();
  if (upper === "ESTUDIANTE") return null;
  const style =
    upper === "TUTOR"
      ? { backgroundColor: "#38bdf8" }
      : upper === "VOAE"
        ? { backgroundColor: "#1e3a5f" }
        : { backgroundColor: "#475569" };
  const label = upper === "MODERADOR" ? "Mod" : upper.charAt(0) + upper.slice(1).toLowerCase();
  return (
    <span
      className="inline-block text-[10px] font-semibold text-white px-1.5 py-0.5 rounded leading-none"
      style={style}
    >
      {label}
    </span>
  );
}

function ReplyItem({ reply, onLike, index }: { reply: Reply; onLike: () => void; index: number }) {
  return (
    <div className="flex gap-2 pl-3 border-l-2 border-muted ml-6 mt-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold">{reply.autor_nombre}</span>
          <RoleBadge rol={reply.autor_rol} />
          <span className="text-[10px] text-muted-foreground">{timeAgo(reply.created_at)}</span>
        </div>
        <p className="text-xs text-foreground mt-0.5">{reply.texto}</p>
        <button
          onClick={onLike}
          className={`flex items-center gap-1 mt-1 text-xs transition ${
            reply.liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`size-3 ${reply.liked ? "fill-current" : ""}`} />
          {reply.likes}
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onLike,
  onReplyLike,
  onSendReply,
  replyText,
  onReplyTextChange,
  replyOpen,
  onToggleReply,
}: {
  comment: Comment;
  onLike: () => void;
  onReplyLike: (replyId: string) => void;
  onSendReply: () => void;
  replyText: string;
  onReplyTextChange: (v: string) => void;
  replyOpen: boolean;
  onToggleReply: () => void;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold">{comment.autor_nombre}</span>
            <RoleBadge rol={comment.autor_rol} />
            <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-foreground mt-0.5">{comment.texto}</p>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 text-xs transition ${
                comment.liked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`size-3.5 ${comment.liked ? "fill-current" : ""}`} />
              {comment.likes}
            </button>
            <button
              onClick={onToggleReply}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Responder
            </button>
          </div>
        </div>
      </div>
      {replyOpen && (
        <div className="flex items-center gap-2 mt-2 ml-6">
          <input
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-3 outline-none focus:border-primary transition"
            autoFocus
          />
          <button
            onClick={onSendReply}
            disabled={!replyText.trim()}
            className="size-8 grid place-items-center rounded-md text-white disabled:opacity-40 transition"
            style={{ backgroundColor: replyText.trim() ? "var(--puma-blue)" : undefined }}
          >
            <Send className="size-3.5" />
          </button>
        </div>
      )}
      {comment.respuestas
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((r, idx) => (
          <ReplyItem key={r.id} reply={r} index={idx} onLike={() => onReplyLike(r.id)} />
        ))}
    </div>
  );
}

function CommentsModal({
  event,
  open,
  onClose,
  comments,
  onToggleLike,
  onToggleReplyLike,
  onAddComment,
  onAddReply,
  replyStates,
  setReplyStates,
}: {
  event: (typeof EVENTS)[number];
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  onToggleLike: () => void;
  onToggleReplyLike: (commentId: string, replyId: string) => void;
  onAddComment: (text: string) => void;
  onAddReply: (commentId: string, text: string) => void;
  replyStates: Record<string, { open: boolean; text: string }>;
  setReplyStates: React.Dispatch<
    React.SetStateAction<Record<string, { open: boolean; text: string }>>
  >;
}) {
  const [newCommentText, setNewCommentText] = useState("");

  const handlePublish = () => {
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim());
    setNewCommentText("");
  };

  const sorted = [...comments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">{event.titulo}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay comentarios aún. Sé el primero en comentar.
            </p>
          ) : (
            sorted.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                onLike={() => onToggleLike()}
                onReplyLike={(replyId) => onToggleReplyLike(c.id, replyId)}
                onSendReply={() => {
                  const rs = replyStates[c.id];
                  if (rs && rs.text.trim()) {
                    onAddReply(c.id, rs.text.trim());
                    setReplyStates((prev) => ({
                      ...prev,
                      [c.id]: { open: false, text: "" },
                    }));
                  }
                }}
                replyText={replyStates[c.id]?.text || ""}
                onReplyTextChange={(v) =>
                  setReplyStates((prev) => ({
                    ...prev,
                    [c.id]: { ...prev[c.id], text: v },
                  }))
                }
                replyOpen={replyStates[c.id]?.open || false}
                onToggleReply={() =>
                  setReplyStates((prev) => {
                    const alreadyOpen = prev[c.id]?.open;
                    return {
                      ...prev,
                      [c.id]: {
                        open: !alreadyOpen,
                        text: alreadyOpen ? prev[c.id].text : `@${c.autor_nombre} `,
                      },
                    };
                  })
                }
              />
            ))
          )}
        </div>
        <div className="flex items-center gap-2 pt-3 border-t mt-3 shrink-0">
          <input
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Escribe un comentario..."
            className="flex-1 h-9 text-sm rounded-md border border-input bg-background px-3 outline-none focus:border-primary transition"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCommentText.trim()) handlePublish();
            }}
          />
          <button
            onClick={handlePublish}
            disabled={!newCommentText.trim()}
            className="h-9 px-4 rounded-md text-sm font-medium text-white disabled:opacity-40 transition"
            style={{ backgroundColor: newCommentText.trim() ? "var(--puma-blue)" : undefined }}
          >
            Publicar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThreeDotMenu({ onShare, onHide }: { onShare: () => void; onHide: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="size-8 grid place-items-center rounded-full hover:bg-muted transition-colors"
      >
        <MoreHorizontal className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md">
          <button
            onClick={() => {
              onShare();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors"
          >
            Compartir
          </button>
          <button
            onClick={() => {
              onHide();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors"
          >
            Ocultar
          </button>
        </div>
      )}
    </div>
  );
}

export function Feed({ role }: { role: Role }) {
  const { user } = useRole();
  const userInitials = getInitials(user.name);

  const events = useMemo(
    () =>
      EVENTS.filter((e) => e.estado === "PROGRAMADO" || e.estado === "EN_CURSO").sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [],
  );

  /* ─── Stories state ─── */
  // TODO: conectar con API de historias
  const [stories, setStories] = useState<Record<string, Story[]>>(() => {
    const now = Date.now();
    const seed: Record<string, Story[]> = {};
    STORY_USERS.forEach((su) => {
      seed[su.userId] = [
        {
          id: `seed-${su.userId}-1`,
          userId: su.userId,
          userName: su.userName,
          userInitials: su.initials,
          content: {
            type: "text",
            text: "¡Bienvenidos a Conecta Pumas!",
            bgColor: STORY_COLORS[Math.floor(Math.random() * STORY_COLORS.length)],
          },
          created_at: now - Math.random() * 3600000 * 4,
          expires_at: now + 86400000,
        },
      ];
    });
    return seed;
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<StoryUser | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);

  const activeStoryUserIds = useMemo(() => {
    const now = Date.now();
    return new Set(
      Object.entries(stories)
        .filter(([, storyList]) => storyList.some((s) => s.expires_at > now))
        .map(([userId]) => userId),
    );
  }, [stories]);

  const currentUserStoryUser: StoryUser = {
    userId: user.id,
    userName: user.name,
    initials: userInitials,
  };

  const storyUsers = [currentUserStoryUser, ...STORY_USERS.filter((su) => su.userId !== user.id)];

  const handlePublishStory = (content: StoryContent) => {
    const now = Date.now();
    const newStory: Story = {
      id: generateStoryId(),
      userId: user.id,
      userName: user.name,
      userInitials,
      content,
      created_at: now,
      expires_at: now + 86400000,
    };
    setStories((prev) => ({
      ...prev,
      [user.id]: [...(prev[user.id] || []), newStory],
    }));
    toast.success("Historia publicada", {
      description: "Tu historia estará visible por 24 horas.",
    });
  };

  const handleViewStories = (su: StoryUser) => {
    const userStories = stories[su.userId] || [];
    const active = userStories.filter((s) => s.expires_at > Date.now());
    if (active.length === 0) return;
    const sorted = active.sort((a, b) => a.created_at - b.created_at);
    setViewingUser(su);
    setViewingIndex(0);
  };

  const [likes, setLikes] = useState<Record<string, number>>(() => {
    const saved: Record<string, number> = {};
    events.forEach((e) => {
      saved[e.id] = Math.floor(Math.random() * 25) + 5;
    });
    return saved;
  });
  const [liked, setLiked] = useState<Record<string, boolean>>(() => {
    const saved: Record<string, boolean> = {};
    if (typeof window !== "undefined") {
      events.forEach((e) => {
        saved[e.id] = localStorage.getItem(`liked_${e.id}`) === "true";
      });
    }
    return saved;
  });
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>(() => {
    const saved: Record<string, boolean> = {};
    if (typeof window !== "undefined") {
      events.forEach((e) => {
        saved[e.id] = localStorage.getItem(`enrolled_${e.id}`) === "true";
      });
    }
    return saved;
  });
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(new Set());
  const [commentEventId, setCommentEventId] = useState<string | null>(null);
  const [allComments, setAllComments] = useState<Record<string, Comment[]>>(() => {
    const saved: Record<string, Comment[]> = {};
    events.forEach((e) => {
      saved[e.id] = seedComments(e.id);
    });
    return saved;
  });
  const [replyStates, setReplyStates] = useState<Record<string, { open: boolean; text: string }>>(
    {},
  );
  const [currentUserLikes, setCurrentUserLikes] = useState<Record<string, Set<string>>>({});

  const handleLike = (id: string) => {
    setLiked((prev) => {
      const was = prev[id];
      const next = { ...prev, [id]: !was };
      localStorage.setItem(`liked_${id}`, String(!was));
      return next;
    });
    setLikes((prev) => ({
      ...prev,
      [id]: prev[id] + (liked[id] ? -1 : 1),
    }));
  };

  const handleInscribirse = (id: string) => {
    setEnrolled((prev) => {
      const was = prev[id];
      const next = { ...prev, [id]: !was };
      localStorage.setItem(`enrolled_${id}`, String(!was));
      return next;
    });
  };

  const handleShareEvent = async (event: { titulo: string; id: string }) => {
    const url = `${window.location.origin}/${role}/events/${event.id}`;
    if (navigator.share) {
      await navigator.share({ title: event.titulo, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleToggleCommentLike = (eventId: string) => {
    setAllComments((prev) => {
      const next = { ...prev };
      next[eventId] = prev[eventId].map((c) => ({
        ...c,
        liked: !c.liked,
        likes: c.liked ? c.likes - 1 : c.likes + 1,
      }));
      return next;
    });
  };

  const handleToggleReplyLike = (eventId: string, commentId: string, replyId: string) => {
    setAllComments((prev) => {
      const next = { ...prev };
      next[eventId] = prev[eventId].map((c) => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          respuestas: c.respuestas.map((r) => {
            if (r.id !== replyId) return r;
            return { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 };
          }),
        };
      });
      return next;
    });
  };

  const handleAddComment = (eventId: string, text: string) => {
    const author = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
    const newComment: Comment = {
      id: `c-${eventId}-${Date.now()}`,
      autor_nombre: author.nombre,
      autor_rol: author.rol,
      texto: text,
      created_at: new Date().toISOString(),
      likes: 0,
      liked: false,
      respuestas: [],
    };
    setAllComments((prev) => ({
      ...prev,
      [eventId]: [...prev[eventId], newComment],
    }));
  };

  const handleAddReply = (eventId: string, commentId: string, text: string) => {
    const author = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
    const newReply: Reply = {
      id: `r-${eventId}-${commentId}-${Date.now()}`,
      autor_nombre: author.nombre,
      autor_rol: author.rol,
      texto: text,
      created_at: new Date().toISOString(),
      likes: 0,
      liked: false,
    };
    setAllComments((prev) => {
      const next = { ...prev };
      next[eventId] = prev[eventId].map((c) => {
        if (c.id !== commentId) return c;
        return { ...c, respuestas: [...c.respuestas, newReply] };
      });
      return next;
    });
  };

  const visibleEvents = useMemo(
    () => events.filter((e) => !hiddenPosts.has(e.id)),
    [events, hiddenPosts],
  );

  if (visibleEvents.length === 0) {
    return (
      <div className="max-w-[460px] mx-auto py-20 text-center">
        <div className="size-16 mx-auto rounded-full bg-muted grid place-items-center mb-4">
          <Calendar className="size-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground text-sm">No hay eventos activos en este momento.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[460px] mx-auto space-y-4 pb-8">
      {/* Stories row */}
      <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-none">
        {storyUsers.map((su, i) => {
          const userStories = stories[su.userId] || [];
          const hasActive = userStories.some((s) => s.expires_at > Date.now());
          const isCurrentUser = su.userId === user.id;

          return (
            <div
              key={su.userId}
              className="flex flex-col items-center gap-1 shrink-0 w-[68px] cursor-pointer"
              onClick={() => {
                if (isCurrentUser) {
                  setCreateOpen(true);
                } else if (hasActive) {
                  handleViewStories(su);
                }
              }}
            >
              <div
                className="size-[62px] rounded-full p-[2px]"
                style={{
                  background: hasActive
                    ? `conic-gradient(#1e3a5f, #d4a017, #1e3a5f)`
                    : "transparent",
                }}
              >
                <div className="size-full rounded-full border-2 border-white bg-[#f1f5f9] grid place-items-center relative">
                  <span className="text-xs font-bold" style={{ color: "var(--puma-blue)" }}>
                    {su.initials}
                  </span>
                  {isCurrentUser && (
                    <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-[#1e3a5f] grid place-items-center border-2 border-white">
                      <Plus className="size-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">
                {isCurrentUser ? "Tu historia" : su.userName.split(" ").pop()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event cards */}
      {visibleEvents.map((event) => {
        const catColor = CATEGORY_COLORS[event.categoria] || "#64748b";
        const isLiked = liked[event.id] || false;
        const isEnrolled = enrolled[event.id] || false;
        const likeCount = likes[event.id] || 0;
        const daysUntil = Math.ceil(
          (new Date(event.fecha_inicio).getTime() - Date.now()) / 86400000,
        );
        const eventComments = allComments[event.id] || [];
        const commentsCount = eventComments.length;

        return (
          <div key={event.id} className="rounded-xl border bg-card shadow-soft overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
              <div
                className="size-9 rounded-full grid place-items-center text-xs font-bold shrink-0"
                style={{ backgroundColor: catColor + "20", color: catColor }}
              >
                {getInitials(event.tutor_nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{event.tutor_nombre}</div>
                <div className="text-[11px] text-muted-foreground">
                  Facultad de Ciencias · {timeAgo(event.created_at)}
                </div>
              </div>
              <ThreeDotMenu
                onShare={() => handleShareEvent(event)}
                onHide={() => {
                  setHiddenPosts((prev) => new Set(prev).add(event.id));
                  toast.success("Post ocultado");
                }}
              />
            </div>

            {/* Banner */}
            <Link
              to={role === "voae" ? "/voae/events/$id" : "/tutor/events/$id"}
              params={{ id: event.id }}
            >
              {event.portada_url ? (
                <img src={event.portada_url} alt="" className="w-full aspect-[16/9] object-cover" />
              ) : (
                <div
                  className="w-full aspect-[16/9] grid place-items-center relative"
                  style={{ backgroundColor: catColor + "15" }}
                >
                  <div
                    className="size-20 rounded-full grid place-items-center"
                    style={{ backgroundColor: catColor + "25" }}
                  >
                    <span className="text-3xl font-bold" style={{ color: catColor }}>
                      {getInitials(event.titulo)}
                    </span>
                  </div>
                  <span
                    className="absolute bottom-3 left-3 text-[10px] px-2.5 py-1 rounded-full font-semibold text-white shadow"
                    style={{ backgroundColor: catColor }}
                  >
                    {CATEGORY_LABEL[event.categoria]}
                  </span>
                </div>
              )}
            </Link>

            {/* Body */}
            <div className="p-4 pt-3 space-y-2">
              <Link
                to={role === "voae" ? "/voae/events/$id" : "/tutor/events/$id"}
                params={{ id: event.id }}
                className="font-semibold text-sm hover:underline"
              >
                {event.titulo}
              </Link>
              <p className="text-xs text-muted-foreground line-clamp-2">{event.descripcion}</p>

              {role === "voae" && (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className="text-white text-[10px]"
                      style={{
                        backgroundColor: event.tipo_evento === "HORAS_VOAE" ? "#1e3a5f" : "#6b7280",
                      }}
                    >
                      {event.tipo_evento === "HORAS_VOAE" ? "Con horas · Art. 140" : "Sin horas"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solicitado por: <span className="font-medium">{event.tutor_nombre}</span>
                  </p>
                </>
              )}

              {/* Cupos progress bar */}
              {(() => {
                const inscritos = getEventInscripciones(event.id);
                const pct =
                  event.cupo_maximo > 0
                    ? Math.min(100, Math.round((inscritos / event.cupo_maximo) * 100))
                    : 0;
                const barColor = pct >= 100 ? "#ef4444" : "#d4a017";
                return (
                  <div className="mt-2">
                    <div className="w-full h-[6px] rounded-full bg-[#e5e7eb] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {inscritos} / {event.cupo_maximo} cupos
                    </p>
                  </div>
                );
              })()}

              {/* Info chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Chip icon={Calendar} text={formatDate(event.fecha_inicio)} />
                <Chip
                  icon={Clock}
                  text={`${formatTime(event.fecha_inicio)} - ${formatTime(event.fecha_fin)}`}
                />
                <Chip icon={MapPin} text={event.lugar} />
              </div>

              {daysUntil >= 0 && daysUntil <= 7 && (
                <div className="text-[10px] font-semibold" style={{ color: "var(--puma-blue)" }}>
                  {daysUntil === 0 ? "Hoy" : daysUntil === 1 ? "Mañana" : `En ${daysUntil} días`}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-1 px-4 pb-3 pt-1 border-t">
              <button
                onClick={() => handleLike(event.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition ${
                  isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`size-3.5 ${isLiked ? "fill-current" : ""}`} />
                {likeCount}
              </button>
              <button
                onClick={() => {
                  setCommentEventId(event.id);
                  setReplyStates({});
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition"
              >
                <MessageCircle className="size-3.5" />
                {commentsCount}
              </button>
              <button
                onClick={() => handleShareEvent(event)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition"
              >
                <Share2 className="size-3.5" />
              </button>
              <div className="flex-1" />
              <Button
                asChild
                size="sm"
                className="text-xs gap-1 text-white"
                style={{ backgroundColor: "var(--puma-blue)" }}
              >
                <Link
                  to={role === "voae" ? "/voae/events/$id" : "/tutor/events/$id"}
                  params={{ id: event.id }}
                >
                  {role === "voae" ? "Ver evento" : "Gestionar"}
                </Link>
              </Button>
            </div>
          </div>
        );
      })}

      {/* Comments modal */}
      {commentEventId &&
        (() => {
          const ev = events.find((e) => e.id === commentEventId);
          if (!ev) return null;
          return (
            <CommentsModal
              event={ev}
              open={!!commentEventId}
              onClose={() => setCommentEventId(null)}
              comments={allComments[commentEventId] || []}
              onToggleLike={() => handleToggleCommentLike(commentEventId)}
              onToggleReplyLike={(commentId, replyId) =>
                handleToggleReplyLike(commentEventId, commentId, replyId)
              }
              onAddComment={(text) => handleAddComment(commentEventId, text)}
              onAddReply={(commentId, text) => handleAddReply(commentEventId, commentId, text)}
              replyStates={replyStates}
              setReplyStates={setReplyStates}
            />
          );
        })()}

      {/* Create story modal */}
      <CreateStoryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onPublish={handlePublishStory}
      />

      {/* Story viewer */}
      {viewingUser &&
        (() => {
          const userStories = stories[viewingUser.userId] || [];
          const active = userStories
            .filter((s) => s.expires_at > Date.now())
            .sort((a, b) => a.created_at - b.created_at);
          if (active.length === 0) {
            setViewingUser(null);
            return null;
          }
          return (
            <StoryViewer
              stories={active}
              initialIndex={viewingIndex}
              onClose={() => setViewingUser(null)}
            />
          );
        })()}
    </div>
  );
}

function Chip({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
      <Icon className="size-3" />
      {text}
    </span>
  );
}
