import { TIPOS_REACCION_PUMITA, TipoReaccionPumita, ReaccionPumita } from '../../domain/entities/ReaccionPumita';
import { ReaccionPumitaRepository } from '../../domain/repositories/ReaccionPumitaRepository';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';

export class PerfilReaccionError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

interface EnviarReaccionPumitaDatos {
  id_emisor: number;
  id_receptor: unknown;
  tipo: unknown;
}

export interface ReaccionPumitaCreada extends ReaccionPumita {
  emisor_nombre: string;
  emisor_foto_url: null;
}

export class EnviarReaccionPumita {
  constructor(
    private readonly reaccionRepo: ReaccionPumitaRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async execute(datos: EnviarReaccionPumitaDatos): Promise<ReaccionPumitaCreada> {
    const idReceptor = this.validarIdReceptor(datos.id_receptor);
    const tipo = this.validarTipo(datos.tipo);

    if (datos.id_emisor === idReceptor) {
      throw new PerfilReaccionError(400, 'No puedes enviarte una reacción a ti mismo');
    }

    const [emisor, receptor] = await Promise.all([
      this.usuarioRepo.findById(datos.id_emisor),
      this.usuarioRepo.findById(idReceptor),
    ]);

    if (!emisor) {
      throw new PerfilReaccionError(401, 'Usuario autenticado no válido');
    }

    if (!receptor) {
      throw new PerfilReaccionError(404, 'Receptor no encontrado');
    }

    if (receptor.permite_reacciones_perfil === false) {
      throw new PerfilReaccionError(403, 'Este Pumita no permite recibir reacciones');
    }

    const mensaje = `${emisor.nombre} te envió ${this.nombreVisible(tipo)}`;

    const reaccion = await this.reaccionRepo.crearConNotificacion({
      id_emisor: datos.id_emisor,
      id_receptor: idReceptor,
      tipo,
      mensaje,
    });

    return {
      ...reaccion,
      emisor_nombre: emisor.nombre,
      emisor_foto_url: null,
    };
  }

  private validarIdReceptor(idReceptor: unknown): number {
    if (typeof idReceptor !== 'number' || !Number.isInteger(idReceptor) || idReceptor <= 0) {
      throw new PerfilReaccionError(400, 'id_receptor debe ser un entero positivo');
    }

    return idReceptor;
  }

  private validarTipo(tipo: unknown): TipoReaccionPumita {
    if (typeof tipo !== 'string' || !TIPOS_REACCION_PUMITA.includes(tipo as TipoReaccionPumita)) {
      throw new PerfilReaccionError(400, 'Tipo de reacción no permitido');
    }

    return tipo as TipoReaccionPumita;
  }

  private nombreVisible(tipo: TipoReaccionPumita): string {
    const nombres: Record<TipoReaccionPumita, string> = {
      APOYO: 'Apoyo',
      FELICITACION: 'Felicitación',
      SALUDO: 'Saludo',
      RUGIDO_PUMA: 'Rugido Puma',
    };

    return nombres[tipo];
  }
}