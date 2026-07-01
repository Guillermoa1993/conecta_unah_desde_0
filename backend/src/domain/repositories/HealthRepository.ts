export interface DbStatusInfo {
  connected: boolean;
  databaseName: string;
  currentUser: string;
  timestamp: string;
}

export interface HealthRepository {
  checkDatabaseStatus(): Promise<DbStatusInfo>;
}
