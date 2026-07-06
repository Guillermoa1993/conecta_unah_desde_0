import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { CheckCircle2 } from "lucide-react";

interface ProgressCardProps {
  currentHours: number;
  requiredHours: number;
  title?: string;
}

export function ProgressCard({
  currentHours,
  requiredHours,
  title = "Progreso Artículo 140",
}: ProgressCardProps) {
  const percentage = Math.min((currentHours / requiredHours) * 100, 100);
  const isCompleted = currentHours >= requiredHours;

  return (
    <Card className={isCompleted ? "border-green-500 border-2" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {isCompleted && (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Horas acumuladas</span>
            <span className="font-semibold text-[#004B87]">
              {currentHours} / {requiredHours} horas
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isCompleted
              ? "¡Felicidades! Has completado tus horas requeridas"
              : `Faltan ${requiredHours - currentHours} horas`}
          </p>
          <span className="text-lg font-bold text-[#004B87]">{Math.round(percentage)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
