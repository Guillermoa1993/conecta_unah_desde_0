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
    if (!datos.correo.endsWith('@unah.hn')) {
      throw new Error('Solo se permiten correos institucionales @unah.hn para estudiantes');
    }

    const codigoValido = verificarOtpRegistro(datos.correo, datos.codigoOtp);
    if (!codigoValido) throw new Error('Código de verificación incorrecto o expirado');

    const existente = await this.usuarioRepo.findByCorreo(datos.correo);
    if (existente) {
      const enrolado = await this.usuarioRepo.estaEnrolado(existente.id_usuario);
      if (enrolado) throw new Error('Este correo ya está registrado');
      const usuario = await this.usuarioRepo.completarEnrolamiento(existente.id_usuario, {
        nombre: datos.nombre,
        carrera: datos.carrera,
        telefono: datos.telefono,
        numero_cuenta: datos.numero_cuenta,
        centro_regional: datos.centro_regional,
        genero: datos.genero,
        biografia: datos.biografia,
        foto_url: datos.foto_url,
        forma003_base64: datos.forma003_base64,
      });
      await this.usuarioRepo.marcarEnrolado(existente.id_usuario);
      return usuario;
    }

    const nuevo = await this.usuarioRepo.create({
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
    await this.usuarioRepo.marcarEnrolado(nuevo.id_usuario);
    return nuevo;
  }
}