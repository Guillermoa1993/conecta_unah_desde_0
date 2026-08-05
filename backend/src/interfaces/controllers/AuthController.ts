import { cfg } from '../../infrastructure/config/configService';
import { Request, Response, NextFunction } from 'express';
import { LoginUsuario } from '../../use-cases/auth/LoginUsuario';
import { RegistrarUsuario } from '../../use-cases/auth/RegistrarUsuario';
import { LoginMicrosoft } from '../../use-cases/auth/LoginMicrosoft';
import { EnviarOtp } from '../../use-cases/auth/EnviarOtp';
import { VerificarOtp } from '../../use-cases/auth/VerificarOtp';
import { getMsalClient, getAzureRedirectUri, AZURE_SCOPES } from '../../infrastructure/auth/msalConfig';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { RegistrarEstudiante } from '../../use-cases/auth/RegistrarEstudiante';
import { RegistrarEmpleado } from '../../use-cases/auth/RegistrarEmpleado';
import { EnviarOtpRegistro } from '../../use-cases/auth/EnviarOtpRegistro';
import jwt from 'jsonwebtoken';
import { ActualizarPerfilPersonal } from '../../use-cases/perfil/ActualizarPerfilPersonal';
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUsuario,
    private readonly registrarUseCase: RegistrarUsuario,
    private readonly loginMicrosoftUseCase: LoginMicrosoft,
    private readonly enviarOtpUseCase: EnviarOtp,
    private readonly verificarOtpUseCase: VerificarOtp,
    private readonly registrarEstudianteUseCase: RegistrarEstudiante,
    private readonly enviarOtpRegistroUseCase: EnviarOtpRegistro,
    private readonly registrarEmpleadoUseCase: RegistrarEmpleado,
    private readonly usuarioRepo?: UsuarioRepository,
    private readonly actualizarPerfilUseCase?: ActualizarPerfilPersonal,
  ) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  registrar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = await this.registrarUseCase.execute(req.body);
      const { password, ...pub } = usuario as unknown as Record<string, unknown> & { password: string };
      res.status(201).json(pub);
    } catch (err) { next(err); }
  };

  perfil = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = await this.usuarioRepo!.findById(req.usuario!.id);
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    const { password, otp_code, otp_expira, ...pub } = usuario as any;
    res.json({ usuario: pub });
  } catch (err) { next(err); }
};

