export interface Pumita {
  id_conexion: number;
  id_usuario: number;   // el "otro" usuario en la conexión
  nombre: string;
  estado: 'pendiente' | 'aceptada' | 'bloqueada';
  soy_solicitante: boolean; // true si yo envié la solicitud
}