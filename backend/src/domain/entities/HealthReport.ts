export interface HealthReport {
  status: string;
  database: {
    connected: boolean;
    databaseName: string;
    currentUser: string;
    timestamp: string;
  };
  server: {
    uptime: number;
    timestamp: string;
  };
}
