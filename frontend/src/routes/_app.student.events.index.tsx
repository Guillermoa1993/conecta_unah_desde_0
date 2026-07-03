import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { EventCard } from "@/components/app/EventCard";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL, EVENTS, type EventCategory } from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/student/events/")({
  component: EventsList,
});

function EventsList() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const list = EVENTS.filter((e) => {
    const matchQ =
      e.titulo.toLowerCase().includes(q.toLowerCase()) ||
      e.tutor_nombre.toLowerCase().includes(q.toLowerCase());
    const matchC = cat === "all" || e.categoria === cat;
    return matchQ && matchC && e.estado === "PROGRAMADO";
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Eventos disponibles"
          description="Descubre actividades académicas, culturales y sociales en curso."
        />
        <Button
          asChild
          className="gap-1.5 text-white shadow-md shrink-0 mt-1"
          style={{ backgroundColor: "#004B87" }}
        >
          <Link to="/student/solicitar">
            <Plus className="size-4" /> Solicitar nuevo evento
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título o tutor…"
            className="w-full h-11 pl-9 pr-3 rounded-lg border bg-card outline-none focus:border-ring text-sm"
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-full sm:w-56 h-11">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-16 text-center">
          <div className="text-base font-medium">No encontramos eventos</div>
          <div className="text-sm text-muted-foreground mt-1">
            Intenta cambiar los filtros o el término de búsqueda.
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((e) => (
            <EventCard key={e.id} event={e} ctaLabel="Ver evento" />
          ))}
        </div>
      )}
    </div>
  );
}
