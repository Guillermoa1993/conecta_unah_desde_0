import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Bell, Edit2, UserPlus, BookOpen, Bookmark, Clock, ChevronDown, ChevronUp, Check, X, Upload, ShieldCheck, ShieldAlert, Scan, ToggleLeft, ToggleRight, GraduationCap, RefreshCw } from "lucide-react";
import Tesseract from "tesseract.js";

interface PerfilProps {
  rolSimulado: string;
  subScreen?: string;
  setSubScreen?: React.Dispatch<React.SetStateAction<string>>;
}

interface PerfilData {
  nombre: string;
  carrera: string;
  facultad: string;
  centroUniversitario: string;
  correoInstitucional: string;
  estadoAcademico: string;
  miembroDesde: string;
  biografia: string;
  horasAcumuladas: number;
  dobleFactor: boolean;
  forma003: string;
}

interface DocumentoForma003 {
  periodo: string;
  carnet: string;
  forma003: string;
  fechaCarga: string;
  estado: 'Pendiente' | 'Validado' | 'Rechazado';
}

interface PublicacionGuardada {
  titulo: string;
  autor: string;
  fechaGuardado: string;
  descripcion: string;
  detalle: string;
}

interface EventoGuardado {
  titulo: string;
  fecha: string;
  estado: string;
  descripcion: string;
  detalle: string;
}

const perfilInicial: PerfilData = {
  nombre: 'Valeria Estrada',
  carrera: 'Licenciatura en Administración',
  facultad: 'Ciencias Económicas',
  centroUniversitario: 'UNAH-CU',
  correoInstitucional: 'valeria.estrada@unah.edu.hn',
  estadoAcademico: 'Activo',
  miembroDesde: 'Mayo de 2026',
  biografia:
    'Estudiante de la Licenciatura en Administración. Me interesa el análisis de datos, la gestión empresarial y la innovación.',
  horasAcumuladas: 42,
  dobleFactor: true,
  forma003: '',
};

type EstadoPumita = 'Conectado' | 'Pendiente' | 'Sugerido';

interface PumitaData {
  nombre: string;
  carrera: string;
  avatar: string;
  estado: EstadoPumita;
  biografia: string;
  activo: boolean;
}

const notificacionesRecientes = [
  { icon: 'fa-user-plus', texto: 'Lucía Pineda quiere unirse a tu red', tiempo: 'Hace 3 h', leida: false, tipo: 'solicitud', nombre: 'Lucía Pineda' },
  { icon: 'fa-calendar-check', texto: 'Tutoría de Finanzas confirmada', tiempo: 'Hace 10 min', leida: false, tipo: 'general' },
  { icon: 'fa-bookmark', texto: 'Nuevo evento guardado en tu perfil', tiempo: 'Hace 1 h', leida: true, tipo: 'general' },
];

const pumitas: PumitaData[] = [
  {
    nombre: 'Andrea Mejía',
    carrera: 'Ingeniería en Sistemas',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    estado: 'Conectado',
    activo: true,
    biografia: 'Estudiante de sistemas enfocada en desarrollo web, comunidades tecnológicas y mentorías entre compañeros.',
  },
  {
    nombre: 'Carlos Rivera',
    carrera: 'Tutor de Contabilidad',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    estado: 'Conectado',
    activo: false,
    biografia: 'Tutor académico con experiencia apoyando a estudiantes en contabilidad financiera y análisis de costos.',
  },
  {
    nombre: 'Lucía Pineda',
    carrera: 'Administración',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200',
    estado: 'Pendiente',
    activo: true,
    biografia: 'Participa en grupos de liderazgo estudiantil y proyectos de innovación para emprendimientos universitarios.',
  },
  {
    nombre: 'Marco Zelaya',
    carrera: 'Mercadotecnia',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    estado: 'Sugerido',
    activo: false,
    biografia: 'Interesado en investigación de mercados, comunicación digital y actividades culturales dentro de la UNAH.',
  },
  {
    nombre: 'Gabriela Santos',
    carrera: 'Psicología',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    estado: 'Conectado',
    activo: true,
    biografia: 'Apoya actividades de bienestar estudiantil y orientación para nuevos ingresos.',
  },
  {
    nombre: 'Diego Alvarado',
    carrera: 'Economía',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    estado: 'Sugerido',
    activo: false,
    biografia: 'Colabora en análisis de datos, tutorías de estadística y debates académicos de economía aplicada.',
  },
];

const reaccionesPumita = ['👍 Apoyo', '🎉 Felicitación', '👋 Saludo', '🐾 Rugido Puma'];

const documentosIniciales: DocumentoForma003[] = [
  {
    periodo: 'I PAC 2026',
    carnet: 'carnet-i-pac-2026.png',
    forma003: 'forma-003-i-pac-2026.pdf',
    fechaCarga: '12/05/2026',
    estado: 'Validado',
  },
  {
    periodo: 'II PAC 2026',
    carnet: 'carnet-ii-pac-2026.png',
    forma003: 'forma-003-ii-pac-2026.pdf',
    fechaCarga: '03/06/2026',
    estado: 'Pendiente',
  },
];

const publicacionesGuardadas: PublicacionGuardada[] = [
  {
    titulo: 'Guía rápida para preparar una tutoría efectiva',
    autor: 'Comunidad Académica UNAH',
    fechaGuardado: '18/06/2026',
    descripcion: 'Consejos breves para organizar materiales, objetivos y tiempos antes de una tutoría.',
    detalle: 'Esta publicación resume pasos prácticos para planificar sesiones de estudio, definir objetivos claros y registrar avances entre compañeros.',
  },
  {
    titulo: 'Convocatoria de voluntariado estudiantil',
    autor: 'VOAE',
    fechaGuardado: '16/06/2026',
    descripcion: 'Información sobre apoyo estudiantil en actividades culturales y académicas.',
    detalle: 'La convocatoria invita a estudiantes a participar en actividades de apoyo institucional, con seguimiento de participación desde la plataforma.',
  },
  {
    titulo: 'Recursos para mejorar tu perfil universitario',
    autor: 'Conecta Puma',
    fechaGuardado: '12/06/2026',
    descripcion: 'Recomendaciones para mantener actualizada la información académica y tus conexiones.',
    detalle: 'Incluye sugerencias sobre biografía, contactos relevantes, documentos académicos y participación en eventos dentro de la red universitaria.',
  },
];

const eventosGuardadosLista: EventoGuardado[] = [
  {
    titulo: 'Seminario de Ciberseguridad UNAH',
    fecha: '25/06/2026',
    estado: 'En curso',
    descripcion: 'Introducción al análisis de vulnerabilidades en entornos controlados.',
    detalle: 'Evento académico orientado a estudiantes interesados en seguridad informática, buenas prácticas y herramientas introductorias.',
  },
  {
    titulo: 'Taller de Liderazgo',
    fecha: '15/10/2026',
    estado: 'Programado',
    descripcion: 'Taller presencial sobre habilidades blandas y liderazgo estudiantil.',
    detalle: 'Actividad de cuatro semanas con dinámicas grupales, seguimiento de participación y enfoque en comunicación efectiva.',
  },
  {
    titulo: 'Webinar de Marketing Digital y SEO',
    fecha: '20/09/2026',
    estado: 'Finalizado',
    descripcion: 'Sesión virtual sobre posicionamiento orgánico y estrategias digitales.',
    detalle: 'Webinar introductorio sobre SEO, contenido digital y herramientas básicas para proyectos universitarios.',
  },
];

