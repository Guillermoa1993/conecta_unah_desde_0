import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

export class CatalogoController {
  constructor(private readonly pool: Pool) {}

  carreras = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await this.pool.query(
        `SELECT c.id_carrera, c.nombre, f.nombre AS facultad
         FROM tabla_grupo_1_carreras c
         LEFT JOIN tabla_grupo_1_facultad f ON c.id_facultad = f.id_facultad
         ORDER BY c.nombre`
      );
      res.json(rows);
    } catch (err) { next(err); }
  };

  departamentos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await this.pool.query(
        `SELECT d.id_departamento, d.nombre, f.nombre AS facultad
         FROM tabla_grupo_1_departamento d
         LEFT JOIN tabla_grupo_1_facultad f ON d.id_facultad = f.id_facultad
         ORDER BY d.nombre`
      );
      res.json(rows);
    } catch (err) { next(err); }
  };

  centrosRegionales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await this.pool.query(
        `SELECT id_centro_regional, codigo, nombre FROM tabla_grupo_1_centro_regional ORDER BY nombre`
      );
      res.json(rows);
    } catch (err) { next(err); }
  };

  facultades = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await this.pool.query(
        `SELECT id_facultad, nombre FROM tabla_grupo_1_facultad ORDER BY nombre`
      );
      res.json(rows);
    } catch (err) { next(err); }
  };
}