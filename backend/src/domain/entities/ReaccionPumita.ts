export type TipoReaccionPumita = 'APOYO' | 'FELICITACION' | 'SALUDO' | 'RUGIDO_PUMA';

export const TIPOS_REACCION_PUMITA: TipoReaccionPumita[] = [
  'APOYO',
  'FELICITACION',
  'SALUDO',
  'RUGIDO_PUMA',
];

export interface ReaccionPumita {
  id_reaccion: number;
  id_emisor: number;
  id_receptor: number;
  tipo: TipoReaccionPumita;
  fecha_creacion: Date;
}

export interface ReaccionPumitaRecibida extends ReaccionPumita {
  emisor_nombre: string;
  emisor_foto_url: null;
}
