import React, { useEffect, useRef, useState } from 'react';
import { reaccionesService } from '../../../services/reacciones.service';
import type { TipoReaccionPumita } from '../../../types';
import { pumitasService, type Pumita } from '../../../services/pumitas.service';
import { useAuth } from '../../../hooks/useAuth';
import { useNotificaciones } from '../../../hooks/useNotificaciones';
import { useNavigate } from 'react-router';
import { authService } from '../../../services/auth.service';
import { forma003Service, type RegistroForma003 } from '../../../services/forma003.service';
import {
  cambioCarreraService,
  type CarreraCambioCarrera,
  type CentroRegionalCambioCarrera,
  type ContextoActualCambioCarrera,
  type SolicitudCambioCarrera,
} from '../../../services/cambio-carrera.service';
interface PerfilProps {
  rolSimulado?: string;
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
  id_registro: number;
  periodo: string;
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
  id_usuario: number;
  id_conexion: number | null;
  nombre: string;
  carrera: string;
  avatar: string;
  estado: EstadoPumita;
  biografia: string;
  activo: boolean;
  solicitudEnviada?: boolean;
}

const ICONO_POR_TIPO_NOTIFICACION: Record<string, string> = {
  EVENTO_APROBADO: 'fa-calendar-check',
  EVENTO_RECHAZADO: 'fa-calendar-xmark',
  NUEVA_INSCRIPCION: 'fa-user-plus',
  EVENTO_CANCELADO: 'fa-calendar-xmark',
  CONSTANCIA_EMITIDA: 'fa-file-circle-check',
  RECORDATORIO: 'fa-bell',
  SISTEMA: 'fa-gear',
  REACCION_PUMITA: 'fa-heart',
  SOLICITUD_PUMITA: 'fa-user-plus',
  EVENTO_DISPONIBLE: 'fa-calendar-days',
};

// Solo estos tipos deben aparecer en la campanita de "Mi Perfil"
const TIPOS_VISIBLES_EN_PERFIL: readonly string[] = [
  'REACCION_PUMITA',
  'SOLICITUD_PUMITA',
  'EVENTO_DISPONIBLE',
  // 'PUBLICACION_NUEVA', // ← agregar cuando exista el módulo de publicaciones
];

function tiempoRelativoNotificacion(fechaIso: string): string {
  const diffMs = Date.now() - new Date(fechaIso).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return 'Justo ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

interface NotificacionPerfil {
  id: string;
  icon: string;
  texto: string;
  tiempo: string;
  leida: boolean;
  tipo: 'reaccion' | 'solicitud' | 'evento' | 'general';
  nombre?: string;
  referenciaId?: number;
}

const reaccionesPumita = ['👍 Apoyo', '🎉 Felicitación', '👋 Saludo', '🐾 Rugido Puma'];


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

const ESTADO_LABEL: Record<string, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  SUSPENDIDO: 'Suspendido',
};

const formatearMiembroDesde = (fecha?: string) => {
  if (!fecha) return '—';
  const texto = new Date(fecha).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' });
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
};

const mapearUsuarioAPerfil = (usuario: any): PerfilData => ({
  nombre: usuario?.nombre ?? '',
  carrera: usuario?.carrera ?? 'Sin carrera asignada',
  facultad: usuario?.facultad ?? 'Sin facultad asignada',
  centroUniversitario: usuario?.centro_regional ?? 'Sin centro regional',
  correoInstitucional: usuario?.correo ?? '',
  estadoAcademico: ESTADO_LABEL[usuario?.estado] ?? usuario?.estado ?? '',
  miembroDesde: formatearMiembroDesde(usuario?.created_at),
  biografia: usuario?.biografia ?? '',
  horasAcumuladas: 42,
  dobleFactor: true,
  forma003: '',
});

const mapearRegistroApi = (r: RegistroForma003): DocumentoForma003 => ({
  id_registro: r.id_registro,
  periodo: r.periodo,
  fechaCarga: new Date(r.fecha_carga).toLocaleDateString(),
  estado: r.estado === 'VALIDADO' ? 'Validado' : r.estado === 'RECHAZADO' ? 'Rechazado' : 'Pendiente',
});

const archivoABase64 = (archivo: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result as string);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(archivo);
  });

