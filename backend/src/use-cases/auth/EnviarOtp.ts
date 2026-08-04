import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { enviarCodigoOtp } from '../../infrastructure/mail/mailService';
import { cfg } from '../../infrastructure/config/configService';

export class EnviarOtp {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(correo: string): Promise<void> {
    const usuario = await this.usuarioRepo.findByCorreo(correo);
    if (!usuario) throw new Error('NO_ENROLADO');

    // Si el usuario fue creado previamente por el administrador pero aún no se ha enrolado
    // (le faltan datos esenciales como teléfono, número de cuenta/empleado o su nombre es incompleto/genérico)
    const esEstudiante = usuario.id_rol === 1 || usuario.rol === 'ESTUDIANTE';
    const noEnroladoEstudiante = esEstudiante && (!usuario.numero_cuenta || !usuario.telefono || !usuario.nombre || usuario.nombre.trim().toLowerCase() === 'usuario' || usuario.nombre.trim().toLowerCase() === 'estudiante');
    const noEnroladoEmpleado = !esEstudiante && usuario.id_rol !== 3 && (!usuario.numero_empleado || !usuario.telefono || !usuario.nombre || usuario.nombre.trim().toLowerCase() === 'usuario' || usuario.nombre.trim().toLowerCase() === 'empleado');

    if (noEnroladoEstudiante || noEnroladoEmpleado) {
      throw new Error('NO_ENROLADO');
    }

    if (usuario.estado !== 'ACTIVO') throw new Error('Cuenta suspendida o inactiva');

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const minutos = parseInt(cfg('TIEMPO_EXPIRACION_OTP', '5'));
    const expira = new Date(Date.now() + minutos * 60 * 1000);

    await this.usuarioRepo.update(usuario.id_usuario, {
      otp_code: codigo,
      otp_expira: expira,
    });

    const DEV_EMAIL_REDIRECT: Record<string, string> = {
      'dev@unah.hn': 'unah_conecta@outlook.com',
    };
    const destinatario = DEV_EMAIL_REDIRECT[usuario.correo.toLowerCase()] ?? usuario.correo;
    await enviarCodigoOtp(destinatario, codigo);
  }
}
