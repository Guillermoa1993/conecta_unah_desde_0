import { useState } from "react";
import { useLocation } from "react-router";
import {
  HelpCircle, X, CheckCircle2, Sparkles, AlertCircle, Clock, ChevronRight,
  BookOpen, MapPin, QrCode, FileText, Award, Calendar, Check, ShieldCheck,
  Building2, Layers
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

  // Determinar contexto exclusivamente para los apartados autorizados
  const path = location.pathname;
  let activeContext: HelpContext | null = context || null;

  if (!activeContext) {
    if (
      path.startsWith("/tutor/eventos") ||
      path.startsWith("/tutor/history") ||
      path.startsWith("/tutor/create-event") ||
      path.startsWith("/tutor/event/")
    ) {
      activeContext = "eventos";
    } else if (
      path === "/voae" ||
      path.startsWith("/voae/records") ||
      path.startsWith("/voae/events/")
    ) {
      activeContext = "voae";
    } else if (
      path === "/voae-depto" ||
      path.startsWith("/voae-depto/records") ||
      path.startsWith("/voae-depto/events/")
    ) {
      activeContext = "coordinacion";
    }
  }

  // Ocultar completamente el botón si el usuario no está dentro de estos apartados
  if (!activeContext) {
    return null;
  }

  const getGuideData = () => {
    switch (activeContext) {
      case "voae":
        return {
          title: "Guía Completa: Panel de Gestión VOAE",
          subtitle: "Instructivo oficial para la validación universal de propuestas con horas y auditoría de certificados",
          badge: "Dirección VOAE",
          steps: [
            {
              title: "1. Recepción Universal de Solicitudes",
              desc: "En este panel recibes automáticamente todas las propuestas de eventos de cualquier Facultad o Centro Regional de la UNAH que hayan solicitado Horas VOAE (Art. 140) y que ya tengan la aprobación previa de su respectiva Coordinación de Carrera."
            },
            {
              title: "2. Auditoría y Validación de la Propuesta",
              desc: "Haz clic en 'Validar propuesta' para inspeccionar los detalles pedagógicos, la pertinencia comunitaria, el cupo asignado, la fecha/hora y la distribución de horas según la dimensión VOAE (Académica, Cultural, Deportiva, Social)."
            },
            {
              title: "3. Resolución: Aprobar o Rechazar con Observaciones",
              desc: "Si la propuesta cumple los estándares universitarios, apruébala para su publicación inmediata en la agenda institucional. En caso de inconsistencias, recházala redactando un motivo claro para que el organizador pueda corregirla."
            },
            {
              title: "4. Auditoría de Eventos Finalizados y Acreditación de Horas",
              desc: "En la sección 'Auditoría de eventos finalizados', revisa las asistencias confirmadas mediante código QR. Presiona 'Ver validaciones' para emitir y descargar el Reporte Oficial de Cumplimiento en formato PDF firmado digitalmente."
            }
          ],
          states: [
            { label: "Pendiente VOAE", tone: "bg-[#003366]/10 text-[#003366] border-[#003366]/30", desc: "El evento cuenta con el aval de la Coordinación de Carrera y aguarda tu dictamen final en Dirección VOAE." },
            { label: "Programado / Publicado", tone: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "Aprobado oficialmente. Es visible en el portal público de estudiantes para inscripción y asistencia." },
            { label: "En Curso / Pase de Lista", tone: "bg-blue-100 text-blue-800 border-blue-300", desc: "La actividad se está desarrollando en este momento. El pase de lista por escáner QR o código está habilitado." },
            { label: "Auditoría Finalizada", tone: "bg-purple-100 text-purple-800 border-purple-300", desc: "Evento concluido y auditado. Las horas VOAE han sido abonadas a los historiales académicos de los estudiantes." },
            { label: "Rechazado", tone: "bg-red-100 text-red-800 border-red-300", desc: "Solicitud desestimada o devuelta con observaciones especificadas para su revisión por parte del solicitante." }
          ],
          faqs: [
            { q: "¿Por qué aparecen solicitudes de distintas facultades en mi bandeja?", a: "Dirección VOAE posee competencia institucional universal para revisar y certificar todas las actividades que otorgan Horas Artículo 140 en cualquier centro regional de la UNAH." },
            { q: "¿Dónde descargo las constancias de horas aprobadas?", a: "Accede al bloque 'Auditoría de eventos finalizados', ubica la actividad concluida y presiona 'Ver validaciones' para generar el PDF oficial." },
            { q: "¿Qué sucede si rechazo una propuesta?", a: "El sistema notifica al organizador de forma inmediata mediante la campana de notificaciones del sistema con las correcciones requeridas." }
          ]
        };

      case "coordinacion":
        return {
          title: "Guía Completa: Panel de Coordinación de Carrera",
          subtitle: "Instructivo para el filtro inicial, evaluación académica y canalización de propuestas de departamento",
          badge: "Coordinación VOAE Depto",
          steps: [
            {
              title: "1. Filtro Automático por Facultad y Carrera",
              desc: "Tu panel está configurado para recibir de forma exclusiva las solicitudes de eventos enviadas por estudiantes, docentes o personal adscrito a tu propia Carrera o Departamento Académico."
            },
            {
              title: "2. Evaluación Pedagógica y de Infraestructura",
              desc: "Presiona 'Revisar propuesta' para analizar la viabilidad del evento, la capacidad del edificio seleccionado, los horarios y si cumple con la justificación académica requerida."
            },
            {
              title: "3. Dictamen y Canalización Automática",
              desc: "• Eventos Recreativos (Sin Horas VOAE): Si los apruebas, quedan publicados automáticamente.\n• Eventos con Horas VOAE (Art. 140): Tu aprobación los transfiere a la bandeja de Dirección VOAE para la acreditación final de horas."
            },
            {
              title: "4. Histórico y Control Interno",
              desc: "Consulta la pestaña de 'Histórico de eventos' para auditorías internas del departamento, reportes de solicitudes procesadas y estadísticas de eventos impartidos por tu unidad académica."
            }
          ],
          states: [
            { label: "Pendiente Depto", tone: "bg-amber-100 text-amber-800 border-amber-300", desc: "Nueva propuesta enviada por un integrante de tu carrera. Requiere tu revisión inicial." },
            { label: "Aprobado Depto / Transferido", tone: "bg-indigo-100 text-indigo-800 border-indigo-300", desc: "Propuesta aprobada por tu facultad. Ha avanzado a la etapa de certificación en Dirección VOAE." },
            { label: "Programado Recreativo", tone: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "Evento sin horas VOAE aprobado por tu unidad y publicado en la agenda de la UNAH." },
            { label: "Rechazado Coordinación", tone: "bg-red-100 text-red-800 border-red-300", desc: "Solicitud devuelta al remitente con indicaciones sobre modificaciones necesarias." }
          ],
          faqs: [
            { q: "¿Puedo proponer mis propios eventos como Coordinador?", a: "¡Sí! Utiliza el menú desplegable 'Mi Gestión de eventos' en la barra lateral izquierda para redactar y publicar eventos del departamento." },
            { q: "¿Qué debo hacer si una solicitud requiere cambio de aula o edificio?", a: "Puedes rechazar temporalmente la propuesta indicando la observación en el motivo, o contactar al organizador para que modifique la ubicación en sus borradores." },
            { q: "¿Quién aprueba finalmente las horas de graduación?", a: "Tú otorgas el aval departamental inicial y Dirección VOAE ratifica el registro oficial en el sistema de la universidad." }
          ]
        };

      case "eventos":
      default:
        return {
          title: "Guía Completa: Gestión de Mis Eventos",
          subtitle: "Instructivo detallado para proponer, configurar ubicación en mapa, portadas IA y controlar asistencias",
          badge: "Organizador del Evento",
          steps: [
            {
              title: "1. Iniciar una Nueva Propuesta",
              desc: "Presiona el botón azul '+ Crear propuesta de evento' en la parte superior. Se abrirá el formulario guiado paso a paso."
            },
            {
              title: "2. Paso 1: Información Básica del Evento",
              desc: "Ingresa el título oficial, la categoría (Académico, Cultural, Deportivo, Social, Recreativo), si otorga Horas VOAE Art. 140, el cupo máximo de participantes y una descripción clara (hasta 250 palabras)."
            },
            {
              title: "3. Paso 2: Selección de Ubicación y Mapa Interactivo",
              desc: "Elige el Centro Regional (ej. Ciudad Universitaria). En el edificio, puedes seleccionar uno prediseñado o elegir '📍 Otro / No encontré mi edificio' para escribir un nombre personalizado (ej. Edificio C4) y arrastrar el pin manualmente en el mapa."
            },
            {
              title: "4. Paso 3: Selección de Portada promocional",
              desc: "Puedes elegir subir una imagen o afiche promocional desde tu dispositivo, o presionar 'Generar Portada IA' para crear un diseño inteligente automático adaptado al tema de tu evento."
            },
            {
              title: "5. Paso 4: Revisión, Borradores y Envío",
              desc: "Verifica el resumen completo. Puedes presionar 'Guardar Borrador' para seguir editando en otro momento, o 'Enviar a aprobación' para iniciar la cadena de revisiones."
            },
            {
              title: "6. Pase de Lista QR y Evento en Vivo",
              desc: "Cuando tu evento esté en la pestaña 'Programados / En curso', abre las opciones para desplegar el Código QR de inscripción rápida y registrar la asistencia de los estudiantes."
            }
          ],
          states: [
            { label: "Borrador", tone: "bg-slate-100 text-slate-800 border-slate-300", desc: "Guardado exclusivamente para ti. Puedes editar el texto, mapa, portada o borrarlo en cualquier instante." },
            { label: "Pendiente Depto", tone: "bg-amber-100 text-amber-800 border-amber-300", desc: "Enviado a revisión de la Coordinación de tu Carrera o Facultad." },
            { label: "Pendiente VOAE", tone: "bg-indigo-100 text-indigo-800 border-indigo-300", desc: "Aprobado por tu facultad. En revisión final por la Dirección VOAE." },
            { label: "Programado / En curso", tone: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "¡Aprobado! Visible para que los estudiantes se inscriban y asistan a tu actividad." },
            { label: "Rechazado", tone: "bg-red-100 text-red-800 border-red-300", desc: "Devuelto con comentarios. Presiona 'Ver motivo', ajusta los datos solicitados y vuelve a enviarlo a revisión." }
          ],
          faqs: [
            { q: "¿Quiénes pueden proponer eventos en la plataforma?", a: "Todos los integrantes de la UNAH (Estudiantes, Empleados, Docentes y Coordinadores) pueden gestionar sus propias propuestas en este apartado." },
            { q: "¿Qué hago si mi edificio no figura en la lista desplegable?", a: "Selecciona la última opción 'Otro / No encontré mi edificio'. Se abrirá un cuadro para que escribas el nombre y puedas arrastrar la ubicación exacta en el mapa." },
            { q: "¿Cómo recibo respuesta sobre el estado de mi evento?", a: "Cada vez que la Coordinación o VOAE apruebe o solicite cambios, recibirás una notificación instantánea en la campana de notificaciones." }
          ]
        };
    }
  };

  const guide = getGuideData();

  return (
    <>
      {/* Botón Flotante Fijo con posición adaptada para Mobile (por encima de BottomNav) y Desktop */}
      <div className="fixed bottom-20 right-4 sm:bottom-20 sm:right-6 md:bottom-6 md:right-6 z-[9999] flex items-center gap-2 group pointer-events-auto">
        <span className="hidden sm:inline-block px-3 py-1.5 text-xs font-semibold text-white bg-slate-900/90 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
          ¿Ayuda con este panel?
        </span>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir ayuda y guía del panel"
          className="relative size-12 sm:size-13 rounded-full bg-gradient-to-tr from-[#003366] via-[#004B87] to-[#005ba4] text-[#FFD100] shadow-xl hover:shadow-2xl border-2 border-[#FFD100] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-[#FFD100]/40"
        >
          <HelpCircle className="size-6 sm:size-7 stroke-[2.2] animate-pulse" />
          <span className="absolute -top-1 -right-1 size-3.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
        </button>
      </div>

      {/* Modal Guiado Fijo y Centrado */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-[#003366] via-[#004B87] to-[#003366] p-4 sm:p-5 text-white relative shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-[#FFD100]/20 border border-[#FFD100]/40 flex items-center justify-center text-[#FFD100] shrink-0">
                    <HelpCircle className="size-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD100] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                      {guide.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 leading-snug">{guide.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="text-xs text-white/80 mt-2 leading-relaxed">{guide.subtitle}</p>

              {/* Selector de Pestañas */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-4 bg-white/10 p-1 rounded-xl border border-white/15 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("pasos")}
                  className={cn(
                    "flex-1 py-1.5 px-2 sm:px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs",
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
                    "flex-1 py-1.5 px-2 sm:px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs",
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
                    "flex-1 py-1.5 px-2 sm:px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs",
                    activeTab === "faq"
                      ? "bg-[#FFD100] text-[#003366] font-bold shadow-xs"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  <AlertCircle className="size-3.5" /> Preguntas Frecuentes
                </button>
              </div>
            </div>

            {/* Contenido del Modal con Scroll Suave */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
              {activeTab === "pasos" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {guide.steps.map((st, i) => (
                    <div key={i} className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:border-[#004B87]/30 transition-colors flex items-start gap-3">
                      <div className="size-7 rounded-xl bg-[#004B87] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {i + 1}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{st.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "estados" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {guide.states.map((st, i) => (
                    <div key={i} className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className={cn("inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-lg border", st.tone)}>
                          {st.label}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "faq" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {guide.faqs.map((faq, i) => (
                    <div key={i} className="p-3.5 sm:p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-indigo-950 flex items-start gap-1.5">
                        <ChevronRight className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                        {faq.q}
                      </h4>
                      <p className="text-xs text-slate-700 pl-5 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-[#004B87] hover:bg-[#003366] text-white font-bold text-xs h-9 sm:h-10 px-5 sm:px-6 rounded-xl gap-1.5 shadow-sm"
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
