export interface Grupo2EventoRepository {
  obtenerEventosDisponibles(id_usuario: number): Promise<any[]>;
  inscribir(id_usuario: number, id_evento: number): Promise<void>;
  cancelarInscripcion(id_usuario: number, id_evento: number): Promise<void>;
  registrarAsistencia(
    id_usuario: number,
    id_evento: number,
    tipo: 'entrada' | 'salida',
    lat: number,
    lng: number
  ): Promise<void>;
}
