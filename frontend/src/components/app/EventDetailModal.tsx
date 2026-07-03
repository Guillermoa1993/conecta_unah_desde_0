import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useRole, type Role } from "@/lib/role-context";
import { EVENTS, CATEGORY_LABEL, CATEGORY_COLORS, TIPO_EVENTO_LABEL } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

const EVENT_ROUTES: Record<Role, string> = {
  empleado: "/empleado/events/$id",
  voae: "/voae/events/$id",
};

export function EventDetailModal({ open, onOpenChange, eventId }: EventDetailModalProps) {
  const { role } = useRole();
  const navigate = useNavigate();
  const eventoData = EVENTS.find((e) => e.id === eventId);

  if (!event) return null;

  const eventDate = eventoData.fecha_inicio.slice(0, 10);
  const eventTime = `${eventoData.fecha_inicio.slice(11, 16)} - ${eventoData.fecha_fin.slice(11, 16)}`;
  const categoryColor = CATEGORY_COLORS[eventoData.categoria];
  const hasCoords = eventoData.latitud !== undefined && eventoData.longitud !== undefined;
  const initials = eventoData.tutor_nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavigate = () => {
    onOpenChange(false);
    const to = EVENT_ROUTES[role] as "/empleado/events/$id" | "/voae/events/$id";
    navigate({ to, params: { id: eventoData.id } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{eventoData.titulo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded"
              style={{ backgroundColor: categoryColor + "20", color: categoryColor }}
            >
              {CATEGORY_LABEL[eventoData.categoria]}
            </span>
            {eventoData.tipo_evento === "HORAS_VOAE" ? (
              <span className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-[var(--puma-blue)] text-white">
                {TIPO_EVENTO_LABEL.HORAS_VOAE}
              </span>
            ) : (
              <span className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {TIPO_EVENTO_LABEL.RECREACION}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              <span>{eventTime}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span>{eventoData.lugar}</span>
            </div>
            {hasCoords && (
              <div className="h-20 rounded-md border bg-muted grid place-items-center text-xs text-muted-foreground">
                Mini mapa - {eventoData.latitud}, {eventoData.longitud}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t">
            <div
              className="size-8 rounded-full grid place-items-center text-xs font-bold text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {initials}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tutor</div>
              <div className="text-sm font-medium">{eventoData.tutor_nombre}</div>
            </div>
          </div>

          <button
            onClick={handleNavigate}
            className="block w-full text-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--puma-blue)" }}
          >
            Ver evento completo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