actualizarPerfil = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telefono, genero, biografia, foto_url } = req.body;
    const usuario = await this.actualizarPerfilUseCase!.execute(req.usuario!.id, {
      telefono, genero, biografia, foto_url,
    });
    const { password, otp_code, otp_expira, ...pub } = usuario as any;
    res.json({ usuario: pub });
  } catch (err) { next(err); }
};

  enviarOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { correo } = req.body;
      await this.enviarOtpUseCase.execute(correo);
      res.json({ mensaje: 'Código enviado correctamente' });
    } catch (err) {
      if (err instanceof Error && err.message === 'CORREO_NO_REGISTRADO') {
        res.status(404).json({ error: 'Este correo no está registrado.' });
        return;
      }
      if (err instanceof Error && err.message === 'NO_ENROLADO') {
        res.status(403).json({ error: 'NO_ENROLADO' });
        return;
      }
      next(err);
    }
  };

  verificarOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.verificarOtpUseCase.execute(req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  registrarEstudiante = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = await this.registrarEstudianteUseCase.execute(req.body);
      const { password, forma003_base64, ...pub } = usuario as unknown as Record<string, unknown> & { password: string; forma003_base64: string };
      res.status(201).json(pub);
    } catch (err) { next(err); }
  };

  registrarEmpleado = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = await this.registrarEmpleadoUseCase.execute(req.body);
      const { password, forma003_base64, ...pub } = usuario as unknown as Record<string, unknown> & { password: string; forma003_base64: string };
      res.status(201).json(pub);
    } catch (err) { next(err); }
  };

  enviarOtpRegistro = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { correo } = req.body;
      await this.enviarOtpRegistroUseCase.execute(correo);
      res.json({ mensaje: 'Código enviado correctamente' });
    } catch (err) { next(err); }
  };

  verificarCorreoExistente = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const correo = req.query.correo as string;
      if (!correo) {
        res.status(400).json({ error: 'Correo requerido' });
        return;
      }
      const usuario = await this.usuarioRepo!.findByCorreo(correo);
      res.json({ existe: !!usuario });
    } catch (err) { next(err); }
  };

  microsoftLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUrl = await getMsalClient().getAuthCodeUrl({
        scopes: AZURE_SCOPES,
        redirectUri: getAzureRedirectUri(),
        prompt: 'select_account',
      });
      res.redirect(authUrl);
    } catch (err) { next(err); }
  };

  microsoftCallback = async (req: Request, res: Response) => {
    const frontendUrl = cfg('FRONTEND_URL', 'http://localhost:5185');
    try {
      const code = req.query.code as string;
      if (!code) throw new Error('Código de autorización faltante');

      const tokenResponse = await getMsalClient().acquireTokenByCode({
        code,
        scopes: AZURE_SCOPES,
        redirectUri: getAzureRedirectUri(),
      });

      const account = tokenResponse.account;
      if (!account?.username || !account?.homeAccountId) {
        throw new Error('No se pudo obtener el perfil de Microsoft');
      }

      const result = await this.loginMicrosoftUseCase.execute({
        microsoftId: account.homeAccountId,
        correo: account.username.toLowerCase(),
        nombre: account.name ?? account.username,
      });

      res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
    } catch (err) {
      const codigo = err instanceof Error ? err.message : '';

      if (codigo === 'NO_ENROLADO') {
        res.redirect(`${frontendUrl}/registro?desde=microsoft`);
        return;
      }
      if (codigo === 'DOMINIO_NO_PERMITIDO') {
        res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Solo se permiten cuentas @unah.hn o @unah.edu.hn')}`);
        return;
      }

      const mensaje = err instanceof Error ? err.message : 'Error de autenticación con Microsoft';
      res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(mensaje)}`);
    }
  };

  // ── Solo disponible fuera de producción ──────────────────────────────────
  devLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ROL_CORREO: Record<string, string> = {
        estudiante:        'guillermo.ayestas@unah.hn',
        admin:             'admin@unah.hn',
        tutor:             'tutor@unah.edu.hn',
        voae:              'voae@unah.hn',
        voae_direccion:    'voae@unah.hn',
        voae_departamento: 'voae_depto@unah.hn',
        voae_depto:        'voae_depto@unah.hn',
        coordinacion:      'voae_depto@unah.hn',
        dev:               'dev@unah.hn',
      };

      const rol = (req.body.rol as string)?.toLowerCase();
      const correo = ROL_CORREO[rol];
      if (!correo) {
        res.status(400).json({ error: `Rol inválido. Opciones: ${Object.keys(ROL_CORREO).join(', ')}` });
        return;
      }

      let usuario = await this.usuarioRepo!.findByCorreo(correo) as any;
      if (!usuario) {
        if (rol.includes('depto') || rol.includes('departamento') || rol.includes('coordinacion')) {
          usuario = {
            id_usuario: 99,
            id: 99,
            nombre: 'Coordinador de Departamento (Prueba)',
            correo: 'voae_depto@unah.hn',
            rol: 'VOAE_DEPARTAMENTO',
          };
        } else if (rol.includes('voae')) {
          usuario = {
            id_usuario: 88,
            id: 88,
            nombre: 'Dirección VOAE (Prueba)',
            correo: 'voae@unah.hn',
            rol: 'VOAE_DIRECCION',
          };
        } else if (rol.includes('tutor') || rol.includes('empleado')) {
          usuario = {
            id_usuario: 77,
            id: 77,
            nombre: 'Empleado / Tutor (Prueba)',
            correo: 'tutor@unah.edu.hn',
            rol: 'EMPLEADO',
          };
        } else if (rol.includes('admin')) {
          usuario = {
            id_usuario: 66,
            id: 66,
            nombre: 'Administrador (Prueba)',
            correo: 'admin@unah.hn',
            rol: 'ADMIN',
          };
        } else {
          usuario = {
            id_usuario: 55,
            id: 55,
            nombre: 'Estudiante (Prueba)',
            correo: 'guillermo.ayestas@unah.hn',
            rol: 'ESTUDIANTE',
          };
        }
      }

      const secret = cfg('JWT_SECRET', 'dev-secret-change-in-prod');
      const token = jwt.sign(
        { id: usuario.id_usuario || usuario.id, rol: usuario.rol },
        secret,
        { expiresIn: '8h' }
      );

      const { password, microsoft_id, otp_code, otp_expira, ...pub } = usuario;
      res.json({ token, usuario: pub });
    } catch (err) { next(err); }
  };
}
