import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export const Route = createFileRoute("/_app/student/mis-eventos")({
  component: MisEventosPage,
});

interface AsistenciaInfo {
  entrada: string;
  salida?: string;
  lat: number;
  lng: number;
  estadoVerificacion: 'Pendiente de verificación' | 'Verificado';
}

interface Evento {
  EVENTO_ID: number;
  TITULO_EVENTO: string;
  DESCRIPCION: string;
  ESTADO_ACTIVIDAD: 'Programado' | 'En curso' | 'Finalizado' | 'Nuevo';
  PROGRESO: number;
  INSCRITO: boolean;
  CUPOS_DISPONIBLES: number;
  FECHA: string;
  INSTRUCTOR: string;
  AVATAR_URL?: string;
  HORARIO?: string;
  UBICACION?: string;
  CLASIFICACION?: string;
  ASISTENCIA?: AsistenciaInfo;
}

function MisEventosPage() {
  const [origenFiltro, setOrigenFiltro] = useState<'mis-eventos' | 'nuevos'>('mis-eventos');
  const [busqueda, setBusqueda] = useState('');
  const [eventoDetalleModal, setEventoDetalleModal] = useState<Evento | null>(null);
  const [eventoACancelar, setEventoACancelar] = useState<Evento | null>(null);
  const [eventoAsistenciaModal, setEventoAsistenciaModal] = useState<Evento | null>(null);
  const [escanerQR, setEscanerQR] = useState<{ abierto: boolean; eventoId: number; tipo: 'entrada' | 'salida' } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const [eventos, setEventos] = useState<Evento[]>([
    {
      EVENTO_ID: 1,
      TITULO_EVENTO: 'Taller de Liderazgo Competitivo',
      DESCRIPCION: 'Curso presencial enfocado en el desarrollo de habilidades blandas y gestión de equipos para horas VOAE.',
      ESTADO_ACTIVIDAD: 'Programado',
      PROGRESO: 0,
      INSCRITO: true,
      CUPOS_DISPONIBLES: 15,
      FECHA: '2026-10-15',
      INSTRUCTOR: 'Ing. Carlos Mendoza',
      HORARIO: '08:00 AM - 11:00 AM',
      UBICACION: 'Auditorio de Ingeniería',
      CLASIFICACION: 'Desarrollo Profesional — Evento por hora',
      AVATAR_URL: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80'
    },
    {
      EVENTO_ID: 2,
      TITULO_EVENTO: 'Seminario de AWS Cloud Foundations',
      DESCRIPCION: 'Introducción práctica a los servicios principales de AWS y despliegue de arquitectura en la nube.',
      ESTADO_ACTIVIDAD: 'En curso',
      PROGRESO: 5,
      INSCRITO: true,
      CUPOS_DISPONIBLES: 8,
      FECHA: '2026-06-22',
      INSTRUCTOR: 'Ing. Arnold Stark',
      HORARIO: '01:00 PM - 04:00 PM',
      UBICACION: 'Laboratorio de Cómputo 3',
      CLASIFICACION: 'Tecnológico — Evento por hora',
      AVATAR_URL: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80'
    },
    {
      EVENTO_ID: 3,
      TITULO_EVENTO: 'Seminario de Ciberseguridad UNAH',
      DESCRIPCION: 'Pentesting básico y protección de infraestructura crítica en redes académicas.',
      ESTADO_ACTIVIDAD: 'En curso',
      PROGRESO: 50,
      INSCRITO: true,
      CUPOS_DISPONIBLES: 12,
      FECHA: '2026-06-25',
      INSTRUCTOR: 'Ing. Gerson Cerrato',
      HORARIO: '02:00 PM - 05:00 PM',
      UBICACION: 'Edificio B2',
      CLASIFICACION: 'Seguridad — Evento por hora',
      AVATAR_URL: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&auto=format&fit=crop&q=80',
      ASISTENCIA: {
        entrada: '2026-06-23 14:05:12',
        lat: 14.0818,
        lng: -87.2068,
        estadoVerificacion: 'Pendiente de verificación'
      }
    },
    {
      EVENTO_ID: 4,
      TITULO_EVENTO: 'Módulo de Finanzas Avanzadas',
      DESCRIPCION: 'Análisis profundo de costos estructurados y presupuestos institucionales.',
      ESTADO_ACTIVIDAD: 'En curso',
      PROGRESO: 95,
      INSCRITO: true,
      CUPOS_DISPONIBLES: 20,
      FECHA: '2026-06-22',
      INSTRUCTOR: 'Lic. Amanda Silva',
      HORARIO: '10:00 AM - 12:00 PM',
      UBICACION: 'Aula Magna C3',
      CLASIFICACION: 'Económico — Evento por hora',
      AVATAR_URL: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=300&auto=format&fit=crop&q=80',
      ASISTENCIA: {
        entrada: '2026-06-22 10:02:44',
        lat: 14.0818,
        lng: -87.2068,
        estadoVerificacion: 'Pendiente de verificación'
      }
    },
    {
      EVENTO_ID: 5,
      TITULO_EVENTO: 'Noche de Talentos UNAH 2026',
      DESCRIPCION: 'Evento artístico estudiantil provisionalmente organizado por VOAE.',
      ESTADO_ACTIVIDAD: 'Finalizado',
      PROGRESO: 100,
      INSCRITO: true,
      CUPOS_DISPONIBLES: 0,
      FECHA: '2026-06-21',
      INSTRUCTOR: 'Lic. Carlos Flores',
      HORARIO: '05:00 PM - 08:00 PM',
      UBICACION: 'Plaza de las Cuatro Culturas',
      CLASIFICACION: 'Cultural — Horas VOAE',
      AVATAR_URL: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      ASISTENCIA: {
        entrada: '2026-06-21 17:05:22',
        salida: '2026-06-21 20:01:45',
        lat: 14.0818,
        lng: -87.2068,
        estadoVerificacion: 'Verificado'
      }
    },
    {
      EVENTO_ID: 6,
      TITULO_EVENTO: 'Introducción al Desarrollo Web con React',
      DESCRIPCION: 'Aprende los fundamentos de React, hooks básicos y manejo de estados desde cero para proyectos estudiantiles.',
      ESTADO_ACTIVIDAD: 'Nuevo',
      PROGRESO: 0,
      INSCRITO: false,
      CUPOS_DISPONIBLES: 25,
      FECHA: '2026-07-02',
      INSTRUCTOR: 'Ing. Elena Rostova',
      HORARIO: '09:00 AM - 12:00 PM',
      UBICACION: 'Laboratorio de Cómputo 1',
      CLASIFICACION: 'Tecnológico — Evento por hora',
      AVATAR_URL: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&auto=format&fit=crop&q=80'
    },
    {
      EVENTO_ID: 7,
      TITULO_EVENTO: 'Conferencia de Inteligencia Artificial y Ética',
      DESCRIPCION: 'Análisis del impacto de los modelos masivos de lenguaje en la educación superior y el mercado laboral moderno.',
      ESTADO_ACTIVIDAD: 'Nuevo',
      PROGRESO: 0,
      INSCRITO: false,
      CUPOS_DISPONIBLES: 50,
      FECHA: '2026-07-10',
      INSTRUCTOR: 'Dr. Samuel Vance',
      HORARIO: '02:00 PM - 04:00 PM',
      UBICACION: 'Auditorio Central Juan Lindo',
      CLASIFICACION: 'Académico — Horas VOAE',
      AVATAR_URL: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=300&auto=format&fit=crop&q=80'
    }
  ]);

  useEffect(() => {
    if (escanerQR?.abierto) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0]
        },
        false
      );

      const alEscanearExitoso = (textoDecodificado: string) => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Error al limpiar la cámara", err));
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const { latitude, longitude } = position.coords;

            setEventos(prev => prev.map(ev => {
              if (ev.EVENTO_ID === escanerQR.eventoId) {
                if (escanerQR.tipo === 'entrada') {
                  return {
                    ...ev,
                    PROGRESO: 50,
                    ASISTENCIA: { entrada: ahora, lat: latitude, lng: longitude, estadoVerificacion: 'Pendiente de verificación' }
                  };
                } else {
                  return {
                    ...ev,
                    PROGRESO: 100,
                    ESTADO_ACTIVIDAD: 'Finalizado',
                    ASISTENCIA: { ...ev.ASISTENCIA!, salida: ahora, lat: latitude, lng: longitude, estadoVerificacion: 'Pendiente de verificación' }
                  };
                }
              }
              return ev;
            }));
            setEscanerQR(null);
          }, () => {
            alert("Asistencia capturada, pero activa los permisos de ubicación para registrar tus coordenadas en el mapa.");
            setEscanerQR(null);
          });
        }
      };

      scannerRef.current.render(alEscanearExitoso, (error) => {});

      const escanearTextosEspanol = () => {
        const btnCambiarCamara = document.getElementById('html5-qrcode-button-camera-permission');
        if (btnCambiarCamara) btnCambiarCamara.innerText = "Conceder permiso de cámara";

        const btnEscanearArchivo = document.getElementById('html5-qrcode-anchor-scan-type');
        if (btnEscanearArchivo) btnEscanearArchivo.innerText = "Escanear un archivo de imagen";

        const labelSeleccion = document.getElementById('html5-qrcode-button-camera-start');
        if (labelSeleccion) labelSeleccion.innerText = "Iniciar Cámara";

        const labelDetener = document.getElementById('html5-qrcode-button-camera-stop');
        if (labelDetener) labelDetener.innerText = "Detener Cámara";
      };

      setTimeout(escanearTextosEspanol, 100);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Error al limpiar recursos de cámara", err));
      }
    };
  }, [escanerQR]);

  const inscribirseAEvento = (id: number) => {
    setEventos(prev => prev.map(ev => {
      if (ev.EVENTO_ID === id) {
        if (ev.CUPOS_DISPONIBLES <= 0) return ev;
        return { ...ev, INSCRITO: true, CUPOS_DISPONIBLES: ev.CUPOS_DISPONIBLES - 1, ESTADO_ACTIVIDAD: 'Programado', PROGRESO: 0 };
      }
      return ev;
    }));
    setEventoDetalleModal(null);
    setOrigenFiltro('mis-eventos');
  };

  const ejecutarCancelacionLimpia = () => {
    if (!eventoACancelar) return;
    setEventos(prev => prev.map(ev => {
      if (ev.EVENTO_ID === eventoACancelar.EVENTO_ID) {
        return { ...ev, INSCRITO: false, ESTADO_ACTIVIDAD: 'Nuevo', PROGRESO: 0, CUPOS_DISPONIBLES: ev.CUPOS_DISPONIBLES + 1, ASISTENCIA: undefined };
      }
      return ev;
    }));
    setEventoACancelar(null);
  };

  const mandarAImprimirComprobante = (titulo: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Constancia VOAE</title></head>
          <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h2>${titulo}</h2><p>Constancia de participación autorizada por VOAE.</p>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const registrosFiltrados = eventos
    .filter(ev => origenFiltro === 'mis-eventos' ? ev.INSCRITO : !ev.INSCRITO)
    .filter(ev => ev.TITULO_EVENTO.toLowerCase().includes(busqueda.toLowerCase()));

  const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
    const pesosEstados = { 'Programado': 1, 'En curso': 2, 'Finalizado': 3, 'Nuevo': 4 };
    return (pesosEstados[a.ESTADO_ACTIVIDAD] || 99) - (pesosEstados[b.ESTADO_ACTIVIDAD] || 99);
  });

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 font-sans antialiased">
      <div className="max-w-6xl mx-auto bg-[#004B87] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight">Mis Eventos</h1>
            <p className="text-xs text-blue-100/70 max-w-sm">Gestiona tu flujo de asistencia geolocalizada mediante QR y revisa tus comprobantes.</p>
          </div>
          <div className="bg-[#003560] p-1 rounded-xl flex shrink-0 self-end md:self-auto">
            <button
              onClick={() => { setOrigenFiltro('mis-eventos'); setBusqueda(''); }}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${origenFiltro === 'mis-eventos' ? 'bg-[#f59e0b] text-slate-900 shadow' : 'text-white hover:bg-white/5'}`}
            >
              Inscritos
            </button>
            <button
              onClick={() => { setOrigenFiltro('nuevos'); setBusqueda(''); }}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${origenFiltro === 'nuevos' ? 'bg-[#f59e0b] text-slate-900 shadow' : 'text-white hover:bg-white/5'}`}
            >
              Buscar Nuevos
            </button>
          </div>
        </div>
        <div className="w-full flex justify-start">
          <div className="relative w-full md:w-[480px]">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
            <input
              type="text"
              placeholder={origenFiltro === 'mis-eventos' ? "Filtrar mis eventos inscritos..." : "Buscar nuevos eventos en el catálogo..."}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white text-slate-800 text-xs font-medium rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#f59e0b] shadow-xs placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {registrosOrdenados.map((evento) => {
          const progreso = evento.PROGRESO;
          const mostrarBotonEntrada = progreso >= 0 && progreso <= 10;
          const mostrarBotonSalida = progreso >= 95 && progreso <= 100;
          const verificado = evento.ASISTENCIA?.estadoVerificacion === 'Verificado';

          return (
            <div key={evento.EVENTO_ID} className="p-5 bg-white rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
              <div className="flex items-center gap-4 flex-1 w-full">
                {evento.AVATAR_URL ? (
                  <img src={evento.AVATAR_URL} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                )}
                <div className="space-y-0.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 onClick={() => setEventoDetalleModal(evento)} className="text-base font-bold text-[#004B87] hover:underline cursor-pointer">
                      {evento.TITULO_EVENTO}
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                      {evento.ESTADO_ACTIVIDAD}
                    </span>
                    {origenFiltro === 'mis-eventos' && (
                      <span className="text-[11px] text-slate-400 font-medium">Progreso: {progreso}%</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl">{evento.DESCRIPCION}</p>
                  {origenFiltro === 'nuevos' && (
                    <p className="text-[11px] font-semibold text-slate-400 pt-0.5">
                      Cupos disponibles: <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">{evento.CUPOS_DISPONIBLES}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="w-full md:w-auto flex justify-end gap-2 shrink-0">
                {origenFiltro === 'mis-eventos' && (
                  <>
                    {evento.ESTADO_ACTIVIDAD === 'En curso' && (
                      <>
                        {mostrarBotonEntrada && (
                          <button
                            onClick={() => setEscanerQR({ abierto: true, eventoId: evento.EVENTO_ID, tipo: 'entrada' })}
                            className="px-4 py-2 bg-[#10b981] hover:bg-[#0d9488] text-white font-bold rounded-xl text-xs shadow-xs"
                          >
                            📷 Marcar Entrada
                          </button>
                        )}
                        {mostrarBotonSalida && (
                          <button
                            onClick={() => setEscanerQR({ abierto: true, eventoId: evento.EVENTO_ID, tipo: 'salida' })}
                            className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold rounded-xl text-xs shadow-xs"
                          >
                            📷 Marcar Salida
                          </button>
                        )}
                      </>
                    )}

                    {evento.ESTADO_ACTIVIDAD === 'Finalizado' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEventoAsistenciaModal(evento)}
                          className="px-4 py-2 bg-[#004B87] text-white font-bold rounded-xl text-xs shadow-xs"
                        >
                          Ver Asistencia
                        </button>
                        <button
                          onClick={() => mandarAImprimirComprobante(evento.TITULO_EVENTO)}
                          disabled={!verificado}
                          className={`px-4 py-2 font-bold rounded-xl text-xs shadow-xs ${
                            verificado ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed border'
                          }`}
                        >
                          Imprimir
                        </button>
                      </div>
                    )}

                    {evento.ESTADO_ACTIVIDAD === 'Programado' && (
                      <button
                        onClick={() => setEventoACancelar(evento)}
                        className="px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs border border-rose-100 hover:bg-rose-100"
                      >
                        Retirarme del Evento
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {escanerQR && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center text-white">
            <h2 className="text-xs font-bold tracking-widest text-emerald-400 uppercase">📷 Escáner de Asistencia Activo QR</h2>
            <button
              onClick={() => setEscanerQR(null)}
              className="text-sm font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
            >
              ✕ Cerrar Lector
            </button>
          </div>
          <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-emerald-400 shadow-2xl">
            <div id="reader" className="w-full"></div>
          </div>
          <div className="max-w-md mx-auto w-full text-center">
            <p className="text-slate-400 text-xs px-4">
              Apunta con la cámara hacia el código QR oficial provisto por el instructor para registrar tu <span className="text-emerald-400 font-semibold uppercase">{escanerQR.tipo}</span>.
            </p>
          </div>
        </div>
      )}

      {eventoDetalleModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-[#004B87] tracking-wider uppercase">💻 DETALLE DE EVENTO</h3>
              <button onClick={() => setEventoDetalleModal(null)} className="text-slate-400 text-xl font-bold">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center p-5 bg-slate-50 rounded-2xl border">
                {eventoDetalleModal.AVATAR_URL ? (
                  <img src={eventoDetalleModal.AVATAR_URL} alt="Evento" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border bg-white shadow-xs shrink-0" />
                ) : (
                  <div className="w-24 h-24 bg-slate-200 rounded-2xl shrink-0" />
                )}
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-black text-[#003560] leading-tight">{eventoDetalleModal.TITULO_EVENTO}</h2>
                  <p className="text-xs font-bold text-slate-500">Instructor: <span className="font-semibold text-slate-700">{eventoDetalleModal.INSTRUCTOR}</span></p>
                  <span className="inline-block px-3 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {eventoDetalleModal.ESTADO_ACTIVIDAD}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{eventoDetalleModal.DESCRIPCION}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50/60 rounded-xl border flex items-center gap-3">
                  <span className="text-xl">⏰</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Horario</label>
                    <span className="text-xs font-bold text-slate-700">{eventoDetalleModal.HORARIO || '09:00 AM - 12:00 PM'}</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl border flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Ubicación</label>
                    <span className="text-xs font-bold text-slate-700">{eventoDetalleModal.UBICACION || 'Campus UNAH'}</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl border flex items-center gap-3 sm:col-span-2">
                  <span className="text-xl">📁</span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Clasificación y Tipo</label>
                    <span className="text-xs font-bold text-slate-700">{eventoDetalleModal.CLASIFICACION || 'General Académica'}</span>
                  </div>
                </div>
              </div>
              {!eventoDetalleModal.INSCRITO && (
                <div className="flex justify-end pt-2">
                  <button onClick={() => inscribirseAEvento(eventoDetalleModal.EVENTO_ID)} className="px-6 py-3 bg-[#00b274] hover:bg-[#009661] text-white text-xs font-bold rounded-xl shadow-md transition-all">
                    📝 Inscribirme al Evento
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {eventoAsistenciaModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border">
            <div className="px-6 py-5 border-b flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[#004B87]">Historial de Asistencia Física</h3>
                <p className="text-xs text-slate-400 mt-1">Verificación de flujos oficiales.</p>
              </div>
              <button onClick={() => setEventoAsistenciaModal(null)} className="text-slate-400 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border rounded-2xl space-y-2 text-xs text-slate-700">
                <p><strong>Evento:</strong> {eventoAsistenciaModal.TITULO_EVENTO}</p>
                <p><strong>Entrada:</strong> {eventoAsistenciaModal.ASISTENCIA?.entrada}</p>
                <p><strong>Salida:</strong> {eventoAsistenciaModal.ASISTENCIA?.salida || 'No registrada'}</p>
                <div className="pt-2 border-t mt-2">
                  <span className="font-bold block mb-1">Estados de verificación:</span>
                  <span className={`px-2.5 py-1 rounded font-bold text-[11px] block ${eventoAsistenciaModal.ASISTENCIA?.estadoVerificacion === 'Verificado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {eventoAsistenciaModal.ASISTENCIA?.estadoVerificacion === 'Verificado'
                      ? '• Verificado: Estado final tras la validación por parte del departamento de VOAE.'
                      : '• Pendiente de verificación'}
                  </span>
                </div>
              </div>
              <div className="w-full h-48 rounded-2xl overflow-hidden border bg-slate-100">
                <iframe
                  title="Mapa de Asistencia de Salida"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${eventoAsistenciaModal.ASISTENCIA?.lat ?? 14.0818},${eventoAsistenciaModal.ASISTENCIA?.lng ?? -87.2068}&z=16&output=embed`}
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}

      {eventoACancelar && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border text-center">
            <h3 className="text-base font-bold text-[#004B87]">¿Desea cancelar su inscripción en este evento?</h3>
            <p className="text-xs text-slate-500">Esta acción liberará el cupo asignado.</p>
            <div className="flex gap-3">
              <button onClick={() => setEventoACancelar(null)} className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold">Volver</button>
              <button onClick={ejecutarCancelacionLimpia} className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs shadow-xs">Confirmar Retiro</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
