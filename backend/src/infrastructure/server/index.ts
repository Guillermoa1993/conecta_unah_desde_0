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
import { PostgresUsuarioSeguridadRepository } from '../repositories/PostgresUsuarioSeguridadRepository';
import { PostgresRolSeguridadRepository } from '../repositories/PostgresRolSeguridadRepository';
import { PostgresPermisoSeguridadRepository } from '../repositories/PostgresPermisoSeguridadRepository';

// Use cases
import { GetHealthReport } from '../../use-cases/GetHealthReport';
import { LoginUsuario } from '../../use-cases/auth/LoginUsuario';
import { RegistrarUsuario } from '../../use-cases/auth/RegistrarUsuario';
import { LoginMicrosoft } from '../../use-cases/auth/LoginMicrosoft';
import { EnviarOtp } from '../../use-cases/auth/EnviarOtp';
import { VerificarOtp } from '../../use-cases/auth/VerificarOtp';
import { CrearEvento } from '../../use-cases/eventos/CrearEvento';
import { ObtenerEventos } from '../../use-cases/eventos/ObtenerEventos';
import { ObtenerEventoPorId } from '../../use-cases/eventos/ObtenerEventoPorId';
import { ActualizarEvento } from '../../use-cases/eventos/ActualizarEvento';
import { AprobarRechazarEvento } from '../../use-cases/eventos/AprobarRechazarEvento';
import { InscribirEstudiante } from '../../use-cases/inscripciones/InscribirEstudiante';
import { CancelarInscripcion } from '../../use-cases/inscripciones/CancelarInscripcion';
import { GestionarConstancia } from '../../use-cases/constancias/GestionarConstancia';
import {
  CrearUsuarioSeguridad, ObtenerUsuariosSeguridad, ObtenerUsuarioSeguridadPorId,
  ActualizarUsuarioSeguridad, InhabilitarUsuarioSeguridad, HabilitarUsuarioSeguridad,
  AsignarRolAUsuario, RevocarRolDeUsuario,
  AsignarPermisoDirectoAUsuario, RevocarPermisoDirectoDeUsuario,
} from '../../use-cases/seguridad/UsuarioSeguridadUseCases';
import {
  CrearRolSeguridad, ObtenerRolesSeguridad, ObtenerRolSeguridadPorId,
  ActualizarRolSeguridad, EliminarRolSeguridad, AsignarPermisoARol, RevocarPermisoDeRol,
} from '../../use-cases/seguridad/RolSeguridadUseCases';
import {
  CrearPermisoSeguridad, ObtenerPermisosSeguridad, ObtenerPermisoSeguridadPorId,
  ActualizarPermisoSeguridad, EliminarPermisoSeguridad,
} from '../../use-cases/seguridad/PermisoSeguridadUseCases';

// Controllers
import { HealthController } from '../../interfaces/controllers/HealthController';
import { AuthController } from '../../interfaces/controllers/AuthController';
import { EventoController } from '../../interfaces/controllers/EventoController';
import { InscripcionController } from '../../interfaces/controllers/InscripcionController';
import { ConstanciaController } from '../../interfaces/controllers/ConstanciaController';
import { NotificacionController } from '../../interfaces/controllers/NotificacionController';
import { UsuarioSeguridadController } from '../../interfaces/controllers/UsuarioSeguridadController';
import { RolSeguridadController } from '../../interfaces/controllers/RolSeguridadController';
import { PermisoSeguridadController } from '../../interfaces/controllers/PermisoSeguridadController';

// Routes
import { authRouter } from '../../interfaces/routes/authRoutes';
import { eventoRouter } from '../../interfaces/routes/eventoRoutes';
import { inscripcionRouter } from '../../interfaces/routes/inscripcionRoutes';
import { constanciaRouter } from '../../interfaces/routes/constanciaRoutes';
import { notificacionRouter } from '../../interfaces/routes/notificacionRoutes';
import { usuarioSeguridadRouter } from '../../interfaces/routes/usuarioSeguridadRoutes';
import { rolSeguridadRouter } from '../../interfaces/routes/rolSeguridadRoutes';
import { permisoSeguridadRouter } from '../../interfaces/routes/permisoSeguridadRoutes';

