import { useNavigate } from "react-router";
import { ArrowLeft, User, GraduationCap, Briefcase } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function RegistroSelector() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 md:p-8 font-sans relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 75, 135, 0.85), rgba(0, 51, 102, 0.9)), url('/edificio_unah.jpg')`,
        backgroundBlendMode: 'multiply'
      }}
    >
      {/* Decorative Blur Circles */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#FFD100]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 z-10 text-center">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Crear cuenta en Conecta Pumas
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-md mx-auto">
            Para registrarte, selecciona una de las siguientes opciones
          </p>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Estudiante Card */}
          <Card
            onClick={() => navigate("/registro/estudiante")}
            className="bg-white/10 backdrop-blur-md border border-white/20 hover:border-[#FFD100] text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl rounded-2xl group overflow-hidden flex flex-col justify-center min-h-[300px]"
          >
            <CardContent className="p-8 flex flex-col items-center justify-center h-full space-y-6">
              <div className="space-y-1 text-center">
                <h3 className="text-2xl font-bold tracking-wide group-hover:text-[#FFD100] transition-colors">
                  Estudiante
                </h3>
                <p className="text-xs text-white/70">
                  Acceso para estudiantes (@unah.hn)
                </p>
              </div>

              <div className="w-36 h-36 flex items-center justify-center bg-white/5 rounded-full p-2 border border-white/10 group-hover:bg-white/15 transition-all group-hover:scale-110">
                <img
                  src="/puma_estudiante.png"
                  alt="Estudiante UNAH"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Docente Card */}
          <Card
            onClick={() => navigate("/registro/empleado")}
            className="bg-white/10 backdrop-blur-md border border-white/20 hover:border-[#FFD100] text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl rounded-2xl group overflow-hidden flex flex-col justify-center min-h-[300px]"
          >
            <CardContent className="p-8 flex flex-col items-center justify-center h-full space-y-6">
              <div className="space-y-1 text-center">
                <h3 className="text-2xl font-bold tracking-wide group-hover:text-[#FFD100] transition-colors">
                  Docente / Empleado
                </h3>
                <p className="text-xs text-white/70">
                  Acceso para empleados y docentes (@unah.edu.hn)
                </p>
              </div>

              <div className="w-36 h-36 flex items-center justify-center bg-white/5 rounded-full p-2 border border-white/10 group-hover:bg-white/15 transition-all group-hover:scale-110">
                <img
                  src="/puma_docente.png"
                  alt="Docente UNAH"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-4 pt-4">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio de Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