export const Perfil: React.FC<PerfilProps> = ({ rolSimulado }) => {
  const [viewMode, setViewMode] = useState<'ver' | 'editar'>('ver');
  const { usuario, actualizarUsuario } = useAuth();
const [perfil, setPerfil] = useState<PerfilData>(() => mapearUsuarioAPerfil(usuario));
const [borrador, setBorrador] = useState<PerfilData>(() => mapearUsuarioAPerfil(usuario));

useEffect(() => {
  if (usuario) setPerfil(mapearUsuarioAPerfil(usuario));
}, [usuario]);
  const { notificaciones: notificacionesReales, marcarLeida: marcarNotificacionLeidaAPI } = useNotificaciones();
  const [notificacionesPerfil, setNotificacionesPerfil] = useState<NotificacionPerfil[]>([]);

  useEffect(() => {
    const mapped: NotificacionPerfil[] = notificacionesReales
      .filter((n) => TIPOS_VISIBLES_EN_PERFIL.includes(n.tipo))
      .map((n) => ({
        id: n.id,
        icon: ICONO_POR_TIPO_NOTIFICACION[n.tipo] ?? 'fa-bell',
        texto: n.mensaje,
        tiempo: tiempoRelativoNotificacion(n.created_at),
        leida: n.leida,
        tipo:
          n.tipo === 'REACCION_PUMITA' ? 'reaccion' as const :
          n.tipo === 'SOLICITUD_PUMITA' ? 'solicitud' as const :
          n.tipo === 'EVENTO_DISPONIBLE' ? 'evento' as const :
          'general' as const,
        nombre: n.emisor_nombre,
        referenciaId: n.referencia_id,
      }));
    setNotificacionesPerfil(mapped);
  }, [notificacionesReales]);

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
  const [pumitas, setPumitas] = useState<PumitaData[]>([]);
  const [cargandoPumitas, setCargandoPumitas] = useState(true);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<PumitaData[]>([]);
  const navigate = useNavigate();

  const cargarPumitas = async () => {
    try {
      const [conexiones, pendientes, sugeridos, enviadas] = await Promise.all([
        pumitasService.listarConexiones(),
        pumitasService.listarPendientes(),
        pumitasService.listarSugeridos(),
        pumitasService.listarEnviadas(),
      ]);

      const mapearAPumitaData = (item: Pumita, estado: EstadoPumita, solicitudEnviada = false): PumitaData => ({
        id_usuario: item.id_usuario,
        id_conexion: item.id_conexion,
        nombre: item.nombre,
        carrera: '',
        avatar: `https://ui-avatars.com/api/?background=003366&color=fff&name=${encodeURIComponent(item.nombre)}`,
        estado,
        biografia: '',
        activo: true,
        solicitudEnviada,
      });

      const conectadas = conexiones.map((c) => mapearAPumitaData(c, 'Conectado'));
      const pendientesMapeadas = pendientes.map((p) => mapearAPumitaData(p, 'Pendiente'));
      const sugeridasMapeadas = sugeridos.map((s) => mapearAPumitaData(s, 'Sugerido'));
      const enviadasMapeadas = enviadas.map((e) => mapearAPumitaData(e, 'Sugerido', true));

      setPumitas([...conectadas, ...pendientesMapeadas, ...sugeridasMapeadas, ...enviadasMapeadas]);
      setSolicitudesPendientes(pendientesMapeadas);
    } catch (error) {
      console.error('No se pudieron cargar las conexiones Pumitas reales', error);
    } finally {
      setCargandoPumitas(false);
    }
  };

  useEffect(() => {
    cargarPumitas();
  }, []);
  
  useEffect(() => {
  const cargarForma003 = async () => {
    try {
      const registros = await forma003Service.listarMios();
      setDocumentosForma003(registros.map(mapearRegistroApi));
    } catch (error) {
      console.error('No se pudo cargar el historial de Forma 003', error);
    }
  };
  cargarForma003();
}, []);

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
  const [carrerasCambio, setCarrerasCambio] = useState<CarreraCambioCarrera[]>([]);
  const [centrosCambio, setCentrosCambio] = useState<CentroRegionalCambioCarrera[]>([]);
  const [contextoCambio, setContextoCambio] = useState<ContextoActualCambioCarrera | null>(null);
  const [solicitudCambioCarrera, setSolicitudCambioCarrera] = useState<SolicitudCambioCarrera | null>(null);
  const [cargandoCambioCarrera, setCargandoCambioCarrera] = useState(true);
  const [enviandoCambioCarrera, setEnviandoCambioCarrera] = useState(false);
  const [documentosForma003, setDocumentosForma003] = useState<DocumentoForma003[]>([]);
  const [carnetArchivoFile, setCarnetArchivoFile] = useState<File | null>(null);
  const [forma003ArchivoFile, setForma003ArchivoFile] = useState<File | null>(null);
  const [guardandoForma003, setGuardandoForma003] = useState(false);
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
  const [mensajeEstadoReaccion, setMensajeEstadoReaccion] = useState('');
  const [tipoMensajeEstadoReaccion, setTipoMensajeEstadoReaccion] = useState<'exito' | 'aviso'>('exito');
  const [timeoutMensajeEstadoReaccion, setTimeoutMensajeEstadoReaccion] = useState<number | null>(null);
  const audioReaccionActual = useRef<HTMLAudioElement | null>(null);

  const iniciarEdicion = () => {
  setBorrador(perfil);
  setViewMode('editar');
  window.history.pushState({ editandoPerfil: true }, '');
};

const [guardandoPerfil, setGuardandoPerfil] = useState(false);

const guardarCambios = async () => {
  setGuardandoPerfil(true);
  try {
    const usuarioActualizado = await authService.actualizarPerfil({
      biografia: borrador.biografia,
      ...(fotoPerfil ? { foto_url: fotoPerfil } : {}),
    });
    actualizarUsuario(usuarioActualizado);
    setPerfil(borrador);
    setFotoPerfil(null);
    window.history.back();
  } catch (error) {
    console.error('No se pudo actualizar el perfil', error);
    mostrarMensajeEstadoReaccion(error instanceof Error ? error.message : 'No se pudo guardar los cambios.', 'aviso');
  } finally {
    setGuardandoPerfil(false);
  }
};

const cancelarEdicion = () => {
  setBorrador(perfil);
  setFotoPerfil(null);
  window.history.back();
};
 
useEffect(() => {
  const manejarPopState = () => {
    if (viewMode === 'editar') {
      setViewMode('ver');
    }
  };

  window.addEventListener('popstate', manejarPopState);
  return () => window.removeEventListener('popstate', manejarPopState);
}, [viewMode]);

  const manejarCambioDeFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const tiposValidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!tiposValidos.includes(archivo.type)) {
      mostrarMensajeEstadoReaccion('La foto debe ser PNG, JPG o WEBP.', 'aviso');
      return;
    }
    // El archivo crece ~33% al convertirse a base64, así que validamos con margen
    // antes de leerlo, y volvemos a validar el tamaño real ya convertido.
    if (archivo.size > 1.4 * 1024 * 1024) {
      mostrarMensajeEstadoReaccion('La foto es demasiado grande (máximo ~1.4MB de archivo original).', 'aviso');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const resultado = lector.result as string;
      if (resultado.length > 2 * 1024 * 1024) {
        mostrarMensajeEstadoReaccion('La foto convertida supera el límite permitido. Prueba con una imagen más pequeña o comprimida.', 'aviso');
        return;
      }
      setFotoPerfil(resultado);
    };
    lector.readAsDataURL(archivo);
  };

  const fotoPerfilEdicion = fotoPerfil || usuario?.foto_url || null;

  const fotoPerfilActual = fotoPerfil || usuario?.foto_url || null;

  const enviarSolicitudPumita = async (pumita: PumitaData) => {
    try {
      await pumitasService.enviarSolicitud(pumita.id_usuario);
      mostrarMensajeEstadoReaccion('Solicitud enviada correctamente.', 'exito');
      await cargarPumitas();
    } catch (error) {
      console.error('No se pudo enviar la solicitud', error);
      mostrarMensajeEstadoReaccion('No se pudo enviar la solicitud.', 'aviso');
    }
  };

  const cancelarSolicitudPumita = async (pumita: PumitaData) => {
    if (!pumita.id_conexion) return;
    try {
      await pumitasService.eliminar(pumita.id_conexion);
      mostrarMensajeEstadoReaccion('Solicitud cancelada.', 'exito');
      await cargarPumitas();
    } catch (error) {
      console.error('No se pudo cancelar la solicitud', error);
      mostrarMensajeEstadoReaccion('No se pudo cancelar la solicitud.', 'aviso');
    }
  };

  const aceptarSolicitudPumita = async (pumita: PumitaData) => {
    if (!pumita.id_conexion) return;
    try {
      await pumitasService.aceptar(pumita.id_conexion);
      setSolicitudNotificacion(null);
      setNotificacionesPerfil((actuales) =>
        actuales.map((notificacion) =>
          notificacion.nombre === pumita.nombre
            ? { ...notificacion, leida: true, texto: `Aceptaste la solicitud de ${pumita.nombre}` }
            : notificacion
        )
      );
      mostrarMensajeEstadoReaccion('Solicitud aceptada.', 'exito');
      await cargarPumitas();
    } catch (error) {
      console.error('No se pudo aceptar la solicitud', error);
      mostrarMensajeEstadoReaccion('No se pudo aceptar la solicitud.', 'aviso');
    }
  };

  const rechazarSolicitudPumita = async (pumita: PumitaData) => {
    if (!pumita.id_conexion) return;
    try {
      await pumitasService.eliminar(pumita.id_conexion);
      setSolicitudNotificacion(null);
      setNotificacionesPerfil((actuales) =>
        actuales.map((notificacion) =>
          notificacion.nombre === pumita.nombre
            ? { ...notificacion, leida: true, texto: `Rechazaste la solicitud de ${pumita.nombre}` }
            : notificacion
        )
      );
      mostrarMensajeEstadoReaccion('Solicitud rechazada.', 'exito');
      await cargarPumitas();
    } catch (error) {
      console.error('No se pudo rechazar la solicitud', error);
      mostrarMensajeEstadoReaccion('No se pudo rechazar la solicitud.', 'aviso');
    }
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
        id: Math.random().toString(),
        icon: 'fa-paw',
        texto: `Rugido Puma enviado a ${nombre}`,
        tiempo: 'Ahora',
        leida: false,
        tipo: 'reaccion' as const,
      },
      ...actuales,
    ].slice(0, 5));
  };

  const mostrarMensajeEstadoReaccion = (mensaje: string, tipo: 'exito' | 'aviso') => {
    if (timeoutMensajeEstadoReaccion) window.clearTimeout(timeoutMensajeEstadoReaccion);
    setMensajeEstadoReaccion(mensaje);
    setTipoMensajeEstadoReaccion(tipo);
    const timeoutId = window.setTimeout(() => {
      setMensajeEstadoReaccion('');
      setTimeoutMensajeEstadoReaccion(null);
    }, 3500);
    setTimeoutMensajeEstadoReaccion(timeoutId);
  };

  const obtenerTipoReaccionBackend = (reaccion: string): TipoReaccionPumita => {
    if (reaccion.includes('Rugido')) return 'RUGIDO_PUMA';
    if (reaccion.includes('Felicit')) return 'FELICITACION';
    if (reaccion.includes('Saludo')) return 'SALUDO';
    return 'APOYO';
  };

  const enviarReaccionPumita = async (receptor: PumitaData, reaccion: string) => {
    const nombre = receptor.nombre;
    setMensajePerfilPumita(`${reaccion} enviada a ${nombre}`);
    setMostrarMenuReaccionesPumita(false);
    mostrarEfectoReaccion(reaccion);
    setNotificacionesPerfil((actuales) => [
      {
        id: Math.random().toString(),
        icon: reaccion.includes('Rugido') ? 'fa-paw' : 'fa-face-smile',
        texto: `${reaccion} enviada a ${nombre}`,
        tiempo: 'Ahora',
        leida: false,
        tipo: 'reaccion' as const,
      },
      ...actuales,
    ].slice(0, 5));

    try {
      await reaccionesService.enviarReaccion(receptor.id_usuario, obtenerTipoReaccionBackend(reaccion));
      mostrarMensajeEstadoReaccion('Reacción enviada correctamente.', 'exito');
    } catch (error) {
      console.error('No se pudo guardar la reacción Pumita', error);
      mostrarMensajeEstadoReaccion('La reacción se mostró localmente, pero aún no pudo guardarse.', 'aviso');
    }
  };

  const dejarDeSeguirPumita = async (pumita: PumitaData) => {
    if (!pumita.id_conexion) return;
    try {
      await pumitasService.eliminar(pumita.id_conexion);
      setPumitaPorDejar(null);
      mostrarMensajeEstadoReaccion('Dejaste de seguir a este Pumita.', 'exito');
      await cargarPumitas();
    } catch (error) {
      console.error('No se pudo dejar de seguir', error);
      mostrarMensajeEstadoReaccion('No se pudo completar la acción.', 'aviso');
    }
  };

  const volverASeguirPumita = (nombre: string) => {
    setDejadosDeSeguir((actuales) => actuales.filter((pumita) => pumita !== nombre));
  };

  const obtenerEstiloEstadoPumita = (estado: EstadoPumita) => {
    if (estado === 'Conectado') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (estado === 'Pendiente') return 'bg-[#FFD100]/20 text-[#003366] border-[#FFD100]/40';
    return 'bg-[#F4F6F8] text-[#5b6472] border-gray-200';
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
    if (audioReaccionActual.current) {
      audioReaccionActual.current.pause();
      audioReaccionActual.current.currentTime = 0;
    }
    const sonidoPorReaccion: Record<string, string> = {
      rugido: '/sounds/rugido-puma.mp3.wav',
      confeti: '/sounds/felicitacion-puma.wav',
      saludo: '/sounds/saludo-puma.wav',
      apoyo: '/sounds/apoyo-puma.wav',
    };
    const audio = new Audio(sonidoPorReaccion[efecto]);
    audioReaccionActual.current = audio;
    audio.play().catch((error) => console.warn('No se pudo reproducir el sonido', error));
    setEfectoReaccion(efecto);
    window.setTimeout(() => setEfectoReaccion(''), 2000);
  };

  useEffect(() => {
  let activo = true;
  const cargarCambioCarrera = async () => {
    setCargandoCambioCarrera(true);
    try {
      const catalogos = await cambioCarreraService.obtenerCatalogos();
      if (!activo) return;
      setCarrerasCambio(catalogos.carreras);
      setCentrosCambio(catalogos.centros_regionales);
      setContextoCambio(catalogos.actual);
      const respuesta = await cambioCarreraService.obtenerMiSolicitud();
      if (activo) setSolicitudCambioCarrera(respuesta.solicitud);
    } catch (error) {
      if (activo) setErrorCambioCarrera(error instanceof Error ? error.message : 'No se pudo cargar la información de cambio de carrera.');
    } finally {
      if (activo) setCargandoCambioCarrera(false);
    }
  };
  cargarCambioCarrera();
  return () => { activo = false; };
}, []);

