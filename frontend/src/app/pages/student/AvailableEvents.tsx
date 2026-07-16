import React, { useState, useEffect, useRef } from 'react';
import { grupo2EventosService } from '../../../services';
import { Share, LogOut } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

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
  ESTADO_ACTIVIDAD: 'Programado' | 'En curso' | 'Finalizado' | '';
  INSCRITO: boolean;
  CUPOS_DISPONIBLES: number;
  FECHA: string;
  INSTRUCTOR: string;
  AVATAR_URL?: string;
  HORARIO?: string;
  HORAS_VOAE?: number;
  UBICACION?: string;
  UBICACION_LINK?: string;
  Categoria?: string;
  ASISTENCIA?: AsistenciaInfo;
}

export const AvailableEvents: React.FC = () => {

  const [origenFiltro, setOrigenFiltro] = useState<'mis-eventos' | 'nuevos'>('mis-eventos');
  const [busqueda, setBusqueda] = useState('');
  const [eventoHorasModal, setEventoHorasModal] = useState(false);
  const [mensajeCompartido, setMensajeCompartido] = useState(false);
  const [eventoACompartir, setEventoACompartir] = useState<Evento | null>(null);
  const [mensajePersonal, setMensajePersonal] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showDescEmojis, setShowDescEmojis] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagStartIndex, setTagStartIndex] = useState(-1);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const CONNECTIONS = [
    { name: 'Camel García', initials: 'CG' },
    { name: 'Valeria Rojas', initials: 'VR' },
    { name: 'Miguel Torres', initials: 'MT' },
    { name: 'Puma Head', initials: 'PH' },
    { name: 'Laura Paz', initials: 'LP' },
    { name: 'Ángela Reyes', initials: 'AR' },
    { name: 'Carlos Mendoza', initials: 'CM' },
  ];
  const mostrarBotonEntrada = (ev: Evento) => {
    return ev?.ESTADO_ACTIVIDAD === 'En curso' && !ev?.ASISTENCIA?.entrada;
  };

  const mostrarBotonSalida = (ev: Evento) => {
    return ev?.ESTADO_ACTIVIDAD === 'En curso' && ev?.ASISTENCIA?.entrada && !ev?.ASISTENCIA?.salida;
  };
  const calcularTotalHoras = () => {
    if (!eventos || !Array.isArray(eventos)) return 0;
  
    return eventos
      .filter(e => {
        const esFinalizado = e.ESTADO_ACTIVIDAD === 'Finalizado';
        // Validación estricta como en la impresión
        const esVerificado = e.ASISTENCIA?.estadoVerificacion === 'Verificado';
        return esFinalizado && esVerificado;
      })
      .reduce((acc, curr) => acc + (Number(curr.HORAS_VOAE) || 0), 0);
  };

 
  // Estados para modales de control
  const [eventoDetalleModal, setEventoDetalleModal] = useState<Evento | null>(null);
  const [eventoACancelar, setEventoACancelar] = useState<Evento | null>(null);
  const [eventoAsistenciaModal, setEventoAsistenciaModal] = useState<Evento | null>(null);

  // Estado para activar la cámara real del dispositivo
  const [escanerQR, setEscanerQR] = useState<{ abierto: boolean; eventoId: number; tipo: 'activar entrada' | 'activar salida' } | null>(null);

  // Referencia para el contenedor del scanner HTML5
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);

  const cargarEventos = async () => {
    try {
      const data = await grupo2EventosService.obtenerMisEventos();
      const mapped = data.map((ev: any) => ({
        EVENTO_ID: ev.EVENTO_ID,
        TITULO_EVENTO: ev.TITULO_EVENTO,
        DESCRIPCION: ev.DESCRIPCION,
        ESTADO_ACTIVIDAD: ev.ESTADO_ACTIVIDAD,
        INSCRITO: ev.INSCRITO,
        CUPOS_DISPONIBLES: ev.CUPOS_DISPONIBLES,
        FECHA: ev.FECHA,
        INSTRUCTOR: ev.INSTRUCTOR,
        AVATAR_URL: ev.AVATAR_URL,
        HORARIO: ev.HORARIO,
        HORAS_VOAE: ev.HORAS_VOAE,
        UBICACION: ev.UBICACION,
        UBICACION_LINK: ev.UBICACION_LINK,
        Categoria: ev.Categoria,
        ASISTENCIA: ev.ASISTENCIA ? {
          entrada: ev.ASISTENCIA.entrada,
          salida: ev.ASISTENCIA.salida || undefined,
          lat: ev.ASISTENCIA.lat || 14.0818,
          lng: ev.ASISTENCIA.lng || -87.2068,
          estadoVerificacion: ev.ASISTENCIA.estadoVerificacion === 'Verificado' ? 'Verificado' : 'Pendiente de verificación'
        } : undefined
      }));
      setEventos(mapped);
    } catch (error) {
      console.error('Error al cargar eventos del backend:', error);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // Lector QR
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
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const tipoAsistencia = escanerQR.tipo === 'activar entrada' ? 'entrada' : 'salida';
            try {
              await grupo2EventosService.registrarAsistencia(escanerQR.eventoId, {
                tipo: tipoAsistencia,
                lat: latitude,
                lng: longitude
              });
              await cargarEventos();
              setEscanerQR(null);
            } catch (error: any) {
              alert(error.message || 'Error al registrar asistencia');
              setEscanerQR(null);
            }
          }, async () => {
            try {
              const tipoAsistencia = escanerQR.tipo === 'activar entrada' ? 'entrada' : 'salida';
              await grupo2EventosService.registrarAsistencia(escanerQR.eventoId, {
                tipo: tipoAsistencia,
                lat: 14.0818,
                lng: -87.2068
              });
              await cargarEventos();
              setEscanerQR(null);
            } catch (error: any) {
              alert(error.message || 'Error al registrar asistencia');
              setEscanerQR(null);
            }
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


  const inscribirseAEvento = async (id: number) => {
    try {
      await grupo2EventosService.inscribir(id);
      await cargarEventos();
      setEventoDetalleModal(null);
      setOrigenFiltro('mis-eventos');
    } catch (error: any) {
      alert(error.message || 'Error al inscribirse al evento');
    }
  };
  const compartirEnSocialFeed = (evento: Evento, mensaje?: string, tags?: string[], images?: string[]) => {
    const savedPosts = localStorage.getItem("unah_posts");
    let posts = savedPosts ? JSON.parse(savedPosts) : [];

    const autorNombre = 'Valeria Estrada';
    const sharerId = 'valeria.estrada';

    const descFinal = mensaje?.trim()
      ? `${mensaje.trim()}\n\n📅 ${evento.TITULO_EVENTO}\n${evento.DESCRIPCION}`
      : evento.DESCRIPCION;

    const postImages = [...(images?.filter(Boolean) || [])];
    if (evento.AVATAR_URL && !postImages.some(i => i === evento.AVATAR_URL)) {
      postImages.push(evento.AVATAR_URL);
    }

    const nuevoPost = {
      id: Date.now(),
      type: "Evento" as const,
      title: evento.TITULO_EVENTO,
      desc: descFinal,
      fecha: evento.FECHA,
      lugar: evento.UBICACION,
      author: autorNombre,
      initials: (autorNombre || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      sharerId,
      scope: evento.Categoria || 'Social',
      visibility: 'Público',
      time: 'Justo ahora',
      tags: tags?.filter(Boolean) || [],
      cupos: evento.CUPOS_DISPONIBLES,
      inscrito: evento.INSCRITO,
      voaeHoras: evento.HORAS_VOAE || 0,
      images: postImages,
      topInscritos: [],
      love: 0, like: 0, dislike: 0, haha: 0, wow: 0, sad: 0, angry: 0,
      comments: [],
      userReaction: null,
      saved: false,
      hidden: false,
      createdAt: Date.now(),
    };

    posts.unshift(nuevoPost);

    localStorage.setItem("unah_posts", JSON.stringify(posts));
    window.dispatchEvent(new CustomEvent('unah-posts-changed'));

    setMensajeCompartido(true);
    setTimeout(() => setMensajeCompartido(false), 2500);
  };

  const abrirModalCompartir = (evento: Evento) => {
    setMensajePersonal('');
    setTagsRaw('');
    setSelectedImages([]);
    setShowDescEmojis(false);
    setShowTagSuggestions(false);
    setEventoACompartir(evento);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTagsRaw(val);
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const queryText = textBeforeCursor.substring(lastAtIdx + 1);
      if (!queryText.includes(' ') && !queryText.includes('\n') && !queryText.includes(',')) {
        setShowTagSuggestions(true);
        setTagSearchQuery(queryText.toLowerCase());
        setTagStartIndex(lastAtIdx);
        return;
      }
    }
    setShowTagSuggestions(false);
  };

  const handleSelectTag = (name: string) => {
    if (tagStartIndex === -1) return;
    const textBeforeAt = tagsRaw.substring(0, tagStartIndex);
    const textAfterAt = tagsRaw.substring(tagStartIndex + tagSearchQuery.length + 1);
    const newTags = `${textBeforeAt}@${name} ${textAfterAt}`;
    setTagsRaw(newTags);
    setShowTagSuggestions(false);
    setTimeout(() => {
      if (tagsRef.current) {
        tagsRef.current.focus();
        const newCursorPos = tagStartIndex + name.length + 2;
        tagsRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 3 - selectedImages.length;
    if (remaining <= 0) return;
    const filesToLoad = Array.from(files).slice(0, remaining);
    const promises = filesToLoad.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }));
    Promise.all(promises).then(base64s => {
      setSelectedImages(prev => [...prev, ...base64s]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmarCompartir = () => {
    if (!eventoACompartir) return;
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    compartirEnSocialFeed(eventoACompartir, mensajePersonal, tags, selectedImages);
    setEventoACompartir(null);
    setMensajePersonal('');
    setTagsRaw('');
    setSelectedImages([]);
  };

  const emojiList = ['😊','😂','🤣','❤️','👍','🎉','🔥','🚀','🎓','🙌','✨','👀','💻','📚','💡','🎨','🌟','👏','✔️','🚩'];
  const ejecutarCancelacionLimpia = async () => {
    if (!eventoACancelar) return;
    try {
      await grupo2EventosService.cancelar(eventoACancelar.EVENTO_ID);
      await cargarEventos();
      setEventoACancelar(null);
    } catch (error: any) {
      alert(error.message || 'Error al cancelar la inscripción');
    }
  };
  const mandarAImprimirComprobante = (evento: Evento) => {
      // Depuración: Verifica qué está recibiendo la función
      console.log("Evento recibido para imprimir:", evento);
      
      // Validación estricta
      const esVerificado = evento.ASISTENCIA?.estadoVerificacion === 'Verificado';
      
      const tituloEvento = evento.TITULO_EVENTO || "Evento sin título";
      const marcaAgua = esVerificado ? '' : 'NO VERIFICADO POR VOAE';
      const estadoTexto = esVerificado ? 'Verificado por departamento VOAE' : 'No verificado por VOAE';
    
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Constancia VOAE</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; }
              .marca-agua { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; font-weight: bold; opacity: 0.15; color: #991b1b; z-index: -1; }
            </style></head>
            <body>
              ${marcaAgua ? `<div class="marca-agua">${marcaAgua}</div>` : ''}
              <h2>${tituloEvento}</h2>
              <p><strong>Estado:</strong> ${estadoTexto}</p>
              <script>window.onload = () => { window.print(); window.close(); };</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    };
  
  // 1. Filtrar los eventos según la pestaña seleccionada y búsqueda por texto
  const registrosFiltrados = eventos
    .filter(ev => origenFiltro === 'mis-eventos' ? ev.INSCRITO : !ev.INSCRITO)
    .filter(ev => ev.TITULO_EVENTO.toLowerCase().includes(busqueda.toLowerCase()));

  // 2. Ordenar explícitamente: Programado -> En curso -> Finalizado
  const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
    const pesosEstados = { 'Programado': 1, 'En curso': 2, 'Finalizado': 3, '': 4 };
    return (pesosEstados[a.ESTADO_ACTIVIDAD] || 99) - (pesosEstados[b.ESTADO_ACTIVIDAD] || 99);
  });

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 font-sans antialiased">
      {/* MENSAJE DE EVENTO COMPARTIDO */}
      {mensajeCompartido && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg font-bold">
          ✅ Evento compartido correctamente
        </div>
      )}
      {/* CABECERA AZUL */}
      <div className="max-w-6xl mx-auto bg-[#004B87] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight">Mis Eventos</h1>
            <button 
                onClick={() => setEventoHorasModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold"
            >
                Total Horas Acumuladas: {calcularTotalHoras()}
            </button>
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
      {/* MODAL HORAS ACUMULADAS */}
      {eventoHorasModal && (
              <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-slate-800">
                  <h3 className="font-bold mb-4">Eventos que suman horas:</h3>
                  
                  {eventos
                    .filter(evento => 
                      evento.ESTADO_ACTIVIDAD === 'Finalizado' && 
                      evento.ASISTENCIA?.estadoVerificacion?.includes('Verificado')
                    )
                    .map(evento => {
                      // El log ahora está correctamente dentro del bloque
                      console.log("Valor real de HORAS_VOAE para", evento.TITULO_EVENTO, ":", evento.HORAS_VOAE);
                      
                      return (
                        <div key={evento.EVENTO_ID} className="flex justify-between border-b py-2">
                          <span>{evento.TITULO_EVENTO}</span>
                          <span className="font-bold">{evento.HORAS_VOAE || "Dato no definido"} hrs</span>
                        </div>
                      );
                    }) // Cerramos el map correctamente aquí
                  }

                  <button 
                    onClick={() => setEventoHorasModal(false)} 
                    className="mt-4 w-full bg-slate-200 p-2 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

      {/* LISTADO PRINCIPAL */}
      <div className="max-w-6xl mx-auto space-y-4">
        {registrosOrdenados.map((evento) => {
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
                      <span className="text-[11px] text-slate-400 font-medium"></span>
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
              {/* ACCIONES DE FILA (SOLO PANTALLA INSCRITOS) */}
              <div className="w-full md:w-auto flex justify-end gap-2 shrink-0">
                {origenFiltro === 'mis-eventos' && (
                  <>
                    {/* Botón de Entrada QR */}
                    {mostrarBotonEntrada(evento) && (
                      <button
                        onClick={() => setEscanerQR({ abierto: true, eventoId: evento.EVENTO_ID, tipo: 'activar entrada' })}
                        className="bg-[#004a8b] text-white hover:bg-[#003d73] px-5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                      >
                        📷 Entrada QR
                      </button>
                    )}
                    {/* Botón de Salida QR */}
                    {mostrarBotonSalida(evento) && (
                      <button
                        onClick={() => setEscanerQR({ abierto: true, eventoId: evento.EVENTO_ID, tipo: 'activar salida' })}
                        className="bg-[#004a8b] text-white hover:bg-[#003d73] px-5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                      >
                        📷 Salida QR
                      </button>
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
                          onClick={() => mandarAImprimirComprobante(evento)} // Pasa todo el objeto 'evento'
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
                      <>
                      <button
                          onClick={() => setEventoACancelar(evento)}
                          className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors flex items-center justify-center"
                          title="Retirarme del Evento"
                          aria-label="Retirarme del Evento"
                        >
                          <LogOut size={16} />
                        </button>
                      <button
                          onClick={() => abrirModalCompartir(evento)}
                          className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center"
                          title="Compartir en Muro"
                          aria-label="Compartir en Muro"
                        >
                          <Share size={16} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PANTALLA COMPLETA: LECTOR QR */}
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
      {/* MODAL: DETALLE DE EVENTO */}
      {eventoDetalleModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-[#004B87] tracking-wider uppercase">
                💻 DETALLE DE EVENTO
              </h3>
              <button onClick={() => setEventoDetalleModal(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-6">
              {/* Encabezado con Imagen */}
              <div className="flex gap-4 mb-6 items-start">
                {eventoDetalleModal.AVATAR_URL ? (
                  <img src={eventoDetalleModal.AVATAR_URL} alt="Evento" className="w-20 h-20 rounded-2xl object-cover border shadow-sm" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 border">
                    {eventoDetalleModal.TITULO_EVENTO.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black text-[#003560] leading-tight">{eventoDetalleModal.TITULO_EVENTO}</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">Instructor: {eventoDetalleModal.INSTRUCTOR}</p>
                </div>
              </div>
              {/* Descripción */}
              <p className="text-sm text-slate-600 mb-6">{eventoDetalleModal.DESCRIPCION}</p>
              {/* Grid de Cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="border rounded-xl p-3 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Horario</p>
                  <p className="font-bold text-slate-800 text-sm">{eventoDetalleModal.HORARIO}</p>
                </div>
                <div className="border rounded-xl p-3 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Lugar</p>
                  <p className="font-bold text-slate-800 text-sm">{eventoDetalleModal.UBICACION}</p>
                  {eventoDetalleModal.UBICACION_LINK && (
                    <a
                      href={eventoDetalleModal.UBICACION_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-bold text-[#004B87] underline hover:text-[#003366]"
                    >
                      Ver en Google Maps
                    </a>
                  )}
                </div>
                <div className="border rounded-xl p-3 bg-slate-50 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Categoría y Tipo</p>
                  <p className="font-bold text-slate-800 text-sm">
                    {eventoDetalleModal.Categoria} — ARTICULO 140
                  </p>
                </div>
                {/* Horas a Obtener */}
                <div className="border rounded-xl p-3 bg-blue-50 border-blue-100 col-span-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Horas a Obtener</p>
                  <p className="font-black text-blue-900 text-sm">
                   {(() => {
                     const hours = eventoDetalleModal.HORAS_VOAE ?? 0;
                     const clasif = (eventoDetalleModal.Categoria || "").trim().toLowerCase();
                     
                     if (eventoDetalleModal.EVENTO_ID <= 4) {
                       return "3 Horas Académicas";
                     }
                     
                     let scopeLabel = eventoDetalleModal.Categoria || "";
                     if (clasif.includes("academico") || clasif.includes("académico")) {
                       scopeLabel = "Académicas";
                     } else if (clasif.includes("deportivo")) {
                       scopeLabel = "Deportivas";
                     } else if (clasif.includes("cultural")) {
                       scopeLabel = "Culturales";
                     } else if (clasif.includes("social")) {
                       scopeLabel = "Sociales";
                     }
                     
                     return `${hours} Horas ${scopeLabel}`;
                   })()}
                  </p>
                </div>
              </div>
              {!eventoDetalleModal.INSCRITO && (
                <button onClick={() => inscribirseAEvento(eventoDetalleModal.EVENTO_ID)} className="w-full py-3 bg-[#004B87] hover:bg-[#003560] text-white font-bold rounded-xl transition-all">
                  Inscribirme al Evento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL: HISTORIAL ASISTENCIA DETALLADO */}
    {eventoAsistenciaModal && (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border">
          
          {/* Encabezado */}
          <div className="px-6 py-5 border-b flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-[#004B87]">Historial de Asistencia</h3>
              <p className="text-xs text-slate-400">Detalles de verificación y geolocalización.</p>
            </div>
            <button onClick={() => setEventoAsistenciaModal(null)} className="text-slate-400 text-xl">✕</button>
          </div>

          <div className="p-6 space-y-6">
            {/* 1. Estado de Verificación (Parte Superior) */}
            <div className={`p-4 rounded-2xl border ${eventoAsistenciaModal.ASISTENCIA?.estadoVerificacion === 'Verificado' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <span className="font-bold text-xs block mb-1">Estado de verificación:</span>
              <p className={`text-xs font-bold ${eventoAsistenciaModal.ASISTENCIA?.estadoVerificacion === 'Verificado' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {eventoAsistenciaModal.ASISTENCIA?.estadoVerificacion === 'Verificado'
                  ? '• Verificado: Estado final tras la validación por parte de VOAE.'
                  : '• Pendiente de verificación'}
              </p>
            </div>

            {/* 2. Detalles y Mapas */}
            <div className="space-y-4">
              
              {/* Entrada */}
              <div>
                <p className="text-xs text-slate-500 mb-1"><strong>Entrada:</strong> {eventoAsistenciaModal.ASISTENCIA?.entrada || 'No registrada'}</p>
                <div className="w-full h-32 rounded-2xl overflow-hidden border bg-slate-100">
                  <iframe
                    title="Mapa de Entrada"
                    width="100%" height="100%" style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${eventoAsistenciaModal.ASISTENCIA?.lat ?? 14.0818},${eventoAsistenciaModal.ASISTENCIA?.entrada ?? -87.2068}&z=16&output=embed`}
                  ></iframe>
                </div>
              </div>

              {/* Salida */}
              <div>
                <p className="text-xs text-slate-500 mb-1"><strong>Salida:</strong> {eventoAsistenciaModal.ASISTENCIA?.salida || 'No registrada'}</p>
                <div className="w-full h-32 rounded-2xl overflow-hidden border bg-slate-100">
                  <iframe
                    title="Mapa de Salida"
                    width="100%" height="100%" style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${eventoAsistenciaModal.ASISTENCIA?.salida ?? 14.0818},${eventoAsistenciaModal.ASISTENCIA?.lng ?? -87.2068}&z=16&output=embed`}
                  ></iframe>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )}
      {/* MODAL: COMPARTIR EN FEED */}
      {eventoACompartir && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs" onClick={() => { setEventoACompartir(null); setMensajePersonal(''); setTagsRaw(''); setSelectedImages([]); }}>
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex justify-between items-center shrink-0">
              <h3 className="text-xs font-extrabold text-[#004B87] tracking-wider uppercase">📤 Compartir en Muro</h3>
              <button onClick={() => { setEventoACompartir(null); setMensajePersonal(''); setTagsRaw(''); setSelectedImages([]); }} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Event preview */}
              <div className="flex gap-4 items-start bg-slate-50 rounded-2xl p-4 border">
                {eventoACompartir.AVATAR_URL ? (
                  <img src={eventoACompartir.AVATAR_URL} alt="" className="w-14 h-14 rounded-xl object-cover border shadow-sm shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center font-black text-blue-600 border shrink-0">
                    {eventoACompartir.TITULO_EVENTO.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-black text-[#003560] leading-tight truncate">{eventoACompartir.TITULO_EVENTO}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{eventoACompartir.INSTRUCTOR} · {eventoACompartir.FECHA}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{eventoACompartir.DESCRIPCION}</p>
                </div>
              </div>

              {/* Mensaje personal */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-2">AGREGA UN MENSAJE (opcional)</label>
                <div className="flex gap-2 items-start">
                  <textarea
                    ref={descRef}
                    value={mensajePersonal}
                    onChange={e => setMensajePersonal(e.target.value)}
                    placeholder="Escribe algo sobre este evento..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDescEmojis(v => !v)}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 shrink-0 text-lg"
                  >
                    😊
                  </button>
                </div>
                {showDescEmojis && (
                  <div className="flex flex-wrap gap-1.5 mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {emojiList.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => { setMensajePersonal(prev => prev + emoji); setShowDescEmojis(false); }}
                        className="text-lg hover:bg-slate-200 rounded-lg px-1 py-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Etiquetas */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-500 block mb-2">ETIQUETAS (separadas por coma, usa @ para mencionar)</label>
                <input
                  ref={tagsRef}
                  type="text"
                  placeholder="#Tema1, #Tema2, @Usuario"
                  value={tagsRaw}
                  onChange={handleTagsChange}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
                {showTagSuggestions && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {CONNECTIONS.filter(c => c.name.toLowerCase().includes(tagSearchQuery)).map(c => (
                      <div
                        key={c.name}
                        onClick={() => handleSelectTag(c.name)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm"
                      >
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{c.initials}</span>
                        <span className="font-medium text-slate-700">{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => { setEventoACompartir(null); setMensajePersonal(''); setTagsRaw(''); setSelectedImages([]); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCompartir}
                  className="flex-1 py-2.5 bg-[#004B87] hover:bg-[#003560] text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Share size={14} />
                  Compartir en Muro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: RETIRARSE */}
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
};