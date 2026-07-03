import { useState, useRef, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAttendance } from "@/lib/event-store";
import { toast } from "sonner";

type OtpModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  studentId: string;
  ubicacionValidada?: boolean | null;
  attendanceMode?: "asistencia" | "salida";
  mode?: "tutor_code" | "email_otp";
  onModeChange?: (mode: "tutor_code" | "email_otp") => void;
  onSuccess?: (mode: "asistencia" | "salida") => void;
};

export function OtpModal({
  open,
  onClose,
  eventId,
  studentId,
  ubicacionValidada,
  attendanceMode = "asistencia",
  mode: authMode = "tutor_code",
  onModeChange,
  onSuccess,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [internalMode, setInternalMode] = useState<"tutor_code" | "email_otp">(authMode);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [countdown, setCountdown] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (open) {
      setDigits(["", "", "", "", "", ""]);
      setError("");
      setSuccess(false);
      setInternalMode(authMode);
      setEmailOtpCode("");
      setCountdown(300);
      setTimeout(() => refs.current[0]?.focus(), 100);
    }
  }, [open, authMode]);

  useEffect(() => {
    if (internalMode !== "email_otp" || !open) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [internalMode, open]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError("");
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (text.length === 6) refs.current[5]?.focus();
  };

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Ingresa el código completo de 6 dígitos");
      return;
    }

    if (internalMode === "email_otp") {
      if (code !== emailOtpCode) {
        setError("Código incorrecto, intenta de nuevo.");
        setDigits(["", "", "", "", "", ""]);
        refs.current[0]?.focus();
        return;
      }
      setSuccess(true);
      toast.success("¡Asistencia registrada exitosamente!", {
        style: { backgroundColor: "#22c55e", color: "white" },
      });
      onSuccess?.(attendanceMode);
      setTimeout(onClose, 1200);
      return;
    }

    const result = markAttendance(eventId, studentId, code);
    if (result === "ok") {
      setSuccess(true);
      toast.success("¡Asistencia registrada exitosamente!", {
        style: { backgroundColor: "#22c55e", color: "white" },
      });
      onSuccess?.(attendanceMode);
      setTimeout(onClose, 1200);
    } else if (result === "already") {
      setError("Ya registraste tu asistencia para este evento.");
    } else {
      setError("Código incorrecto, intenta de nuevo.");
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    }
  };

  const handleSwitchToEmailOtp = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setEmailOtpCode(newCode);
    setInternalMode("email_otp");
    onModeChange?.("email_otp");
    setCountdown(300);
    setDigits(["", "", "", "", "", ""]);
    setError("");
    setTimeout(() => refs.current[0]?.focus(), 100);
  };

  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setEmailOtpCode(newCode);
    setCountdown(300);
    setDigits(["", "", "", "", "", ""]);
    setError("");
    setTimeout(() => refs.current[0]?.focus(), 100);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card p-6 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 size-7 rounded-full grid place-items-center hover:bg-red-50 transition"
          style={{ color: "#ef4444" }}
        >
          <X className="size-5" />
        </button>

        {success ? (
          <div className="py-8">
            <div
              className="size-16 mx-auto rounded-full grid place-items-center"
              style={{ backgroundColor: "#22c55e20" }}
            >
              <CheckCircle2 className="size-8" style={{ color: "#22c55e" }} />
            </div>
            <p className="text-lg font-semibold mt-4" style={{ color: "#22c55e" }}>
              ¡Asistencia registrada exitosamente!
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold mt-1" style={{ color: "var(--puma-dark)" }}>
              {attendanceMode === "salida" ? "Registrar Salida" : "Marcar Asistencia"}
            </h2>
            {internalMode === "tutor_code" ? (
              <p className="text-sm text-muted-foreground mt-1">Token de asistencia</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">
                Te enviamos un código a tu correo institucional. Revisa tu bandeja de entrada.
              </p>
            )}

            {ubicacionValidada === false && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg mt-4 text-sm text-left"
                style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
              >
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  Ubicación fuera del rango permitido. La asistencia se marcará con advertencia.
                </span>
              </div>
            )}

            {internalMode === "email_otp" && (
              <div className="mt-4 text-lg font-semibold" style={{ color: "var(--puma-blue)" }}>
                {formatTime(countdown)}
              </div>
            )}

            <div className="flex justify-center gap-2.5 mt-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="size-12 rounded-xl border-2 text-center text-2xl font-bold outline-none transition-all"
                  style={{
                    borderColor: error ? "#ef4444" : d ? "var(--puma-blue)" : "#e2e8f0",
                    caretColor: "var(--puma-blue)",
                  }}
                />
              ))}
            </div>

            {error && (
              <div
                className="flex items-center justify-center gap-1.5 mt-3 text-sm"
                style={{ color: "#ef4444" }}
              >
                <AlertCircle className="size-4" /> {error}
              </div>
            )}

            <Button
              className="w-full mt-6 text-white gap-1.5 h-12 text-base"
              style={{ backgroundColor: "#22c55e" }}
              onClick={handleSubmit}
            >
              <CheckCircle2 className="size-5" />{" "}
              {attendanceMode === "salida" ? "Registrar salida" : "Marcar asistencia"}
            </Button>

            {internalMode === "email_otp" && (
              <button
                onClick={handleResendCode}
                disabled={countdown > 240}
                className={`mt-3 text-sm underline ${countdown > 240 ? "text-muted-foreground cursor-not-allowed" : "text-[var(--puma-blue)] cursor-pointer"}`}
              >
                Reenviar código
              </button>
            )}

            {internalMode === "tutor_code" && (
              <button
                onClick={handleSwitchToEmailOtp}
                className="mt-3 text-sm text-[var(--puma-blue)] underline"
              >
                ¿No puedes usar el código del tutor? Recibe un código por correo
              </button>
            )}

            <Button
              variant="outline"
              className="w-full mt-3 gap-1.5"
              style={{ borderColor: "#ef4444", color: "#ef4444" }}
              onClick={onClose}
            >
              Cerrar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
