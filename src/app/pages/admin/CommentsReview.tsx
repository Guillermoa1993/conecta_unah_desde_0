import { useState } from "react";
import { MessageSquare, Star, Search, Filter, CheckCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";

type Comment = {
  id: number;
  student: string;
  event: string;
  tutor: string;
  rating: number;
  comment: string;
  date: string;
  status: "pending" | "reviewed";
};

const mockComments: Comment[] = [
  {
    id: 1,
    student: "Ana García",
    event: "Taller de React",
    tutor: "Dr. Juan Pérez",
    rating: 5,
    comment: "Excelente taller, aprendí mucho sobre hooks y componentes funcionales. El Dr. Pérez explica muy claramente.",
    date: "2024-11-10",
    status: "pending",
  },
  {
    id: 2,
    student: "Carlos López",
    event: "Curso de Python",
    tutor: "Dra. María González",
    rating: 4,
    comment: "Muy buen curso, aunque me hubiera gustado que cubriera más temas de programación orientada a objetos.",
    date: "2024-11-09",
    status: "pending",
  },
  {
    id: 3,
    student: "María Rodríguez",
    event: "Workshop de Machine Learning",
    tutor: "Mtro. Carlos Ramírez",
    rating: 3,
    comment: "El contenido estuvo bien pero el tiempo fue insuficiente para cubrir todos los temas prometidos.",
    date: "2024-11-08",
    status: "reviewed",
  },
  {
    id: 4,
    student: "Luis Martínez",
    event: "Taller de React",
    tutor: "Dr. Juan Pérez",
    rating: 5,
    comment: "Increíble sesión, las explicaciones fueron muy claras y los ejercicios prácticos fueron de gran ayuda.",
    date: "2024-11-10",
    status: "reviewed",
  },
  {
    id: 5,
    student: "Carmen Flores",
    event: "Seminario de Bases de Datos",
    tutor: "Dr. Alberto Núñez",
    rating: 2,
    comment: "El contenido fue muy avanzado para el nivel del grupo. Se necesita más material introductorio.",
    date: "2024-11-07",
    status: "pending",
  },
  {
    id: 6,
    student: "Jorge Sánchez",
    event: "Curso de Python",
    tutor: "Dra. María González",
    rating: 4,
    comment: "Buen ritmo de enseñanza, los ejemplos fueron muy prácticos y aplicables en el mundo real.",
    date: "2024-11-09",
    status: "pending",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-[#FFD100] text-[#FFD100]" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export function CommentsReview() {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");

  const filtered = comments.filter((c) => {
    const matchesSearch =
      c.student.toLowerCase().includes(search.toLowerCase()) ||
      c.event.toLowerCase().includes(search.toLowerCase()) ||
      c.comment.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesRating = filterRating === "all" || c.rating === Number(filterRating);
    return matchesSearch && matchesStatus && matchesRating;
  });

  const pendingCount = comments.filter((c) => c.status === "pending").length;

  const handleMarkReviewed = (id: number) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "reviewed" } : c))
    );
    toast.success("Comentario marcado como revisado");
  };

  const handleDelete = (id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success("Comentario eliminado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Revisión de Comentarios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los comentarios y retroalimentación de los estudiantes
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-[#FFD100] text-[#003366] text-sm px-3 py-1">
            {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comentarios</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">{comments.length}</h3>
              </div>
              <MessageSquare className="h-10 w-10 text-[#004B87] opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <h3 className="text-3xl font-bold text-yellow-500 mt-1">{pendingCount}</h3>
              </div>
              <Filter className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calificación Promedio</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">
                  {(comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)}
                </h3>
              </div>
              <Star className="h-10 w-10 text-[#FFD100] opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por estudiante, evento o comentario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="reviewed">Revisados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Calificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                <SelectItem value="2">⭐⭐ (2)</SelectItem>
                <SelectItem value="1">⭐ (1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No se encontraron comentarios con los filtros seleccionados.
            </CardContent>
          </Card>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} className={c.status === "pending" ? "border-l-4 border-l-yellow-400" : "border-l-4 border-l-green-400"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#004B87]">{c.student}</span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-sm text-muted-foreground">{c.event}</span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-sm text-muted-foreground">{c.tutor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={c.rating} />
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                      <Badge
                        variant={c.status === "pending" ? "outline" : "secondary"}
                        className={
                          c.status === "pending"
                            ? "border-yellow-400 text-yellow-600"
                            : "bg-green-100 text-green-700"
                        }
                      >
                        {c.status === "pending" ? "Pendiente" : "Revisado"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {c.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => handleMarkReviewed(c.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Revisado
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-400 text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{c.comment}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
