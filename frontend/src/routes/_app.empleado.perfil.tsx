import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useRole } from "@/lib/role-context";

export const Route = createFileRoute("/_app/empleado/perfil")({
  component: PerfilPage,
});

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
  estado: "Pendiente" | "Validado" | "Rechazado";
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

type EstadoPumita = "Conectado" | "Pendiente" | "Sugerido";

interface PumitaData {
  nombre: string;
  carrera: string;
  avatar: string;
  estado: EstadoPumita;
  biografia: string;
  activo: boolean;
}

const perfilInicial: PerfilData = {
  nombre: "Dr. Carlos Mendoza",
  carrera: "Docencia Universitaria",
  facultad: "Ciencias Económicas",
  centroUniversitario: "UNAH-CU",
  correoInstitucional: "carlos.mendoza@unah.hn",
  estadoAcademico: "Activo",
  miembroDesde: "Enero de 2020",
  biografia: "Docente de la Facultad de Ciencias Económicas. Apasionado por la enseñanza y la gestión académica.",
  horasAcumuladas: 0,
  dobleFactor: true,
  forma003: "",
};

const notificacionesRecientes = [
  { icon: "fa-calendar-check", texto: "Evento aprobado por VOAE", tiempo: "Hace 10 min" },
  { icon: "fa-bookmark", texto: "Nuevo evento guardado en tu perfil", tiempo: "Hace 1 h" },
  { icon: "fa-user-plus", texto: "Andrea quiere unirse a tu red", tiempo: "Hace 3 h" },
];

