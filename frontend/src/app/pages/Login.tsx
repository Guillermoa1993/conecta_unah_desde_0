import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Mail, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import logoUnah from "../../imports/logoUnah.png";
import logoIA from "../../imports/logoIA.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2;
type Role = "student" | "tutor" | "admin" | "voae" | "dev";

const ROLE_PATHS: Record<Role, string> = {
  student: "/student/feed",
  tutor:   "/tutor",
  admin:   "/admin",
  voae:    "/voae",
  dev:     "/student/feed",
};

const DOMAINS = [
  { value: "@unah.hn",     label: "@unah.hn (Estudiante)" },
  { value: "@unah.edu.hn", label: "@unah.edu.hn (Personal / Empleado)" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function deriveRole(correo: string): Role {
  const local = correo.split("@")[0].toLowerCase();
  if (local.startsWith("dev"))            return "dev";
  if (local.startsWith("admin"))          return "admin";
  if (local.startsWith("voae"))           return "voae";
  if (correo.endsWith("@unah.edu.hn"))    return "tutor";
  return "student";
}

function isValidDomain(correo: string): boolean {
  return correo.endsWith("@unah.hn") || correo.endsWith("@unah.edu.hn");
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
  );
}

// ─── Brand Panel ─────────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="md:col-span-6 bg-gradient-to-br from-[#004B87] via-[#003366] to-[#004B87] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-[#FFD100]/10 blur-2xl pointer-events-none" />

      {/* Logo badge */}
      <div className="flex items-center gap-3 z-10">
        <div className="h-10 w-10 bg-[#FFD100] text-[#003366] font-black rounded-lg flex items-center justify-center text-lg shadow-lg">
          UE
        </div>
        <div>
          <div className="font-bold text-base tracking-wide">UNAH Eventos</div>
          <div className="text-[10px] text-white/60 tracking-widest uppercase">Sistema Universitario</div>
        </div>
      </div>

      {/* Mascot */}
      <div className="flex flex-col items-center justify-center my-8 z-10">
        <div className="relative flex items-center justify-center">
          <div className="absolute bottom-0 w-40 h-10 bg-[#FFD100]/20 blur-xl rounded-full" />
          <img
            src="/puma_final.png"
            alt="Mascota UNAH"
            className="hover:scale-105 transition-transform duration-300 relative"
            style={{ width: 220, objectFit: "contain", filter: "drop-shadow(0 0 18px rgba(255,209,0,0.35))" }}
          />
        </div>
        <h1 className="text-3xl font-extrabold text-center mt-6">
          Conecta <span className="text-[#FFD100]">Pumas</span>
        </h1>
        <p className="text-white/80 text-sm text-center max-w-xs mt-2 leading-relaxed">
          Gestión digital de eventos universitarios y validación del Artículo 140.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 z-10">
        <div className="text-center flex flex-col items-center justify-center">
          <div className="text-[#FFD100] text-base font-black leading-tight">Artículo</div>
          <div className="text-sm text-white font-bold uppercase tracking-wider">140</div>
        </div>
        <div className="flex flex-col items-center justify-center border-x border-white/10 px-1">
          <img
            src={logoIA}
            alt="Carrera de Informática Administrativa"
            className="h-12 w-12 rounded-full object-cover border-2 border-[#FFD100]/40 shadow-lg"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,209,0,0.3))" }}
          />
        </div>
        <div className="flex flex-col items-center justify-center px-1">
          <img
            src={logoUnah}
            alt="UNAH"
            className="h-12 w-auto object-contain"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,209,0,0.25))" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Email + Domain ───────────────────────────────────────────────────
interface EmailStepProps {
  username:        string;
  domain:          string;
  isLoading:       boolean;
  onUsername:      (v: string) => void;
  onDomain:        (v: string) => void;
  onSubmit:        (e: React.FormEvent<HTMLFormElement>) => void;
}

