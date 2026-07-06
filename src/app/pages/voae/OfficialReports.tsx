import { Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

const students = [
  { id: "1", name: "Ana García", events: 15, hours: 48, status: "incomplete" },
  { id: "2", name: "Carlos López", events: 20, hours: 65, status: "complete" },
  { id: "3", name: "María Rodríguez", events: 18, hours: 60, status: "complete" },
  { id: "4", name: "Luis Martínez", events: 12, hours: 38, status: "incomplete" },
  { id: "5", name: "Carmen Flores", events: 22, hours: 72, status: "complete" },
];

export function OfficialReports() {
  const handleDownload = () => {
    toast.success("Generando reporte oficial en PDF...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Reportes Oficiales</h1>
          <p className="text-muted-foreground mt-1">
            Estadísticas y reportes institucionales
          </p>
        </div>
        <Button onClick={handleDownload} className="bg-[#004B87] hover:bg-[#003366]">
          <Download className="mr-2 h-5 w-5" />
          Descargar Reporte General
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cumplimiento por Estudiante</CardTitle>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="complete">Completos</SelectItem>
                <SelectItem value="incomplete">Incompletos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="text-center">Eventos</TableHead>
                  <TableHead className="text-center">Horas Acumuladas</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-center">{student.events}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-[#004B87]">
                        {student.hours} / 60
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          student.status === "complete"
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-yellow-500 hover:bg-yellow-600"
                        }
                      >
                        {student.status === "complete" ? "Completo" : "Incompleto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
