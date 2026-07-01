import { HealthReport } from '../domain/entities/HealthReport';
import { HealthRepository } from '../domain/repositories/HealthRepository';

export class GetHealthReport {
  constructor(private healthRepository: HealthRepository) {}

  async execute(): Promise<HealthReport> {
    const dbStatus = await this.healthRepository.checkDatabaseStatus();
    
    return {
      status: dbStatus.connected ? 'OK' : 'DEGRADED',
      database: dbStatus,
      server: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };
  }
}
