import { Calendar, Clock, MapPin, Users, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export interface Event {
  id: string;
  title: string;
  tutor: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  availableSpots: number;
  totalSpots: number;
  status: "available" | "full" | "in-progress" | "completed";
  category: string;
}

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
  showActions?: boolean;
}

export function EventCard({ event, onJoin, showActions = true }: EventCardProps) {
  const getStatusBadge = () => {
    switch (event.status) {
      case "available":
        return <Badge className="bg-green-500 hover:bg-green-600">Disponible</Badge>;
      case "full":
        return <Badge className="bg-red-500 hover:bg-red-600">Lleno</Badge>;
      case "in-progress":
        return <Badge className="bg-[#FFD100] text-[#003366] hover:bg-[#FFD100]">En Curso</Badge>;
      case "completed":
        return <Badge variant="secondary">Finalizado</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#004B87] to-[#003366] text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-white/90">
              <User className="h-4 w-4" />
              {event.tutor}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-[#004B87]" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-[#004B87]" />
          <span>{event.time} • {event.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-[#004B87]" />
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-[#004B87]" />
          <span>
            {event.availableSpots} de {event.totalSpots} lugares disponibles
          </span>
        </div>
        <Badge variant="outline" className="border-[#FFD100] text-[#004B87]">
          {event.category}
        </Badge>
      </CardContent>
      {showActions && (
        <CardFooter className="bg-secondary p-4">
          <Button
            className="w-full bg-[#004B87] hover:bg-[#003366]"
            disabled={event.status === "full" || event.status === "completed"}
            onClick={() => onJoin?.(event.id)}
          >
            {event.status === "full" ? "No hay lugares" : "Inscribirse al Evento"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
