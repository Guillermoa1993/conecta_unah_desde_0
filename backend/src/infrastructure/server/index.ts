import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Infrastructure
import pool from '../database/db';
import { PostgresHealthRepository } from '../repositories/PostgresHealthRepository';
import { PostgresUsuarioRepository } from '../repositories/PostgresUsuarioRepository';
import { PostgresEventoRepository } from '../repositories/PostgresEventoRepository';
import { PostgresInscripcionRepository } from '../repositories/PostgresInscripcionRepository';
import { PostgresConstanciaRepository } from '../repositories/PostgresConstanciaRepository';
import { PostgresNotificacionRepository } from '../repositories/PostgresNotificacionRepository';
import { PostgresEstadoRepository } from '../repositories/PostgresEstadoRepository';
import { PostgresPumitaRepository } from '../repositories/PostgresPumitaRepository';
import { PostgresReaccionPumitaRepository } from '../repositories/PostgresReaccionPumitaRepository';

// Use cases
import { GetHealthReport } from '../../use-cases/GetHealthReport';
import { LoginUsuario } from '../../use-cases/auth/LoginUsuario';
import { RegistrarUsuario } from '../../use-cases/auth/RegistrarUsuario';
import { LoginMicrosoft } from '../../use-cases/auth/LoginMicrosoft';
import { EnviarOtp } from '../../use-cases/auth/EnviarOtp';
import { VerificarOtp } from '../../use-cases/auth/VerificarOtp';
import { RegistrarEstudiante } from '../../use-cases/auth/RegistrarEstudiante';
import { EnviarOtpRegistro } from '../../use-cases/auth/EnviarOtpRegistro';
import { CrearEvento } from '../../use-cases/eventos/CrearEvento';
import { ObtenerEventos } from '../../use-cases/eventos/ObtenerEventos';
import { ObtenerEventoPorId } from '../../use-cases/eventos/ObtenerEventoPorId';
import { ActualizarEvento } from '../../use-cases/eventos/ActualizarEvento';
import { AprobarRechazarEvento } from '../../use-cases/eventos/AprobarRechazarEvento';
import { InscribirEstudiante } from '../../use-cases/inscripciones/InscribirEstudiante';
import { CancelarInscripcion } from '../../use-cases/inscripciones/CancelarInscripcion';
import { GestionarConstancia } from '../../use-cases/constancias/GestionarConstancia';
import { CrearEstado } from '../../use-cases/estados/CrearEstado';
import { ObtenerEstadosActivos } from '../../use-cases/estados/ObtenerEstadosActivos';
import { ListarConexiones } from '../../use-cases/pumitas/ListarConexiones';
import { ListarSolicitudesPendientes } from '../../use-cases/pumitas/ListarSolicitudesPendientes';
import { GestionarSolicitud } from '../../use-cases/pumitas/GestionarSolicitud';
import { EnviarReaccionPumita } from '../../use-cases/perfil/EnviarReaccionPumita';
import { ListarReaccionesRecibidas } from '../../use-cases/perfil/ListarReaccionesRecibidas';
import { ListarSugeridos } from '../../use-cases/pumitas/ListarSugeridos';
import { ListarSolicitudesEnviadas } from '../../use-cases/pumitas/ListarSolicitudesEnviadas';
// Controllers
import { HealthController } from '../../interfaces/controllers/HealthController';
import { AuthController } from '../../interfaces/controllers/AuthController';
import { EventoController } from '../../interfaces/controllers/EventoController';
import { InscripcionController } from '../../interfaces/controllers/InscripcionController';
import { ConstanciaController } from '../../interfaces/controllers/ConstanciaController';
import { NotificacionController } from '../../interfaces/controllers/NotificacionController';
import { EstadoController } from '../../interfaces/controllers/EstadoController';
import { PumitaController } from '../../interfaces/controllers/PumitaController';
import { PerfilReaccionController } from '../../interfaces/controllers/PerfilReaccionController';

// Routes
import { authRouter } from '../../interfaces/routes/authRoutes';
import { eventoRouter } from '../../interfaces/routes/eventoRoutes';
import { inscripcionRouter } from '../../interfaces/routes/inscripcionRoutes';
import { constanciaRouter } from '../../interfaces/routes/constanciaRoutes';
import { notificacionRouter } from '../../interfaces/routes/notificacionRoutes';
import { estadoRouter } from '../../interfaces/routes/estadoRoutes';
import { pumitaRouter } from '../../interfaces/routes/pumitaRoutes';
import { perfilReaccionRouter } from '../../interfaces/routes/perfilReaccionRoutes';
import { parametrosRouter } from '../../interfaces/routes/parametrosRoutes';

// Middleware
import { errorMiddleware } from '../../interfaces/middlewares/errorMiddleware';
import { loadConfig, cfg } from '../config/configService';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();

app.use(cors({ origin: (origin, cb) => cb(null, true) })); // CORS dinámico — se re-aplica tras loadConfig
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Repositorios ────────────────────────────────────────────────────────────
const healthRepo       = new PostgresHealthRepository();
const usuarioRepo      = new PostgresUsuarioRepository(pool);
const eventoRepo       = new PostgresEventoRepository(pool);
const inscripcionRepo  = new PostgresInscripcionRepository(pool);
const constanciaRepo   = new PostgresConstanciaRepository(pool);
const notificacionRepo = new PostgresNotificacionRepository(pool);
const estadoRepo = new PostgresEstadoRepository(pool);
const pumitaRepo = new PostgresPumitaRepository(pool);
const reaccionRepo = new PostgresReaccionPumitaRepository(pool);