const manejarClickNotificacion = (notificacion: NotificacionPerfil) => {
  if (!notificacion.leida) {
    marcarNotificacionLeidaAPI(notificacion.id);
  }

  if (notificacion.tipo === 'reaccion') {
    const pumita = notificacion.nombre ? pumitas.find((item) => item.nombre === notificacion.nombre) : null;
    if (pumita) abrirPerfilPumita(pumita);
    mostrarEfectoReaccion(notificacion.texto);
    document.getElementById('interaccion-social')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setMostrarNotificaciones(false);
    setMostrarHistorialNotificaciones(false);
    return;
  }

  if (notificacion.tipo === 'solicitud') {
    const pumita = solicitudesPendientes.find((item) => item.id_usuario === notificacion.referenciaId);
    if (pumita) setSolicitudNotificacion(pumita);
    setMostrarNotificaciones(false);
    setMostrarHistorialNotificaciones(false);
    return;
  }

  if (notificacion.tipo === 'evento') {
    setMostrarNotificaciones(false);
    setMostrarHistorialNotificaciones(false);
    navigate('/student/events');
    return;
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
  const enviarCambioCarrera = async () => {
  if (solicitudCambioCarrera?.estado === 'PENDIENTE') {
    setErrorCambioCarrera('Ya existe una solicitud de cambio de carrera pendiente.');
    return;
  }

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
  setMensajeCambioCarrera('');
  setEnviandoCambioCarrera(true);
  try {
    const respuesta = await cambioCarreraService.crear({
      id_carrera_solicitada: Number(nuevaCarrera),
      id_centro_regional_solicitado: Number(centroRegionalCambio),
      motivo: motivoCambioCarrera.trim(),
    });
    setSolicitudCambioCarrera(respuesta.solicitud);
    setMensajeCambioCarrera('Solicitud de cambio de carrera enviada.');
    setNuevaCarrera('');
    setCentroRegionalCambio('');
    setMotivoCambioCarrera('');
  } catch (error) {
    setErrorCambioCarrera(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
  } finally {
    setEnviandoCambioCarrera(false);
  }
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

    if (tipo === 'Carnet') {
      setCarnetArchivoFile(archivo);
      setCarnetRegistro(archivo.name);
    }
    if (tipo === 'Forma 003') {
      setForma003ArchivoFile(archivo);
      setForma003Registro(archivo.name);
    }
    setMensajeDocumento('');
    e.target.value = '';
  };
const agregarRegistroAcademico = async () => {
    if (!periodoRegistro.trim()) {
      setMensajeDocumento('El período académico es obligatorio.');
      return;
    }

    if (!carnetArchivoFile || !forma003ArchivoFile) {
      setMensajeDocumento('Debes cargar Carnet y Forma 003.');
      return;
    }

    setGuardandoForma003(true);
    try {
      const [carnetBase64, forma003Base64] = await Promise.all([
        archivoABase64(carnetArchivoFile),
        archivoABase64(forma003ArchivoFile),
      ]);

      const nuevoRegistro = await forma003Service.crear({
        periodo: periodoRegistro.trim(),
        carnet_base64: carnetBase64,
        forma003_base64: forma003Base64,
      });

      setDocumentosForma003((actuales) => [mapearRegistroApi(nuevoRegistro), ...actuales]);
      setMensajeDocumento('Registro agregado correctamente.');
      setPeriodoRegistro('');
      setCarnetRegistro('');
      setForma003Registro('');
      setCarnetArchivoFile(null);
      setForma003ArchivoFile(null);
      setMostrarRegistroAcademico(false);
    } catch (error) {
      console.error('No se pudo agregar el registro', error);
      setMensajeDocumento(error instanceof Error ? error.message : 'No se pudo agregar el registro.');
    } finally {
      setGuardandoForma003(false);
    }
  };
const actualizarForma003 = async (idRegistro: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const validacion = validarArchivoAcademico(archivo);
    if (!validacion.valido) {
      setMensajeDocumento(validacion.mensaje);
      e.target.value = '';
      return;
    }

    try {
      const forma003Base64 = await archivoABase64(archivo);
      const actualizado = await forma003Service.actualizarArchivo(idRegistro, forma003Base64);
      setDocumentosForma003((actuales) =>
        actuales.map((documento) =>
          documento.id_registro === idRegistro ? mapearRegistroApi(actualizado) : documento
        )
      );
      setMensajeDocumento('Forma 003 actualizada correctamente.');
    } catch (error) {
      console.error('No se pudo actualizar la Forma 003', error);
      setMensajeDocumento(error instanceof Error ? error.message : 'No se pudo actualizar la Forma 003.');
    } finally {
      e.target.value = '';
    }
  };

// ─── VISTA EDITAR ───────────────────────────────────────────────
if (viewMode === 'editar') {
  return (
    <div className="flex bg-[#F4F6F8] min-h-screen text-[#003366] font-sans overflow-y-auto">
      <div className="flex-1 p-4 md:p-6">
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#003366]">Mi Perfil</h1>
            <p className="text-[#5b6472] text-sm">Editar perfil</p>
            <div className="mt-3 h-1 w-16 rounded-full bg-[#FFD100]"></div>
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
                <div className="w-full h-full rounded-full border-4 border-[#FFD100] bg-[#F4F6F8] flex items-center justify-center overflow-hidden">
                  {fotoPerfilEdicion ? (
                    <img src={fotoPerfilEdicion} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#004B87] text-4xl font-bold">
                      {(borrador.nombre || 'Usuario Puma')
                        .trim()
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((palabra) => palabra[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <input type="file" id="fileInput" className="hidden" accept="image/*" onChange={manejarCambioDeFoto} />
                <label
                  htmlFor="fileInput"
                  className="absolute bottom-0 right-0 bg-white text-[#003366] w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFD100] transition-colors shadow-lg cursor-pointer border border-gray-200"
                  aria-label="Cambiar foto de perfil"
                >
                  <span className="text-base leading-none">📷</span>
                </label>
              </div>

              <h2 className="text-xl font-bold text-[#003366] mt-4">{borrador.nombre}</h2>
              <p className="text-[#004B87] text-sm mb-4">{borrador.carrera}</p>

              <div className="space-y-4 text-left border-t border-gray-200 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[#5b6472] text-xs uppercase font-bold tracking-wider">Carrera</span>
                  <p className="text-sm text-[#003366]">{borrador.carrera}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#5b6472] text-xs uppercase font-bold tracking-wider">Facultad</span>
                  <p className="text-sm text-[#003366]">{borrador.facultad}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#5b6472] text-xs uppercase font-bold tracking-wider">Centro Universitario</span>
                  <p className="text-sm text-[#003366]">{borrador.centroUniversitario}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#5b6472] text-xs uppercase font-bold tracking-wider">Correo institucional</span>
                  <input
                    value={borrador.correoInstitucional}
                    readOnly
                    className="bg-[#F4F6F8] text-[#5b6472] text-sm rounded-xl px-3 py-2 outline-none cursor-not-allowed border border-gray-200 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna central */}
          <div className="xl:col-span-6 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4 text-[#003366]">Datos de cuenta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-[#5b6472] text-xs uppercase font-bold tracking-wider">Nombre</span>
                  <input
                    value={borrador.nombre}
                    readOnly
                    className="bg-[#F4F6F8] text-[#5b6472] text-sm rounded-xl px-3 py-3 outline-none cursor-not-allowed border border-gray-200 w-full"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[#5b6472] text-xs uppercase font-bold tracking-wider">Correo institucional</span>
                  <input
                    value={borrador.correoInstitucional}
                    readOnly
                    className="bg-[#F4F6F8] text-[#5b6472] text-sm rounded-xl px-3 py-3 outline-none cursor-not-allowed border border-gray-200 w-full"
                  />
                </label>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-[#003366]">
                <i className="fa-solid fa-pen-to-square text-[#F59E0B]"></i> Mi biografía
              </h3>
              <textarea
                className="w-full bg-[#F4F6F8] text-[#003366] p-4 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 border border-gray-200 focus:border-[#004B87] transition-all resize-none"
                value={borrador.biografia}
                maxLength={300}
                onChange={(e) => setBorrador({ ...borrador, biografia: e.target.value })}
                placeholder="Cuéntanos sobre ti..."
              />
              <p className="text-right text-xs text-[#5b6472] mt-2">{borrador.biografia.length} / 300</p>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-2 text-[#003366]">Historial Forma 003</h3>
              <p className="text-[#5b6472] text-xs mb-4">Registros locales para visualización y validación simulada.</p>

              <button
                type="button"
                onClick={() => {
                  setMostrarRegistroAcademico(true);
                  setMensajeDocumento('');
                  
                }}
                className="w-full mb-4 bg-[#FFD100] hover:bg-[#FFDE47] border border-[#FFD100] rounded-lg px-3 py-2.5 text-xs font-bold text-[#003366] transition-colors"
              >
                Agregar registro
              </button>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {documentosForma003.map((documento) => (
                  <div key={documento.id_registro} className="border border-gray-200 rounded-xl p-3 bg-[#F4F6F8]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[#003366] text-sm">{documento.periodo}</p>
                        <p className="text-xs text-[#5b6472]">Historial académico</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                          documento.estado === 'Validado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : documento.estado === 'Rechazado'
                              ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                              : 'bg-[#FFD100]/20 text-[#003366] border-[#FFD100]/40'
                        }`}
                      >
                        {documento.estado}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#003366] truncate">Carnet y Forma 003 cargados</p>
                    <p className="text-[11px] text-[#5b6472]">Cargado: {documento.fechaCarga}</p>
                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-[#003366] hover:border-[#FFD100] transition-colors">
                      Actualizar Forma 003
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => actualizarForma003(documento.id_registro, e)}
                      />
                    </label>
                  </div>
                ))}
              </div>

              {mensajeDocumento && (
                <p className="mt-3 text-xs font-semibold text-[#004B87]">{mensajeDocumento}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={guardarCambios}
                className="w-full bg-[#FFD100] text-[#003366] font-bold p-4 rounded-lg hover:bg-[#FFDE47] transition-all shadow-sm"
              >
                Guardar cambios
              </button>
              <button
                onClick={cancelarEdicion}
                className="w-full bg-white text-[#DC2626] border border-[#DC2626]/20 p-4 rounded-lg hover:bg-[#DC2626]/10 transition-all shadow-sm"
              >
                Cancelar edición
              </button>
            </div>
          </div>
        </div>
      </div>

      {mostrarRegistroAcademico && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl p-5">
            {guardandoForma003 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/90 backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFD100] border-t-[#003366]"></div>
                <p className="text-sm font-bold text-[#003366]">Guardando registro...</p>
                <p className="max-w-xs text-center text-xs text-[#5b6472]">
                  Esto puede tardar unos segundos, especialmente si el servidor estaba inactivo.
                </p>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#003366]">Agregar registro académico</h3>
                <p className="text-sm text-[#5b6472]">Carga Carnet y Forma 003 para el período seleccionado.</p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarRegistroAcademico(false)}
                disabled={guardandoForma003}
                className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Cerrar registro académico"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-2">Período académico</span>
                <input
                  value={periodoRegistro}
                  onChange={(e) => setPeriodoRegistro(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#003366] outline-none focus:border-[#004B87]"
                  placeholder="Ej. III PAC 2026"
                />
              </label>

              <label className="block cursor-pointer rounded-lg border border-gray-200 bg-[#F4F6F8] p-4 hover:border-[#FFD100] transition-colors">
                <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-1">Cargar Carnet</span>
                <span className="text-sm font-semibold text-[#003366]">{carnetRegistro || 'PDF, JPG o PNG máximo 10 MB'}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => manejarSeleccionRegistro('Carnet', e)}
                />
              </label>

              <label className="block cursor-pointer rounded-lg border border-gray-200 bg-[#F4F6F8] p-4 hover:border-[#FFD100] transition-colors">
                <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-1">Cargar Forma 003</span>
                <span className="text-sm font-semibold text-[#003366]">{forma003Registro || 'PDF, JPG o PNG máximo 10 MB'}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => manejarSeleccionRegistro('Forma 003', e)}
                />
              </label>
            </div>

            {mensajeDocumento && (
              <p className="mt-3 rounded-lg border border-[#FFD100]/40 bg-[#FFD100]/10 px-3 py-2 text-xs font-semibold text-[#003366]">
                {mensajeDocumento}
              </p>
            )}

            <button
              type="button"
              onClick={agregarRegistroAcademico}
              className="mt-5 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFDE47] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={guardandoForma003}
            >
              {guardandoForma003 ? 'Guardando...' : 'Agregar registro'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VISTA NORMAL ───────────────────────────────────────────────
return (
  <div className="space-y-6 bg-[#F4F6F8] min-h-screen">
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#003366] mb-2">Mi Perfil</h1>
            <p className="text-[#5b6472] text-sm">Administra tu información académica y tus conexiones universitarias.</p>
            <div className="mt-3 h-1 w-16 rounded-full bg-[#FFD100]"></div>
          </div>
          <div className="relative self-start">
            <button
              type="button"
              onClick={() => setMostrarNotificaciones((actual) => !actual)}
              className="relative w-11 h-11 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:border-[#FFD100] hover:bg-[#FFD100]/20 transition-colors"
              aria-label="Ver notificaciones del perfil"
            >
              <i className="fa-solid fa-bell"></i>
              {notificacionesPerfil.some((notificacion) => !notificacion.leida) && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FFD100] text-[10px] font-bold text-[#003366] flex items-center justify-center">
                  {notificacionesPerfil.filter((notificacion) => !notificacion.leida).length}
                </span>
              )}
            </button>

            {mostrarNotificaciones && (
              <div className="absolute right-0 top-12 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                <h4 className="text-sm font-bold text-[#003366] mb-2">Notificaciones</h4>
                <div className="space-y-2">
                  {notificacionesPerfil.slice(0, 5).map((notificacion) => (
                    <button
                      key={notificacion.id}
                      type="button"
                      onClick={() => manejarClickNotificacion(notificacion)}
                      className={`w-full flex items-start gap-3 rounded-lg p-3 text-left hover:bg-[#FFD100]/10 transition-colors ${
                        notificacion.leida ? 'bg-[#F4F6F8]' : 'bg-[#F4F6F8] border border-dashed border-[#FFD100]'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-white text-[#F59E0B] flex items-center justify-center shrink-0 border border-gray-200">
                        <i className={`fa-solid ${notificacion.icon} text-xs`}></i>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#003366]">{notificacion.texto}</p>
                        <p className="text-[11px] text-[#5b6472]">{notificacion.tiempo}</p>
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
                  className="mt-3 w-full border-t border-gray-100 pt-3 text-xs font-bold text-[#004B87] hover:text-[#003366] transition-colors"
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
              className="min-w-0 rounded-xl bg-[#F4F6F8] border border-gray-200 px-3 py-2 shadow-sm text-left hover:border-[#FFD100] transition-colors"
            >
              <div className="flex items-center gap-2 text-[#F59E0B]">
                <i className={`fa-solid ${icon} text-xs`}></i>
                <span className="text-[11px] font-bold uppercase tracking-wide truncate">{label}</span>
              </div>
              <p className="text-lg font-bold text-[#003366] mt-1 truncate">{value}</p>
            </button>
          ))}
        </div>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-32 h-32 rounded-full border-4 border-[#FFD100] p-1 mb-4 overflow-hidden bg-[#F4F6F8] shadow-sm flex items-center justify-center">
              {fotoPerfilActual ? (
                <img src={fotoPerfilActual} alt={perfil.nombre} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-[#004B87] text-4xl font-bold">
                  {(perfil.nombre || 'Usuario Puma')
                    .trim()
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((palabra) => palabra[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#003366]">{perfil.nombre}</h2>
            <p className="text-sm font-semibold text-[#004B87] mt-1">{perfil.carrera}</p>
            <p className="text-xs text-[#5b6472] mt-2">{perfil.centroUniversitario}</p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarAgregarPumita(true)}
            className="mt-5 w-full text-left rounded-xl border border-[#FFD100]/40 bg-[#FFD100]/10 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-white text-[#004B87] flex items-center justify-center border border-[#FFD100]/30">
                <i className="fa-solid fa-user-plus"></i>
              </span>
              <div>
                <p className="font-bold text-[#003366] text-sm">Agregar a mi red</p>
                <p className="text-xs text-[#5b6472]">Conecta con otros pumitas</p>
              </div>
            </div>
          </button>

          <button
            onClick={iniciarEdicion}
            className="mt-5 w-full bg-[#FFD100] hover:bg-[#FFDE47] text-[#003366] font-bold py-3 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
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
            className="mt-3 w-full bg-white hover:bg-[#F4F6F8] text-[#003366] border border-gray-200 font-bold py-3 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-left text-[#F59E0B]"></i>
            Solicitar cambio de carrera
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-[#003366] mb-4">Información personal</h3>
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
                <span className="w-8 h-8 rounded-lg bg-[#F4F6F8] text-[#F59E0B] flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${icon} text-xs`}></i>
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-[#5b6472] font-bold uppercase tracking-wide">{label}</p>
                  <p className="text-[#003366] font-semibold break-words">{value}</p>
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
              <h3 className="text-xl font-bold text-[#003366]">Mis Pumitas</h3>
              <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-[#FFD100]"></div>
              <p className="text-sm text-[#5b6472]">Contactos recientes dentro de tu red universitaria.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarRedPumita((actual) => !actual)}
              className="self-start sm:self-auto px-4 py-2 rounded-lg bg-[#F4F6F8] border border-gray-200 text-sm font-bold text-[#003366] hover:bg-[#FFD100] transition-colors"
            >
              {mostrarRedPumita ? 'Ocultar Red Pumita' : 'Ver todos'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pumitasConectadas.slice(0, 4).map((pumita) => {
              const dejadoDeSeguir = dejadosDeSeguir.includes(pumita.nombre);
              const estadoVisual = pumitasAceptados.includes(pumita.nombre) ? 'Conectado' : pumita.estado;

              return (
                <article key={pumita.nombre} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-[#FFD100] hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <img src={pumita.avatar} alt={pumita.nombre} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#003366] truncate">{pumita.nombre}</h4>
                      <p className="text-xs text-[#5b6472] truncate">{pumita.carrera}</p>
                      <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${dejadoDeSeguir ? 'bg-gray-100 text-[#5b6472] border-gray-200' : obtenerEstiloEstadoPumita(estadoVisual)}`}>
                        {dejadoDeSeguir ? 'Sin seguir' : estadoVisual}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => abrirPerfilPumita(pumita)}
                      className="border border-gray-200 rounded-lg py-2 text-xs font-bold text-[#003366] hover:border-[#FFD100] hover:bg-[#F4F6F8] transition-colors"
                    >
                      Ver perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => (dejadoDeSeguir ? volverASeguirPumita(pumita.nombre) : setPumitaPorDejar(pumita))}
                      className={`border rounded-lg py-2 text-xs font-bold transition-colors ${
                        dejadoDeSeguir
                          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          : 'border-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626]/10'
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
                  <h4 className="text-lg font-bold text-[#003366]">Red Pumita</h4>
                  <p className="text-xs text-[#5b6472]">Pumitas conectadas, pendientes y sugeridas.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FFD100]/20 text-[#003366] text-xs font-bold border border-[#FFD100]/40">
                  {pumitas.length} contactos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {pumitas.map((pumita) => (
                  <article key={`red-${pumita.nombre}`} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <img src={pumita.avatar} alt={pumita.nombre} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-[#003366] truncate">{pumita.nombre}</h5>
                      <p className="text-xs text-[#5b6472] truncate">{pumita.carrera}</p>
                      <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${obtenerEstiloEstadoPumita(pumita.estado)}`}>
                        {pumita.solicitudEnviada ? 'Solicitud enviada' : pumita.estado}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirPerfilPumita(pumita)}
                        className="px-3 py-2 rounded-lg bg-[#F4F6F8] border border-gray-200 text-xs font-bold text-[#003366] hover:bg-[#FFD100] transition-colors"
                      >
                        Ver perfil
                      </button>

                      {pumita.estado === 'Conectado' && (
                        <button
                          type="button"
                          onClick={() => setPumitaPorDejar(pumita)}
                          className="px-3 py-2 rounded-lg border border-[#DC2626]/20 text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                        >
                          Dejar de seguir
                        </button>
                      )}

                      {pumita.estado === 'Pendiente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => rechazarSolicitudPumita(pumita)}
                            className="px-3 py-2 rounded-lg border border-[#DC2626]/20 text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                          >
                            Rechazar
                          </button>
                          <button
                            type="button"
                            onClick={() => aceptarSolicitudPumita(pumita)}
                            className="px-3 py-2 rounded-lg bg-[#FFD100] text-xs font-bold text-[#003366] hover:bg-[#FFDE47] transition-colors"
                          >
                            Aceptar
                          </button>
                        </>
                      )}

                      {pumita.estado === 'Sugerido' && (
                        pumita.solicitudEnviada ? (
                          <button
                            type="button"
                            onClick={() => cancelarSolicitudPumita(pumita)}
                            className="px-3 py-2 rounded-lg border border-[#DC2626]/20 text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                          >
                            Cancelar solicitud
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => enviarSolicitudPumita(pumita)}
                            className="px-3 py-2 rounded-lg bg-[#FFD100] text-xs font-bold text-[#003366] hover:bg-[#FFDE47] transition-colors"
                          >
                            Agregar
                          </button>
                        )
                      )}
                    </div>
                  </article>
                ))}
              
              </div>
            </div>
          )}
        </section>

        <section className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#003366]">Interacción Social</h3>
              <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-[#FFD100]"></div>
              <p className="text-sm text-[#5b6472]">
                Activa o desactiva las reacciones que otros Pumitas pueden enviarte.
              </p>
            </div>

            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <span className="text-sm font-bold text-[#003366]">{interaccionesActivas ? 'ON' : 'OFF'}</span>
              <button
                type="button"
                onClick={() => setInteraccionesActivas((actual) => !actual)}
                className={`relative w-14 h-8 rounded-full border shadow-inner transition-all duration-300 ${
                  interaccionesActivas ? 'bg-[#FFD100] border-[#FFD100]' : 'bg-white border-gray-300'
                }`}
                aria-label="Activar o desactivar interacciones sociales"
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                    interaccionesActivas ? 'translate-x-7' : 'translate-x-1'
                  } ${interaccionesActivas ? 'bg-[#004B87]' : 'bg-[#003366]'}`}
                />
              </button>
            </label>
          </div>

          {!interaccionesActivas && (
            <p className="mt-3 text-xs text-[#5b6472]">Las reacciones al perfil están deshabilitadas.</p>
          )}
        </section>

        <section className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-[#003366]">Gestión académica básica</h3>
            <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-[#FFD100]"></div>
            <p className="text-sm text-[#5b6472]">Accesos rápidos a contenido guardado y trámites del perfil.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMostrarEventosGuardados(true)}
              className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-4 text-left shadow-sm hover:border-[#FFD100] transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-white text-[#F59E0B] flex items-center justify-center border border-gray-200">
                <i className="fa-solid fa-calendar-check"></i>
              </span>
              <h4 className="mt-3 font-bold text-[#003366]">Ver eventos guardados</h4>
              <p className="text-sm text-[#5b6472] mt-1">Consulta eventos guardados sin cargar la vista principal.</p>
            </button>

            <button
              type="button"
              onClick={() => setMostrarPublicacionesGuardadas(true)}
              className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-4 text-left shadow-sm hover:border-[#FFD100] transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-white text-[#F59E0B] flex items-center justify-center border border-gray-200">
                <i className="fa-solid fa-bookmark"></i>
              </span>
              <h4 className="mt-3 font-bold text-[#003366]">Ver publicaciones guardadas</h4>
              <p className="text-sm text-[#5b6472] mt-1">Abre tus publicaciones guardadas en una vista separada.</p>
            </button>
          </div>
        </section>
      </main>
    </div>

    {efectoReaccion && (
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[#003366]/20 p-4">
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
          className={`rounded-3xl border border-[#FFD100]/60 bg-white/95 px-8 py-7 text-center shadow-2xl ${
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
            <p className="mt-4 text-2xl md:text-3xl font-black text-[#003366]">¡Rugido Puma!</p>
          )}
        </div>
      </div>
    )}

    {mostrarHistorialNotificaciones && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-[#003366]">Historial de notificaciones</h3>
              <p className="text-sm text-[#5b6472]">Busca y revisa tus notificaciones del perfil.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarHistorialNotificaciones(false)}
              className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
              aria-label="Cerrar historial de notificaciones"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="relative mb-4">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6472] text-xs"></i>
            <input
              value={busquedaNotificaciones}
              onChange={(e) => setBusquedaNotificaciones(e.target.value)}
              placeholder="Buscar notificaciones..."
              className="w-full rounded-xl border border-gray-200 bg-[#F4F6F8] py-3 pl-9 pr-3 text-sm outline-none focus:border-[#FFD100]"
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
                  className={`w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#FFD100]/10 ${
                    notificacion.leida ? 'border border-gray-200 bg-white' : 'border border-dashed border-[#FFD100] bg-[#F4F6F8]'
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg bg-white text-[#F59E0B] flex items-center justify-center shrink-0 border border-gray-200">
                    <i className={`fa-solid ${notificacion.icon} text-xs`}></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#003366]">{notificacion.texto}</p>
                    <p className="text-xs text-[#5b6472]">{notificacion.tiempo}</p>
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
              <h3 className="text-lg font-bold text-[#003366]">{solicitudNotificacion.nombre}</h3>
              <p className="text-sm text-[#5b6472]">{solicitudNotificacion.carrera}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#5b6472]">Quiere unirse a tu Red Pumita.</p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => rechazarSolicitudPumita(solicitudNotificacion)}
              className="rounded-lg border border-[#DC2626]/20 bg-white py-3 text-sm font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => aceptarSolicitudPumita(solicitudNotificacion)}
              className="rounded-lg bg-[#FFD100] py-3 text-sm font-bold text-[#003366] hover:bg-[#FFDE47] transition-colors"
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
              <h3 className="text-xl font-bold text-[#003366]">Eventos guardados</h3>
              <p className="text-sm text-[#5b6472]">Eventos guardados para consultar después.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarEventosGuardados(false)}
              className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
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
                  className="text-left font-bold text-[#003366] hover:text-[#004B87] transition-colors"
                >
                  {evento.titulo}
                </button>
                <p className="text-xs text-[#5b6472] mt-1">{evento.fecha}</p>
                <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-[#FFD100]/20 border border-[#FFD100]/40 text-[11px] font-bold text-[#003366]">
                  {evento.estado}
                </span>
                <p className="text-xs text-[#5b6472] mt-3">{evento.descripcion}</p>
                <button
                  type="button"
                  onClick={() => quitarEventoGuardado(evento.titulo)}
                  className="mt-4 w-full rounded-lg border border-[#DC2626]/20 px-3 py-2 text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                >
                  Quitar de guardados
                </button>
              </article>
            ))}
            {eventosGuardadosLocales.length === 0 && (
              <p className="md:col-span-3 rounded-xl border border-gray-200 bg-[#F4F6F8] p-4 text-sm font-semibold text-[#5b6472]">
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
              <h3 className="text-xl font-bold text-[#003366]">Publicaciones guardadas</h3>
              <p className="text-sm text-[#5b6472]">Publicaciones académicas guardadas para consultar después.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarPublicacionesGuardadas(false)}
              className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
              aria-label="Cerrar publicaciones guardadas"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {publicacionesGuardadasLocales.map((publicacion) => (
              <article key={`modal-${publicacion.titulo}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#FFD100] transition-colors">
                <button
                  type="button"
                  onClick={() => setPublicacionSeleccionada(publicacion)}
                  className="text-left font-bold text-[#003366] hover:text-[#004B87] transition-colors"
                >
                  {publicacion.titulo}
                </button>
                <p className="text-xs text-[#5b6472] mt-2">Autor: {publicacion.autor}</p>
                <p className="text-xs text-[#5b6472]">Guardado: {publicacion.fechaGuardado}</p>
                <p className="text-sm text-[#5b6472] mt-3 leading-relaxed">{publicacion.descripcion}</p>
                <button
                  type="button"
                  onClick={() => quitarPublicacionGuardada(publicacion.titulo)}
                  className="mt-4 w-full rounded-lg border border-[#DC2626]/20 px-3 py-2 text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                >
                  Quitar de guardados
                </button>
              </article>
            ))}
            {publicacionesGuardadasLocales.length === 0 && (
              <p className="md:col-span-3 rounded-xl border border-gray-200 bg-[#F4F6F8] p-4 text-sm font-semibold text-[#5b6472]">
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
              <p className="text-xs font-bold uppercase tracking-wide text-[#F59E0B]">Detalle de publicación guardada</p>
              <h3 className="mt-1 text-2xl md:text-3xl font-bold text-[#003366]">{publicacionSeleccionada.titulo}</h3>
              <p className="text-sm text-[#5b6472]">Autor: {publicacionSeleccionada.autor}</p>
              <p className="text-xs text-[#5b6472]">Guardado: {publicacionSeleccionada.fechaGuardado}</p>
            </div>
            <button
              type="button"
              onClick={() => setPublicacionSeleccionada(null)}
              className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
              aria-label="Cerrar publicación guardada"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-4">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <span className="w-11 h-11 rounded-full bg-[#FFD100] text-[#003366] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-bookmark"></i>
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[#003366]">{publicacionSeleccionada.autor}</p>
                <p className="text-xs text-[#5b6472]">Publicación guardada · {publicacionSeleccionada.fechaGuardado}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#5b6472]">{publicacionSeleccionada.detalle}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-3 text-xs font-bold text-[#5b6472]">
              <span className="rounded-full bg-white border border-gray-200 px-3 py-1">Guardada</span>
              <span className="rounded-full bg-white border border-gray-200 px-3 py-1">Vista de detalle</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPublicacionSeleccionada(null)}
            className="mt-5 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFDE47] transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => quitarPublicacionGuardada(publicacionSeleccionada.titulo)}
            className="mt-3 w-full border border-[#DC2626]/20 text-[#DC2626] font-bold py-3 rounded-lg hover:bg-[#DC2626]/10 transition-colors"
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
              <p className="text-xs font-bold uppercase tracking-wide text-[#F59E0B]">Detalle del evento guardado</p>
              <h3 className="mt-1 text-2xl md:text-3xl font-bold text-[#003366]">{eventoSeleccionado.titulo}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex px-3 py-1 rounded-full bg-[#FFD100]/20 border border-[#FFD100]/40 text-xs font-bold text-[#003366]">
                  {eventoSeleccionado.estado}
                </span>
                <span className="inline-flex px-3 py-1 rounded-full bg-[#F4F6F8] border border-gray-200 text-xs font-bold text-[#5b6472]">
                  {eventoSeleccionado.fecha}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEventoSeleccionado(null)}
              className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
              aria-label="Cerrar evento guardado"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-5">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-[#F4F6F8] p-5">
              <h4 className="text-lg font-bold text-[#003366]">Información del evento</h4>
              <p className="mt-3 text-sm leading-relaxed text-[#5b6472]">{eventoSeleccionado.detalle}</p>
              <p className="mt-4 text-sm leading-relaxed text-[#5b6472]">{eventoSeleccionado.descripcion}</p>
            </div>
            <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="font-bold text-[#003366]">Acciones</h4>
              <button
                type="button"
                onClick={() => setEventoSeleccionado(null)}
                className="mt-4 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFDE47] transition-colors"
              >
                Volver a eventos guardados
              </button>
              <button
                type="button"
                onClick={() => quitarEventoGuardado(eventoSeleccionado.titulo)}
                className="mt-3 w-full border border-[#DC2626]/20 text-[#DC2626] font-bold py-3 rounded-lg hover:bg-[#DC2626]/10 transition-colors"
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
            className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
            aria-label="Cerrar perfil de Pumita"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full border-4 border-[#FFD100] bg-[#F4F6F8] p-1 shadow-sm">
              <img
                src={pumitaSeleccionada.avatar}
                alt={pumitaSeleccionada.nombre}
                className="w-full h-full rounded-full object-contain bg-white"
              />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-[#003366]">{pumitaSeleccionada.nombre}</h3>
            <p className="text-sm font-semibold text-[#004B87]">{pumitaSeleccionada.carrera}</p>
            <p className="mt-4 text-sm leading-relaxed text-[#5b6472]">{pumitaSeleccionada.biografia}</p>

            {mensajePerfilPumita && (
              <p className="mt-4 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {mensajePerfilPumita}
              </p>
            )}
            {mensajeEstadoReaccion && (
              <p
                className={`mt-2 w-full rounded-lg border px-4 py-2 text-xs font-semibold ${
                  tipoMensajeEstadoReaccion === 'exito'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {mensajeEstadoReaccion}
              </p>
            )}

            {perteneceARedPumita(pumitaSeleccionada) ? (
              <div className="mt-6 w-full space-y-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMostrarMenuReaccionesPumita((actual) => !actual)}
                    className="w-full border border-gray-200 bg-[#F4F6F8] text-[#003366] font-bold py-3 rounded-lg hover:border-[#FFD100] transition-colors"
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
                            onClick={() => enviarReaccionPumita(pumitaSeleccionada, reaccion)}
                            className="rounded-lg px-3 py-2 text-left text-sm font-bold text-[#003366] hover:bg-[#FFD100]/20 transition-colors"
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
                  onClick={() => enviarSolicitudPumita(pumitaSeleccionada)}
                  disabled={pumitaSeleccionada.solicitudEnviada}
                  className={`w-full font-bold py-3 rounded-lg transition-colors ${
                    pumitaSeleccionada.solicitudEnviada
                      ? 'bg-[#F4F6F8] text-[#5b6472] border border-gray-200 cursor-not-allowed'
                      : 'bg-[#FFD100] text-[#003366] hover:bg-[#FFDE47]'
                  }`}
                >
                  {pumitaSeleccionada.solicitudEnviada ? 'Solicitud enviada' : 'Agregar Pumita'}
                </button>
                {pumitaSeleccionada.solicitudEnviada && (
                  <button
                    type="button"
                    onClick={() => cancelarSolicitudPumita(pumitaSeleccionada)}
                    className="w-full rounded-lg border border-[#DC2626]/20 py-3 text-sm font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
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
            <span className="w-11 h-11 rounded-lg bg-[#FFD100]/20 text-[#F59E0B] flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </span>
            <h3 className="text-xl font-bold text-[#003366]">Aviso sobre horas</h3>
          </div>
          <p className="text-sm leading-relaxed text-[#5b6472]">
            Recuerda: estas horas solo son acumuladas por la aplicación; por tanto, las únicas horas válidas para el artículo 140 son aquellas que aprobó y emitió el departamento de VOAE.
          </p>
          <button
            type="button"
            onClick={() => setMostrarAdvertenciaHoras(false)}
            className="mt-5 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFDE47] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    )}

    {pumitaPorDejar && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-2xl p-5">
          <h3 className="text-lg font-bold text-[#003366]">Dejar de seguir</h3>
          <p className="mt-3 text-sm text-[#5b6472]">
            ¿Deseas dejar de seguir a {pumitaPorDejar.nombre}?
          </p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => setPumitaPorDejar(null)}
              className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-bold text-[#003366] hover:bg-[#F4F6F8] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => dejarDeSeguirPumita(pumitaPorDejar)}
              className="rounded-lg bg-[#DC2626] py-3 text-sm font-bold text-white hover:bg-[#DC2626]/90 transition-colors"
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
              <h3 className="text-xl font-bold text-[#003366]">Solicitar cambio de carrera</h3>
              <p className="text-sm text-[#5b6472]">Completa la solicitud para revisión académica.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarCambioCarrera(false)}
              className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
              aria-label="Cerrar cambio de carrera"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {solicitudCambioCarrera && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-[#F4F6F8] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#003366]">Última solicitud</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  solicitudCambioCarrera.estado === 'PENDIENTE'
                    ? 'bg-amber-100 text-amber-800'
                    : solicitudCambioCarrera.estado === 'APROBADA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-700'
                }`}>
                  {solicitudCambioCarrera.estado}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#5b6472]">
                Solicitada el {new Date(solicitudCambioCarrera.fecha_creacion).toLocaleDateString('es-HN')}
              </p>
              <p className="mt-2 text-sm text-[#5b6472]">
                {solicitudCambioCarrera.carrera_solicitada} · {solicitudCambioCarrera.centro_regional_solicitado ?? 'Sin centro regional'}
              </p>
              {solicitudCambioCarrera.comentario_revision && (
                <p className="mt-2 text-sm text-[#5b6472]">Observación: {solicitudCambioCarrera.comentario_revision}</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-2">Carrera actual</span>
              <input
                value={contextoCambio?.carrera_actual ?? ''}
                readOnly
                className="w-full bg-[#F4F6F8] border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#5b6472] cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-2">Centro regional actual</span>
              <input
                value={contextoCambio?.centro_actual ?? ''}
                readOnly
                className="w-full bg-[#F4F6F8] border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#5b6472] cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-2">Nueva carrera</span>
              <select
                value={nuevaCarrera}
                onChange={(e) => setNuevaCarrera(e.target.value)}
                disabled={cargandoCambioCarrera || solicitudCambioCarrera?.estado === 'PENDIENTE'}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#003366] outline-none focus:border-[#004B87]"
              >
                <option value="">Selecciona una carrera</option>
                {carrerasCambio
                  .filter((carrera) => carrera.id_carrera !== contextoCambio?.id_carrera_actual)
                  .map((carrera) => <option key={carrera.id_carrera} value={carrera.id_carrera}>{carrera.nombre}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-2">Centro regional solicitado</span>
              <select
                value={centroRegionalCambio}
                onChange={(e) => setCentroRegionalCambio(e.target.value)}
                disabled={cargandoCambioCarrera || solicitudCambioCarrera?.estado === 'PENDIENTE'}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#003366] outline-none focus:border-[#004B87]"
              >
                <option value="">Selecciona un centro regional</option>
                {centrosCambio.map((centro) => (
                  <option key={centro.id_centro_regional} value={centro.id_centro_regional}>{centro.nombre}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs text-[#5b6472] font-bold uppercase tracking-wide mb-2">Motivo del cambio</span>
              <textarea
                value={motivoCambioCarrera}
                onChange={(e) => setMotivoCambioCarrera(e.target.value)}
                disabled={solicitudCambioCarrera?.estado === 'PENDIENTE'}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#003366] outline-none focus:border-[#004B87] min-h-28 resize-none"
                placeholder="Explica brevemente el motivo del cambio..."
              />
            </label>
          </div>

          {errorCambioCarrera && (
            <p className="mt-3 rounded-lg border border-[#DC2626]/20 bg-[#DC2626]/10 px-3 py-2 text-xs font-semibold text-[#DC2626]">
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
            disabled={cargandoCambioCarrera || enviandoCambioCarrera || solicitudCambioCarrera?.estado === 'PENDIENTE'}
            className="mt-5 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFDE47] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {solicitudCambioCarrera?.estado === 'PENDIENTE'
              ? 'Solicitud pendiente'
              : enviandoCambioCarrera ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    )}

   

    {mostrarAgregarPumita && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl">
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-[#003366]">Agregar Pumita a mi red</h3>
              <p className="text-sm text-[#5b6472]">Sugerencias de compañeras y compañeros para conectar.</p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarAgregarPumita(false)}
              className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"
              aria-label="Cerrar Agregar Pumita"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-[#F4F6F8] p-3">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6472] text-sm"></i>
                <input
                  value={busquedaAgregarPumita}
                  onChange={(e) => setBusquedaAgregarPumita(e.target.value)}
                  placeholder="Buscar usuarios..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#FFD100]"
                />
              </div>
            </div>

            <section className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-3">
              <h4 className="text-sm font-bold text-[#003366] mb-3">Solicitudes pendientes</h4>
              <div className="space-y-2">
                {solicitudesPendientesFiltradas.length === 0 && (
                  <p className="text-xs font-semibold text-[#5b6472]">No hay solicitudes pendientes.</p>
                )}
                {solicitudesPendientesFiltradas.map((pumita) => (
                  <article key={`pendiente-${pumita.nombre}`} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                    <img src={pumita.avatar} alt={pumita.nombre} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-bold text-[#003366] truncate">{pumita.nombre}</h5>
                      <p className="text-xs text-[#5b6472] truncate">{pumita.carrera}</p>
                      <span className="inline-flex mt-2 rounded-full border border-[#FFD100]/40 bg-[#FFD100]/20 px-2 py-0.5 text-[11px] font-bold text-[#003366]">
                        Pendiente
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => rechazarSolicitudPumita(pumita)}
                        className="rounded-lg border border-[#DC2626]/20 px-3 py-2 text-[11px] font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => aceptarSolicitudPumita(pumita)}
                        className="rounded-lg bg-[#FFD100] px-3 py-2 text-[11px] font-bold text-[#003366] hover:bg-[#FFDE47] transition-colors"
                      >
                        Aceptar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-bold text-[#003366]">Resultados</h4>
              {sugerenciasPumitas.map((pumita) => {
                const solicitudLocal = Boolean(pumita.solicitudEnviada);
                const estadoResultado = solicitudLocal ? 'Solicitud enviada' : pumita.estado;

                return (
                  <article key={`agregar-${pumita.nombre}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <img src={pumita.avatar} alt={pumita.nombre} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#003366] truncate">{pumita.nombre}</h4>
                      <p className="text-xs text-[#5b6472] truncate">{pumita.carrera}</p>
                      <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                        estadoResultado === 'Solicitud enviada'
                          ? 'border-[#FFD100]/40 bg-[#FFD100]/20 text-[#003366]'
                          : obtenerEstiloEstadoPumita(estadoResultado as EstadoPumita)
                      }`}>
                        {estadoResultado}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {solicitudLocal ? (
                        <button
                          type="button"
                          onClick={() => cancelarSolicitudPumita(pumita)}
                          className="px-3 py-2 rounded-lg border border-[#DC2626]/20 text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
                        >
                          Cancelar solicitud
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => enviarSolicitudPumita(pumita)}
                          className="px-3 py-2 rounded-lg bg-[#FFD100] text-xs font-bold text-[#003366] hover:bg-[#FFDE47] transition-colors"
                        >
                          Agregar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
              {sugerenciasPumitas.length === 0 && solicitudesPendientesFiltradas.length === 0 && (
                <p className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-4 text-sm font-semibold text-[#5b6472]">
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
          <p className="text-sm font-semibold text-[#003366]">Evento quitado de guardados</p>
          <button
            type="button"
            onClick={deshacerQuitarEvento}
            className="shrink-0 rounded-lg bg-[#FFD100] px-3 py-2 text-xs font-bold text-[#003366] hover:bg-[#FFDE47] transition-colors"
          >
            Deshacer
          </button>
        </div>
      </div>
    )}

    {publicacionQuitada && (
      <div className="fixed bottom-4 left-4 right-4 z-[70] sm:left-auto sm:right-6 sm:w-96">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-2xl">
          <p className="text-sm font-semibold text-[#003366]">Publicación quitada de guardados</p>
          <button
            type="button"
            onClick={deshacerQuitarPublicacion}
            className="shrink-0 rounded-lg bg-[#FFD100] px-3 py-2 text-xs font-bold text-[#003366] hover:bg-[#FFDE47] transition-colors"
          >
            Deshacer
          </button>
        </div>
      </div>
    )}
  </div>
);
};
export { Perfil as StudentProfile };