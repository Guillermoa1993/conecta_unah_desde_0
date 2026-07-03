import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  GraduationCap,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  EVENTS,
  CATEGORY_LABEL_LONG,
  getConstanciaByVerificationCode,
  type Constancia,
} from "@/lib/mock-data";

export const Route = createFileRoute("/verificar")({
  head: () => ({
    meta: [
      { title: "Verificar Constancia — Conecta Pumas" },
      { name: "description", content: "Verificación de constancias del Artículo 140 · UNAH" },
    ],
  }),
  component: VerificarPage,
});

function VerificarPage() {
  const [codigo, setCodigo] = useState("");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("codigo") || "";
    setCodigo(c);
    setInputValue(c);
  }, []);

  const constancia:
    | (Constancia & { evento_titulo?: string; estudiante_nombre?: string; horas?: number })
    | undefined = codigo
    ? getConstanciaByVerificationCode(codigo) ||
      JSON.parse(localStorage.getItem("conecta_constancias") || "[]").find(
        (c: any) => c.id === codigo,
      )
    : undefined;

  const evento = constancia ? EVENTS.find((e) => e.id === constancia.actividad_id) : undefined;

  const verified = constancia?.estado === "VERIFICADA";

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <header
        className="border-b bg-white/80 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-[var(--puma-dark)] grid place-items-center">
            <GraduationCap className="size-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Conecta Pumas · Verificación</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-12 pb-16">
        <div className="w-full max-w-md space-y-5">
          <div className="bg-white rounded-2xl shadow-lg border p-6 text-center">
            <div className="size-16 mx-auto rounded-full bg-[var(--puma-dark)]/10 grid place-items-center mb-4">
              <ShieldCheck className="size-8 text-[var(--puma-dark)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--puma-dark)]">Verificar Constancia</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingrese el código de verificación de la constancia
            </p>

            <div className="mt-6 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ej: const-001"
                className="flex-1 h-11 px-4 rounded-xl border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--puma-dark)]/20 focus:border-[var(--puma-dark)] transition"
                onKeyDown={(e) => e.key === "Enter" && setCodigo(inputValue)}
              />
              <button
                onClick={() => setCodigo(inputValue)}
                className="h-11 px-5 rounded-xl bg-[var(--puma-dark)] text-white text-sm font-medium hover:bg-[#002244] transition inline-flex items-center gap-2"
              >
                <Search className="size-4" /> Buscar
              </button>
            </div>
          </div>

          {codigo && !constancia && (
            <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
              <div className="size-16 mx-auto rounded-full bg-red-50 grid place-items-center mb-4">
                <XCircle className="size-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-red-600">No encontrada</h2>
              <p className="text-sm text-muted-foreground mt-2">
                No se encontró ninguna constancia con el código <strong>{codigo}</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Verifique que el código sea correcto o escanee nuevamente el código QR.
              </p>
            </div>
          )}

          {constancia && (
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              <div className={`p-6 text-center ${verified ? "bg-green-50" : "bg-red-50"}`}>
                <div
                  className={`size-16 mx-auto rounded-full grid place-items-center mb-3 ${verified ? "bg-green-100" : "bg-red-100"}`}
                >
                  {verified ? (
                    <CheckCircle2 className="size-8 text-green-600" />
                  ) : (
                    <XCircle className="size-8 text-red-500" />
                  )}
                </div>
                <h2 className={`text-xl font-bold ${verified ? "text-green-700" : "text-red-600"}`}>
                  {verified ? "Constancia Verificada" : "No Verificada"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {verified
                    ? "Esta constancia ha sido validada por la VOAE."
                    : "Esta constancia aún no ha sido validada por la VOAE."}
                </p>
              </div>

              <div className="p-6 space-y-3 text-sm border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código</span>
                  <span className="font-mono font-medium">{constancia.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span className={`font-medium ${verified ? "text-green-600" : "text-red-500"}`}>
                    {constancia.estado}
                  </span>
                </div>
                {evento && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Evento</span>
                      <span className="font-medium text-right max-w-[200px]">{evento.titulo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoría</span>
                      <span className="font-medium">{CATEGORY_LABEL_LONG[evento.categoria]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tutor</span>
                      <span className="font-medium">{evento.tutor_nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="font-medium">{evento.fecha_inicio.slice(0, 10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duración</span>
                      <span className="font-medium">{evento.duracion_horas} horas</span>
                    </div>
                  </>
                )}
                {!evento && constancia.evento_titulo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evento</span>
                    <span className="font-medium text-right max-w-[200px]">
                      {constancia.evento_titulo}
                    </span>
                  </div>
                )}
                {constancia.estudiante_nombre && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estudiante</span>
                    <span className="font-medium text-right max-w-[200px]">
                      {constancia.estudiante_nombre}
                    </span>
                  </div>
                )}
                {constancia.horas !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas</span>
                    <span className="font-medium">{constancia.horas} horas</span>
                  </div>
                )}
                {constancia.verificado_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verificado el</span>
                    <span className="font-medium">
                      {new Date(constancia.verificado_at).toLocaleDateString("es-HN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-[var(--puma-dark)] transition underline underline-offset-2"
            >
              Volver a Conecta Pumas
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
