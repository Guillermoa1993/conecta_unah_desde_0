import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Star, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Progress } from "../../components/ui/progress";
import { toast } from "sonner";

const questions = [
  {
    id: 1,
    question: "¿Qué tan satisfecho estás con el contenido del evento?",
  },
  {
    id: 2,
    question: "¿El tutor demostró dominio del tema?",
  },
  {
    id: 3,
    question: "¿Consideras que el evento cumplió tus expectativas?",
  },
  {
    id: 4,
    question: "¿Recomendarías este evento a otros estudiantes?",
  },
  {
    id: 5,
    question: "¿Qué tan útil fue el evento para tu formación académica?",
  },
];

export function Survey() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});
  const [comments, setComments] = useState("");
  const [hoveredStar, setHoveredStar] = useState<{ [key: number]: number }>({});

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(ratings).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const handleRating = (questionId: number, rating: number) => {
    setRatings({ ...ratings, [questionId]: rating });
  };

  const handleSubmit = () => {
    if (answeredQuestions < totalQuestions) {
      toast.error("Por favor, responde todas las preguntas");
      return;
    }

    toast.success("¡Gracias por tu retroalimentación!", {
      description: "Tu opinión nos ayuda a mejorar nuestros eventos",
    });
    
    setTimeout(() => {
      navigate("/student");
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#004B87]">Encuesta de Satisfacción</h1>
        <p className="text-muted-foreground mt-1">
          Tu opinión es importante para nosotros
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium text-[#004B87]">
                {answeredQuestions} / {totalQuestions} preguntas
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {q.id}. {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = ratings[q.id] >= star;
                  const isHovered = hoveredStar[q.id] >= star;
                  
                  return (
                    <button
                      key={star}
                      onClick={() => handleRating(q.id, star)}
                      onMouseEnter={() =>
                        setHoveredStar({ ...hoveredStar, [q.id]: star })
                      }
                      onMouseLeave={() =>
                        setHoveredStar({ ...hoveredStar, [q.id]: 0 })
                      }
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          isSelected || isHovered
                            ? "fill-[#FFD100] text-[#FFD100]"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {ratings[q.id] && (
                <p className="text-center mt-2 text-sm text-muted-foreground">
                  Calificación: {ratings[q.id]} de 5 estrellas
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Comentarios Adicionales (Opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Comparte tus comentarios o sugerencias sobre el evento..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1 border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white"
          onClick={() => navigate("/student")}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-[#004B87] hover:bg-[#003366]"
        >
          <Send className="mr-2 h-5 w-5" />
          Enviar Encuesta
        </Button>
      </div>
    </div>
  );
}
