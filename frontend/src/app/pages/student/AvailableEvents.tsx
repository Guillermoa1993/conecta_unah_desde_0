import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { EventCard, Event } from "../../components/events/EventCard";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Taller de Desarrollo Web con React",
    tutor: "Dr. Juan Pérez",
    date: "2026-06-01",
    time: "10:00 AM",
    duration: "3 horas",
    location: "Aula 301, Edificio Principal",
    availableSpots: 15,
    totalSpots: 30,
    status: "available",
    category: "Desarrollo de Software",
  },
  {
    id: "2",
    title: "Conferencia de Inteligencia Artificial",
    tutor: "Dra. María González",
    date: "2026-06-05",
    time: "2:00 PM",
    duration: "2 horas",
    location: "Auditorio Principal",
    availableSpots: 0,
    totalSpots: 100,
    status: "full",
    category: "IA y Machine Learning",
  },
  {
    id: "3",
    title: "Workshop de UX/UI Design",
    tutor: "Mtro. Carlos Ramírez",
    date: "2026-06-10",
    time: "4:00 PM",
    duration: "4 horas",
    location: "Sala de Diseño A-12",
    availableSpots: 8,
    totalSpots: 20,
    status: "available",
    category: "Diseño",
  },
  {
    id: "4",
    title: "Curso de Inglés Técnico",
    tutor: "Prof. Ana Martínez",
    date: "2026-06-12",
    time: "9:00 AM",
    duration: "3 horas",
    location: "Centro de Idiomas",
    availableSpots: 12,
    totalSpots: 25,
    status: "available",
    category: "Idiomas",
  },
  {
    id: "5",
    title: "Seminario de Blockchain",
    tutor: "Dr. Roberto Torres",
    date: "2026-06-15",
    time: "11:00 AM",
    duration: "2 horas",
    location: "Lab de Cómputo 5",
    availableSpots: 6,
    totalSpots: 15,
    status: "available",
    category: "Tecnología",
  },
  {
    id: "6",
    title: "Taller de Liderazgo",
    tutor: "Lic. Laura Sánchez",
    date: "2026-06-18",
    time: "3:00 PM",
    duration: "3 horas",
    location: "Sala de Conferencias B",
    availableSpots: 20,
    totalSpots: 40,
    status: "available",
    category: "Desarrollo Personal",
  },
];

export function AvailableEvents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tutor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(mockEvents.map((e) => e.category)));

  const handleJoinEvent = (eventId: string) => {
    const event = mockEvents.find((e) => e.id === eventId);
    toast.success(`Te has inscrito exitosamente a: ${event?.title}`, {
      description: "Recibirás una confirmación por correo electrónico",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">Eventos Disponibles</h1>
        <p className="text-muted-foreground mt-1">
          Explora y únete a eventos académicos disponibles
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos o tutores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onJoin={handleJoinEvent} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No se encontraron eventos con los filtros seleccionados
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("all");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
