import { Pool } from 'pg';
import { BitacoraRepository } from '../../domain/repositories/BitacoraRepository';
import { BitacoraEntry } from '../../domain/entities/BitacoraEntry';

const SELECT_BITACORA = `
    SELECT
        b.id_bitacora,
        b.id_usuario,
        u.nombre AS usuario,
        u.correo,
        b.accion,
        b.fecha
    FROM tabla_grupo_1_bitacora b
    LEFT JOIN tabla_grupo_1_usuario u
        ON b.id_usuario = u.id_usuario
`;

export class PostgresBitacoraRepository implements BitacoraRepository {

    constructor(
        private readonly pool: Pool,
    ) {}

    async findAll(limit = 100): Promise<BitacoraEntry[]> {

        const { rows } = await this.pool.query(
            `
            ${SELECT_BITACORA}
            ORDER BY b.fecha DESC
            LIMIT $1
            `,
            [limit],
        );

        return rows;

    }

    async findByUsuario(
        id_usuario: number,
        limit = 100,
    ): Promise<BitacoraEntry[]> {

        const { rows } = await this.pool.query(
            `
            ${SELECT_BITACORA}
            WHERE b.id_usuario = $1
            ORDER BY b.fecha DESC
            LIMIT $2
            `,
            [
                id_usuario,
                limit,
            ],
        );

        return rows;

    }

    async registrar(
        id_usuario: number,
        accion: string,
    ): Promise<BitacoraEntry> {

        const { rows } = await this.pool.query(
            `
            INSERT INTO tabla_grupo_1_bitacora
            (
                id_usuario,
                accion
            )
            VALUES
            (
                $1,
                $2
            )
            RETURNING
                id_bitacora,
                id_usuario,
                accion,
                fecha
            `,
            [
                id_usuario,
                accion,
            ],
        );

        return rows[0];

    }

}