// Middleware
import { errorMiddleware } from '../../interfaces/middlewares/errorMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use(express.json());

// ── Repositorios ────────────────────────────────────────────────────────────
const healthRepo       = new PostgresHealthRepository();
const usuarioRepo      = new PostgresUsuarioRepository(pool);
const eventoRepo       = new PostgresEventoRepository(pool);
const inscripcionRepo  = new PostgresInscripcionRepository(pool);
const constanciaRepo   = new PostgresConstanciaRepository(pool);
const notificacionRepo = new PostgresNotificacionRepository(pool);
const usuarioSegRepo   = new PostgresUsuarioSeguridadRepository(pool);
const rolSegRepo       = new PostgresRolSeguridadRepository(pool);
const permisoSegRepo   = new PostgresPermisoSeguridadRepository(pool);

// ── Use cases ───────────────────────────────────────────────────────────────
const loginUC          = new LoginUsuario(usuarioRepo);
const registrarUC      = new RegistrarUsuario(usuarioRepo);
const loginMicrosoftUC = new LoginMicrosoft(usuarioRepo);
const enviarOtpUC      = new EnviarOtp(usuarioRepo);
const verificarOtpUC   = new VerificarOtp(usuarioRepo);
const crearEventoUC    = new CrearEvento(eventoRepo);
const obtenerEventosUC = new ObtenerEventos(eventoRepo);
const obtenerEventoUC  = new ObtenerEventoPorId(eventoRepo);
const actualizarUC     = new ActualizarEvento(eventoRepo);
const aprobarUC        = new AprobarRechazarEvento(eventoRepo, notificacionRepo);
const inscribirUC      = new InscribirEstudiante(inscripcionRepo, eventoRepo);
const cancelarInscUC   = new CancelarInscripcion(inscripcionRepo);
const constanciaUC     = new GestionarConstancia(constanciaRepo, eventoRepo, notificacionRepo);

// Módulo 4 · Seguridad — Usuarios
const crearUsuarioSegUC       = new CrearUsuarioSeguridad(usuarioSegRepo);
const obtenerUsuariosSegUC    = new ObtenerUsuariosSeguridad(usuarioSegRepo);
const obtenerUsuarioSegUC     = new ObtenerUsuarioSeguridadPorId(usuarioSegRepo);
const actualizarUsuarioSegUC  = new ActualizarUsuarioSeguridad(usuarioSegRepo);
const inhabilitarUsuarioSegUC = new InhabilitarUsuarioSeguridad(usuarioSegRepo);
const habilitarUsuarioSegUC   = new HabilitarUsuarioSeguridad(usuarioSegRepo);
const asignarRolUsuarioUC     = new AsignarRolAUsuario(usuarioSegRepo, rolSegRepo);
const revocarRolUsuarioUC     = new RevocarRolDeUsuario(usuarioSegRepo);
const asignarPermisoUsuarioUC = new AsignarPermisoDirectoAUsuario(usuarioSegRepo, permisoSegRepo);
const revocarPermisoUsuarioUC = new RevocarPermisoDirectoDeUsuario(usuarioSegRepo);

// Módulo 4 · Seguridad — Roles
const crearRolSegUC      = new CrearRolSeguridad(rolSegRepo);
const obtenerRolesSegUC   = new ObtenerRolesSeguridad(rolSegRepo);
const obtenerRolSegUC     = new ObtenerRolSeguridadPorId(rolSegRepo);
const actualizarRolSegUC  = new ActualizarRolSeguridad(rolSegRepo);
const eliminarRolSegUC    = new EliminarRolSeguridad(rolSegRepo);
const asignarPermisoRolUC = new AsignarPermisoARol(rolSegRepo, permisoSegRepo);
const revocarPermisoRolUC = new RevocarPermisoDeRol(rolSegRepo);

