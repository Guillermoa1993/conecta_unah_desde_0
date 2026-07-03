import { Request, Response, NextFunction } from 'express';
import { LoginUsuario } from '../../use-cases/auth/LoginUsuario';
import { RegistrarUsuario } from '../../use-cases/auth/RegistrarUsuario';
import { LoginMicrosoft } from '../../use-cases/auth/LoginMicrosoft';
import { EnviarOtp } from '../../use-cases/auth/EnviarOtp';
import { VerificarOtp } from '../../use-cases/auth/VerificarOtp';
import { msalClient, AZURE_REDIRECT_URI, AZURE_SCOPES } from '../../infrastructure/auth/msalConfig';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUsuario,
    private readonly registrarUseCase: RegistrarUsuario,
    private readonly loginMicrosoftUseCase: LoginMicrosoft,
    private readonly enviarOtpUseCase: EnviarOtp,
    private readonly verificarOtpUseCase: VerificarOtp,
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

  perfil = async (req: Request, res: Response) => {
    res.json({ usuario: req.usuario });
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

  microsoftLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUrl = await msalClient.getAuthCodeUrl({
        scopes: AZURE_SCOPES,
        redirectUri: AZURE_REDIRECT_URI,
        prompt: 'select_account',
      });
      res.redirect(authUrl);
    } catch (err) { next(err); }
  };

  microsoftCallback = async (req: Request, res: Response) => {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5187';
    try {
      const code = req.query.code as string;
      if (!code) throw new Error('Código de autorización faltante');

      const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        scopes: AZURE_SCOPES,
        redirectUri: AZURE_REDIRECT_URI,
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
}
