export interface Estado {
  id_estado_temporal: number;
  id_usuario: number;
  foto_url?: string;
  texto_estado?: string;
  fecha_inicio: Date;
  fecha_final: Date;
  activo: number; // 0 o 1
  nombre_usuario?: string; // viene del JOIN, no es columna real
}

export interface CrearEstadoDto {
  id_usuario: number;
  foto_url?: string;
  texto_estado?: string;
}