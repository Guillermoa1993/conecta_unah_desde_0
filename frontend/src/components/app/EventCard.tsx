import { useState } from "react";
import { CalendarDays, Clock, MapPin, Users, QrCode } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_LABEL,
  CATEGORY_COLORS,
  STATUS_LABEL,
  STATUS_TONE,
  getEventInscripciones,
  type UniEvent,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { EventQrModal } from "@/components/app/EventQrModal";

type EventCardProps = {
  event: UniEvent;
  ctaLabel?: string;
  onView?: (event: UniEvent) => void;
  variant?: "tutor";
};

export function EventCard({
  event,
  ctaLabel = "Ver evento",
  onView,
  variant = "tutor",
}: EventCardProps) {
  const navigate = useNavigate();
  const [qrModal, setQrModal] = useState(false);
  const enrolled = getEventInscripciones(event.id);
  const fillPct = Math.round((enrolled / event.cupo_maximo) * 100);
  const eventDate = event.fecha_inicio.slice(0, 10);
  const eventTime = event.fecha_inicio.slice(11, 16);

  const handleClick = () => {
    if (onView) return onView(event);
    navigate({ to: "/tutor/events/$id", params: { id: event.id } });
  };

  return (
    <>
      <div className="group rounded-xl border bg-card overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all">
        <EventImage imageUrl={event.imagen_url} category={event.categoria} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                  {CATEGORY_LABEL[event.categoria]}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border",
                    STATUS_TONE[event.estado],
                  )}
                >
                  {STATUS_LABEL[event.estado]}
                </span>
              </div>
              <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors">
                {event.titulo}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{event.descripcion}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-muted-foreground">Horas</div>
              <div className="text-2xl font-semibold text-primary">{event.duracion_horas}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground my-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {eventDate}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {eventTime} · {event.duracion_horas}h
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="size-3.5" />
              {event.lugar}
            </div>
          </div>

          <div className="mt-3 mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="size-3.5" /> {enrolled}/{event.cupo_maximo}
              </span>
              <span className="font-medium">{fillPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full gradient-gold rounded-full transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t">
            <div className="text-xs min-w-0 flex-1">
              <span className="text-muted-foreground">Tutor: </span>
              <span className="font-medium">{event.tutor_nombre}</span>
            </div>
            <Button
              size="sm"
              onClick={handleClick}
              className="text-white"
              style={{ backgroundColor: "var(--puma-blue)" }}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>

      <EventQrModal
        open={qrModal}
        onClose={() => setQrModal(false)}
        eventId={event.id}
        eventTitle={event.titulo}
        eventDate={eventDate}
      />
    </>
  );
}

function EventImage({ imageUrl, category }: { imageUrl?: string; category: string }) {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#64748b";
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="w-full h-36 object-cover" />;
  }
  return (
    <div className="w-full h-36 grid place-items-center" style={{ backgroundColor: color + "20" }}>
      <div
        className="size-12 rounded-full grid place-items-center"
        style={{ backgroundColor: color + "30" }}
      >
        <div className="text-lg font-bold" style={{ color }}>
          {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]?.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
