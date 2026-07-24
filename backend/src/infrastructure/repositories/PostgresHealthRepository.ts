import { HealthRepository, DbStatusInfo } from '../../domain/repositories/HealthRepository';
import pool from '../database/db';

export class PostgresHealthRepository implements HealthRepository {
  async checkDatabaseStatus(): Promise<DbStatusInfo> {
    try {
      const res = await pool.query('SELECT NOW() as now_time, current_database() as db_name, current_user as user_name;');
      const row = res.rows[0];
      
      return {
        connected: true,
        databaseName: row.db_name,
        currentUser: row.user_name,
        timestamp: row.now_time
      };
    } catch (error: any) {
      return {
        connected: false,
        databaseName: 'unknown',
        currentUser: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }
}
