import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mail, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import logoVoae from "../../imports/image.png";
import logoUnah from "../../imports/logoUnah.png";
import logoIA from "../../imports/logoIA.png";



export function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const sessionActive = sessionStorage.getItem("unah_session_active");
    const role = sessionStorage.getItem("unah_role");
    if (sessionActive === "true" && role) {
      const path = { student:"/student/feed", tutor:"/tutor", admin:"/admin", voae:"/voae" }[role] ?? "/student/feed";
      navigate(path, { replace: true });
    }
  }, [navigate]);
  const [step, setStep] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState("");
  const [codigoOtp, setCodigoOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const esEstudiante = correo.endsWith("@unah.hn");
    const esDocenteEmpleado = correo.endsWith("@unah.edu.hn");

    if (!esEstudiante && !esDocenteEmpleado) {
      toast.error(
        "Por favor, ingresa un correo institucional válido (@unah.hn para estudiantes o @unah.edu.hn para personal)."
      );
      return;
    }

    setIsLoading(true);
    // Simular envío de código por 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    toast.success(`Código de seguridad enviado a: ${correo}`);
    setStep(2);
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoOtp.length !== 6) {
      toast.error("El código debe ser exactamente de 6 dígitos.");
      return;
    }

    setIsLoading(true);
    // Simular validación
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);

    // Derivar rol según dominio — en producción vendrá del backend
    const isEmpleado = correo.endsWith("@unah.edu.hn");
    const localPart  = correo.split("@")[0].toLowerCase();
    const role = localPart.startsWith("dev")   ? "dev"
               : localPart.startsWith("admin") ? "admin"
               : localPart.startsWith("voae")  ? "voae"
               : isEmpleado                    ? "tutor"
               :                                 "student";
    const userType = isEmpleado ? "empleado" : "estudiante";
    const path = { student:"/student/feed", tutor:"/tutor", admin:"/admin", voae:"/voae" }[role]!;

    toast.success("¡Inicio de sesión exitoso!");
    sessionStorage.setItem("unah_session_active", "true");
    sessionStorage.setItem("unah_session_role", path);
    sessionStorage.setItem("unah_user_type", userType);
    sessionStorage.setItem("unah_role", role);
    navigate(path, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <Card className="w-full max-w-5xl overflow-hidden shadow-2xl rounded-2xl border-none grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Panel Izquierdo: Branding & Info */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#004B87] via-[#003366] to-[#004B87] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute top-[-10%] left-[-10%] w-[300px] height-[300px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[250px] height-[250px] rounded-full bg-[#FFD100]/10 blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 z-10">
            <div className="h-10 w-10 bg-[#FFD100] text-[#003366] font-black rounded-lg flex items-center justify-center text-lg shadow-lg">
              UE
            </div>
            <div>
              <div className="font-bold text-base tracking-wide">UNAH Eventos</div>
              <div className="text-[10px] text-white/60 tracking-widest uppercase">
                Sistema Universitario
              </div>
            </div>
          </div>

          {/* Center Mascot & Info */}
          <div className="flex flex-col items-center justify-center my-8 z-10">
            <div className="relative group flex items-center justify-center">
              <div className="absolute bottom-0 w-40 h-10 bg-[#FFD100]/20 blur-xl rounded-full" />
              <img
                src="/puma_final.png"
                alt="Mascota UNAH"
                className="group-hover:scale-105 transition-transform duration-300"
                style={{
                  width: "220px",
                  height: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 18px rgba(255,209,0,0.35))",
                  position: "relative",
                }}
              />
            </div>
            <h1 className="text-3xl font-extrabold text-center mt-6">
              Conecta <span className="text-[#FFD100]">Pumas</span>
            </h1>
            <p className="text-white/80 text-sm text-center max-w-xs mt-2 leading-relaxed">
              Gestión digital de eventos universitarios y validación del Artículo 140.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 z-10">
            {/* Artículo 140 */}
            <div className="text-center flex flex-col items-center justify-center">
              <div className="text-[#FFD100] text-base font-black leading-tight">Artículo</div>
              <div className="text-sm text-white font-bold uppercase tracking-wider">140</div>
            </div>
            {/* Logo Informática Administrativa - circular */}
            <div className="flex flex-col items-center justify-center border-x border-white/10 px-1">
              <img
                src={logoIA}
                alt="Carrera de Informática Administrativa"
                className="h-12 w-12 rounded-full object-cover border-2 border-[#FFD100]/40 shadow-lg"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,209,0,0.3))' }}
              />
            </div>
            {/* UNAH Logo */}
            <div className="flex flex-col items-center justify-center px-1">
              <img
                src={logoUnah}
                alt="UNAH Campus Logo"
                className="h-12 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,209,0,0.25))' }}
              />
            </div>
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="md:col-span-6 bg-white p-8 md:p-12 flex flex-col justify-center relative">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-[#003366]">Iniciar Sesión</h2>
              <p className="text-sm text-slate-500 mt-2">
                Acceso seguro a la plataforma mediante tu correo institucional.
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleEnviarCodigo} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">
                    Correo Institucional
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail className="h-5 w-5" />
                    </span>
                    <Input
                      type="email"
                      required
                      placeholder="nombre.apellido@unah.edu.hn"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#FFD100] text-[#003366] font-medium"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    * Estudiantes: @unah.hn • Personal/Tutor: @unah.edu.hn
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#004B87] hover:bg-[#003366] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#004B87]/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Solicitar Código de Acceso
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerificarCodigo} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">
                      Código de Seguridad (OTP)
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-[#004B87] hover:underline font-semibold"
                    >
                      Cambiar correo
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    <Input
                      type="text"
                      required
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="000000"
                      value={codigoOtp}
                      onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, ""))}
                      className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#FFD100] text-[#003366] font-bold tracking-[0.4em] text-lg text-center"
                    />
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Se ha enviado un código de 6 dígitos al correo <strong>{correo}</strong>.
                    Por favor revisa tu bandeja de entrada o spam.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#004B87] hover:bg-[#003366] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#004B87]/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verificar e Ingresar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Registrar Cuenta Alternativo */}
            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">¿Eres nuevo en el sistema?</p>
              <button
                type="button"
                onClick={() => navigate("/registro")}
                className="text-xs text-[#004B87] hover:text-[#003366] font-bold mt-1 transition-colors"
              >
                Registrar nueva cuenta →
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-300">
              © 2026 UNAH – IA-119 Programación e Implementación de Sistemas
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}
