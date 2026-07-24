export interface BitacoraEntry {
  id_bitacora: number;
  id_usuario: number;
  usuario?: string;   // nombre del usuario, viene por JOIN
  correo?: string;
  accion: string;
  fecha: Date;
}