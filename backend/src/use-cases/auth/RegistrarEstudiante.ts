import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';
import { verificarOtpRegistro } from '../../infrastructure/otp/otpRegistroStore';

interface RegistrarEstudianteDto {
  nombre: string;
  correo: string;
  telefono: string;
  genero: string;
  numero_cuenta: string;
  carrera: string;
  centro_regional: string;
  foto_url?: string;
  biografia?: string;
  forma003_base64: string;
  codigoOtp: string;
}

export class RegistrarEstudiante {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(datos: RegistrarEstudianteDto): Promise<Usuario> {
    const existente = await this.usuarioRepo.findByCorreo(datos.correo);
    if (existente) throw new Error('Este correo ya está registrado');

    if (!datos.correo.endsWith('@unah.hn')) {
      throw new Error('Solo se permiten correos institucionales @unah.hn para estudiantes');
    }

    const codigoValido = verificarOtpRegistro(datos.correo, datos.codigoOtp);
    if (!codigoValido) throw new Error('Código de verificación incorrecto o expirado');

    return this.usuarioRepo.create({
      nombre: datos.nombre,
      correo: datos.correo,
      password: '',
      rol: 'ESTUDIANTE',
      carrera: datos.carrera,
      telefono: datos.telefono,
      numero_cuenta: datos.numero_cuenta,
      centro_regional: datos.centro_regional,
      genero: datos.genero,
      biografia: datos.biografia,
      foto_url: datos.foto_url,
      forma003_base64: datos.forma003_base64,
    });
  }
}