export const StudentProfile: React.FC<PerfilProps> = ({ rolSimulado }) => {
  const [viewMode, setViewMode] = useState<'ver' | 'editar'>('ver');
  const [perfil, setPerfil] = useState<PerfilData>(perfilInicial);
  const [borrador, setBorrador] = useState<PerfilData>(perfilInicial);
  const [notificacionesPerfil, setNotificacionesPerfil] = useState(notificacionesRecientes);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarHistorialNotificaciones, setMostrarHistorialNotificaciones] = useState(false);
  const [busquedaNotificaciones, setBusquedaNotificaciones] = useState('');
  const [solicitudNotificacion, setSolicitudNotificacion] = useState<PumitaData | null>(null);
  const [pumitaSeleccionada, setPumitaSeleccionada] = useState<PumitaData | null>(null);
  const [mensajePerfilPumita, setMensajePerfilPumita] = useState('');
  const [mostrarMenuReaccionesPumita, setMostrarMenuReaccionesPumita] = useState(false);
  const [mostrarRedPumita, setMostrarRedPumita] = useState(false);
  const [mostrarAgregarPumita, setMostrarAgregarPumita] = useState(false);
  const [busquedaAgregarPumita, setBusquedaAgregarPumita] = useState('');
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<PumitaData[]>(
    pumitas.filter((pumita) => pumita.estado === 'Pendiente')
  );
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<string[]>([]);
  const [pumitasAceptados, setPumitasAceptados] = useState<string[]>([]);
  const [dejadosDeSeguir, setDejadosDeSeguir] = useState<string[]>([]);
  const [pumitaPorDejar, setPumitaPorDejar] = useState<PumitaData | null>(null);
  const [interaccionesActivas, setInteraccionesActivas] = useState(true);
  const [mostrarAdvertenciaHoras, setMostrarAdvertenciaHoras] = useState(false);
  const [mostrarCambioCarrera, setMostrarCambioCarrera] = useState(false);
  const [nuevaCarrera, setNuevaCarrera] = useState('');
  const [centroRegionalCambio, setCentroRegionalCambio] = useState('');
  const [motivoCambioCarrera, setMotivoCambioCarrera] = useState('');
  const [errorCambioCarrera, setErrorCambioCarrera] = useState('');
  const [mensajeCambioCarrera, setMensajeCambioCarrera] = useState('');
  const [documentosForma003, setDocumentosForma003] = useState<DocumentoForma003[]>(documentosIniciales);
  const [mostrarRegistroAcademico, setMostrarRegistroAcademico] = useState(false);
  const [periodoRegistro, setPeriodoRegistro] = useState('');
  const [carnetRegistro, setCarnetRegistro] = useState('');
  const [forma003Registro, setForma003Registro] = useState('');
  const [mensajeDocumento, setMensajeDocumento] = useState('');
  const [mostrarEventosGuardados, setMostrarEventosGuardados] = useState(false);
  const [eventosGuardadosLocales, setEventosGuardadosLocales] = useState(eventosGuardadosLista);
  const [eventoQuitado, setEventoQuitado] = useState<{ evento: EventoGuardado; indice: number } | null>(null);
  const [timeoutEventoQuitado, setTimeoutEventoQuitado] = useState<number | null>(null);
  const [mostrarPublicacionesGuardadas, setMostrarPublicacionesGuardadas] = useState(false);
  const [publicacionesGuardadasLocales, setPublicacionesGuardadasLocales] = useState(publicacionesGuardadas);
  const [publicacionQuitada, setPublicacionQuitada] = useState<{ publicacion: PublicacionGuardada; indice: number } | null>(null);
  const [timeoutPublicacionQuitada, setTimeoutPublicacionQuitada] = useState<number | null>(null);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState<PublicacionGuardada | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoGuardado | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [efectoReaccion, setEfectoReaccion] = useState('');

  const iniciarEdicion = () => {
    setBorrador(perfil);
    setViewMode('editar');
  };

  const guardarCambios = () => {
    setPerfil(borrador);
    setViewMode('ver');
  };

  const cancelarEdicion = () => {
    setBorrador(perfil);
    setViewMode('ver');
  };

  const manejarCambioDeFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      setFotoPerfil(URL.createObjectURL(archivo));
    }
  };

  const fotoPerfilActual =
    fotoPerfil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  const enviarSolicitudPumita = (nombre: string) => {
    setSolicitudesEnviadas((actuales) => (actuales.includes(nombre) ? actuales : [...actuales, nombre]));
  };

  const cancelarSolicitudPumita = (nombre: string) => {
    setSolicitudesEnviadas((actuales) => actuales.filter((solicitud) => solicitud !== nombre));
  };

  const aceptarSolicitudPumita = (nombre: string) => {
    setSolicitudesPendientes((actuales) => actuales.filter((pumita) => pumita.nombre !== nombre));
    setPumitasAceptados((actuales) => (actuales.includes(nombre) ? actuales : [...actuales, nombre]));
    setSolicitudNotificacion(null);
    setNotificacionesPerfil((actuales) =>
      actuales.map((notificacion) =>
        notificacion.nombre === nombre ? { ...notificacion, leida: true, texto: `Aceptaste la solicitud de ${nombre}` } : notificacion
      )
    );
  };

  const rechazarSolicitudPumita = (nombre: string) => {
    setSolicitudesPendientes((actuales) => actuales.filter((pumita) => pumita.nombre !== nombre));
    setSolicitudNotificacion(null);
    setNotificacionesPerfil((actuales) =>
      actuales.map((notificacion) =>
        notificacion.nombre === nombre ? { ...notificacion, leida: true, texto: `Rechazaste la solicitud de ${nombre}` } : notificacion
      )
    );
  };

  const abrirPerfilPumita = (pumita: PumitaData) => {
    setMensajePerfilPumita('');
    setMostrarMenuReaccionesPumita(false);
    setPumitaSeleccionada(pumita);
  };

  const enviarRugidoPuma = (nombre: string) => {
    setMensajePerfilPumita(`Rugido Puma enviado a ${nombre}`);
    mostrarEfectoReaccion('rugido');
    setNotificacionesPerfil((actuales) => [
      {
        icon: 'fa-paw',
        texto: `Rugido Puma enviado a ${nombre}`,
        tiempo: 'Ahora',
        leida: false,
        tipo: 'reaccion',
      },
      ...actuales,
    ].slice(0, 5));
  };

  const enviarReaccionPumita = (nombre: string, reaccion: string) => {
    setMensajePerfilPumita(`${reaccion} enviada a ${nombre}`);
    setMostrarMenuReaccionesPumita(false);
    mostrarEfectoReaccion(reaccion);
    setNotificacionesPerfil((actuales) => [
      {
        icon: reaccion.includes('Rugido') ? 'fa-paw' : 'fa-face-smile',
        texto: `${reaccion} enviada a ${nombre}`,
        tiempo: 'Ahora',
        leida: false,
        tipo: 'reaccion',
      },
      ...actuales,
    ].slice(0, 5));
  };

  const dejarDeSeguirPumita = (nombre: string) => {
    setDejadosDeSeguir((actuales) => (actuales.includes(nombre) ? actuales : [...actuales, nombre]));
    setPumitaPorDejar(null);
  };

  const volverASeguirPumita = (nombre: string) => {
    setDejadosDeSeguir((actuales) => actuales.filter((pumita) => pumita !== nombre));
  };

  const obtenerEstiloEstadoPumita = (estado: EstadoPumita) => {
    if (estado === 'Conectado') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (estado === 'Pendiente') return 'bg-puma-secondary/20 text-puma-dark border-puma-secondary/40';
    return 'bg-puma-background text-puma-text border-gray-200';
  };

  const pumitasConectadas = pumitas.filter(
    (pumita) => (pumita.estado === 'Conectado' || pumitasAceptados.includes(pumita.nombre)) && !dejadosDeSeguir.includes(pumita.nombre)
  );

  const perteneceARedPumita = (pumita: PumitaData) =>
    (pumita.estado === 'Conectado' || pumitasAceptados.includes(pumita.nombre)) && !dejadosDeSeguir.includes(pumita.nombre);

  const nombresSolicitudesPendientes = solicitudesPendientes.map((pumita) => pumita.nombre);
  const busquedaAgregarNormalizada = busquedaAgregarPumita.trim().toLowerCase();
  const sugerenciasPumitas = pumitas
    .filter((pumita) => !perteneceARedPumita(pumita))
    .filter((pumita) => !nombresSolicitudesPendientes.includes(pumita.nombre))
    .filter((pumita) => {
      if (!busquedaAgregarNormalizada) return true;
      return (
        pumita.nombre.toLowerCase().includes(busquedaAgregarNormalizada) ||
        pumita.carrera.toLowerCase().includes(busquedaAgregarNormalizada)
      );
    });
  const solicitudesPendientesFiltradas = solicitudesPendientes.filter((pumita) => {
    if (!busquedaAgregarNormalizada) return true;
    return (
      pumita.nombre.toLowerCase().includes(busquedaAgregarNormalizada) ||
      pumita.carrera.toLowerCase().includes(busquedaAgregarNormalizada)
    );
  });

  const mostrarEfectoReaccion = (reaccion: string) => {
    const efecto = reaccion.includes('Apoyo')
      ? 'apoyo'
      : reaccion.includes('Felicitación')
      ? 'confeti'
      : reaccion.includes('Saludo')
        ? 'saludo'
        : reaccion.includes('Rugido')
          ? 'rugido'
          : '';
    if (!efecto) return;
    setEfectoReaccion(efecto);
    window.setTimeout(() => setEfectoReaccion(''), 2000);
  };

  const manejarClickNotificacion = (notificacion: (typeof notificacionesRecientes)[number]) => {
    setNotificacionesPerfil((actuales) =>
      actuales.map((item) => (item.texto === notificacion.texto ? { ...item, leida: true } : item))
    );
    if (notificacion.tipo === 'solicitud' && notificacion.nombre) {
      const pumita = pumitas.find((item) => item.nombre === notificacion.nombre);
      if (pumita) setSolicitudNotificacion(pumita);
      setMostrarNotificaciones(false);
      return;
    }
    if (notificacion.tipo === 'reaccion') {
      const pumita = notificacion.nombre ? pumitas.find((item) => item.nombre === notificacion.nombre) : null;
      if (pumita) abrirPerfilPumita(pumita);
      document.getElementById('interaccion-social')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setMostrarNotificaciones(false);
      setMostrarHistorialNotificaciones(false);
    }
  };

  const quitarPublicacionGuardada = (titulo: string) => {
    if (timeoutPublicacionQuitada) window.clearTimeout(timeoutPublicacionQuitada);

    const indice = publicacionesGuardadasLocales.findIndex((publicacion) => publicacion.titulo === titulo);
    const publicacion = publicacionesGuardadasLocales[indice];
    if (!publicacion) return;

    setPublicacionQuitada({ publicacion, indice });
    setPublicacionesGuardadasLocales((actuales) => actuales.filter((item) => item.titulo !== titulo));
    if (publicacionSeleccionada?.titulo === titulo) setPublicacionSeleccionada(null);

    const timeoutId = window.setTimeout(() => {
      setPublicacionQuitada(null);
      setTimeoutPublicacionQuitada(null);
    }, 5000);
    setTimeoutPublicacionQuitada(timeoutId);
  };

  const deshacerQuitarPublicacion = () => {
    if (!publicacionQuitada) return;
    if (timeoutPublicacionQuitada) window.clearTimeout(timeoutPublicacionQuitada);

    setPublicacionesGuardadasLocales((actuales) => {
      if (actuales.some((publicacion) => publicacion.titulo === publicacionQuitada.publicacion.titulo)) return actuales;
      const restauradas = [...actuales];
      restauradas.splice(publicacionQuitada.indice, 0, publicacionQuitada.publicacion);
      return restauradas;
    });
    setPublicacionQuitada(null);
    setTimeoutPublicacionQuitada(null);
  };

  const quitarEventoGuardado = (titulo: string) => {
    if (timeoutEventoQuitado) window.clearTimeout(timeoutEventoQuitado);

    const indice = eventosGuardadosLocales.findIndex((evento) => evento.titulo === titulo);
    const evento = eventosGuardadosLocales[indice];
    if (!evento) return;

    setEventoQuitado({ evento, indice });
    setEventosGuardadosLocales((actuales) => actuales.filter((evento) => evento.titulo !== titulo));
    if (eventoSeleccionado?.titulo === titulo) setEventoSeleccionado(null);

    const timeoutId = window.setTimeout(() => {
      setEventoQuitado(null);
      setTimeoutEventoQuitado(null);
    }, 5000);
    setTimeoutEventoQuitado(timeoutId);
  };

  const deshacerQuitarEvento = () => {
    if (!eventoQuitado) return;
    if (timeoutEventoQuitado) window.clearTimeout(timeoutEventoQuitado);

    setEventosGuardadosLocales((actuales) => {
      if (actuales.some((evento) => evento.titulo === eventoQuitado.evento.titulo)) return actuales;
      const restaurados = [...actuales];
      restaurados.splice(eventoQuitado.indice, 0, eventoQuitado.evento);
      return restaurados;
    });
    setEventoQuitado(null);
    setTimeoutEventoQuitado(null);
  };
  const enviarCambioCarrera = () => {
    if (!nuevaCarrera.trim()) {
      setErrorCambioCarrera('La nueva carrera es obligatoria.');
      return;
    }

    if (!centroRegionalCambio.trim()) {
      setErrorCambioCarrera('El centro regional es obligatorio.');
      return;
    }

    if (motivoCambioCarrera.trim().length < 10) {
      setErrorCambioCarrera('El motivo debe tener al menos 10 caracteres.');
      return;
    }

    setErrorCambioCarrera('');
    setMensajeCambioCarrera('Solicitud de cambio de carrera enviada.');
    setNuevaCarrera('');
    setCentroRegionalCambio('');
    setMotivoCambioCarrera('');
  };

  const validarArchivoAcademico = (archivo: File | undefined) => {
    if (!archivo) return { valido: false, mensaje: 'Debes cargar Carnet y Forma 003.' };
    const extensionValida = /\.(pdf|jpg|jpeg|png)$/i.test(archivo.name);
    const tamanoValido = archivo.size <= 10 * 1024 * 1024;

    if (!extensionValida) return { valido: false, mensaje: 'Solo se permiten archivos PDF, JPG o PNG.' };
    if (!tamanoValido) return { valido: false, mensaje: 'El tamaño máximo permitido es 10 MB.' };

    return { valido: true, mensaje: '' };
  };

  const manejarSeleccionRegistro = (tipo: 'Carnet' | 'Forma 003', e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const validacion = validarArchivoAcademico(archivo);
    if (!validacion.valido) {
      setMensajeDocumento(validacion.mensaje);
      e.target.value = '';
      return;
    }

    if (tipo === 'Carnet') setCarnetRegistro(archivo.name);
    if (tipo === 'Forma 003') setForma003Registro(archivo.name);
    setMensajeDocumento('');
    e.target.value = '';
  };

  const agregarRegistroAcademico = () => {
    if (!periodoRegistro.trim()) {
      setMensajeDocumento('El período académico es obligatorio.');
      return;
    }

    if (!carnetRegistro || !forma003Registro) {
      setMensajeDocumento('Debes cargar Carnet y Forma 003.');
      return;
    }

    setDocumentosForma003((actuales) => [
      {
        periodo: periodoRegistro,
        carnet: carnetRegistro,
        forma003: forma003Registro,
        fechaCarga: new Date().toLocaleDateString(),
        estado: 'Pendiente',
      },
      ...actuales,
    ]);
    setMensajeDocumento('Registro agregado correctamente.');
    setPeriodoRegistro('');
    setCarnetRegistro('');
    setForma003Registro('');
    setMostrarRegistroAcademico(false);
  };

  const validarRegistroForma003 = () => {
    setDocumentosForma003((actuales) =>
      actuales.map((documento, index) => (index === 0 ? { ...documento, estado: 'Validado' } : documento))
    );
    setMensajeDocumento('Registro validado localmente.');
  };

  const actualizarForma003 = (indexDocumento: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const validacion = validarArchivoAcademico(archivo);
    if (!validacion.valido) {
      setMensajeDocumento(validacion.mensaje);
      e.target.value = '';
      return;
    }

    setDocumentosForma003((actuales) =>
      actuales.map((documento, index) =>
        index === indexDocumento
          ? { ...documento, forma003: archivo.name, fechaCarga: new Date().toLocaleDateString(), estado: 'Pendiente' }
          : documento
      )
    );
    setMensajeDocumento('Forma 003 actualizada localmente.');
    e.target.value = '';
  };

