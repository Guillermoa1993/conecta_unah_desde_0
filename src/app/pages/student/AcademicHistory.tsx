import { Download, CheckCircle2, Clock, MapPin } from "lucide-react";
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
import { toast } from "sonner";

const attendanceHistory = [
  {
    id: "1",
    eventName: "Taller de Desarrollo Web con React",
    date: "2026-05-20",
    time: "10:00 AM",
    location: "Aula 301, Edificio Principal",
    hours: 3,
    status: "validated",
    tutor: "Dr. Juan Pérez",
    certificate: true,
  },
  {
    id: "2",
    eventName: "Conferencia de Inteligencia Artificial",
    date: "2026-05-18",
    time: "2:00 PM",
    location: "Auditorio Principal",
    hours: 2,
    status: "validated",
    tutor: "Dra. María González",
    certificate: true,
  },
  {
    id: "3",
    eventName: "Workshop de UX/UI Design",
    date: "2026-05-15",
    time: "4:00 PM",
    location: "Sala de Diseño A-12",
    hours: 4,
    status: "validated",
    tutor: "Mtro. Carlos Ramírez",
    certificate: true,
  },
  {
    id: "4",
    eventName: "Curso de Inglés Técnico",
    date: "2026-05-12",
    time: "9:00 AM",
    location: "Centro de Idiomas",
    hours: 3,
    status: "pending",
    tutor: "Prof. Ana Martínez",
    certificate: false,
  },
  {
    id: "5",
    eventName: "Seminario de Blockchain",
    date: "2026-05-10",
    time: "11:00 AM",
    location: "Lab de Cómputo 5",
    hours: 2,
    status: "validated",
    tutor: "Dr. Roberto Torres",
    certificate: true,
  },
  {
    id: "6",
    eventName: "Taller de Python Avanzado",
    date: "2026-05-08",
    time: "3:00 PM",
    location: "Lab de Cómputo 3",
    hours: 5,
    status: "validated",
    tutor: "Dr. Juan Pérez",
    certificate: true,
  },
  {
    id: "7",
    eventName: "Curso de Git y GitHub",
    date: "2026-05-05",
    time: "10:00 AM",
    location: "Aula 205, Edificio B",
    hours: 2,
    status: "validated",
    tutor: "Mtro. Luis Hernández",
    certificate: true,
  },
  {
    id: "8",
    eventName: "Taller de Liderazgo",
    date: "2026-05-03",
    time: "3:00 PM",
    location: "Sala de Conferencias B",
    hours: 3,
    status: "validated",
    tutor: "Lic. Laura Sánchez",
    certificate: true,
  },
  {
    id: "9",
    eventName: "Workshop de Ciberseguridad",
    date: "2026-05-01",
    time: "9:00 AM",
    location: "Lab de Redes, Edificio C",
    hours: 4,
    status: "validated",
    tutor: "Ing. Pedro Gómez",
    certificate: true,
  },
];

export function AcademicHistory() {
  const totalHours = attendanceHistory
    .filter((a) => a.status === "validated")
    .reduce((sum, a) => sum + a.hours, 0);
  const totalEvents = attendanceHistory.filter((a) => a.status === "validated").length;

  const handleDownloadCertificate = (eventName: string) => {
    toast.success(`Descargando certificado: ${eventName}`);
  };

  const handleDownloadAll = () => {
    toast.success("Generando reporte completo en PDF...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Historial Académico</h1>
          <p className="text-muted-foreground mt-1">
            Registro completo de tus actividades validadas
          </p>
        </div>
        <Button
          onClick={handleDownloadAll}
          className="bg-[#004B87] hover:bg-[#003366]"
        >
          <Download className="mr-2 h-5 w-5" />
          Descargar Reporte
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Horas</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">{totalHours}</h3>
              </div>
              <Clock className="h-12 w-12 text-[#004B87] opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos Completados</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">{totalEvents}</h3>
              </div>
              <CheckCircle2 className="h-12 w-12 text-[#004B87] opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificados</p>
                <h3 className="text-3xl font-bold text-[#004B87] mt-1">
                  {attendanceHistory.filter((a) => a.certificate).length}
                </h3>
              </div>
              <Download className="h-12 w-12 text-[#004B87] opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Asistencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-center">Horas</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Certificado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.eventName}</TableCell>
                    <TableCell>{record.tutor}</TableCell>
                    <TableCell>
                      <div className="text-sm">{record.date}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {record.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-[#004B87]" />
                        {record.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-[#004B87] text-[#004B87]">
                        {record.hours}h
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {record.status === "validated" ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Validado
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">
                          <Clock className="mr-1 h-3 w-3" />
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.certificate ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadCertificate(record.eventName)}
                          className="text-[#004B87] hover:text-[#003366] hover:bg-[#F4F6F8]"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
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
