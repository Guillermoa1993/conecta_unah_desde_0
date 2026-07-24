import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';
import { verificarOtpRegistro } from '../../infrastructure/otp/otpRegistroStore';

interface RegistrarEmpleadoDto {
  nombre: string;
  correo: string;
  telefono: string;
  genero: string;
  numeroEmpleado: string;
  facultad: string;
  centroRegional: string;
  foto_url?: string;
  forma003_base64: string;
  codigoOtp: string;
}

export class RegistrarEmpleado {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(datos: RegistrarEmpleadoDto): Promise<Usuario> {
    const existente = await this.usuarioRepo.findByCorreo(datos.correo);
    if (existente) throw new Error('Este correo ya está registrado');


    if (!datos.correo.endsWith('@unah.edu.hn')) {
     throw new Error('Solo se permiten correos institucionales @unah.edu.hn para personal/empleados');
    }

    const codigoValido = verificarOtpRegistro(datos.correo, datos.codigoOtp);
    if (!codigoValido) throw new Error('Código de verificación incorrecto o expirado');

    return this.usuarioRepo.create({
      nombre: datos.nombre,
      correo: datos.correo,
      password: '',
      rol: 'TUTOR',
      telefono: datos.telefono,
      genero: datos.genero,
      numero_empleado: datos.numeroEmpleado,
      departamento: datos.facultad,
      centro_regional: datos.centroRegional,
      foto_url: datos.foto_url,
      forma003_base64: datos.forma003_base64,
    });
  }
}