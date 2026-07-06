import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { toast } from "sonner";

const mockStudents = [
  { id: "1", name: "Ana García", email: "ana.garcia@pumas.unam.mx", attended: true, time: "10:05 AM" },
  { id: "2", name: "Carlos López", email: "carlos.lopez@pumas.unam.mx", attended: true, time: "10:03 AM" },
  { id: "3", name: "María Rodríguez", email: "maria.rodriguez@pumas.unam.mx", attended: false, time: null },
  { id: "4", name: "Luis Martínez", email: "luis.martinez@pumas.unam.mx", attended: true, time: "10:08 AM" },
  { id: "5", name: "Carmen Flores", email: "carmen.flores@pumas.unam.mx", attended: true, time: "10:02 AM" },
  { id: "6", name: "Jorge Sánchez", email: "jorge.sanchez@pumas.unam.mx", attended: false, time: null },
  { id: "7", name: "Patricia Torres", email: "patricia.torres@pumas.unam.mx", attended: true, time: "10:12 AM" },
  { id: "8", name: "Roberto Díaz", email: "roberto.diaz@pumas.unam.mx", attended: true, time: "10:01 AM" },
];

export function ManageEvent() {
  const { eventId } = useParams();
  const [qrTimer, setQrTimer] = useState(120); // 2 minutes
  const [isEventActive, setIsEventActive] = useState(true);
  const [students, setStudents] = useState(mockStudents);

  useEffect(() => {
    if (qrTimer > 0 && isEventActive) {
      const timer = setTimeout(() => setQrTimer(qrTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [qrTimer, isEventActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const attendedCount = students.filter((s) => s.attended).length;
  const attendancePercentage = (attendedCount / students.length) * 100;

  const handleRegenerateQR = () => {
    setQrTimer(120);
    toast.success("Código QR regenerado");
  };

  const handleEndEvent = () => {
    setIsEventActive(false);
    toast.success("Evento finalizado", {
      description: "Los estudiantes ya no podrán registrar asistencia",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">
            Taller de Desarrollo Web con React
          </h1>
          <p className="text-muted-foreground mt-1">Gestión en Tiempo Real</p>
        </div>
        {isEventActive && (
          <Button
            variant="destructive"
            onClick={handleEndEvent}
          >
            Finalizar Evento
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estudiantes Inscritos</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">
                  {students.length}
                </h3>
              </div>
              <Users className="h-12 w-12 text-[#004B87] opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Asistencia Registrada</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">
                  {attendedCount}
                </h3>
              </div>
              <CheckCircle2 className="h-12 w-12 text-[#004B87] opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Porcentaje de Asistencia</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">
                  {Math.round(attendancePercentage)}%
                </h3>
              </div>
              <Progress value={attendancePercentage} className="w-16 h-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Section */}
      {isEventActive && (
        <Card>
          <CardHeader>
            <CardTitle>Código QR para Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-white border-4 border-[#004B87] rounded-lg">
                  <QRCodeSVG
                    value={`event:${eventId}:${Date.now()}`}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Tiempo restante:</p>
                  <p className="text-2xl font-bold text-[#004B87]">
                    {formatTime(qrTimer)}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="p-4 bg-[#F4F6F8] rounded-lg">
                  <h4 className="font-semibold text-[#004B87] mb-2">Instrucciones:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>1. Proyecta este código QR en pantalla grande</li>
                    <li>2. Los estudiantes deben escanearlo con su dispositivo móvil</li>
                    <li>3. El código se regenera automáticamente cada 2 minutos</li>
                    <li>4. Monitorea la asistencia en tiempo real en la tabla inferior</li>
                  </ul>
                </div>

                <Button
                  onClick={handleRegenerateQR}
                  variant="outline"
                  className="w-full border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Regenerar Código QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Hora de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-center">
                      {student.attended ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Presente
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Ausente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.time || "-"}
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