function EmailStep({ username, domain, isLoading, onUsername, onDomain, onSubmit }: EmailStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">
          Usuario Institucional
        </label>
        <div className="flex gap-2">
          <div className="relative flex-[3] min-w-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="h-5 w-5" />
            </span>
            <Input
              type="text"
              required
              placeholder="ej. juan.perez"
              value={username}
              onChange={(e) => onUsername(e.target.value)}
              className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#FFD100] text-[#003366] font-medium"
            />
          </div>
          <select
            value={domain}
            onChange={(e) => onDomain(e.target.value)}
            className="h-12 px-2 rounded-xl bg-slate-50 border border-slate-200 text-[#003366] text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100] font-bold flex-[2] min-w-0"
          >
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <span className="text-[11px] text-slate-400 block leading-tight">
          * Escribe tu usuario y selecciona tu dominio institucional.
        </span>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-[#004B87] hover:bg-[#003366] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#004B87]/20 flex items-center justify-center gap-2"
      >
        {isLoading ? <Spinner /> : (
          <>
            <span>Solicitar Código de Acceso</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────
interface OtpStepProps {
  correo:    string;
  otp:       string;
  isLoading: boolean;
  onOtp:     (v: string) => void;
  onBack:    () => void;
  onSubmit:  (e: React.FormEvent<HTMLFormElement>) => void;
}

function OtpStep({ correo, otp, isLoading, onOtp, onBack, onSubmit }: OtpStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-widest block">
            Código de Seguridad (OTP)
          </label>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-[#004B87] hover:underline font-semibold"
          >
            Cambiar correo
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <KeyRound className="h-5 w-5" />
          </span>
          <Input
            type="text"
            required
            maxLength={6}
            pattern="\d{6}"
            placeholder="000000"
            value={otp}
            onChange={(e) => onOtp(e.target.value.replace(/\D/g, ""))}
            className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#FFD100] text-[#003366] font-bold tracking-[0.4em] text-lg text-center"
          />
        </div>
        <p className="text-xs text-slate-500 leading-normal">
          Se envió un código de 6 dígitos a <strong>{correo}</strong>.{" "}
          Revisa tu bandeja de entrada o spam.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-[#004B87] hover:bg-[#003366] text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-[#004B87]/20 flex items-center justify-center gap-2"
      >
        {isLoading ? <Spinner /> : (
          <>
            <span>Verificar e Ingresar</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    const active = sessionStorage.getItem("unah_session_active");
    const role   = sessionStorage.getItem("unah_role") as Role | null;
    if (active === "true" && role && role in ROLE_PATHS) {
      navigate(ROLE_PATHS[role], { replace: true });
    }
  }, [navigate]);

  const [step,     setStep]     = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [domain,   setDomain]   = useState("@unah.hn");
  const [otp,      setOtp]      = useState("");
  const [loading,  setLoading]  = useState(false);

  // Pre-fill email from enrollment redirect
  useEffect(() => {
    const state = location.state as { email?: string } | null;
    if (state?.email) {
      const email = state.email;
      const atIndex = email.indexOf("@");
      if (atIndex > 0) {
        setUsername(email.substring(0, atIndex));
        const dom = email.substring(atIndex);
        if (dom === "@unah.hn" || dom === "@unah.edu.hn") {
          setDomain(dom);
        }
      }
    }
  }, [location.state]);

  const correo = `${username.trim()}${domain}`;

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Por favor ingresa tu nombre de usuario.");
      return;
    }
    if (!isValidDomain(correo)) {
      toast.error("Por favor, ingresa un correo institucional válido.");
      return;
    }
    setLoading(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success(`Código de seguridad enviado a: ${correo}`);
    setStep(2);
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("El código debe ser exactamente de 6 dígitos.");
      return;
    }
    setLoading(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    setLoading(false);

    const role     = deriveRole(correo);
    const userType = correo.endsWith("@unah.edu.hn") ? "empleado" : "estudiante";
    const path     = ROLE_PATHS[role];

    sessionStorage.setItem("unah_session_active", "true");
    sessionStorage.setItem("unah_session_role",   path);
    sessionStorage.setItem("unah_user_type",      userType);
    sessionStorage.setItem("unah_role",           role);

    toast.success("¡Inicio de sesión exitoso!");
    navigate(path, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Two-column card */}
      <div className="w-full max-w-5xl overflow-hidden shadow-2xl rounded-2xl grid grid-cols-1 md:grid-cols-12 min-h-[600px]">

        <BrandPanel />

        {/* Right panel: form */}
        <div className="md:col-span-6 bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">

            <div>
              <h2 className="text-3xl font-extrabold text-[#003366]">Iniciar Sesión</h2>
              <p className="text-sm text-slate-500 mt-2">
                Acceso seguro mediante tu correo institucional UNAH.
              </p>
            </div>

            {step === 1 ? (
              <EmailStep
                username={username}
                domain={domain}
                isLoading={loading}
                onUsername={setUsername}
                onDomain={setDomain}
                onSubmit={handleSendOtp}
              />
            ) : (
              <OtpStep
                correo={correo}
                otp={otp}
                isLoading={loading}
                onOtp={setOtp}
                onBack={() => setStep(1)}
                onSubmit={handleVerifyOtp}
              />
            )}

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
      </div>
    </div>
  );
}
