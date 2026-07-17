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
      if (err instanceof Error && err.message === 'NO_ENROLADO') {
        res.status(404).json({ error: 'Este correo no está registrado. Debes enrolarte primero.' });
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

  enviarOtpRegistro = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { correo } = req.body;
      await this.enviarOtpRegistroUseCase.execute(correo);
      res.json({ mensaje: 'Código enviado correctamente' });
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
        estudiante: 'guillermo.ayestas@unah.hn',
        admin:      'admin@unah.hn',
        tutor:      'tutor@unah.edu.hn',
        voae:       'voae@unah.hn',
        dev:        'dev@unah.hn',
      };

      const rol = (req.body.rol as string)?.toLowerCase();
      const correo = ROL_CORREO[rol];
      if (!correo) {
        res.status(400).json({ error: `Rol inválido. Opciones: ${Object.keys(ROL_CORREO).join(', ')}` });
        return;
      }

      const usuario = await this.usuarioRepo!.findByCorreo(correo) as any;
      if (!usuario) {
        res.status(404).json({ error: `Usuario de prueba "${correo}" no encontrado en la DB` });
        return;
      }

      const secret = cfg('JWT_SECRET', 'dev-secret-change-in-prod');
      const token = jwt.sign(
        { id: usuario.id_usuario, rol: usuario.rol },
        secret,
        { expiresIn: '8h' }
      );

      const { password, microsoft_id, otp_code, otp_expira, ...pub } = usuario;
      res.json({ token, usuario: pub });
    } catch (err) { next(err); }
  };
}
