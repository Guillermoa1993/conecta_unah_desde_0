import { Request, Response, NextFunction } from 'express';
import { LoginUsuario } from '../../use-cases/auth/LoginUsuario';
import { RegistrarUsuario } from '../../use-cases/auth/RegistrarUsuario';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUsuario,
    private readonly registrarUseCase: RegistrarUsuario,
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
}
