export type EventStatus =
  | "BORRADOR"
  | "PENDIENTE_APROBACION"
  | "RECHAZADO"
  | "PROGRAMADO"
  | "EN_CURSO"
  | "EN_CURSO_SALIDA"
  | "FINALIZADO";
export type EventCategory = "ACADEMICO" | "CULTURAL" | "DEPORTIVO" | "SOCIAL";
export type InscripcionOrigen = "QR_FISICO" | "MANUAL";
export type InscripcionEstado = "INSCRITO" | "PRE_INSCRITO" | "EN_DESARROLLO" | "CANCELADO";
export type AsistenciaEstadoValidacion = "PENDIENTE" | "APROBADO" | "RECHAZADO";
export type ActividadEstado = "PENDIENTE" | "APROBADO" | "RECHAZADO";
export type NotificacionTipo = "EVENTO" | "ASISTENCIA" | "SISTEMA";
export type QrTipo = "INSCRIPCION" | "ASISTENCIA";

export interface UniEvent {
  id: string;
  tutor_id: string;
  tutor_nombre: string;
  titulo: string;
  descripcion: string;
  categoria: EventCategory;
  tipo_evento: "HORAS_VOAE" | "RECREACION";
  imagen_url: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_horas: number;
  cupo_maximo: number;
  estado: EventStatus;
  lugar: string;
  created_at: string;
  updated_at: string;
  // Extended fields
  codigo_actividad?: string;
  tipo_actividad?: "Presencial" | "Virtual" | "Híbrido";
  entidad_organizadora?: string;
  asistencias_requeridas?: number;
  carreras_permitidas?: string[];
  imagenes_adicionales?: string[];
  pdf_respaldo_url?: string;
  lista_escrita_url?: string;
  portada_url?: string;
  centro_regional?: string;
  usa_imagen_personalizada: boolean;
  requiere_inscripcion: boolean;
  aprobado_por?: string;
  motivo_rechazo?: string;
  latitud?: number;
  longitud?: number;
  hora_inicio?: string;
  hora_fin?: string;
  enlace_virtual?: string;
  visibilidad?: "PUBLICO" | "PRIVADO";
  solicitado_por_rol?: "TUTOR" | "ESTUDIANTE";
  creado_por_rol?: "ESTUDIANTE" | "TUTOR";
  tutor_responsable?: string;
  tipo_duracion?: "TOTALES" | "DIARIAS";
}

export interface Inscripcion {
  id: string;
  evento_id: string;
  estudiante_id: string;
  estudiante_nombre: string;
  origen: InscripcionOrigen;
  estado: InscripcionEstado;
  inscrito_at: string;
}

export interface Asistencia {
  id: string;
  evento_id: string;
  estudiante_id: string;
  estudiante_nombre: string;
  estudiante_carrera: string;
  validado_por?: string;
  escaneado_at: string;
  estado_validacion: AsistenciaEstadoValidacion;
  validado_at?: string;
  encuesta_completada: boolean;
  motivo_rechazo?: string;
  adjunto_url?: string;
  hora_llegada?: string;
  hora_salida?: string;
  latitud_entrada?: number;
  longitud_entrada?: number;
  ubicacion_entrada_validada?: boolean | null;
  latitud_salida?: number;
  longitud_salida?: number;
  ubicacion_salida_validada?: boolean | null;
}

export interface EncuestaSatisfaccion {
  id: string;
  asistencia_id: string;
  calificacion_evento: number;
  calificacion_tutor: number;
  aspectos_destacados: string[];
  comentario: string;
  enviado_at: string;
}

export interface ActividadEstudiante {
  id: string;
  estudiante_id: string;
  asistencia_id: string;
  horas_acreditadas: number;
  categoria: EventCategory;
  estado: ActividadEstado;
  acreditado_at: string;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificacionTipo;
  leido: boolean;
  created_at: string;
}