// ── Use cases ───────────────────────────────────────────────────────────────
const loginUC          = new LoginUsuario(usuarioRepo);
const registrarUC      = new RegistrarUsuario(usuarioRepo);
const loginMicrosoftUC = new LoginMicrosoft(usuarioRepo);
const enviarOtpUC      = new EnviarOtp(usuarioRepo);
const verificarOtpUC   = new VerificarOtp(usuarioRepo);
const registrarEstudianteUC = new RegistrarEstudiante(usuarioRepo);
const enviarOtpRegistroUC   = new EnviarOtpRegistro(usuarioRepo);
const crearEventoUC    = new CrearEvento(eventoRepo);
const obtenerEventosUC = new ObtenerEventos(eventoRepo);
const obtenerEventoUC  = new ObtenerEventoPorId(eventoRepo);
const actualizarUC     = new ActualizarEvento(eventoRepo);
const aprobarUC        = new AprobarRechazarEvento(eventoRepo, notificacionRepo);
const inscribirUC      = new InscribirEstudiante(inscripcionRepo, eventoRepo);
const cancelarInscUC   = new CancelarInscripcion(inscripcionRepo);
const constanciaUC     = new GestionarConstancia(constanciaRepo, eventoRepo, notificacionRepo);
const crearEstadoUC = new CrearEstado(estadoRepo);
const obtenerEstadosUC = new ObtenerEstadosActivos(estadoRepo);
const listarConexionesUC = new ListarConexiones(pumitaRepo);
const listarPendientesUC = new ListarSolicitudesPendientes(pumitaRepo);
const listarSugeridosUC = new ListarSugeridos(pumitaRepo);
const listarEnviadasUC = new ListarSolicitudesEnviadas(pumitaRepo);
const gestionarSolicitudUC = new GestionarSolicitud(pumitaRepo);
const enviarReaccionUC = new EnviarReaccionPumita(reaccionRepo, usuarioRepo);
const listarReaccionesRecibidasUC = new ListarReaccionesRecibidas(reaccionRepo);

// ── Controllers ─────────────────────────────────────────────────────────────
const healthCtrl       = new HealthController(new GetHealthReport(healthRepo));
const authCtrl         = new AuthController(loginUC, registrarUC, loginMicrosoftUC, enviarOtpUC, verificarOtpUC, registrarEstudianteUC, enviarOtpRegistroUC, usuarioRepo);
const eventoCtrl       = new EventoController(crearEventoUC, obtenerEventosUC, obtenerEventoUC, actualizarUC, aprobarUC, eventoRepo);
const inscripcionCtrl  = new InscripcionController(inscribirUC, cancelarInscUC, inscripcionRepo);
const constanciaCtrl   = new ConstanciaController(constanciaUC, constanciaRepo);
const notificacionCtrl = new NotificacionController(notificacionRepo);
const estadoCtrl = new EstadoController(crearEstadoUC, obtenerEstadosUC);
const pumitaCtrl = new PumitaController(listarConexionesUC, listarPendientesUC, listarSugeridosUC, listarEnviadasUC, gestionarSolicitudUC);
const perfilReaccionCtrl = new PerfilReaccionController(enviarReaccionUC, listarReaccionesRecibidasUC);

// ── Rutas ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => healthCtrl.handle(req, res));
app.use('/api/auth',          authRouter(authCtrl));
app.use('/api/eventos',       eventoRouter(eventoCtrl));
app.use('/api/inscripciones', inscripcionRouter(inscripcionCtrl));
app.use('/api/constancias',   constanciaRouter(constanciaCtrl));
app.use('/api/notificaciones', notificacionRouter(notificacionCtrl));
app.use('/api/estados', estadoRouter(estadoCtrl));
app.use('/api/pumitas', pumitaRouter(pumitaCtrl));
app.use('/api/perfil/reacciones', perfilReaccionRouter(perfilReaccionCtrl));
app.use('/api/parametros',    parametrosRouter);

// ── Error handler (debe ir al final) ────────────────────────────────────────
app.use(errorMiddleware);

// Carga config de BD y luego arranca el servidor
loadConfig().then(() => {
  const PORT = Number(cfg('PORT', '5000'));
  const sslActivo = cfg('SSL_ACTIVO') === '1';
  const sslCert   = cfg('SSL_CERTIFICADO', '');

  const banner = (proto: string, port: number) => {
    console.log(`\n🚀 UNAH Conecta API corriendo en ${proto}://localhost:${port}`);
    console.log(`   Health:         GET  /api/health`);
    console.log(`   Auth:           POST /api/auth/login | POST /api/auth/registro`);
    console.log(`   Eventos:        GET  /api/eventos`);
    console.log(`   Inscripciones:  POST /api/inscripciones/evento/:id`);
    console.log(`   Constancias:    GET  /api/constancias/pendientes`);
    console.log(`   Perfil:         POST /api/perfil/reacciones | GET /api/perfil/reacciones/recibidas`);
    console.log(`   Notificaciones: GET  /api/notificaciones\n`);
  };

  if (sslActivo && sslCert) {
    try {
      const keyPath  = sslCert.endsWith('.pem') ? sslCert.replace('cert.pem', 'key.pem') : `${sslCert}/key.pem`;
      const certPath = sslCert.endsWith('.pem') ? sslCert : `${sslCert}/cert.pem`;
      const credentials = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
      https.createServer(credentials, app).listen(PORT, () => banner('https', PORT));
    } catch (e: any) {
      console.warn(`⚠️  SSL configurado pero certificado no encontrado (${e.message}). Arrancando en HTTP.`);
      app.listen(PORT, () => banner('http', PORT));
    }
  } else {
    app.listen(PORT, () => banner('http', PORT));
  }
}).catch(err => {
  console.error('Error cargando config desde BD:', err);
  process.exit(1);
});