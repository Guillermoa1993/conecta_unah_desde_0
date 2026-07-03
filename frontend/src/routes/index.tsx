import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  ShieldCheck,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Download,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conecta Pumas — Módulo de Eventos" },
      {
        name: "description",
        content:
          "Plataforma oficial de gestión y validación digital de actividades académicas del artículo 140.",
      },
      { property: "og:title", content: "Conecta Pumas — Módulo de Eventos" },
      {
        property: "og:description",
        content: "Plataforma oficial de gestión y validación digital de actividades académicas.",
      },
    ],
  }),
  component: Landing,
});

const ROLES = [
  {
    to: "/empleado",
    label: "Empleado",
    icon: BookOpen,
    desc: "Crea y gestiona actividades académicas",
  },
  {
    to: "/voae",
    label: "Personal VOAE",
    icon: ShieldCheck,
    desc: "Audita y valida actividades oficiales",
  },
];

function Landing() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {installPrompt && !dismissed && (
        <div
          className="sticky top-0 z-50 bg-[var(--puma-blue)] text-white px-4 py-3 flex items-center justify-between gap-3 text-sm"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <span className="font-medium">Instala Conecta Pumas en tu dispositivo</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-[var(--puma-blue)] font-semibold text-xs hover:bg-gray-100 transition"
            >
              <Download className="size-3.5" /> Instalar
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg gradient-primary grid place-items-center">
              <GraduationCap className="size-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">Conecta Pumas</div>
              <div className="text-[11px] text-muted-foreground">Módulo de Eventos · Art. 140</div>
            </div>
          </div>
          <Link to="/tutor" className="text-sm font-medium text-primary hover:underline">
            Ingresar →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/30 text-xs font-medium mb-6">
            <span className="size-1.5 rounded-full bg-gold" />
            Plataforma institucional · UNAH
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Gestión y validación digital de{" "}
            <span className="text-primary">actividades académicas</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground">
            Conecta Pumas unifica la creación, asistencia, validación y auditoría de eventos
            relacionados con el artículo 140 universitario, en una experiencia moderna, móvil y
            accesible.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/tutor"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg gradient-primary text-primary-foreground font-medium shadow-card hover:shadow-elevated transition"
            >
              Explorar plataforma <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/voae"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border bg-card font-medium hover:bg-secondary transition"
            >
              Panel de auditoría
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {["QR dinámico", "Validación VOAE", "Reportes PDF", "PWA móvil"].map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-success" /> {f}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-center mb-6">
            Ingresar como
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="group rounded-xl border bg-card p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all"
              >
                <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4 group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
                  <r.icon className="size-5" />
                </div>
                <div className="font-semibold">{r.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                <div className="mt-4 text-xs text-primary font-medium inline-flex items-center gap-1">
                  Entrar <ArrowRight className="size-3 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 Universidad Nacional Autónoma · Conecta Pumas
      </footer>
    </div>
  );
}