// Módulo 4 · Seguridad — Permisos
const crearPermisoSegUC     = new CrearPermisoSeguridad(permisoSegRepo);
const obtenerPermisosSegUC  = new ObtenerPermisosSeguridad(permisoSegRepo);
const obtenerPermisoSegUC   = new ObtenerPermisoSeguridadPorId(permisoSegRepo);
const actualizarPermisoSegUC = new ActualizarPermisoSeguridad(permisoSegRepo);
const eliminarPermisoSegUC  = new EliminarPermisoSeguridad(permisoSegRepo);

// ── Controllers ─────────────────────────────────────────────────────────────
const healthCtrl       = new HealthController(new GetHealthReport(healthRepo));
const authCtrl         = new AuthController(loginUC, registrarUC, loginMicrosoftUC, enviarOtpUC, verificarOtpUC, usuarioRepo);
const eventoCtrl       = new EventoController(crearEventoUC, obtenerEventosUC, obtenerEventoUC, actualizarUC, aprobarUC, eventoRepo);
const inscripcionCtrl  = new InscripcionController(inscribirUC, cancelarInscUC, inscripcionRepo);
const constanciaCtrl   = new ConstanciaController(constanciaUC, constanciaRepo);
const notificacionCtrl = new NotificacionController(notificacionRepo);

const usuarioSegCtrl = new UsuarioSeguridadController(
  crearUsuarioSegUC, obtenerUsuariosSegUC, obtenerUsuarioSegUC, actualizarUsuarioSegUC,
  inhabilitarUsuarioSegUC, habilitarUsuarioSegUC,
  asignarRolUsuarioUC, revocarRolUsuarioUC, asignarPermisoUsuarioUC, revocarPermisoUsuarioUC,
);
const rolSegCtrl = new RolSeguridadController(
  crearRolSegUC, obtenerRolesSegUC, obtenerRolSegUC, actualizarRolSegUC, eliminarRolSegUC,
  asignarPermisoRolUC, revocarPermisoRolUC,
);
const permisoSegCtrl = new PermisoSeguridadController(
  crearPermisoSegUC, obtenerPermisosSegUC, obtenerPermisoSegUC, actualizarPermisoSegUC, eliminarPermisoSegUC,
);

// ── Rutas ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => healthCtrl.handle(req, res));
app.use('/api/auth',          authRouter(authCtrl));
app.use('/api/eventos',       eventoRouter(eventoCtrl));
app.use('/api/inscripciones', inscripcionRouter(inscripcionCtrl));
app.use('/api/constancias',   constanciaRouter(constanciaCtrl));
app.use('/api/notificaciones', notificacionRouter(notificacionCtrl));
app.use('/api/seguridad/usuarios', usuarioSeguridadRouter(usuarioSegCtrl));
app.use('/api/seguridad/roles',    rolSeguridadRouter(rolSegCtrl));
app.use('/api/seguridad/permisos', permisoSeguridadRouter(permisoSegCtrl));

// ── Error handler (debe ir al final) ────────────────────────────────────────
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`\n🚀 UNAH Conecta API corriendo en http://localhost:${PORT}`);
  console.log(`   Health:         GET  /api/health`);
  console.log(`   Auth:           POST /api/auth/login | POST /api/auth/registro`);
  console.log(`   Eventos:        GET  /api/eventos`);
  console.log(`   Inscripciones:  POST /api/inscripciones/evento/:id`);
  console.log(`   Constancias:    GET  /api/constancias/pendientes`);
  console.log(`   Notificaciones: GET  /api/notificaciones`);
  console.log(`   Seguridad:      GET  /api/seguridad/usuarios | /api/seguridad/roles | /api/seguridad/permisos\n`);
});