export interface QrToken {
  id: string;
  evento_id: string;
  tipo: QrTipo;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface Novedad {
  id: string;
  autor_id: string;
  autor_nombre: string;
  autor_rol: string;
  titulo: string;
  contenido: string;
  tipo: "MANUAL" | "AUTOMATICA";
  created_at: string;
  evento_id?: string;
  imagen_url?: string;
}

export interface Constancia {
  id: string;
  actividad_id: string;
  url_archivo: string;
  qr_validacion: string;
  estado: "NO_VERIFICADA" | "VERIFICADA";
  verificado_por?: string;
  verificado_at?: string;
  created_at: string;
}

export interface Suscripcion {
  id: string;
  estudiante_id: string;
  evento_id: string;
  created_at: string;
}

export interface Moderador {
  id: string;
  usuario_id: string;
  nombre: string;
  email: string;
  asignado_por: string;
  permisos: string[];
  activo: boolean;
  motivo_desactivacion?: string;
  created_at: string;
}

export const EVENTS: UniEvent[] = [
  {
    id: "evt-001",
    tutor_id: "TUT-0034",
    tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Taller de Investigación Académica",
    descripcion: "Aprende metodologías modernas de investigación científica y redacción académica.",
    categoria: "ACADEMICO",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    lista_escrita_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fecha_inicio: "2026-06-12T09:00:00",
    fecha_fin: "2026-06-12T12:00:00",
    duracion_horas: 3,
    cupo_maximo: 50,
    estado: "PROGRAMADO",
    lugar: "Aula Magna - Edificio A1",
    created_at: "2026-06-01T00:00:00",
    updated_at: "2026-06-01T00:00:00",
    codigo_actividad: "ACT-001",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Facultad de Ciencias",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    aprobado_por: "Lic. Roberto Fiallos",
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-002",
    tutor_id: "TUT-0045",
    tutor_nombre: "Lic. Ana Sánchez",
    titulo: "Conferencia: Liderazgo Universitario",
    descripcion: "Sesión con líderes nacionales sobre el rol del estudiante universitario.",
    categoria: "SOCIAL",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-06-15T14:00:00",
    fecha_fin: "2026-06-15T16:00:00",
    duracion_horas: 2,
    cupo_maximo: 200,
    estado: "PROGRAMADO",
    lugar: "Auditorio Central",
    created_at: "2026-06-02T00:00:00",
    updated_at: "2026-06-02T00:00:00",
    codigo_actividad: "ACT-002",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Facultad de Ciencias Sociales",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-003",
    tutor_id: "TUT-0034",
    tutor_nombre: "Prof. María Lagos",
    titulo: "Festival Cultural UNAH 2026",
    descripcion: "Celebración de la diversidad cultural con presentaciones artísticas.",
    categoria: "CULTURAL",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-06-09T16:00:00",
    fecha_fin: "2026-06-09T20:00:00",
    duracion_horas: 4,
    cupo_maximo: 500,
    estado: "PROGRAMADO",
    lugar: "Plaza Central",
    aprobado_por: "Lic. Roberto Fiallos",
    created_at: "2026-05-20T00:00:00",
    updated_at: "2026-06-01T00:00:00",
    codigo_actividad: "ACT-003",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Vicerrectoría de Cultura",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-004",
    tutor_id: "TUT-0034",
    tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Jornada de Voluntariado Social",
    descripcion: "Servicio comunitario en colonias vulnerables de Tegucigalpa.",
    categoria: "SOCIAL",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    pdf_respaldo_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fecha_inicio: "2026-05-28T08:00:00",
    fecha_fin: "2026-05-28T14:00:00",
    duracion_horas: 6,
    cupo_maximo: 80,
    estado: "FINALIZADO",
    lugar: "Colonia Villanueva",
    created_at: "2026-05-10T00:00:00",
    updated_at: "2026-05-28T14:00:00",
    codigo_actividad: "ACT-004",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Vicerrectoría de Vinculación",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-005",
    tutor_id: "TUT-0045",
    tutor_nombre: "Lic. Pedro Romero",
    titulo: "Torneo Interuniversitario de Ajedrez",
    descripcion: "Competencia académica deportiva entre facultades.",
    categoria: "DEPORTIVO",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-05-20T10:00:00",
    fecha_fin: "2026-05-20T15:00:00",
    duracion_horas: 5,
    cupo_maximo: 64,
    estado: "FINALIZADO",
    lugar: "Gimnasio Universitario",
    created_at: "2026-05-01T00:00:00",
    updated_at: "2026-05-20T15:00:00",
    codigo_actividad: "ACT-005",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Dirección de Deportes",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-006",
    tutor_id: "TUT-0045",
    tutor_nombre: "Ing. Laura Paz",
    titulo: "Seminario: Inteligencia Artificial Aplicada",
    descripcion: "Aplicaciones de IA en la investigación universitaria.",
    categoria: "ACADEMICO",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-05-10T15:00:00",
    fecha_fin: "2026-05-10T18:00:00",
    duracion_horas: 3,
    cupo_maximo: 40,
    estado: "FINALIZADO",
    lugar: "Lab. Computación 3",
    created_at: "2026-04-15T00:00:00",
    updated_at: "2026-05-10T18:00:00",
    codigo_actividad: "ACT-006",
    tipo_actividad: "Virtual",
    entidad_organizadora: "Facultad de Ingeniería",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-pend-001",
    tutor_id: "TUT-0034",
    tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Seminario: Ética en la Investigación",
    descripcion: "Seminario sobre principios éticos en la investigación académica universitaria.",
    categoria: "ACADEMICO",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-07-05T10:00:00",
    fecha_fin: "2026-07-05T13:00:00",
    duracion_horas: 3,
    cupo_maximo: 60,
    estado: "PENDIENTE_APROBACION",
    lugar: "Aula 301 - Edificio B",
    created_at: "2026-06-10T00:00:00",
    updated_at: "2026-06-10T00:00:00",
    codigo_actividad: "ACT-008",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Facultad de Ciencias",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-007",
    tutor_id: "TUT-0034",
    tutor_nombre: "Lic. Ana Sánchez",
    titulo: "Charla de Ética Profesional",
    descripcion: "Reflexión sobre el ejercicio ético en las profesiones.",
    categoria: "ACADEMICO",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-04-22T11:00:00",
    fecha_fin: "2026-04-22T13:00:00",
    duracion_horas: 2,
    cupo_maximo: 60,
    estado: "FINALIZADO",
    lugar: "Aula 204",
    created_at: "2026-04-01T00:00:00",
    updated_at: "2026-04-22T13:00:00",
    codigo_actividad: "ACT-007",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Facultad de Humanidades",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-borr-001",
    tutor_id: "TUT-0034",
    tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Taller de Oratoria y Liderazgo",
    descripcion:
      "Taller práctico para desarrollar habilidades de comunicación efectiva y liderazgo.",
    categoria: "SOCIAL",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-07-15T09:00:00",
    fecha_fin: "2026-07-15T12:00:00",
    duracion_horas: 3,
    cupo_maximo: 30,
    estado: "BORRADOR",
    lugar: "Salón de Usos Múltiples",
    created_at: "2026-06-22T00:00:00",
    updated_at: "2026-06-22T00:00:00",
    codigo_actividad: "ACT-009",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Vicerrectoría de Estudiantes",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-borr-002",
    tutor_id: "TUT-0034",
    tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Feria de la Salud",
    descripcion: "Jornada de salud preventiva con módulos de atención médica básica.",
    categoria: "SOCIAL",
    tipo_evento: "RECREACION",
    imagen_url: "",
    fecha_inicio: "2026-08-01T08:00:00",
    fecha_fin: "2026-08-01T14:00:00",
    duracion_horas: 6,
    cupo_maximo: 100,
    estado: "BORRADOR",
    lugar: "Plaza Cívica",
    created_at: "2026-06-20T00:00:00",
    updated_at: "2026-06-20T00:00:00",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Facultad de Ciencias Médicas",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
  },
  {
    id: "evt-rech-001",
    tutor_id: "TUT-0034",
    tutor_nombre: "Dr. Carlos Mendoza",
    titulo: "Conferencia: Innovación en Ingeniería",
    descripcion: "Conferencia sobre innovación tecnológica en la ingeniería moderna.",
    categoria: "ACADEMICO",
    tipo_evento: "HORAS_VOAE",
    imagen_url: "",
    fecha_inicio: "2026-05-30T10:00:00",
    fecha_fin: "2026-05-30T13:00:00",
    duracion_horas: 3,
    cupo_maximo: 80,
    estado: "RECHAZADO",
    lugar: "Auditorio de Ingeniería",
    created_at: "2026-05-10T00:00:00",
    updated_at: "2026-05-28T00:00:00",
    codigo_actividad: "ACT-010",
    tipo_actividad: "Presencial",
    entidad_organizadora: "Facultad de Ingeniería",
    asistencias_requeridas: 1,
    carreras_permitidas: [],
    centro_regional: "Ciudad Universitaria",
    usa_imagen_personalizada: false,
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    solicitado_por_rol: "TUTOR",
    creado_por_rol: "TUTOR",
    motivo_rechazo:
      "El evento no cumple con los lineamientos de horas VOAE. La actividad no está directamente relacionada con el plan de estudios de las carreras participantes. Se solicita ajustar la descripción del evento para alinearla con los objetivos académicos.",
  },
];

const STUDENT_NAMES = [
  "María González",
  "Juan Pérez",
  "Ana Martínez",
  "Luis Hernández",
  "Carmen Flores",
  "José Rodríguez",
  "Sofía López",
  "Miguel Castro",
  "Lucía Vargas",
  "Diego Mejía",
  "Valeria Cruz",
  "Andrés Reyes",
  "Camila Núñez",
  "Pablo Suazo",
  "Daniela Lara",
];

export function getInscripciones(eventId: string, count: number): Inscripcion[] {
  return Array.from({ length: count }, (_, i) => {
    const name = STUDENT_NAMES[i % STUDENT_NAMES.length];
    return {
      id: `${eventId}-ins-${i}`,
      evento_id: eventId,
      estudiante_id: `2021${String(100000 + i).padStart(6, "0")}`,
      estudiante_nombre: name,
      origen: i % 3 === 0 ? "QR_FISICO" : "MANUAL",
      estado: "INSCRITO",
      inscrito_at: "2026-06-01T00:00:00",
    };
  });
}

export function getStudentProfile(estudianteId: string) {
  const student = MOCK_STUDENT_PROFILES.find((s) => s.id === estudianteId);
  if (!student) return null;
  const actividades = getStudentApprovedActivities(estudianteId);
  const horasPorCategoria = {
    ACADEMICO: actividades
      .filter((a) => a.estado === "APROBADO" && a.categoria === "ACADEMICO")
      .reduce((s, a) => s + a.horas_acreditadas, 0),
    CULTURAL: actividades
      .filter((a) => a.estado === "APROBADO" && a.categoria === "CULTURAL")
      .reduce((s, a) => s + a.horas_acreditadas, 0),
    DEPORTIVO: actividades
      .filter((a) => a.estado === "APROBADO" && a.categoria === "DEPORTIVO")
      .reduce((s, a) => s + a.horas_acreditadas, 0),
    SOCIAL: actividades
      .filter((a) => a.estado === "APROBADO" && a.categoria === "SOCIAL")
      .reduce((s, a) => s + a.horas_acreditadas, 0),
  };
  return {
    ...student,
    horas_aprobadas: actividades.reduce((s, a) => s + a.horas_acreditadas, 0),
    horas_por_categoria: horasPorCategoria,
    progreso_por_categoria: Object.fromEntries(
      Object.entries(horasPorCategoria).map(([cat, hrs]) => [
        cat,
        { acumuladas: hrs, limite: LIMITE_POR_CATEGORIA, completado: hrs >= LIMITE_POR_CATEGORIA },
      ]),
    ),
  };
}

const CARRERAS = [
  "Ingeniería en Sistemas",
  "Medicina",
  "Derecho",
  "Arquitectura",
  "Psicología",
  "Ingeniería Civil",
  "Administración de Empresas",
  "Biología",
  "Física",
  "Matemáticas",
  "Pedagogía",
  "Historia",
  "Filosofía",
  "Contaduría",
  "Trabajo Social",
];

export function getAsistencias(eventId: string, count: number): Asistencia[] {
  return Array.from({ length: count }, (_, i) => {
    const name = STUDENT_NAMES[i % STUDENT_NAMES.length];
    const rejected = i === 2;
    const pending = i === count - 1;
    const hour = 16 + (i % 4);
    const minute = 5 + (i % 12);
    return {
      id: `${eventId}-asist-${i}`,
      evento_id: eventId,
      estudiante_id: `2021${String(100000 + i).padStart(6, "0")}`,
      estudiante_nombre: name,
      estudiante_carrera: CARRERAS[i % CARRERAS.length],
      validado_por: i % 4 === 0 || rejected ? "VOAE-012" : undefined,
      escaneado_at: `2026-06-09T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      estado_validacion: rejected
        ? "RECHAZADO"
        : pending
          ? "PENDIENTE"
          : i < Math.floor(count * 0.85)
            ? "APROBADO"
            : "PENDIENTE",
      validado_at: i < Math.floor(count * 0.7) && !rejected ? "2026-06-10T10:00:00" : undefined,
      encuesta_completada: i < Math.floor(count * 0.6),
      motivo_rechazo: rejected
        ? "El estudiante no cumplió con el tiempo mínimo de permanencia en el evento."
        : undefined,
      hora_llegada:
        i % 5 === 0
          ? undefined
          : `2026-06-09T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      hora_salida:
        i % 5 === 0
          ? undefined
          : `2026-06-09T${String(hour + 2).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      adjunto_url: i % 4 === 0 ? "https://placehold.co/400x600/png?text=Adjunto" : undefined,
      latitud_entrada: undefined,
      longitud_entrada: undefined,
      ubicacion_entrada_validada: null,
      latitud_salida: undefined,
      longitud_salida: undefined,
      ubicacion_salida_validada: null,
    };
  });
}

export function getEnrollments(eventId: string, count: number) {
  return getInscripciones(eventId, count).map((ins) => {
    const asist = getAsistencias(eventId, count).find((a) => a.estudiante_id === ins.estudiante_id);
    return {
      id: ins.id,
      studentId: ins.estudiante_id,
      studentName: ins.estudiante_nombre,
      studentCareer: asist?.estudiante_carrera ?? "No especificada",
      email: ins.estudiante_nombre.toLowerCase().replace(/\s/g, ".") + "@unah.hn",
      enrolledAt: ins.inscrito_at.slice(0, 10),
      attended: asist?.estado_validacion === "APROBADO",
      attendanceTime: asist ? asist.escaneado_at.slice(11, 16) : undefined,
      hora_llegada: asist?.hora_llegada,
      hora_salida: asist?.hora_salida,
      latitud_entrada: asist?.latitud_entrada,
      longitud_entrada: asist?.longitud_entrada,
      ubicacion_entrada_validada: asist?.ubicacion_entrada_validada,
      latitud_salida: asist?.latitud_salida,
      longitud_salida: asist?.longitud_salida,
      ubicacion_salida_validada: asist?.ubicacion_salida_validada,
    };
  });
}

export function getEventInscripciones(eventId: string): number {
  const enrolledMap: Record<string, number> = {
    "evt-001": 42,
    "evt-002": 187,
    "evt-003": 312,
    "evt-004": 78,
    "evt-005": 60,
    "evt-006": 40,
    "evt-007": 55,
    "evt-borr-001": 0,
    "evt-borr-002": 0,
    "evt-rech-001": 0,
  };
  return enrolledMap[eventId] ?? 0;
}

export function getEventAsistencias(eventId: string): number {
  const attendedMap: Record<string, number> = {
    "evt-001": 0,
    "evt-002": 0,
    "evt-003": 285,
    "evt-004": 72,
    "evt-005": 58,
    "evt-006": 38,
    "evt-007": 50,
  };
  return attendedMap[eventId] ?? 0;
}

export const ENCUESTAS: EncuestaSatisfaccion[] = [
  {
    id: "enc-001",
    asistencia_id: "evt-003-asist-0",
    calificacion_evento: 5,
    calificacion_tutor: 5,
    aspectos_destacados: ["Contenido de calidad", "Tutor excelente", "Bien organizado"],
    comentario: "Excelente sesión, muy bien organizada y con contenido relevante.",
    enviado_at: "2026-06-09T18:00:00",
  },
  {
    id: "enc-002",
    asistencia_id: "evt-003-asist-1",
    calificacion_evento: 4,
    calificacion_tutor: 4,
    aspectos_destacados: ["Contenido de calidad", "Material útil"],
    comentario: "Buen evento, aunque el tiempo se sintió un poco corto.",
    enviado_at: "2026-06-09T18:05:00",
  },
  {
    id: "enc-003",
    asistencia_id: "evt-003-asist-2",
    calificacion_evento: 5,
    calificacion_tutor: 5,
    aspectos_destacados: ["Tutor excelente", "Puntualidad"],
    comentario: "Aprendí muchísimo. El tutor explicó todo con claridad.",
    enviado_at: "2026-06-09T18:10:00",
  },
  {
    id: "enc-004",
    asistencia_id: "evt-003-asist-3",
    calificacion_evento: 3,
    calificacion_tutor: 4,
    aspectos_destacados: ["Ambiente agradable"],
    comentario: "Contenido bueno, pero la sala tenía problemas de audio.",
    enviado_at: "2026-06-09T18:15:00",
  },
  {
    id: "enc-005",
    asistencia_id: "evt-003-asist-4",
    calificacion_evento: 5,
    calificacion_tutor: 5,
    aspectos_destacados: ["Contenido de calidad", "Bien organizado", "Ambiente agradable"],
    comentario: "Una de las mejores actividades del semestre.",
    enviado_at: "2026-06-09T19:00:00",
  },
  {
    id: "enc-006",
    asistencia_id: "evt-003-asist-5",
    calificacion_evento: 4,
    calificacion_tutor: 4,
    aspectos_destacados: ["Material útil", "Puntualidad"],
    comentario: "Muy recomendado para estudiantes de últimos años.",
    enviado_at: "2026-06-09T19:30:00",
  },
];

export const ACTIVIDADES: ActividadEstudiante[] = [
  {
    id: "act-001",
    estudiante_id: "20211002345",
    asistencia_id: "evt-003-asist-0",
    horas_acreditadas: 4,
    categoria: "CULTURAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-10T10:00:00",
  },
  {
    id: "act-002",
    estudiante_id: "20201567823",
    asistencia_id: "evt-003-asist-1",
    horas_acreditadas: 4,
    categoria: "CULTURAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-10T10:00:00",
  },
  {
    id: "act-003",
    estudiante_id: "20211098765",
    asistencia_id: "evt-003-asist-2",
    horas_acreditadas: 4,
    categoria: "CULTURAL",
    estado: "PENDIENTE",
    acreditado_at: "",
  },
  {
    id: "act-004",
    estudiante_id: "20221034567",
    asistencia_id: "evt-003-asist-3",
    horas_acreditadas: 4,
    categoria: "CULTURAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-10T10:00:00",
  },
  {
    id: "act-005",
    estudiante_id: "20201245678",
    asistencia_id: "evt-003-asist-4",
    horas_acreditadas: 4,
    categoria: "CULTURAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-10T10:00:00",
  },
  // María González — events across multiple categories
  {
    id: "act-006",
    estudiante_id: "20211002345",
    asistencia_id: "evt-001-asist-0",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-13T10:00:00",
  },
  {
    id: "act-007",
    estudiante_id: "20211002345",
    asistencia_id: "evt-006-asist-0",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-13T10:00:00",
  },
  {
    id: "act-008",
    estudiante_id: "20211002345",
    asistencia_id: "evt-007-asist-0",
    horas_acreditadas: 2,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-13T10:00:00",
  },
  {
    id: "act-009",
    estudiante_id: "20211002345",
    asistencia_id: "evt-002-asist-0",
    horas_acreditadas: 2,
    categoria: "SOCIAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-16T10:00:00",
  },
  {
    id: "act-010",
    estudiante_id: "20211002345",
    asistencia_id: "evt-004-asist-0",
    horas_acreditadas: 6,
    categoria: "SOCIAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-16T10:00:00",
  },
  {
    id: "act-011",
    estudiante_id: "20211002345",
    asistencia_id: "evt-005-asist-0",
    horas_acreditadas: 5,
    categoria: "DEPORTIVO",
    estado: "APROBADO",
    acreditado_at: "2026-06-16T10:00:00",
  },
  // Juan Pérez
  {
    id: "act-012",
    estudiante_id: "20201567823",
    asistencia_id: "evt-001-asist-1",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-13T10:00:00",
  },
  {
    id: "act-013",
    estudiante_id: "20201567823",
    asistencia_id: "evt-004-asist-1",
    horas_acreditadas: 6,
    categoria: "SOCIAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-17T10:00:00",
  },
  // Luis Hernández
  {
    id: "act-014",
    estudiante_id: "20221034567",
    asistencia_id: "evt-005-asist-3",
    horas_acreditadas: 5,
    categoria: "DEPORTIVO",
    estado: "APROBADO",
    acreditado_at: "2026-06-20T10:00:00",
  },
  {
    id: "act-015",
    estudiante_id: "20221034567",
    asistencia_id: "evt-001-asist-3",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-13T10:00:00",
  },
  // José Rodríguez — enough ACADEMICO hours for trophy showcase
  {
    id: "act-016",
    estudiante_id: "20211006789",
    asistencia_id: "evt-001-asist-5",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-13T10:00:00",
  },
  {
    id: "act-017",
    estudiante_id: "20211006789",
    asistencia_id: "evt-001-asist-6",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-13T10:00:00",
  },
  {
    id: "act-018",
    estudiante_id: "20211006789",
    asistencia_id: "evt-006-asist-5",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-14T10:00:00",
  },
  {
    id: "act-019",
    estudiante_id: "20211006789",
    asistencia_id: "evt-006-asist-6",
    horas_acreditadas: 3,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-14T10:00:00",
  },
  {
    id: "act-020",
    estudiante_id: "20211006789",
    asistencia_id: "evt-007-asist-5",
    horas_acreditadas: 2,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-15T10:00:00",
  },
  {
    id: "act-021",
    estudiante_id: "20211006789",
    asistencia_id: "evt-007-asist-6",
    horas_acreditadas: 2,
    categoria: "ACADEMICO",
    estado: "APROBADO",
    acreditado_at: "2026-06-15T10:00:00",
  },
  {
    id: "act-022",
    estudiante_id: "20211006789",
    asistencia_id: "evt-003-asist-5",
    horas_acreditadas: 4,
    categoria: "CULTURAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-10T10:00:00",
  },
  // Sofía López
  {
    id: "act-023",
    estudiante_id: "20211007890",
    asistencia_id: "evt-002-asist-2",
    horas_acreditadas: 2,
    categoria: "SOCIAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-16T10:00:00",
  },
  {
    id: "act-024",
    estudiante_id: "20211007890",
    asistencia_id: "evt-004-asist-2",
    horas_acreditadas: 6,
    categoria: "SOCIAL",
    estado: "APROBADO",
    acreditado_at: "2026-06-17T10:00:00",
  },
  // Miguel Castro
  {
    id: "act-025",
    estudiante_id: "20211008901",
    asistencia_id: "evt-005-asist-4",
    horas_acreditadas: 5,
    categoria: "DEPORTIVO",
    estado: "APROBADO",
    acreditado_at: "2026-06-20T10:00:00",
  },
];

export const QRS: QrToken[] = [
  {
    id: "qr-001",
    evento_id: "evt-001",
    tipo: "INSCRIPCION",
    token: "qr-evt-001-inscripcion",
    expires_at: "2026-06-12T09:00:00",
    used_at: undefined,
    created_at: "2026-06-01T00:00:00",
  },
  {
    id: "qr-002",
    evento_id: "evt-001",
    tipo: "ASISTENCIA",
    token: "qr-evt-001-asistencia",
    expires_at: "2026-06-12T12:00:00",
    used_at: undefined,
    created_at: "2026-06-01T00:00:00",
  },
  {
    id: "qr-003",
    evento_id: "evt-003",
    tipo: "INSCRIPCION",
    token: "qr-evt-003-inscripcion",
    expires_at: "2026-06-09T16:00:00",
    used_at: "2026-06-01T00:00:00",
    created_at: "2026-05-20T00:00:00",
  },
  {
    id: "qr-004",
    evento_id: "evt-003",
    tipo: "ASISTENCIA",
    token: "qr-evt-003-asistencia",
    expires_at: "2026-06-09T20:00:00",
    used_at: undefined,
    created_at: "2026-05-20T00:00:00",
  },
];

export const NOTIFICACIONES: Notificacion[] = [
  {
    id: "not-001",
    usuario_id: "20211002345",
    titulo: "Te inscribiste exitosamente a Taller de Investigación Académica",
    mensaje: "Recibirás un recordatorio 24 horas antes del evento.",
    tipo: "EVENTO",
    leido: false,
    created_at: "2026-06-10T22:30:00",
  },
  {
    id: "not-002",
    usuario_id: "20211002345",
    titulo: "Tu asistencia al evento Festival Cultural UNAH 2026 fue aprobada",
    mensaje: "Se acreditaron 4h a tu historial",
    tipo: "ASISTENCIA",
    leido: false,
    created_at: "2026-06-10T10:00:00",
  },
  {
    id: "not-003",
    usuario_id: "20211002345",
    titulo: "Tu asistencia al evento Jornada de Voluntariado Social fue rechazada",
    mensaje: "Motivo: El estudiante no cumplió con el tiempo mínimo de permanencia en el evento.",
    tipo: "ASISTENCIA",
    leido: false,
    created_at: "2026-06-10T09:00:00",
  },
  {
    id: "not-004",
    usuario_id: "20211002345",
    titulo: "El evento Taller de Investigación Académica comienza mañana",
    mensaje: "No olvides tu carnet estudiantil. ¡Te esperamos!",
    tipo: "EVENTO",
    leido: false,
    created_at: "2026-06-11T00:00:00",
  },
  {
    id: "not-005",
    usuario_id: "20211002345",
    titulo: "Hay un lugar disponible en Taller de Investigación Académica",
    mensaje: "Donde estabas en lista de espera. ¡Corre a inscribirte!",
    tipo: "SISTEMA",
    leido: true,
    created_at: "2026-06-08T14:00:00",
  },
  {
    id: "not-006",
    usuario_id: "20211002345",
    titulo: "¡Completaste las 15 horas de Académico!",
    mensaje: "Ya cumpliste este ámbito. Sigue participando en otras categorías.",
    tipo: "SISTEMA",
    leido: false,
    created_at: "2026-06-10T10:05:00",
  },
];

export const LIMITE_POR_CATEGORIA = 15;

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

export const CATEGORY_LABEL_LONG: Record<EventCategory, string> = {
  ACADEMICO: "Académico-científico",
  CULTURAL: "Cultural-Artístico",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

export const VISIBILIDAD_LABEL: Record<string, string> = {
  PUBLICO: "Público",
  PRIVADO: "Privado",
};

export const SOLICITADO_POR_LABEL: Record<string, string> = {
  TUTOR: "Tutor",
  ESTUDIANTE: "Estudiante",
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente aprobación",
  RECHAZADO: "Rechazado",
  PROGRAMADO: "Programado",
  EN_CURSO: "En curso",
  EN_CURSO_SALIDA: "En curso (salida)",
  FINALIZADO: "Finalizado",
};

export const STATUS_TONE: Record<EventStatus, string> = {
  BORRADOR: "bg-muted text-muted-foreground border-border",
  PENDIENTE_APROBACION: "bg-amber-50 text-amber-900 border-amber-200",
  RECHAZADO: "bg-red-50 text-red-900 border-red-200",
  PROGRAMADO: "bg-green-50 text-green-800 border-green-200",
  EN_CURSO: "bg-blue-50 text-blue-800 border-blue-200",
  EN_CURSO_SALIDA: "bg-blue-50 text-blue-800 border-blue-200",
  FINALIZADO: "bg-muted text-muted-foreground border-border",
};

export const CENTROS_REGIONALES = [
  "Ciudad Universitaria",
  "CURLA",
  "CURLP",
  "CURC",
  "CURVA",
  "UNAH-VS",
];

export const TIPO_EVENTO_LABEL: Record<string, string> = {
  HORAS_VOAE: "Horas VOAE (Artículo 140)",
  RECREACION: "Evento de recreación",
};

export const ESTADO_INSCRIPCION_LABEL: Record<string, string> = {
  SI: "Requiere inscripción",
  NO: "No requiere inscripción",
};

export const PERMISOS_MODERADOR = ["ASISTENCIA", "FEED"];

export const NOVEDADES: Novedad[] = [
  {
    id: "nov-001",
    autor_id: "VOAE-001",
    autor_nombre: "VOAE UNAH",
    autor_rol: "VOAE",
    titulo: "¡Bienvenidos al nuevo semestre!",
    contenido:
      "Les recordamos que todas las actividades deben ser aprobadas por VOAE. Revisen los requisitos en el portal.",
    tipo: "MANUAL",
    created_at: "2026-06-01T08:00:00",
  },
  {
    id: "nov-002",
    autor_id: "VOAE-001",
    autor_nombre: "VOAE UNAH",
    autor_rol: "VOAE",
    titulo: "Nuevo evento disponible: Taller de Investigación",
    contenido: "Se ha creado un nuevo evento académico. Revisa los detalles e inscríbete.",
    tipo: "AUTOMATICA",
    created_at: "2026-06-01T09:00:00",
    evento_id: "evt-001",
  },
  {
    id: "nov-003",
    autor_id: "TUT-0034",
    autor_nombre: "Dr. Carlos Mendoza",
    autor_rol: "Tutor",
    titulo: "Cupos disponibles para taller",
    contenido:
      "Aún hay cupos para el Taller de Investigación Académica. ¡No pierdan la oportunidad!",
    tipo: "MANUAL",
    created_at: "2026-06-05T10:30:00",
    evento_id: "evt-001",
  },
  {
    id: "nov-004",
    autor_id: "VOAE-001",
    autor_nombre: "VOAE UNAH",
    autor_rol: "VOAE",
    titulo: "Recordatorio: Plazo de inscripciones",
    contenido: "Las inscripciones para actividades de este mes cierran el 20 de junio.",
    tipo: "MANUAL",
    created_at: "2026-06-10T07:00:00",
  },
];

export const MODERADORES: Moderador[] = [
  {
    id: "mod-001",
    usuario_id: "VOAE-001",
    nombre: "Lic. Roberto Guzmán",
    email: "roberto.guzman@unah.hn",
    asignado_por: "ADMIN-001",
    permisos: ["APROBAR_EVENTOS", "VALIDAR_ASISTENCIAS", "GESTIONAR_FEED", "VER_ANALITICA"],
    activo: true,
    created_at: "2026-01-15T00:00:00",
  },
  {
    id: "mod-002",
    usuario_id: "VOAE-002",
    nombre: "MSc. Karen Flores",
    email: "karen.flores@unah.hn",
    asignado_por: "ADMIN-001",
    permisos: ["VALIDAR_ASISTENCIAS", "VER_ANALITICA"],
    activo: true,
    created_at: "2026-02-01T00:00:00",
  },
  {
    id: "mod-003",
    usuario_id: "VOAE-003",
    nombre: "Ing. Mario Pineda",
    email: "mario.pineda@unah.hn",
    asignado_por: "ADMIN-001",
    permisos: ["APROBAR_EVENTOS", "GESTIONAR_FEED"],
    activo: false,
    created_at: "2026-03-10T00:00:00",
  },
];

export const CONSTANCIAS: Constancia[] = [
  {
    id: "const-001",
    actividad_id: "act-001",
    url_archivo: "https://unah.hn/constancias/const-001.pdf",
    qr_validacion: "qr-const-001",
    estado: "VERIFICADA",
    verificado_por: "VOAE-012",
    verificado_at: "2026-06-11T10:00:00",
    created_at: "2026-06-10T12:00:00",
  },
  {
    id: "const-002",
    actividad_id: "act-002",
    url_archivo: "https://unah.hn/constancias/const-002.pdf",
    qr_validacion: "qr-const-002",
    estado: "VERIFICADA",
    verificado_por: "VOAE-012",
    verificado_at: "2026-06-11T11:00:00",
    created_at: "2026-06-10T14:00:00",
  },
  {
    id: "const-003",
    actividad_id: "act-003",
    url_archivo: "https://unah.hn/constancias/const-003.pdf",
    qr_validacion: "qr-const-003",
    estado: "NO_VERIFICADA",
    created_at: "2026-06-12T09:00:00",
  },
];

export const SUSCRIPCIONES: Suscripcion[] = [
  {
    id: "sub-001",
    estudiante_id: "20211002345",
    evento_id: "evt-001",
    created_at: "2026-06-05T10:00:00",
  },
  {
    id: "sub-002",
    estudiante_id: "20211002345",
    evento_id: "evt-003",
    created_at: "2026-06-05T10:30:00",
  },
  {
    id: "sub-003",
    estudiante_id: "20201567823",
    evento_id: "evt-001",
    created_at: "2026-06-06T09:00:00",
  },
  {
    id: "sub-004",
    estudiante_id: "20201567823",
    evento_id: "evt-002",
    created_at: "2026-06-06T09:15:00",
  },
  {
    id: "sub-005",
    estudiante_id: "20211098765",
    evento_id: "evt-003",
    created_at: "2026-06-07T14:00:00",
  },
];

/* ──────── STUDENT SEARCH (VOAE) ──────── */
export interface StudentProfile {
  id: string;
  nombre: string;
  carrera: string;
  activo: boolean;
}

export const MOCK_STUDENT_PROFILES: StudentProfile[] = [
  { id: "20211002345", nombre: "María González", carrera: "Ingeniería en Sistemas", activo: true },
  { id: "20201567823", nombre: "Juan Pérez", carrera: "Medicina", activo: true },
  { id: "20211098765", nombre: "Ana Martínez", carrera: "Derecho", activo: true },
  { id: "20221034567", nombre: "Luis Hernández", carrera: "Arquitectura", activo: true },
  { id: "20201245678", nombre: "Carmen Flores", carrera: "Psicología", activo: false },
  { id: "20211006789", nombre: "José Rodríguez", carrera: "Ingeniería Civil", activo: true },
  { id: "20211007890", nombre: "Sofía López", carrera: "Administración de Empresas", activo: true },
  { id: "20211008901", nombre: "Miguel Castro", carrera: "Biología", activo: true },
];

export function findStudentByAccount(cuenta: string): StudentProfile | null {
  return MOCK_STUDENT_PROFILES.find((s) => s.id === cuenta) ?? null;
}

export function getStudentApprovedActivities(estudianteId: string): ActividadEstudiante[] {
  return ACTIVIDADES.filter((a) => a.estudiante_id === estudianteId && a.estado === "APROBADO");
}

export function getStudentCategoryHours(estudianteId: string, categoria: EventCategory): number {
  return getStudentApprovedActivities(estudianteId)
    .filter((a) => a.categoria === categoria && a.estado === "APROBADO")
    .reduce((s, a) => s + a.horas_acreditadas, 0);
}

export function getSuscripciones(eventoId: string): Suscripcion[] {
  return SUSCRIPCIONES.filter((s) => s.evento_id === eventoId);
}

export function toggleSuscripcion(estudianteId: string, eventoId: string): boolean {
  const idx = SUSCRIPCIONES.findIndex(
    (s) => s.estudiante_id === estudianteId && s.evento_id === eventoId,
  );
  if (idx >= 0) {
    SUSCRIPCIONES.splice(idx, 1);
    return false;
  } else {
    SUSCRIPCIONES.push({
      id: `sub-${Date.now()}`,
      estudiante_id: estudianteId,
      evento_id: eventoId,
      created_at: new Date().toISOString(),
    });
    return true;
  }
}

export function getConstanciaForActividad(actividadId: string): Constancia | undefined {
  return CONSTANCIAS.find((c) => c.actividad_id === actividadId);
}

export function generateConstanciaId(): string {
  return `const-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getConstanciaByVerificationCode(codigo: string): Constancia | undefined {
  return CONSTANCIAS.find((c) => c.id === codigo || c.qr_validacion === codigo);
}

let notifCounter = 100;
export function addNotification(n: {
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificacionTipo;
}): void {
  NOTIFICACIONES.unshift({
    id: `not-dyn-${++notifCounter}`,
    usuario_id: n.usuario_id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    tipo: n.tipo,
    leido: false,
    created_at: new Date().toISOString(),
  });
}