const pumitas: PumitaData[] = [
  { nombre: "Andrea Mejía", carrera: "Ingeniería en Sistemas", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200", estado: "Conectado", activo: true, biografia: "Estudiante de sistemas enfocada en desarrollo web." },
  { nombre: "Carlos Rivera", carrera: "Tutor de Contabilidad", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", estado: "Conectado", activo: false, biografia: "Tutor académico en contabilidad financiera." },
  { nombre: "Lucía Pineda", carrera: "Administración", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200", estado: "Pendiente", activo: true, biografia: "Participa en grupos de liderazgo estudiantil." },
  { nombre: "Marco Zelaya", carrera: "Mercadotecnia", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200", estado: "Sugerido", activo: false, biografia: "Interesado en investigación de mercados." },
  { nombre: "Gabriela Santos", carrera: "Psicología", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200", estado: "Conectado", activo: true, biografia: "Apoya actividades de bienestar estudiantil." },
  { nombre: "Diego Alvarado", carrera: "Economía", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", estado: "Sugerido", activo: false, biografia: "Colabora en análisis de datos." },
];

const reaccionesPumita = ["👍 Apoyo", "🎉 Felicitación", "👋 Saludo", "🐾 Rugido Puma"];

const documentosIniciales: DocumentoForma003[] = [
  { periodo: "I PAC 2026", carnet: "carnet-i-pac-2026.png", forma003: "forma-003-i-pac-2026.pdf", fechaCarga: "12/05/2026", estado: "Validado" },
  { periodo: "II PAC 2026", carnet: "carnet-ii-pac-2026.png", forma003: "forma-003-ii-pac-2026.pdf", fechaCarga: "03/06/2026", estado: "Pendiente" },
];

const publicacionesGuardadas: PublicacionGuardada[] = [
  { titulo: "Guía rápida para preparar una tutoría efectiva", autor: "Comunidad Académica UNAH", fechaGuardado: "18/06/2026", descripcion: "Consejos breves para organizar materiales.", detalle: "Esta publicación resume pasos prácticos para planificar sesiones de estudio." },
  { titulo: "Convocatoria de voluntariado estudiantil", autor: "VOAE", fechaGuardado: "16/06/2026", descripcion: "Información sobre apoyo estudiantil.", detalle: "La convocatoria invita a estudiantes a participar en actividades de apoyo institucional." },
  { titulo: "Recursos para mejorar tu perfil universitario", autor: "Conecta Puma", fechaGuardado: "12/06/2026", descripcion: "Recomendaciones para mantener actualizada tu información.", detalle: "Incluye sugerencias sobre biografía, contactos relevantes y documentos académicos." },
];

const eventosGuardadosLista: EventoGuardado[] = [
  { titulo: "Seminario de Ciberseguridad UNAH", fecha: "25/06/2026", estado: "En curso", descripcion: "Introducción al análisis de vulnerabilidades.", detalle: "Evento académico orientado a estudiantes interesados en seguridad informática." },
  { titulo: "Taller de Liderazgo", fecha: "15/10/2026", estado: "Programado", descripcion: "Taller presencial sobre habilidades blandas.", detalle: "Actividad de cuatro semanas con dinámicas grupales." },
  { titulo: "Webinar de Marketing Digital y SEO", fecha: "20/09/2026", estado: "Finalizado", descripcion: "Sesión virtual sobre posicionamiento orgánico.", detalle: "Webinar introductorio sobre SEO y contenido digital." },
];

const carrerasDisponibles = [
  "Ingeniería en Sistemas", "Licenciatura en Administración", "Licenciatura en Contaduría Pública",
  "Licenciatura en Economía", "Ingeniería Industrial", "Licenciatura en Mercadotecnia",
  "Licenciatura en Psicología", "Ingeniería Civil", "Licenciatura en Derecho",
  "Licenciatura en Ciencias de la Educación",
];

const centrosRegionales = [
  "UNAH-CU", "UNAH-VS", "UNAH-La Ceiba", "UNAH-Comayagua", "UNAH-Choluteca",
  "UNAH-San Pedro Sula", "UNAH-Copán", "UNAH-Olancho", "UNAH-Gracias",
  "UNAH-El Paraíso", "UNAH-Intibucá", "UNAH-Juticalpa", "UNAH-Yoro",
];

const motivosSugeridos = [
  "Cambio de interés académico", "Mejores oportunidades laborales",
  "Disponibilidad de horario", "Reubicación geográfica",
  "Rendimiento académico", "Recomendación académica",
];

function PerfilPage() {
  const { user } = useRole();
  const [viewMode, setViewMode] = useState<"ver" | "editar">("ver");
  const [perfil, setPerfil] = useState<PerfilData>(perfilInicial);
  const [borrador, setBorrador] = useState<PerfilData>(perfilInicial);
  const [notificacionesPerfil, setNotificacionesPerfil] = useState(notificacionesRecientes);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [pumitaSeleccionada, setPumitaSeleccionada] = useState<PumitaData | null>(null);
  const [mensajePerfilPumita, setMensajePerfilPumita] = useState("");
  const [mostrarMenuReaccionesPumita, setMostrarMenuReaccionesPumita] = useState(false);
  const [mostrarRedPumita, setMostrarRedPumita] = useState(false);
  const [mostrarAgregarPumita, setMostrarAgregarPumita] = useState(false);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<string[]>([]);
  const [dejadosDeSeguir, setDejadosDeSeguir] = useState<string[]>([]);
  const [pumitaPorDejar, setPumitaPorDejar] = useState<PumitaData | null>(null);
  const [interaccionesActivas, setInteraccionesActivas] = useState(true);
  const [mostrarAdvertenciaHoras, setMostrarAdvertenciaHoras] = useState(false);
  const [mostrarCambioCarrera, setMostrarCambioCarrera] = useState(false);
  const [nuevaCarrera, setNuevaCarrera] = useState("");
  const [centroRegionalCambio, setCentroRegionalCambio] = useState("");
  const [motivoCambioCarrera, setMotivoCambioCarrera] = useState("");
  const [errorCambioCarrera, setErrorCambioCarrera] = useState("");
  const [mensajeCambioCarrera, setMensajeCambioCarrera] = useState("");
  const [documentosForma003, setDocumentosForma003] = useState<DocumentoForma003[]>(documentosIniciales);
  const [mostrarRegistroAcademico, setMostrarRegistroAcademico] = useState(false);
  const [periodoRegistro, setPeriodoRegistro] = useState("");
  const [carnetRegistro, setCarnetRegistro] = useState("");
  const [forma003Registro, setForma003Registro] = useState("");
  const [mensajeDocumento, setMensajeDocumento] = useState("");
  const [mostrarEventosGuardados, setMostrarEventosGuardados] = useState(false);
  const [mostrarPublicacionesGuardadas, setMostrarPublicacionesGuardadas] = useState(false);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState<PublicacionGuardada | null>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoGuardado | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  const iniciarEdicion = () => { setBorrador(perfil); setViewMode("editar"); };
  const guardarCambios = () => { setPerfil(borrador); setViewMode("ver"); };
  const cancelarEdicion = () => { setBorrador(perfil); setViewMode("ver"); };

  const manejarCambioDeFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) setFotoPerfil(URL.createObjectURL(archivo));
  };

  const fotoPerfilActual = fotoPerfil || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";

  const enviarSolicitudPumita = (nombre: string) => {
    setSolicitudesEnviadas((actuales) => (actuales.includes(nombre) ? actuales : [...actuales, nombre]));
  };
  const cancelarSolicitudPumita = (nombre: string) => {
    setSolicitudesEnviadas((actuales) => actuales.filter((s) => s !== nombre));
  };
  const abrirPerfilPumita = (p: PumitaData) => { setMensajePerfilPumita(""); setMostrarMenuReaccionesPumita(false); setPumitaSeleccionada(p); };
  const enviarRugidoPuma = (nombre: string) => {
    setMensajePerfilPumita(`Rugido Puma enviado a ${nombre}`);
    setNotificacionesPerfil((a) => [{ icon: "fa-paw", texto: `Rugido Puma enviado a ${nombre}`, tiempo: "Ahora" }, ...a].slice(0, 5));
  };
  const enviarReaccionPumita = (nombre: string, reaccion: string) => {
    setMensajePerfilPumita(`${reaccion} enviada a ${nombre}`);
    setMostrarMenuReaccionesPumita(false);
    setNotificacionesPerfil((a) => [{ icon: reaccion.includes("Rugido") ? "fa-paw" : "fa-face-smile", texto: `${reaccion} enviada a ${nombre}`, tiempo: "Ahora" }, ...a].slice(0, 5));
  };
  const dejarDeSeguirPumita = (nombre: string) => {
    setDejadosDeSeguir((a) => (a.includes(nombre) ? a : [...a, nombre]));
    setPumitaPorDejar(null);
  };
  const obtenerEstiloEstadoPumita = (estado: EstadoPumita) => {
    if (estado === "Conectado") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (estado === "Pendiente") return "bg-[#FFD100]/20 text-[#003366] border-[#FFD100]/40";
    return "bg-[#F4F6F8] text-[#717182] border-gray-200";
  };
  const pumitasConectadas = pumitas.filter((p) => p.estado === "Conectado" && !dejadosDeSeguir.includes(p.nombre));
  const perteneceARedPumita = (p: PumitaData) => p.estado === "Conectado" && !dejadosDeSeguir.includes(p.nombre);
  const eventosGuardados = 12;

  const enviarCambioCarrera = () => {
    if (!nuevaCarrera.trim()) { setErrorCambioCarrera("La nueva carrera es obligatoria."); return; }
    if (!centroRegionalCambio.trim()) { setErrorCambioCarrera("El centro regional es obligatorio."); return; }
    if (motivoCambioCarrera.trim().length < 10) { setErrorCambioCarrera("El motivo debe tener al menos 10 caracteres."); return; }
    setErrorCambioCarrera("");
    setMensajeCambioCarrera("Solicitud de cambio de carrera enviada.");
    setNuevaCarrera(""); setCentroRegionalCambio(""); setMotivoCambioCarrera("");
  };

  const validarArchivoAcademico = (archivo: File | undefined) => {
    if (!archivo) return { valido: false, mensaje: "Debes cargar Carnet y Forma 003." };
    const extensionValida = /\.(pdf|jpg|jpeg|png)$/i.test(archivo.name);
    const tamanoValido = archivo.size <= 10 * 1024 * 1024;
    if (!extensionValida) return { valido: false, mensaje: "Solo se permiten archivos PDF, JPG o PNG." };
    if (!tamanoValido) return { valido: false, mensaje: "El tamaño máximo permitido es 10 MB." };
    return { valido: true, mensaje: "" };
  };

  const manejarSeleccionRegistro = (tipo: "Carnet" | "Forma 003", e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const validacion = validarArchivoAcademico(archivo);
    if (!validacion.valido) { setMensajeDocumento(validacion.mensaje); e.target.value = ""; return; }
    if (tipo === "Carnet") setCarnetRegistro(archivo.name);
    if (tipo === "Forma 003") setForma003Registro(archivo.name);
    setMensajeDocumento(""); e.target.value = "";
  };

  const agregarRegistroAcademico = () => {
    if (!periodoRegistro.trim()) { setMensajeDocumento("El período académico es obligatorio."); return; }
    if (!carnetRegistro || !forma003Registro) { setMensajeDocumento("Debes cargar Carnet y Forma 003."); return; }
    setDocumentosForma003((a) => [{ periodo: periodoRegistro, carnet: carnetRegistro, forma003: forma003Registro, fechaCarga: new Date().toLocaleDateString(), estado: "Pendiente" }, ...a]);
    setMensajeDocumento("Registro agregado correctamente.");
    setPeriodoRegistro(""); setCarnetRegistro(""); setForma003Registro(""); setMostrarRegistroAcademico(false);
  };

  const validarRegistroForma003 = () => {
    setDocumentosForma003((a) => a.map((d, i) => (i === 0 ? { ...d, estado: "Validado" } : d)));
    setMensajeDocumento("Registro validado localmente.");
  };

  if (viewMode === "editar") {
    return (
      <div className="flex bg-[#F4F6F8] min-h-screen text-[#003366] font-sans overflow-y-auto">
        <div className="flex-1 p-4 md:p-6">
          <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#003366]">Mi Perfil</h1>
              <p className="text-[#717182] text-sm">Editar perfil</p>
              <div className="mt-3 h-1 w-16 rounded-full bg-[#FFD100]" />
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-bold text-sm">{borrador.estadoAcademico}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="w-full h-full rounded-full border-4 border-[#FFD100] bg-[#F4F6F8] flex items-center justify-center overflow-hidden">
                    {fotoPerfil ? <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" /> : <span className="text-[#004B87] text-4xl font-bold">CM</span>}
                  </div>
                  <input type="file" id="fileInput" className="hidden" accept="image/*" onChange={manejarCambioDeFoto} />
                  <label htmlFor="fileInput" className="absolute bottom-0 right-0 bg-white text-[#003366] w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FFD100] transition-colors shadow-lg cursor-pointer border border-gray-200">
                    <span className="text-base leading-none">📷</span>
                  </label>
                </div>
                <h2 className="text-xl font-bold text-[#003366] mt-4">{borrador.nombre}</h2>
                <p className="text-[#004B87] text-sm mb-4">{borrador.carrera}</p>
                <div className="space-y-4 text-left border-t border-gray-200 pt-4">
                  <div className="flex flex-col gap-1"><span className="text-[#717182] text-xs uppercase font-bold tracking-wider">Carrera</span><p className="text-sm text-[#003366]">{borrador.carrera}</p></div>
                  <div className="flex flex-col gap-1"><span className="text-[#717182] text-xs uppercase font-bold tracking-wider">Facultad</span><p className="text-sm text-[#003366]">{borrador.facultad}</p></div>
                  <div className="flex flex-col gap-1"><span className="text-[#717182] text-xs uppercase font-bold tracking-wider">Centro Universitario</span><p className="text-sm text-[#003366]">{borrador.centroUniversitario}</p></div>
                  <div className="flex flex-col gap-1"><span className="text-[#717182] text-xs uppercase font-bold tracking-wider">Correo institucional</span><input value={borrador.correoInstitucional} readOnly className="bg-[#F4F6F8] text-[#717182] text-sm rounded-xl px-3 py-2 outline-none cursor-not-allowed border border-gray-200 w-full" /></div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-6 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-4 text-[#003366]">Datos de cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2"><span className="text-[#717182] text-xs uppercase font-bold tracking-wider">Nombre</span><input value={borrador.nombre} readOnly className="bg-[#F4F6F8] text-[#717182] text-sm rounded-xl px-3 py-3 outline-none cursor-not-allowed border border-gray-200 w-full" /></label>
                  <label className="flex flex-col gap-2"><span className="text-[#717182] text-xs uppercase font-bold tracking-wider">Correo institucional</span><input value={borrador.correoInstitucional} readOnly className="bg-[#F4F6F8] text-[#717182] text-sm rounded-xl px-3 py-3 outline-none cursor-not-allowed border border-gray-200 w-full" /></label>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-[#003366]"><i className="fa-solid fa-pen-to-square text-[#E8920A]" /> Mi biografía</h3>
                <textarea className="w-full bg-[#F4F6F8] text-[#003366] p-4 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-[#FFD100]/40 border border-gray-200 focus:border-[#004B87] transition-all resize-none" value={borrador.biografia} maxLength={300} onChange={(e) => setBorrador({ ...borrador, biografia: e.target.value })} placeholder="Cuéntanos sobre ti..." />
                <p className="text-right text-xs text-[#717182] mt-2">{borrador.biografia.length} / 300</p>
              </div>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-4 text-[#003366]">Seguridad y avance</h3>
                <div className="space-y-4 text-sm">
                  <div><span className="block text-[#717182] mb-2">Horas acumuladas</span><input type="number" value={borrador.horasAcumuladas} readOnly className="w-full bg-[#F4F6F8] p-3 rounded-xl text-sm border border-gray-200 outline-none text-[#717182] cursor-not-allowed" /><p className="text-[11px] text-[#717182] mt-2">Solo lectura.</p></div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold mb-2 text-[#003366]">Historial Forma 003</h3>
                <p className="text-[#717182] text-xs mb-4">Registros locales para visualización.</p>
                <button type="button" onClick={() => { setMostrarRegistroAcademico(true); setMensajeDocumento(""); }} className="w-full mb-4 bg-[#FFD100] hover:bg-[#FFE766] border border-[#FFD100] rounded-lg px-3 py-2.5 text-xs font-bold text-[#003366] transition-colors">Agregar registro</button>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {documentosForma003.map((doc) => (
                    <div key={`${doc.periodo}-${doc.carnet}`} className="border border-gray-200 rounded-xl p-3 bg-[#F4F6F8]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><p className="font-bold text-[#003366] text-sm">{doc.periodo}</p><p className="text-xs text-[#717182]">Historial académico</p></div>
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${doc.estado === "Validado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : doc.estado === "Rechazado" ? "bg-[#D4183D]/10 text-[#D4183D] border-[#D4183D]/20" : "bg-[#FFD100]/20 text-[#003366] border-[#FFD100]/40"}`}>{doc.estado}</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-[#003366] truncate">Carnet: {doc.carnet}</p>
                      <p className="text-xs font-semibold text-[#003366] truncate">Forma 003: {doc.forma003}</p>
                      <p className="text-[11px] text-[#717182]">Cargado: {doc.fechaCarga}</p>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={validarRegistroForma003} className="mt-4 w-full bg-white border border-gray-200 text-[#003366] font-bold py-2.5 rounded-lg hover:bg-[#FFD100] transition-colors text-xs">Validar registro</button>
                {mensajeDocumento && <p className="mt-3 text-xs font-semibold text-[#004B87]">{mensajeDocumento}</p>}
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={guardarCambios} className="w-full bg-[#FFD100] text-[#003366] font-bold p-4 rounded-lg hover:bg-[#FFE766] transition-all shadow-sm">Guardar cambios</button>
                <button onClick={cancelarEdicion} className="w-full bg-white text-[#D4183D] border border-[#D4183D]/20 p-4 rounded-lg hover:bg-[#D4183D]/10 transition-all shadow-sm">Cancelar edición</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F4F6F8] min-h-screen">
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#003366] mb-2">Mi Perfil</h1>
              <p className="text-[#717182] text-sm">Administra tu información académica y tus conexiones universitarias.</p>
              <div className="mt-3 h-1 w-16 rounded-full bg-[#FFD100]" />
            </div>
            <div className="relative self-start">
              <button type="button" onClick={() => setMostrarNotificaciones((a) => !a)} className="relative w-11 h-11 rounded-xl bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:border-[#FFD100] hover:bg-[#FFD100]/20 transition-colors">
                <i className="fa-solid fa-bell" />
                {notificacionesPerfil.length > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FFD100] text-[10px] font-bold text-[#003366] flex items-center justify-center">{notificacionesPerfil.length}</span>}
              </button>
              {mostrarNotificaciones && (
                <div className="absolute right-0 top-12 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                  <h4 className="text-sm font-bold text-[#003366] mb-2">Notificaciones</h4>
                  <div className="space-y-2">
                    {notificacionesPerfil.slice(0, 5).map((n) => (
                      <div key={`${n.texto}-${n.tiempo}`} className="flex items-start gap-3 rounded-lg bg-[#F4F6F8] p-3">
                        <span className="w-8 h-8 rounded-lg bg-white text-[#E8920A] flex items-center justify-center shrink-0 border border-gray-200"><i className={`fa-solid ${n.icon} text-xs`} /></span>
                        <div className="min-w-0"><p className="text-xs font-bold text-[#003366]">{n.texto}</p><p className="text-[11px] text-[#717182]">{n.tiempo}</p></div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mt-3 w-full border-t border-gray-100 pt-3 text-xs font-bold text-[#004B87] hover:text-[#003366] transition-colors">Ver todas las notificaciones</button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "fa-bookmark", label: "Eventos guardados", value: eventosGuardados },
              { icon: "fa-newspaper", label: "Publicaciones guardadas", value: publicacionesGuardadas.length },
              { icon: "fa-clock", label: "Horas acumuladas", value: perfil.horasAcumuladas },
            ].map(({ icon, label, value }) => (
              <button key={label} type="button" onClick={() => { if (label === "Eventos guardados") setMostrarEventosGuardados(true); if (label === "Publicaciones guardadas") setMostrarPublicacionesGuardadas(true); }} className="min-w-0 rounded-xl bg-[#F4F6F8] border border-gray-200 px-3 py-2 shadow-sm text-left hover:border-[#FFD100] transition-colors">
                <div className="flex items-center gap-2 text-[#E8920A]"><i className={`fa-solid ${icon} text-xs`} /><span className="text-[11px] font-bold uppercase tracking-wide truncate">{label}</span>
                  {label === "Horas acumuladas" && <button type="button" onClick={() => setMostrarAdvertenciaHoras(true)} className="ml-auto text-[#D4183D] hover:text-[#003366] transition-colors"><i className="fa-solid fa-triangle-exclamation text-xs" /></button>}
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
              <div className="relative w-32 h-32 rounded-full border-4 border-[#FFD100] p-1 mb-4 overflow-hidden bg-[#F4F6F8] shadow-sm">
                <img src={fotoPerfilActual} alt={perfil.nombre} className="w-full h-full object-cover rounded-full" />
              </div>
              <h2 className="text-2xl font-bold text-[#003366]">{perfil.nombre}</h2>
              <p className="text-sm font-semibold text-[#004B87] mt-1">{perfil.carrera}</p>
              <p className="text-xs text-[#717182] mt-2">{perfil.centroUniversitario}</p>
            </div>
            <button type="button" onClick={() => setMostrarAgregarPumita(true)} className="mt-5 w-full text-left rounded-xl border border-[#FFD100]/40 bg-[#FFD100]/10 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-lg bg-white text-[#004B87] flex items-center justify-center border border-[#FFD100]/30"><i className="fa-solid fa-user-plus" /></span><div><p className="font-bold text-[#003366] text-sm">Agregar a mi red</p><p className="text-xs text-[#717182]">Conecta con otros pumitas</p></div></div>
            </button>
            <button onClick={iniciarEdicion} className="mt-5 w-full bg-[#FFD100] hover:bg-[#FFE766] text-[#003366] font-bold py-3 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"><i className="fa-solid fa-pen-to-square" /> Editar Perfil</button>
            <button type="button" onClick={() => { setMostrarCambioCarrera(true); setErrorCambioCarrera(""); setMensajeCambioCarrera(""); }} className="mt-3 w-full bg-white hover:bg-[#F4F6F8] text-[#003366] border border-gray-200 font-bold py-3 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"><i className="fa-solid fa-right-left text-[#E8920A]" /> Solicitar cambio de carrera</button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-[#003366] mb-4">Información personal</h3>
            <div className="space-y-4 text-sm">
              {[
                { icon: "fa-briefcase", label: "Carrera", value: perfil.carrera },
                { icon: "fa-building-columns", label: "Facultad", value: perfil.facultad },
                { icon: "fa-location-dot", label: "Centro regional", value: perfil.centroUniversitario },
                { icon: "fa-envelope", label: "Correo institucional", value: perfil.correoInstitucional },
                { icon: "fa-circle-check", label: "Estado académico", value: perfil.estadoAcademico },
                { icon: "fa-calendar-days", label: "Miembro desde", value: perfil.miembroDesde },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <span className="w-8 h-8 rounded-lg bg-[#F4F6F8] text-[#E8920A] flex items-center justify-center shrink-0"><i className={`fa-solid ${icon} text-xs`} /></span>
                  <div className="min-w-0"><p className="text-xs text-[#717182] font-bold uppercase tracking-wide">{label}</p><p className="text-[#003366] font-semibold break-words">{value}</p></div>
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
                <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-[#FFD100]" />
                <p className="text-sm text-[#717182]">Contactos recientes dentro de tu red universitaria.</p>
              </div>
              <button type="button" onClick={() => setMostrarRedPumita((a) => !a)} className="self-start sm:self-auto px-4 py-2 rounded-lg bg-[#F4F6F8] border border-gray-200 text-sm font-bold text-[#003366] hover:bg-[#FFD100] transition-colors">{mostrarRedPumita ? "Ocultar Red Pumita" : "Ver todos"}</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {pumitas.slice(0, 4).map((pumita) => {
                const dejadoDeSeguir = dejadosDeSeguir.includes(pumita.nombre);
                return (
                  <article key={pumita.nombre} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-[#FFD100] hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <img src={pumita.avatar} alt={pumita.nombre} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                      <div className="min-w-0"><h4 className="font-bold text-[#003366] truncate">{pumita.nombre}</h4><p className="text-xs text-[#717182] truncate">{pumita.carrera}</p>{dejadoDeSeguir && <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[11px] font-bold text-[#717182]">Dejado de seguir</span>}</div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button type="button" onClick={() => abrirPerfilPumita(pumita)} className="border border-gray-200 rounded-lg py-2 text-xs font-bold text-[#003366] hover:border-[#FFD100] hover:bg-[#F4F6F8] transition-colors">Ver perfil</button>
                      <button type="button" onClick={() => setPumitaPorDejar(pumita)} disabled={dejadoDeSeguir} className="border border-[#D4183D]/20 rounded-lg py-2 text-xs font-bold text-[#D4183D] hover:bg-[#D4183D]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{dejadoDeSeguir ? "Dejado de seguir" : "Dejar de seguir"}</button>
                    </div>
                  </article>
                );
              })}
            </div>

            {mostrarRedPumita && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div><h4 className="text-lg font-bold text-[#003366]">Red Pumita</h4><p className="text-xs text-[#717182]">Pumitas conectadas, pendientes y sugeridas.</p></div>
                  <span className="px-3 py-1 rounded-full bg-[#FFD100]/20 text-[#003366] text-xs font-bold border border-[#FFD100]/40">{pumitas.length} contactos</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pumitas.map((pumita) => {
                    const dejadoDeSeguir = dejadosDeSeguir.includes(pumita.nombre);
                    return (
                      <article key={`red-${pumita.nombre}`} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                        <img src={pumita.avatar} alt={pumita.nombre} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                        <div className="min-w-0 flex-1"><h5 className="font-bold text-[#003366] truncate">{pumita.nombre}</h5><p className="text-xs text-[#717182] truncate">{pumita.carrera}</p><span className={`inline-flex mt-2 px-2 py-0.5 rounded-full border text-[11px] font-bold ${dejadoDeSeguir ? "bg-gray-100 text-[#717182] border-gray-200" : obtenerEstiloEstadoPumita(pumita.estado)}`}>{dejadoDeSeguir ? "Dejado de seguir" : pumita.estado}</span></div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => abrirPerfilPumita(pumita)} className="px-3 py-2 rounded-lg bg-[#F4F6F8] border border-gray-200 text-xs font-bold text-[#003366] hover:bg-[#FFD100] transition-colors">Ver perfil</button>
                          <button type="button" onClick={() => setPumitaPorDejar(pumita)} disabled={dejadoDeSeguir} className="px-3 py-2 rounded-lg border border-[#D4183D]/20 text-xs font-bold text-[#D4183D] hover:bg-[#D4183D]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{dejadoDeSeguir ? "Listo" : "Dejar de seguir"}</button>
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
                <h3 className="text-xl font-bold text-[#003366]">Interacción Social</h3>
                <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-[#FFD100]" />
                <p className="text-sm text-[#717182]">Controla si otros Pumitas pueden enviar reacciones a tu perfil.</p>
              </div>
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <span className="text-sm font-bold text-[#003366]">{interaccionesActivas ? "ON" : "OFF"}</span>
                <button type="button" onClick={() => setInteraccionesActivas((a) => !a)} className={`relative w-14 h-8 rounded-full border shadow-inner transition-all duration-300 ${interaccionesActivas ? "bg-[#FFD100] border-[#FFD100]" : "bg-white border-gray-300"}`}>
                  <span className={`absolute top-1 w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${interaccionesActivas ? "translate-x-7" : "translate-x-1"} ${interaccionesActivas ? "bg-[#004B87]" : "bg-[#003366]"}`} />
                </button>
              </label>
            </div>
            {!interaccionesActivas && <p className="mt-3 text-xs text-[#717182]">Las reacciones al perfil están deshabilitadas.</p>}
          </section>

          <section className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-[#003366]">Gestión académica básica</h3>
              <div className="mt-2 mb-2 h-1 w-12 rounded-full bg-[#FFD100]" />
              <p className="text-sm text-[#717182]">Accesos rápidos a contenido guardado y trámites del perfil.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button type="button" onClick={() => setMostrarEventosGuardados(true)} className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-4 text-left shadow-sm hover:border-[#FFD100] transition-colors">
                <span className="w-10 h-10 rounded-lg bg-white text-[#E8920A] flex items-center justify-center border border-gray-200"><i className="fa-solid fa-calendar-check" /></span>
                <h4 className="mt-3 font-bold text-[#003366]">Ver eventos guardados</h4>
                <p className="text-sm text-[#717182] mt-1">Consulta eventos guardados sin cargar la vista principal.</p>
              </button>
              <button type="button" onClick={() => setMostrarPublicacionesGuardadas(true)} className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-4 text-left shadow-sm hover:border-[#FFD100] transition-colors">
                <span className="w-10 h-10 rounded-lg bg-white text-[#E8920A] flex items-center justify-center border border-gray-200"><i className="fa-solid fa-bookmark" /></span>
                <h4 className="mt-3 font-bold text-[#003366]">Ver publicaciones guardadas</h4>
                <p className="text-sm text-[#717182] mt-1">Abre tus publicaciones guardadas en una vista separada.</p>
              </button>
            </div>
          </section>
        </main>
      </div>

      {mostrarEventosGuardados && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[86vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><h3 className="text-xl font-bold text-[#003366]">Eventos guardados</h3><p className="text-sm text-[#717182]">Eventos guardados para consultar después.</p></div>
              <button type="button" onClick={() => setMostrarEventosGuardados(false)} className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {eventosGuardadosLista.map((ev) => (
                <article key={`modal-${ev.titulo}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <button type="button" onClick={() => setEventoSeleccionado(ev)} className="text-left font-bold text-[#003366] hover:text-[#004B87] transition-colors">{ev.titulo}</button>
                  <p className="text-xs text-[#717182] mt-1">{ev.fecha}</p>
                  <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-[#FFD100]/20 border border-[#FFD100]/40 text-[11px] font-bold text-[#003366]">{ev.estado}</span>
                  <p className="text-xs text-[#717182] mt-3">{ev.descripcion}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {mostrarPublicacionesGuardadas && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[86vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><h3 className="text-xl font-bold text-[#003366]">Publicaciones guardadas</h3><p className="text-sm text-[#717182]">Publicaciones académicas guardadas.</p></div>
              <button type="button" onClick={() => setMostrarPublicacionesGuardadas(false)} className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {publicacionesGuardadas.map((pub) => (
                <article key={`modal-${pub.titulo}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#FFD100] transition-colors">
                  <button type="button" onClick={() => setPublicacionSeleccionada(pub)} className="text-left font-bold text-[#003366] hover:text-[#004B87] transition-colors">{pub.titulo}</button>
                  <p className="text-xs text-[#717182] mt-2">Autor: {pub.autor}</p>
                  <p className="text-xs text-[#717182]">Guardado: {pub.fechaGuardado}</p>
                  <p className="text-sm text-[#717182] mt-3 leading-relaxed">{pub.descripcion}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {publicacionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div><h3 className="text-xl font-bold text-[#003366]">{publicacionSeleccionada.titulo}</h3><p className="text-sm text-[#717182]">Autor: {publicacionSeleccionada.autor}</p><p className="text-xs text-[#717182]">Guardado: {publicacionSeleccionada.fechaGuardado}</p></div>
              <button type="button" onClick={() => setPublicacionSeleccionada(null)} className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#F4F6F8] p-4">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3"><span className="w-11 h-11 rounded-full bg-[#FFD100] text-[#003366] flex items-center justify-center shrink-0"><i className="fa-solid fa-bookmark" /></span><div className="min-w-0"><p className="font-bold text-[#003366]">{publicacionSeleccionada.autor}</p><p className="text-xs text-[#717182]">Publicación guardada · {publicacionSeleccionada.fechaGuardado}</p></div></div>
              <p className="mt-4 text-sm leading-relaxed text-[#717182]">{publicacionSeleccionada.detalle}</p>
            </div>
            <button type="button" onClick={() => setPublicacionSeleccionada(null)} className="mt-5 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFE766] transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {eventoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div><h3 className="text-xl font-bold text-[#003366]">{eventoSeleccionado.titulo}</h3><p className="text-sm text-[#717182]">{eventoSeleccionado.fecha}</p><span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-[#FFD100]/20 border border-[#FFD100]/40 text-[11px] font-bold text-[#003366]">{eventoSeleccionado.estado}</span></div>
              <button type="button" onClick={() => setEventoSeleccionado(null)} className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"><i className="fa-solid fa-xmark" /></button>
            </div>
            <p className="text-sm leading-relaxed text-[#717182]">{eventoSeleccionado.detalle}</p>
            <button type="button" onClick={() => setEventoSeleccionado(null)} className="mt-5 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFE766] transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {pumitaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 shadow-2xl p-6">
            <button type="button" onClick={() => { setPumitaSeleccionada(null); setMensajePerfilPumita(""); setMostrarMenuReaccionesPumita(false); }} className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"><i className="fa-solid fa-xmark" /></button>
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full border-4 border-[#FFD100] bg-[#F4F6F8] p-1 shadow-sm"><img src={pumitaSeleccionada.avatar} alt={pumitaSeleccionada.nombre} className="w-full h-full rounded-full object-contain bg-white" /></div>
              <h3 className="mt-4 text-2xl font-bold text-[#003366]">{pumitaSeleccionada.nombre}</h3>
              <p className="text-sm font-semibold text-[#004B87]">{pumitaSeleccionada.carrera}</p>
              <p className="mt-4 text-sm leading-relaxed text-[#717182]">{pumitaSeleccionada.biografia}</p>
              {mensajePerfilPumita && <p className="mt-4 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{mensajePerfilPumita}</p>}
              {perteneceARedPumita(pumitaSeleccionada) ? (
                <div className="mt-6 w-full space-y-3">
                  <button type="button" onClick={() => enviarRugidoPuma(pumitaSeleccionada.nombre)} className="w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFE766] transition-colors">Enviar Rugido Puma</button>
                  <div className="relative">
                    <button type="button" onClick={() => setMostrarMenuReaccionesPumita((a) => !a)} className="w-full border border-gray-200 bg-[#F4F6F8] text-[#003366] font-bold py-3 rounded-lg hover:border-[#FFD100] transition-colors">Reaccionar ▼</button>
                    {mostrarMenuReaccionesPumita && (
                      <div className="absolute left-0 right-0 top-12 z-20 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                        <div className="grid grid-cols-1 gap-2">
                          {reaccionesPumita.map((reaccion) => (
                            <button key={`reaccion-${reaccion}`} type="button" onClick={() => enviarReaccionPumita(pumitaSeleccionada.nombre, reaccion)} className="rounded-lg px-3 py-2 text-left text-sm font-bold text-[#003366] hover:bg-[#FFD100]/20 transition-colors">{reaccion}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => enviarSolicitudPumita(pumitaSeleccionada.nombre)} disabled={solicitudesEnviadas.includes(pumitaSeleccionada.nombre)} className={`mt-6 w-full font-bold py-3 rounded-lg transition-colors ${solicitudesEnviadas.includes(pumitaSeleccionada.nombre) ? "bg-[#F4F6F8] text-[#717182] border border-gray-200 cursor-not-allowed" : "bg-[#FFD100] text-[#003366] hover:bg-[#FFE766]"}`}>Agregar Pumita</button>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarAdvertenciaHoras && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl p-5">
            <div className="flex items-center gap-3 mb-4"><span className="w-11 h-11 rounded-lg bg-[#FFD100]/20 text-[#E8920A] flex items-center justify-center"><i className="fa-solid fa-triangle-exclamation" /></span><h3 className="text-xl font-bold text-[#003366]">Aviso sobre horas</h3></div>
            <p className="text-sm leading-relaxed text-[#717182]">Recuerda: estas horas solo son acumuladas por la aplicación; por tanto, las únicas horas válidas para el artículo 140 son aquellas que aprobó y emitió el departamento de VOAE.</p>
            <button type="button" onClick={() => setMostrarAdvertenciaHoras(false)} className="mt-5 w-full bg-[#FFD100] text-[#003366] font-bold py-3 rounded-lg hover:bg-[#FFE766] transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {pumitaPorDejar && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-2xl p-5">
            <h3 className="text-lg font-bold text-[#003366]">Dejar de seguir</h3>
            <p className="mt-3 text-sm text-[#717182]">¿Deseas dejar de seguir a {pumitaPorDejar.nombre}?</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button type="button" onClick={() => setPumitaPorDejar(null)} className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-bold text-[#003366] hover:bg-[#F4F6F8] transition-colors">Cancelar</button>
              <button type="button" onClick={() => dejarDeSeguirPumita(pumitaPorDejar.nombre)} className="rounded-lg bg-[#D4183D] py-3 text-sm font-bold text-white hover:bg-[#D4183D]/90 transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarCambioCarrera && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div><h3 className="text-xl font-bold text-[#003366]">Solicitar cambio de carrera</h3><p className="text-sm text-[#717182]">Completa la solicitud para revisión académica.</p></div>
              <button type="button" onClick={() => setMostrarCambioCarrera(false)} className="w-9 h-9 rounded-lg bg-[#F4F6F8] border border-gray-200 text-[#003366] hover:bg-[#FFD100] transition-colors"><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="space-y-4">
              <label className="block"><span className="block text-xs text-[#717182] font-bold uppercase tracking-wide mb-2">Carrera actual</span><input value={perfil.carrera} readOnly className="w-full bg-[#F4F6F8] border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#717182] cursor-not-allowed" /></label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