// ─── VISTA EDITAR ───────────────────────────────────────────────
if (viewMode === 'editar') {
  return (
    <div className="flex bg-puma-background min-h-screen text-puma-dark font-sans overflow-y-auto">
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-puma-dark">Mi Perfil</h1>
            <p className="text-puma-text text-sm">Editar perfil</p>
            <div className="mt-3 h-1 w-16 rounded-full bg-puma-secondary"></div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-sm">{borrador.estadoAcademico}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Columna izquierda */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="w-full h-full rounded-full border-4 border-puma-secondary bg-puma-background flex items-center justify-center overflow-hidden">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-puma-primary text-4xl font-bold">VE</span>
                  )}
                </div>
                <input type="file" id="fileInput" className="hidden" accept="image/*" onChange={manejarCambioDeFoto} />
                <label
                  htmlFor="fileInput"
                  className="absolute bottom-0 right-0 bg-white text-puma-dark w-9 h-9 rounded-full flex items-center justify-center hover:bg-puma-secondary transition-colors shadow-lg cursor-pointer border border-gray-200"
                  aria-label="Cambiar foto de perfil"
                >
                  <span className="text-base leading-none">📷</span>
                </label>
              </div>

              <h2 className="text-xl font-bold text-puma-dark mt-4">{borrador.nombre}</h2>
              <p className="text-puma-primary text-sm mb-4">{borrador.carrera}</p>

              <div className="space-y-4 text-left border-t border-gray-200 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-puma-text text-xs uppercase font-bold tracking-wider">Carrera</span>
                  <p className="text-sm text-puma-dark">{borrador.carrera}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-puma-text text-xs uppercase font-bold tracking-wider">Facultad</span>
                  <p className="text-sm text-puma-dark">{borrador.facultad}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-puma-text text-xs uppercase font-bold tracking-wider">Centro Universitario</span>
                  <p className="text-sm text-puma-dark">{borrador.centroUniversitario}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-puma-text text-xs uppercase font-bold tracking-wider">Correo institucional</span>
                  <input
                    value={borrador.correoInstitucional}
                    readOnly
                    className="bg-puma-background text-puma-text text-sm rounded-xl px-3 py-2 outline-none cursor-not-allowed border border-gray-200 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna central */}
          <div className="xl:col-span-6 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4 text-puma-dark">Datos de cuenta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-puma-text text-xs uppercase font-bold tracking-wider">Nombre</span>
                  <input
                    value={borrador.nombre}
                    readOnly
                    className="bg-puma-background text-puma-text text-sm rounded-xl px-3 py-3 outline-none cursor-not-allowed border border-gray-200 w-full"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-puma-text text-xs uppercase font-bold tracking-wider">Correo institucional</span>
                  <input
                    value={borrador.correoInstitucional}
                    readOnly
                    className="bg-puma-background text-puma-text text-sm rounded-xl px-3 py-3 outline-none cursor-not-allowed border border-gray-200 w-full"
                  />
                </label>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-puma-dark">
                <i className="fa-solid fa-pen-to-square text-puma-amber"></i> Mi biografía
              </h3>
              <textarea
                className="w-full bg-puma-background text-puma-dark p-4 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-puma-secondary/40 border border-gray-200 focus:border-puma-primary transition-all resize-none"
                value={borrador.biografia}
                maxLength={300}
                onChange={(e) => setBorrador({ ...borrador, biografia: e.target.value })}
                placeholder="Cuéntanos sobre ti..."
              />
              <p className="text-right text-xs text-puma-text mt-2">{borrador.biografia.length} / 300</p>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-2 text-puma-dark">Historial Forma 003</h3>
              <p className="text-puma-text text-xs mb-4">Registros locales para visualización y validación simulada.</p>

              <button
                type="button"
                onClick={() => {
                  setMostrarRegistroAcademico(true);
                  setMensajeDocumento('');
                }}
                className="w-full mb-4 bg-puma-secondary hover:bg-puma-secondaryLight border border-puma-secondary rounded-lg px-3 py-2.5 text-xs font-bold text-puma-dark transition-colors"
              >
                Agregar registro
              </button>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {documentosForma003.map((documento, index) => (
                  <div key={`${documento.periodo}-${documento.carnet}-${documento.forma003}`} className="border border-gray-200 rounded-xl p-3 bg-puma-background">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-puma-dark text-sm">{documento.periodo}</p>
                        <p className="text-xs text-puma-text">Historial académico</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                          documento.estado === 'Validado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : documento.estado === 'Rechazado'
                              ? 'bg-puma-danger/10 text-puma-danger border-puma-danger/20'
                              : 'bg-puma-secondary/20 text-puma-dark border-puma-secondary/40'
                        }`}
                      >
                        {documento.estado}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-puma-dark truncate">Carnet: {documento.carnet}</p>
                    <p className="text-xs font-semibold text-puma-dark truncate">Forma 003: {documento.forma003}</p>
                    <p className="text-[11px] text-puma-text">Cargado: {documento.fechaCarga}</p>
                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-puma-dark hover:border-puma-secondary transition-colors">
                      Actualizar Forma 003
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => actualizarForma003(index, e)}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={validarRegistroForma003}
                className="mt-4 w-full bg-white border border-gray-200 text-puma-dark font-bold py-2.5 rounded-lg hover:bg-puma-secondary transition-colors text-xs"
              >
                Validar registro
              </button>

              {mensajeDocumento && (
                <p className="mt-3 text-xs font-semibold text-puma-primary">{mensajeDocumento}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={guardarCambios}
                className="w-full bg-puma-secondary text-puma-dark font-bold p-4 rounded-lg hover:bg-puma-secondaryLight transition-all shadow-sm"
              >
                Guardar cambios
              </button>
              <button
                onClick={cancelarEdicion}
                className="w-full bg-white text-puma-danger border border-puma-danger/20 p-4 rounded-lg hover:bg-puma-danger/10 transition-all shadow-sm"
              >
                Cancelar edición
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VISTA NORMAL ───────────────────────────────────────────────
return (
  <div className="space-y-6 bg-puma-background min-h-screen">
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-puma-dark mb-2">Mi Perfil</h1>
            <p className="text-puma-text text-sm">Administra tu información académica y tus conexiones universitarias.</p>
            <div className="mt-3 h-1 w-16 rounded-full bg-puma-secondary"></div>
          </div>
          <div className="relative self-start">
            <button
              type="button"
              onClick={() => setMostrarNotificaciones((actual) => !actual)}
              className="relative w-11 h-11 rounded-xl bg-puma-background border border-gray-200 text-puma-dark hover:border-puma-secondary hover:bg-puma-secondary/20 transition-colors"
              aria-label="Ver notificaciones del perfil"
            >
              <i className="fa-solid fa-bell"></i>
              {notificacionesPerfil.some((notificacion) => !notificacion.leida) && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-puma-secondary text-[10px] font-bold text-puma-dark flex items-center justify-center">
                  {notificacionesPerfil.filter((notificacion) => !notificacion.leida).length}
                </span>
              )}
            </button>

            {mostrarNotificaciones && (
              <div className="absolute right-0 top-12 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                <h4 className="text-sm font-bold text-puma-dark mb-2">Notificaciones</h4>
                <div className="space-y-2">
                  {notificacionesPerfil.slice(0, 5).map((notificacion) => (
                    <button
                      key={`${notificacion.texto}-${notificacion.tiempo}`}
                      type="button"
                      onClick={() => manejarClickNotificacion(notificacion)}
                      className={`w-full flex items-start gap-3 rounded-lg p-3 text-left hover:bg-puma-secondary/10 transition-colors ${
                        notificacion.leida ? 'bg-puma-background' : 'bg-puma-background border border-dashed border-puma-secondary'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-white text-puma-amber flex items-center justify-center shrink-0 border border-gray-200">
                        <i className={`fa-solid ${notificacion.icon} text-xs`}></i>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-puma-dark">{notificacion.texto}</p>
                        <p className="text-[11px] text-puma-text">{notificacion.tiempo}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarHistorialNotificaciones(true);
                    setMostrarNotificaciones(false);
                  }}
                  className="mt-3 w-full border-t border-gray-100 pt-3 text-xs font-bold text-puma-primary hover:text-puma-dark transition-colors"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: 'fa-bookmark', label: 'Eventos guardados', value: eventosGuardadosLocales.length },
            { icon: 'fa-newspaper', label: 'Publicaciones guardadas', value: publicacionesGuardadasLocales.length },
          ].map(({ icon, label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (label === 'Eventos guardados') setMostrarEventosGuardados(true);
                if (label === 'Publicaciones guardadas') setMostrarPublicacionesGuardadas(true);
              }}
              className="min-w-0 rounded-xl bg-puma-background border border-gray-200 px-3 py-2 shadow-sm text-left hover:border-puma-secondary transition-colors"
            >
              <div className="flex items-center gap-2 text-puma-amber">
                <i className={`fa-solid ${icon} text-xs`}></i>
                <span className="text-[11px] font-bold uppercase tracking-wide truncate">{label}</span>
              </div>
              <p className="text-lg font-bold text-puma-dark mt-1 truncate">{value}</p>
            </button>
          ))}
        </div>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-32 h-32 rounded-full border-4 border-puma-secondary p-1 mb-4 overflow-hidden bg-puma-background shadow-sm">
              <img src={fotoPerfilActual} alt={perfil.nombre} className="w-full h-full object-cover rounded-full" />
            </div>
            <h2 className="text-2xl font-bold text-puma-dark">{perfil.nombre}</h2>
            <p className="text-sm font-semibold text-puma-primary mt-1">{perfil.carrera}</p>
            <p className="text-xs text-puma-text mt-2">{perfil.centroUniversitario}</p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarAgregarPumita(true)}
            className="mt-5 w-full text-left rounded-xl border border-puma-secondary/40 bg-puma-secondary/10 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-white text-puma-primary flex items-center justify-center border border-puma-secondary/30">
                <i className="fa-solid fa-user-plus"></i>
              </span>
              <div>
                <p className="font-bold text-puma-dark text-sm">Agregar a mi red</p>
                <p className="text-xs text-puma-text">Conecta con otros pumitas</p>
              </div>
            </div>
          </button>

          <button
            onClick={iniciarEdicion}
            className="mt-5 w-full bg-puma-secondary hover:bg-puma-secondaryLight text-puma-dark font-bold py-3 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            Editar Perfil
          </button>

          <button
            type="button"
            onClick={() => {
              setMostrarCambioCarrera(true);
              setErrorCambioCarrera('');
              setMensajeCambioCarrera('');
            }}
            className="mt-3 w-full bg-white hover:bg-puma-background text-puma-dark border border-gray-200 font-bold py-3 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-left text-puma-amber"></i>
            Solicitar cambio de carrera
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-puma-dark mb-4">Información personal</h3>
          <div className="space-y-4 text-sm">
            {[
              { icon: 'fa-briefcase', label: 'Carrera', value: perfil.carrera },
              { icon: 'fa-building-columns', label: 'Facultad', value: perfil.facultad },
              { icon: 'fa-location-dot', label: 'Centro regional', value: perfil.centroUniversitario },
              { icon: 'fa-envelope', label: 'Correo institucional', value: perfil.correoInstitucional },
              { icon: 'fa-circle-check', label: 'Estado académico', value: perfil.estadoAcademico },
              { icon: 'fa-calendar-days', label: 'Miembro desde', value: perfil.miembroDesde },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <span className="w-8 h-8 rounded-lg bg-puma-background text-puma-amber flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${icon} text-xs`}></i>
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-puma-text font-bold uppercase tracking-wide">{label}</p>
                  <p className="text-puma-dark font-semibold break-words">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="lg:col-span-8 xl:col-span-9 space-y-6">
        <section className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Mis Pumitas</h3>
              <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-puma-secondary"></div>
              <p className="text-sm text-puma-text">Contactos recientes dentro de tu red universitaria.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarRedPumita((actual) => !actual)}
              className="self-start sm:self-auto px-4 py-2 rounded-lg bg-puma-background border border-gray-200 text-sm font-bold text-puma-dark hover:bg-puma-secondary transition-colors"
            >
              {mostrarRedPumita ? 'Ocultar Red Pumita' : 'Ver todos'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pumitas.slice(0, 4).map((pumita) => {
              const dejadoDeSeguir = dejadosDeSeguir.includes(pumita.nombre);
              const estadoVisual = pumitasAceptados.includes(pumita.nombre) ? 'Conectado' : pumita.estado;

              return (
                <article key={pumita.nombre} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-puma-secondary hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <img src={pumita.avatar} alt={pumita.nombre} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-puma-dark truncate">{pumita.nombre}</h4>
                      <p className="text-xs text-puma-text truncate">{pumita.carrera}</p>
                      <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${dejadoDeSeguir ? 'bg-gray-100 text-puma-text border-gray-200' : obtenerEstiloEstadoPumita(estadoVisual)}`}>
                        {dejadoDeSeguir ? 'Sin seguir' : estadoVisual}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => abrirPerfilPumita(pumita)}
                      className="border border-gray-200 rounded-lg py-2 text-xs font-bold text-puma-dark hover:border-puma-secondary hover:bg-puma-background transition-colors"
                    >
                      Ver perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => (dejadoDeSeguir ? volverASeguirPumita(pumita.nombre) : setPumitaPorDejar(pumita))}
                      className={`border rounded-lg py-2 text-xs font-bold transition-colors ${
                        dejadoDeSeguir
                          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          : 'border-puma-danger/20 text-puma-danger hover:bg-puma-danger/10'
                      }`}
                    >
                      {dejadoDeSeguir ? 'Volver a seguir' : 'Dejar de seguir'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {mostrarRedPumita && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-lg font-bold text-puma-dark">Red Pumita</h4>
                  <p className="text-xs text-puma-text">Pumitas conectadas, pendientes y sugeridas.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-puma-secondary/20 text-puma-dark text-xs font-bold border border-puma-secondary/40">
                  {pumitas.length} contactos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pumitas.map((pumita) => {
                  const dejadoDeSeguir = dejadosDeSeguir.includes(pumita.nombre);
                  const estadoVisual = pumitasAceptados.includes(pumita.nombre) ? 'Conectado' : pumita.estado;

                  return (
                    <article key={`red-${pumita.nombre}`} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                      <img src={pumita.avatar} alt={pumita.nombre} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-puma-dark truncate">{pumita.nombre}</h5>
                        <p className="text-xs text-puma-text truncate">{pumita.carrera}</p>
                        <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${dejadoDeSeguir ? 'bg-gray-100 text-puma-text border-gray-200' : obtenerEstiloEstadoPumita(estadoVisual)}`}>
                          {dejadoDeSeguir ? 'Sin seguir' : estadoVisual}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => abrirPerfilPumita(pumita)}
                          className="px-3 py-2 rounded-lg bg-puma-background border border-gray-200 text-xs font-bold text-puma-dark hover:bg-puma-secondary transition-colors"
                        >
                          Ver perfil
                        </button>
                        <button
                          type="button"
                          onClick={() => (dejadoDeSeguir ? volverASeguirPumita(pumita.nombre) : setPumitaPorDejar(pumita))}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                            dejadoDeSeguir
                              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              : 'border-puma-danger/20 text-puma-danger hover:bg-puma-danger/10'
                          }`}
                        >
                          {dejadoDeSeguir ? 'Volver a seguir' : 'Dejar de seguir'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Interacción Social</h3>
              <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-puma-secondary"></div>
              <p className="text-sm text-puma-text">
                Activa o desactiva las reacciones que otros Pumitas pueden enviarte.
              </p>
            </div>

            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <span className="text-sm font-bold text-puma-dark">{interaccionesActivas ? 'ON' : 'OFF'}</span>
              <button
                type="button"
                onClick={() => setInteraccionesActivas((actual) => !actual)}
                className={`relative w-14 h-8 rounded-full border shadow-inner transition-all duration-300 ${
                  interaccionesActivas ? 'bg-puma-secondary border-puma-secondary' : 'bg-white border-gray-300'
                }`}
                aria-label="Activar o desactivar interacciones sociales"
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                    interaccionesActivas ? 'translate-x-7' : 'translate-x-1'
                  } ${interaccionesActivas ? 'bg-puma-primary' : 'bg-puma-dark'}`}
                />
              </button>
            </label>
          </div>

          {!interaccionesActivas && (
            <p className="mt-3 text-xs text-puma-text">Las reacciones al perfil están deshabilitadas.</p>
          )}
        </section>

        <section className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-puma-dark">Gestión académica básica</h3>
            <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-puma-secondary"></div>
            <p className="text-sm text-puma-text">Accesos rápidos a contenido guardado y trámites del perfil.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMostrarEventosGuardados(true)}
              className="rounded-xl border border-gray-200 bg-puma-background p-4 text-left shadow-sm hover:border-puma-secondary transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-white text-puma-amber flex items-center justify-center border border-gray-200">
                <i className="fa-solid fa-calendar-check"></i>
              </span>
              <h4 className="mt-3 font-bold text-puma-dark">Ver eventos guardados</h4>
              <p className="text-sm text-puma-text mt-1">Consulta eventos guardados sin cargar la vista principal.</p>
            </button>

            <button
              type="button"
              onClick={() => setMostrarPublicacionesGuardadas(true)}
              className="rounded-xl border border-gray-200 bg-puma-background p-4 text-left shadow-sm hover:border-puma-secondary transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-white text-puma-amber flex items-center justify-center border border-gray-200">
                <i className="fa-solid fa-bookmark"></i>
              </span>
              <h4 className="mt-3 font-bold text-puma-dark">Ver publicaciones guardadas</h4>
              <p className="text-sm text-puma-text mt-1">Abre tus publicaciones guardadas en una vista separada.</p>
            </button>
          </div>
        </section>
      </main>
    </div>

    {efectoReaccion && (
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-puma-dark/20 p-4">
        <div className="absolute left-[12%] top-[18%] text-6xl opacity-80 animate-bounce">
          {efectoReaccion === 'apoyo' ? '👍' : efectoReaccion === 'confeti' ? '🎉' : efectoReaccion === 'saludo' ? '👋' : '🐾'}
        </div>
        <div className="absolute right-[14%] top-[24%] text-5xl opacity-80 animate-pulse">
          {efectoReaccion === 'apoyo' ? '👍' : efectoReaccion === 'confeti' ? '✨' : efectoReaccion === 'saludo' ? '👏' : '🐾'}
        </div>
        <div className="absolute bottom-[18%] left-[22%] text-5xl opacity-80 animate-bounce">
          {efectoReaccion === 'apoyo' ? '👍' : efectoReaccion === 'confeti' ? '🎊' : efectoReaccion === 'saludo' ? '👋' : '🐾'}
        </div>
        <div
          className={`rounded-3xl border border-puma-secondary/60 bg-white/95 px-8 py-7 text-center shadow-2xl ${
            efectoReaccion === 'rugido' ? 'animate-pulse' : 'animate-bounce'
          }`}
        >
          <p className="mb-2 text-2xl">🔊</p>
          <p className="text-6xl md:text-7xl">
            {efectoReaccion === 'apoyo'
              ? '👍 👍 👍'
              : efectoReaccion === 'confeti'
                ? '🎉 ✨ 🎉'
                : efectoReaccion === 'saludo'
                  ? '👋 👏 👋'
                  : '🐾 🐾 🐾'}
          </p>
          {efectoReaccion === 'rugido' && (
            <p className="mt-4 text-2xl md:text-3xl font-black text-puma-dark">¡Rugido Puma!</p>
          )}
        </div>
      </div>
    )}

    {mostrarHistorialNotificaciones && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Historial de notificaciones</h3>
              <p className="text-sm text-puma-text">Busca y revisa tus notificaciones del perfil.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarHistorialNotificaciones(false)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar historial de notificaciones"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="relative mb-4">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-puma-text text-xs"></i>
            <input
              value={busquedaNotificaciones}
              onChange={(e) => setBusquedaNotificaciones(e.target.value)}
              placeholder="Buscar notificaciones..."
              className="w-full rounded-xl border border-gray-200 bg-puma-background py-3 pl-9 pr-3 text-sm outline-none focus:border-puma-secondary"
            />
          </div>

          <div className="space-y-2">
            {notificacionesPerfil
              .filter((notificacion) => notificacion.texto.toLowerCase().includes(busquedaNotificaciones.toLowerCase()))
              .map((notificacion) => (
                <button
                  key={`historial-${notificacion.texto}-${notificacion.tiempo}`}
                  type="button"
                  onClick={() => manejarClickNotificacion(notificacion)}
                  className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-puma-secondary/10 ${
                    notificacion.leida ? 'border border-gray-200 bg-white' : 'border border-dashed border-puma-secondary bg-puma-background'
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg bg-white text-puma-amber flex items-center justify-center shrink-0 border border-gray-200">
                    <i className={`fa-solid ${notificacion.icon} text-xs`}></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-puma-dark">{notificacion.texto}</p>
                    <p className="text-xs text-puma-text">{notificacion.tiempo}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    )}

    {solicitudNotificacion && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-center gap-3">
            <img src={solicitudNotificacion.avatar} alt={solicitudNotificacion.nombre} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
            <div>
              <h3 className="text-lg font-bold text-puma-dark">{solicitudNotificacion.nombre}</h3>
              <p className="text-sm text-puma-text">{solicitudNotificacion.carrera}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-puma-text">Quiere unirse a tu Red Pumita.</p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => rechazarSolicitudPumita(solicitudNotificacion.nombre)}
              className="rounded-lg border border-puma-danger/20 bg-white py-3 text-sm font-bold text-puma-danger hover:bg-puma-danger/10 transition-colors"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => aceptarSolicitudPumita(solicitudNotificacion.nombre)}
              className="rounded-lg bg-puma-secondary py-3 text-sm font-bold text-puma-dark hover:bg-puma-secondaryLight transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    )}

    {mostrarEventosGuardados && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl max-h-[86vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Eventos guardados</h3>
              <p className="text-sm text-puma-text">Eventos guardados para consultar después.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarEventosGuardados(false)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar eventos guardados"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {eventosGuardadosLocales.map((evento) => (
              <article key={`modal-${evento.titulo}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setEventoSeleccionado(evento)}
                  className="text-left font-bold text-puma-dark hover:text-puma-primary transition-colors"
                >
                  {evento.titulo}
                </button>
                <p className="text-xs text-puma-text mt-1">{evento.fecha}</p>
                <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-puma-secondary/20 border border-puma-secondary/40 text-[11px] font-bold text-puma-dark">
                  {evento.estado}
                </span>
                <p className="text-xs text-puma-text mt-3">{evento.descripcion}</p>
                <button
                  type="button"
                  onClick={() => quitarEventoGuardado(evento.titulo)}
                  className="mt-4 w-full rounded-lg border border-puma-danger/20 px-3 py-2 text-xs font-bold text-puma-danger hover:bg-puma-danger/10 transition-colors"
                >
                  Quitar de guardados
                </button>
              </article>
            ))}
            {eventosGuardadosLocales.length === 0 && (
              <p className="md:col-span-3 rounded-xl border border-gray-200 bg-puma-background p-4 text-sm font-semibold text-puma-text">
                No tienes eventos guardados.
              </p>
            )}
          </div>
        </div>
      </div>
    )}

    {mostrarPublicacionesGuardadas && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl max-h-[86vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Publicaciones guardadas</h3>
              <p className="text-sm text-puma-text">Publicaciones académicas guardadas para consultar después.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarPublicacionesGuardadas(false)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar publicaciones guardadas"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {publicacionesGuardadasLocales.map((publicacion) => (
              <article key={`modal-${publicacion.titulo}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-puma-secondary transition-colors">
                <button
                  type="button"
                  onClick={() => setPublicacionSeleccionada(publicacion)}
                  className="text-left font-bold text-puma-dark hover:text-puma-primary transition-colors"
                >
                  {publicacion.titulo}
                </button>
                <p className="text-xs text-puma-text mt-2">Autor: {publicacion.autor}</p>
                <p className="text-xs text-puma-text">Guardado: {publicacion.fechaGuardado}</p>
                <p className="text-sm text-puma-text mt-3 leading-relaxed">{publicacion.descripcion}</p>
                <button
                  type="button"
                  onClick={() => quitarPublicacionGuardada(publicacion.titulo)}
                  className="mt-4 w-full rounded-lg border border-puma-danger/20 px-3 py-2 text-xs font-bold text-puma-danger hover:bg-puma-danger/10 transition-colors"
                >
                  Quitar de guardados
                </button>
              </article>
            ))}
            {publicacionesGuardadasLocales.length === 0 && (
              <p className="md:col-span-3 rounded-xl border border-gray-200 bg-puma-background p-4 text-sm font-semibold text-puma-text">
                No tienes publicaciones guardadas.
              </p>
            )}
          </div>
        </div>
      </div>
    )}

    {publicacionSeleccionada && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-puma-amber">Detalle de publicación guardada</p>
              <h3 className="mt-1 text-2xl md:text-3xl font-bold text-puma-dark">{publicacionSeleccionada.titulo}</h3>
              <p className="text-sm text-puma-text">Autor: {publicacionSeleccionada.autor}</p>
              <p className="text-xs text-puma-text">Guardado: {publicacionSeleccionada.fechaGuardado}</p>
            </div>
            <button
              type="button"
              onClick={() => setPublicacionSeleccionada(null)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar publicación guardada"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-puma-background p-4">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <span className="w-11 h-11 rounded-full bg-puma-secondary text-puma-dark flex items-center justify-center shrink-0">
                <i className="fa-solid fa-bookmark"></i>
              </span>
              <div className="min-w-0">
                <p className="font-bold text-puma-dark">{publicacionSeleccionada.autor}</p>
                <p className="text-xs text-puma-text">Publicación guardada · {publicacionSeleccionada.fechaGuardado}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-puma-text">{publicacionSeleccionada.detalle}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-3 text-xs font-bold text-puma-text">
              <span className="rounded-full bg-white border border-gray-200 px-3 py-1">Guardada</span>
              <span className="rounded-full bg-white border border-gray-200 px-3 py-1">Vista de detalle</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPublicacionSeleccionada(null)}
            className="mt-5 w-full bg-puma-secondary text-puma-dark font-bold py-3 rounded-lg hover:bg-puma-secondaryLight transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => quitarPublicacionGuardada(publicacionSeleccionada.titulo)}
            className="mt-3 w-full border border-puma-danger/20 text-puma-danger font-bold py-3 rounded-lg hover:bg-puma-danger/10 transition-colors"
          >
            Quitar de guardados
          </button>
        </div>
      </div>
    )}

    {eventoSeleccionado && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-puma-amber">Detalle del evento guardado</p>
              <h3 className="mt-1 text-2xl md:text-3xl font-bold text-puma-dark">{eventoSeleccionado.titulo}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex px-3 py-1 rounded-full bg-puma-secondary/20 border border-puma-secondary/40 text-xs font-bold text-puma-dark">
                  {eventoSeleccionado.estado}
                </span>
                <span className="inline-flex px-3 py-1 rounded-full bg-puma-background border border-gray-200 text-xs font-bold text-puma-text">
                  {eventoSeleccionado.fecha}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEventoSeleccionado(null)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar evento guardado"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-puma-background p-5">
              <h4 className="text-lg font-bold text-puma-dark">Información del evento</h4>
              <p className="mt-3 text-sm leading-relaxed text-puma-text">{eventoSeleccionado.detalle}</p>
              <p className="mt-4 text-sm leading-relaxed text-puma-text">{eventoSeleccionado.descripcion}</p>
            </div>
            <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="font-bold text-puma-dark">Acciones</h4>
              <button
                type="button"
                onClick={() => setEventoSeleccionado(null)}
                className="mt-4 w-full bg-puma-secondary text-puma-dark font-bold py-3 rounded-lg hover:bg-puma-secondaryLight transition-colors"
              >
                Volver a eventos guardados
              </button>
              <button
                type="button"
                onClick={() => quitarEventoGuardado(eventoSeleccionado.titulo)}
                className="mt-3 w-full border border-puma-danger/20 text-puma-danger font-bold py-3 rounded-lg hover:bg-puma-danger/10 transition-colors"
              >
                Quitar de guardados
              </button>
            </aside>
          </div>
        </div>
      </div>
    )}

    {pumitaSeleccionada && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-6">
          <button
            type="button"
            onClick={() => {
              setPumitaSeleccionada(null);
              setMensajePerfilPumita('');
              setMostrarMenuReaccionesPumita(false);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
            aria-label="Cerrar perfil de Pumita"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full border-4 border-puma-secondary bg-puma-background p-1 shadow-sm">
              <img
                src={pumitaSeleccionada.avatar}
                alt={pumitaSeleccionada.nombre}
                className="w-full h-full rounded-full object-contain bg-white"
              />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-puma-dark">{pumitaSeleccionada.nombre}</h3>
            <p className="text-sm font-semibold text-puma-primary">{pumitaSeleccionada.carrera}</p>
            <p className="mt-4 text-sm leading-relaxed text-puma-text">{pumitaSeleccionada.biografia}</p>

            {mensajePerfilPumita && (
              <p className="mt-4 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {mensajePerfilPumita}
              </p>
            )}

            {perteneceARedPumita(pumitaSeleccionada) ? (
              <div className="mt-6 w-full space-y-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMostrarMenuReaccionesPumita((actual) => !actual)}
                    className="w-full border border-gray-200 bg-puma-background text-puma-dark font-bold py-3 rounded-lg hover:border-puma-secondary transition-colors"
                  >
                    Reaccionar ▼
                  </button>

                  {mostrarMenuReaccionesPumita && (
                    <div className="absolute left-0 right-0 top-12 z-20 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                      <div className="grid grid-cols-1 gap-2">
                        {reaccionesPumita.map((reaccion) => (
                          <button
                            key={`perfil-${pumitaSeleccionada.nombre}-${reaccion}`}
                            type="button"
                            onClick={() => enviarReaccionPumita(pumitaSeleccionada.nombre, reaccion)}
                            className="rounded-lg px-3 py-2 text-left text-sm font-bold text-puma-dark hover:bg-puma-secondary/20 transition-colors"
                          >
                            {reaccion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 w-full space-y-3">
                <button
                  type="button"
                  onClick={() => enviarSolicitudPumita(pumitaSeleccionada.nombre)}
                  disabled={solicitudesEnviadas.includes(pumitaSeleccionada.nombre)}
                  className={`w-full font-bold py-3 rounded-lg transition-colors ${
                    solicitudesEnviadas.includes(pumitaSeleccionada.nombre)
                      ? 'bg-puma-background text-puma-text border border-gray-200 cursor-not-allowed'
                      : 'bg-puma-secondary text-puma-dark hover:bg-puma-secondaryLight'
                  }`}
                >
                  {solicitudesEnviadas.includes(pumitaSeleccionada.nombre) ? 'Solicitud enviada' : 'Agregar Pumita'}
                </button>
                {solicitudesEnviadas.includes(pumitaSeleccionada.nombre) && (
                  <button
                    type="button"
                    onClick={() => cancelarSolicitudPumita(pumitaSeleccionada.nombre)}
                    className="w-full rounded-lg border border-puma-danger/20 py-3 text-sm font-bold text-puma-danger hover:bg-puma-danger/10 transition-colors"
                  >
                    Cancelar solicitud
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {mostrarAdvertenciaHoras && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-11 h-11 rounded-lg bg-puma-secondary/20 text-puma-amber flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </span>
            <h3 className="text-xl font-bold text-puma-dark">Aviso sobre horas</h3>
          </div>
          <p className="text-sm leading-relaxed text-puma-text">
            Recuerda: estas horas solo son acumuladas por la aplicación; por tanto, las únicas horas válidas para el artículo 140 son aquellas que aprobó y emitió el departamento de VOAE.
          </p>
          <button
            type="button"
            onClick={() => setMostrarAdvertenciaHoras(false)}
            className="mt-5 w-full bg-puma-secondary text-puma-dark font-bold py-3 rounded-lg hover:bg-puma-secondaryLight transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    )}

    {pumitaPorDejar && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-2xl p-5">
          <h3 className="text-lg font-bold text-puma-dark">Dejar de seguir</h3>
          <p className="mt-3 text-sm text-puma-text">
            ¿Deseas dejar de seguir a {pumitaPorDejar.nombre}?
          </p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => setPumitaPorDejar(null)}
              className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-bold text-puma-dark hover:bg-puma-background transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => dejarDeSeguirPumita(pumitaPorDejar.nombre)}
              className="rounded-lg bg-puma-danger py-3 text-sm font-bold text-white hover:bg-puma-danger/90 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )}

    {mostrarCambioCarrera && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Solicitar cambio de carrera</h3>
              <p className="text-sm text-puma-text">Completa la solicitud para revisión académica.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarCambioCarrera(false)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar cambio de carrera"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs text-puma-text font-bold uppercase tracking-wide mb-2">Carrera actual</span>
              <input
                value={perfil.carrera}
                readOnly
                className="w-full bg-puma-background border border-gray-200 rounded-lg px-3 py-3 text-sm text-puma-text cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-puma-text font-bold uppercase tracking-wide mb-2">Nueva carrera</span>
              <input
                value={nuevaCarrera}
                onChange={(e) => setNuevaCarrera(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-puma-dark outline-none focus:border-puma-primary"
                placeholder="Ej. Ingeniería Industrial"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-puma-text font-bold uppercase tracking-wide mb-2">Centro regional</span>
              <input
                value={centroRegionalCambio}
                onChange={(e) => setCentroRegionalCambio(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-puma-dark outline-none focus:border-puma-primary"
                placeholder="Ej. UNAH-CU"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-puma-text font-bold uppercase tracking-wide mb-2">Motivo del cambio</span>
              <textarea
                value={motivoCambioCarrera}
                onChange={(e) => setMotivoCambioCarrera(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-puma-dark outline-none focus:border-puma-primary min-h-28 resize-none"
                placeholder="Explica brevemente el motivo del cambio..."
              />
            </label>
          </div>

          {errorCambioCarrera && (
            <p className="mt-3 rounded-lg border border-puma-danger/20 bg-puma-danger/10 px-3 py-2 text-xs font-semibold text-puma-danger">
              {errorCambioCarrera}
            </p>
          )}

          {mensajeCambioCarrera && (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              {mensajeCambioCarrera}
            </p>
          )}

          <button
            type="button"
            onClick={enviarCambioCarrera}
            className="mt-5 w-full bg-puma-secondary text-puma-dark font-bold py-3 rounded-lg hover:bg-puma-secondaryLight transition-colors"
          >
            Enviar solicitud
          </button>
        </div>
      </div>
    )}

    {mostrarRegistroAcademico && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Agregar registro académico</h3>
              <p className="text-sm text-puma-text">Carga Carnet y Forma 003 para el período seleccionado.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarRegistroAcademico(false)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar registro académico"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs text-puma-text font-bold uppercase tracking-wide mb-2">Período académico</span>
              <input
                value={periodoRegistro}
                onChange={(e) => setPeriodoRegistro(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-puma-dark outline-none focus:border-puma-primary"
                placeholder="Ej. III PAC 2026"
              />
            </label>

            <label className="block cursor-pointer rounded-lg border border-gray-200 bg-puma-background p-4 hover:border-puma-secondary transition-colors">
              <span className="block text-xs text-puma-text font-bold uppercase tracking-wide mb-1">Cargar Carnet</span>
              <span className="text-sm font-semibold text-puma-dark">{carnetRegistro || 'PDF, JPG o PNG máximo 10 MB'}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => manejarSeleccionRegistro('Carnet', e)}
              />
            </label>

            <label className="block cursor-pointer rounded-lg border border-gray-200 bg-puma-background p-4 hover:border-puma-secondary transition-colors">
              <span className="block text-xs text-puma-text font-bold uppercase tracking-wide mb-1">Cargar Forma 003</span>
              <span className="text-sm font-semibold text-puma-dark">{forma003Registro || 'PDF, JPG o PNG máximo 10 MB'}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => manejarSeleccionRegistro('Forma 003', e)}
              />
            </label>
          </div>

          {mensajeDocumento && (
            <p className="mt-3 rounded-lg border border-puma-secondary/40 bg-puma-secondary/10 px-3 py-2 text-xs font-semibold text-puma-dark">
              {mensajeDocumento}
            </p>
          )}

          <button
            type="button"
            onClick={agregarRegistroAcademico}
            className="mt-5 w-full bg-puma-secondary text-puma-dark font-bold py-3 rounded-lg hover:bg-puma-secondaryLight transition-colors"
          >
            Validar registro
          </button>
        </div>
      </div>
    )}

    {mostrarAgregarPumita && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl">
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-puma-dark">Agregar Pumita a mi red</h3>
              <p className="text-sm text-puma-text">Sugerencias de compañeras y compañeros para conectar.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarAgregarPumita(false)}
              className="w-9 h-9 rounded-lg bg-puma-background border border-gray-200 text-puma-dark hover:bg-puma-secondary transition-colors"
              aria-label="Cerrar Agregar Pumita"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-puma-background p-3">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-puma-text text-sm"></i>
                <input
                  value={busquedaAgregarPumita}
                  onChange={(e) => setBusquedaAgregarPumita(e.target.value)}
                  placeholder="Buscar usuarios..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-puma-secondary"
                />
              </div>
            </div>

            <section className="rounded-xl border border-gray-200 bg-puma-background p-3">
              <h4 className="text-sm font-bold text-puma-dark mb-3">Solicitudes pendientes</h4>
              <div className="space-y-2">
                {solicitudesPendientesFiltradas.length === 0 && (
                  <p className="text-xs font-semibold text-puma-text">No hay solicitudes pendientes.</p>
                )}
                {solicitudesPendientesFiltradas.map((pumita) => (
                  <article key={`pendiente-${pumita.nombre}`} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                    <img src={pumita.avatar} alt={pumita.nombre} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-bold text-puma-dark truncate">{pumita.nombre}</h5>
                      <p className="text-xs text-puma-text truncate">{pumita.carrera}</p>
                      <span className="inline-flex mt-2 rounded-full border border-puma-secondary/40 bg-puma-secondary/20 px-2 py-0.5 text-[11px] font-bold text-puma-dark">
                        Pendiente
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => rechazarSolicitudPumita(pumita.nombre)}
                        className="rounded-lg border border-puma-danger/20 px-3 py-2 text-[11px] font-bold text-puma-danger hover:bg-puma-danger/10 transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => aceptarSolicitudPumita(pumita.nombre)}
                        className="rounded-lg bg-puma-secondary px-3 py-2 text-[11px] font-bold text-puma-dark hover:bg-puma-secondaryLight transition-colors"
                      >
                        Aceptar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-bold text-puma-dark">Resultados</h4>
              {sugerenciasPumitas.map((pumita) => {
                const solicitudLocal = solicitudesEnviadas.includes(pumita.nombre);
                const estadoResultado = solicitudLocal ? 'Solicitud enviada' : pumita.estado;

                return (
                  <article key={`agregar-${pumita.nombre}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <img src={pumita.avatar} alt={pumita.nombre} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-puma-dark truncate">{pumita.nombre}</h4>
                      <p className="text-xs text-puma-text truncate">{pumita.carrera}</p>
                      <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                        estadoResultado === 'Solicitud enviada'
                          ? 'border-puma-secondary/40 bg-puma-secondary/20 text-puma-dark'
                          : obtenerEstiloEstadoPumita(estadoResultado as EstadoPumita)
                      }`}>
                        {estadoResultado}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {solicitudLocal ? (
                        <button
                          type="button"
                          onClick={() => cancelarSolicitudPumita(pumita.nombre)}
                          className="px-3 py-2 rounded-lg border border-puma-danger/20 text-xs font-bold text-puma-danger hover:bg-puma-danger/10 transition-colors"
                        >
                          Cancelar solicitud
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => enviarSolicitudPumita(pumita.nombre)}
                          className="px-3 py-2 rounded-lg bg-puma-secondary text-xs font-bold text-puma-dark hover:bg-puma-secondaryLight transition-colors"
                        >
                          Agregar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
              {sugerenciasPumitas.length === 0 && solicitudesPendientesFiltradas.length === 0 && (
                <p className="rounded-xl border border-gray-200 bg-puma-background p-4 text-sm font-semibold text-puma-text">
                  No se encontraron usuarios.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    )}

    {eventoQuitado && (
      <div className="fixed bottom-4 left-4 right-4 z-[70] sm:left-auto sm:right-6 sm:w-96">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-2xl">
          <p className="text-sm font-semibold text-puma-dark">Evento quitado de guardados</p>
          <button
            type="button"
            onClick={deshacerQuitarEvento}
            className="shrink-0 rounded-lg bg-puma-secondary px-3 py-2 text-xs font-bold text-puma-dark hover:bg-puma-secondaryLight transition-colors"
          >
            Deshacer
          </button>
        </div>
      </div>
    )}

    {publicacionQuitada && (
      <div className="fixed bottom-4 left-4 right-4 z-[70] sm:left-auto sm:right-6 sm:w-96">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-2xl">
          <p className="text-sm font-semibold text-puma-dark">Publicación quitada de guardados</p>
          <button
            type="button"
            onClick={deshacerQuitarPublicacion}
            className="shrink-0 rounded-lg bg-puma-secondary px-3 py-2 text-xs font-bold text-puma-dark hover:bg-puma-secondaryLight transition-colors"
          >
            Deshacer
          </button>
        </div>
      </div>
    )}
  </div>
);
};
