import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Download, Clock, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const monthlyData = [
  { month: "Enero", eventos: 4, asistentes: 85, horas: 12 },
  { month: "Febrero", eventos: 6, asistentes: 142, horas: 18 },
  { month: "Marzo", eventos: 5, asistentes: 118, horas: 15 },
  { month: "Abril", eventos: 7, asistentes: 167, horas: 21 },
  { month: "Mayo", eventos: 8, asistentes: 189, horas: 24 },
];

const categoryData = [
  { name: "Desarrollo de Software", value: 35 },
  { name: "IA y Machine Learning", value: 25 },
  { name: "Diseño", value: 20 },
  { name: "Tecnología", value: 12 },
  { name: "Desarrollo Personal", value: 8 },
];

const COLORS = ["#004B87", "#FFD100", "#003366", "#0066CC", "#FFE766"];

export function TutorReports() {
  const handleDownloadReport = () => {
    toast.success("Generando reporte en PDF...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground mt-1">
            Análisis de tu desempeño como tutor
          </p>
        </div>
        <Button
          onClick={handleDownloadReport}
          className="bg-[#004B87] hover:bg-[#003366]"
        >
          <Download className="mr-2 h-5 w-5" />
          Descargar Reporte
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total de Eventos</p>
            <h3 className="text-3xl font-bold text-[#004B87] mt-1">30</h3>
            <p className="text-xs text-green-600 mt-1">+15% vs semestre anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total de Asistentes</p>
            <h3 className="text-3xl font-bold text-[#004B87] mt-1">701</h3>
            <p className="text-xs text-green-600 mt-1">+22% vs semestre anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Horas Impartidas</p>
            <h3 className="text-3xl font-bold text-[#004B87] mt-1">90</h3>
            <p className="text-xs text-green-600 mt-1">+18% vs semestre anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Promedio Satisfacción</p>
            <h3 className="text-3xl font-bold text-[#004B87] mt-1">4.7/5</h3>
            <p className="text-xs text-green-600 mt-1">+0.3 vs semestre anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Mensual de Eventos y Asistentes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="eventos"
                stroke="#004B87"
                strokeWidth={2}
                name="Eventos"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="asistentes"
                stroke="#FFD100"
                strokeWidth={2}
                name="Asistentes"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Horas Impartidas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="horas" fill="#004B87" name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Events by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Más Exitosos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: "Taller de React", date: "2026-05-20", time: "10:00 AM", location: "Aula 301, Edificio Principal", attendees: 45, rating: 4.9 },
              { title: "Curso de Python", date: "2026-05-18", time: "2:00 PM", location: "Lab de Cómputo 5", attendees: 42, rating: 4.8 },
              { title: "Workshop de ML", date: "2026-05-15", time: "4:00 PM", location: "Sala de Conferencias B", attendees: 38, rating: 4.7 },
              { title: "Seminario de Blockchain", date: "2026-05-10", time: "11:00 AM", location: "Lab de Cómputo 3", attendees: 35, rating: 4.6 },
              { title: "Taller de UX/UI", date: "2026-05-05", time: "3:00 PM", location: "Sala de Diseño A-12", attendees: 32, rating: 4.5 },
            ].map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{event.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.date} • {event.time}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-[#004B87]" />
                      {event.location}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{event.attendees} asistentes</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#FFD100]">⭐ {event.rating}</p>
                  <p className="text-xs text-muted-foreground">Calificación</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
