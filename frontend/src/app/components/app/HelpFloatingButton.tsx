import { useState } from "react";
import { useLocation } from "react-router";
import {
  HelpCircle, X, CheckCircle2, Sparkles, AlertCircle, Clock, ChevronRight
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../../lib/utils";

type HelpContext = "eventos" | "voae" | "coordinacion";

interface HelpFloatingButtonProps {
  context?: HelpContext;
}

export function HelpFloatingButton({ context }: HelpFloatingButtonProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pasos" | "estados" | "faq">("pasos");

  // Determinar contexto por prop o por ruta activa
  const activeContext: HelpContext = context || (
    location.pathname.startsWith("/voae-depto") ? "coordinacion" :
    location.pathname.startsWith("/voae") ? "voae" : "eventos"
  );

  const getGuideData = () => {
    switch (activeContext) {
      case "voae":
        return {
          title: "Guía del Panel de Gestión VOAE",
          subtitle: "Validación universal de propuestas con horas y auditoría de acreditaciones",
          badge: "Dirección VOAE",
          steps: [
            {
              title: "1. Eventos Pendientes de Aprobación",
              desc: "Aquí recibes de forma universal todas las propuestas con Horas VOAE aprobadas previamente por los Departamentos académicos."
            },
            {
              title: "2. Validar Propuesta de Evento",
              desc: "Presiona 'Validar propuesta' para auditar los detalles, cupo, horarios y distribución de horas por ámbito (Cultural, Deportivo, Académico, Social)."
            },
            {
              title: "3. Auditoría de Eventos Finalizados",
              desc: "En esta sección auditas los eventos concluidos con lista de asistencia verificada para emitir y descargar el Reporte de Cumplimiento en PDF."
            }
          ],
          states: [
            { label: "Pendiente VOAE", tone: "bg-amber-100 text-amber-800 border-amber-300", desc: "Aprobado por el departamento, esperando validación de Dirección VOAE." },
            { label: "Programado / En curso", tone: "bg-blue-100 text-blue-800 border-blue-300", desc: "Aprobado por VOAE y publicado oficialmente para toda la UNAH." },
            { label: "Auditoría / Finalizado", tone: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "Evento concluido listo para descarga de reporte oficial de horas." }
          ],
          faqs: [
            { q: "¿Por qué veo solicitudes de distintas carreras?", a: "Dirección VOAE tiene visión universal de todas las facultades tras la aprobación inicial del Departamento." },
            { q: "¿Dónde descargo los certificados de horas?", a: "En la sección 'Auditoría de eventos finalizados', presiona 'Ver validaciones' y descarga el PDF firmado." }
          ]
        };

      case "coordinacion":
        return {
          title: "Guía del Panel de Gestión Coordinación",
          subtitle: "Revisión inicial y filtro de propuestas enviadas en tu carrera o facultad",
          badge: "Coordinación de Departamento",
          steps: [
            {
              title: "1. Solicitudes por Carrera / Facultad",
              desc: "Recibes automáticamente las propuestas enviadas por estudiantes o personal pertenecientes exclusivamente a tu carrera o facultad."
            },
            {
              title: "2. Evaluar Propuesta Académica",
              desc: "Verifica que el lugar, cupo, fechas y horas solicitadas cumplan con el reglamento del Artículo 140 de la UNAH."
            },
            {
              title: "3. Aprobación y Pase a Dirección VOAE",
              desc: "Si apruebas un evento Recreativo, se publica al instante. Si apruebas un evento con Horas VOAE, avanza a la revisión de Dirección VOAE."
            }
          ],
          states: [
            { label: "Pendiente Depto", tone: "bg-amber-100 text-amber-800 border-amber-300", desc: "Solicitud nueva recibida esperando tu revisión como Coordinador." },
            { label: "Aprobado Depto", tone: "bg-indigo-100 text-indigo-800 border-indigo-300", desc: "Aprobado por tu departamento y transferido a Dirección VOAE." },
            { label: "Rechazado", tone: "bg-red-100 text-red-800 border-red-300", desc: "Solicitud devuelta al solicitante indicando el motivo de corrección." }
          ],
          faqs: [
            { q: "¿Solo veo eventos de mi facultad?", a: "Sí, el sistema filtra de forma automática los eventos para que sólo atiendas las solicitudes de tu coordinación." },
            { q: "¿Puedo proponer mis propios eventos?", a: "¡Sí! En la pestaña 'Mi Gestión de eventos' del menú lateral puedes crear tus propias propuestas." }
          ]
        };

      case "eventos":
      default:
        return {
          title: "Guía de Gestión de Mis Eventos",
          subtitle: "Crea, administra y da seguimiento a tus propuestas de eventos en Conecta Pumas",
          badge: "Organizador de Eventos",
          steps: [
            {
              title: "1. Crear Propuesta de Evento",
              desc: "Haz clic en '+ Crear propuesta de evento' y completa el formulario de 4 pasos (Información, Ubicación con mapa interactivo, Portada IA/Dispositivo y Revisión)."
            },
            {
              title: "2. Guardar en Borrador o Enviar",
              desc: "Puedes guardar tu propuesta como borrador para trabajar luego o enviarla directamente a revisión de la Coordinación."
            },
            {
              title: "3. Monitorear Estado y Pasar Lista QR",
              desc: "Revisa en tiempo real el avance de tu evento. Cuando esté 'En curso', usa el pase de lista QR para registrar la asistencia de los participantes."
            }
          ],
          states: [
            { label: "Borrador", tone: "bg-slate-100 text-slate-800 border-slate-300", desc: "Tu propuesta está guardada localmente y puedes editarla libremente." },
            { label: "Pendiente Depto", tone: "bg-amber-100 text-amber-800 border-amber-300", desc: "Enviada a revisión del Coordinador de tu Facultad o Carrera." },
            { label: "Pendiente VOAE", tone: "bg-indigo-100 text-indigo-800 border-indigo-300", desc: "Aprobada por Coordinación, esperando aval final de Dirección VOAE." },
            { label: "Programado / En curso", tone: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "¡Aprobado y publicado! Disponible para inscripción y asistencia de estudiantes." },
            { label: "Rechazado", tone: "bg-red-100 text-red-800 border-red-300", desc: "Devuelto con observaciones. Puedes editar y enviar nuevamente." }
          ],
          faqs: [
            { q: "¿Quiénes pueden crear eventos?", a: "¡Todos! Estudiantes, docentes, coordinadores y personal pueden proponer eventos desde esta pantalla." },
            { q: "¿Cómo sé si aprobaron mi evento?", a: "Recibirás una notificación automática en la campana de notificaciones del sistema con cada cambio de estado." }
          ]
        };
    }
  };

  const guide = getGuideData();

  return (
    <>
      {/* Botón Flotante en la esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
        <span className="hidden sm:inline-block px-3 py-1.5 text-xs font-semibold text-white bg-slate-900/90 rounded-xl shadow-lg border border-slate-700/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
          ¿Ayuda con este panel?
        </span>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir ayuda y guía del panel"
          className="relative size-13 rounded-full bg-gradient-to-tr from-[#003366] via-[#004B87] to-[#005ba4] text-[#FFD100] shadow-xl hover:shadow-2xl border-2 border-[#FFD100] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-[#FFD100]/40"
        >
          <HelpCircle className="size-7 stroke-[2.2] animate-pulse" />
          <span className="absolute -top-1 -right-1 size-3.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
        </button>
      </div>

      {/* Modal / Diálogo Guía Interactiva */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-[#003366] via-[#004B87] to-[#003366] p-5 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-[#FFD100]/20 border border-[#FFD100]/40 flex items-center justify-center text-[#FFD100]">
                    <HelpCircle className="size-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD100] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                      {guide.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{guide.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="text-xs text-white/80 mt-2">{guide.subtitle}</p>

              {/* Selector de Pestañas */}
              <div className="flex items-center gap-2 mt-4 bg-white/10 p-1 rounded-xl border border-white/15 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("pasos")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    activeTab === "pasos"
                      ? "bg-[#FFD100] text-[#003366] font-bold shadow-xs"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  <Sparkles className="size-3.5" /> Pasos Clave
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("estados")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    activeTab === "estados"
                      ? "bg-[#FFD100] text-[#003366] font-bold shadow-xs"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  <Clock className="size-3.5" /> Estados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("faq")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                    activeTab === "faq"
                      ? "bg-[#FFD100] text-[#003366] font-bold shadow-xs"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  <AlertCircle className="size-3.5" /> Preguntas Frecuentes
                </button>
              </div>
            </div>

            {/* Contenido del Modal por Pestaña */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
              {activeTab === "pasos" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {guide.steps.map((st, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:border-[#004B87]/30 transition-colors flex items-start gap-3.5">
                      <div className="size-7 rounded-xl bg-[#004B87] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{st.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "estados" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {guide.states.map((st, i) => (
                    <div key={i} className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-start justify-between gap-3">
                      <div>
                        <span className={cn("inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-lg border mb-1.5", st.tone)}>
                          {st.label}
                        </span>
                        <p className="text-xs text-slate-600">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "faq" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {guide.faqs.map((faq, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-1.5">
                      <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <ChevronRight className="size-3.5 text-indigo-600 shrink-0" />
                        {faq.q}
                      </h4>
                      <p className="text-xs text-slate-700 pl-5 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con Botón de Entendido */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-[#004B87] hover:bg-[#003366] text-white font-bold text-xs h-10 px-6 rounded-xl gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="size-4" /> Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
