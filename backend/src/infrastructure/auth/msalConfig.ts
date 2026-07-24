import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';
import { cfg } from '../config/configService';

function createMsalClient(): ConfidentialClientApplication {
  const config: Configuration = {
    auth: {
      clientId: cfg('AZURE_CLIENT_ID'),
      authority: 'https://login.microsoftonline.com/common',
      clientSecret: cfg('AZURE_CLIENT_SECRET'),
    },
  };
  return new ConfidentialClientApplication(config);
}

// Lazy — se crea en el primer uso para que cfg() ya tenga los valores de BD
let _msalClient: ConfidentialClientApplication | null = null;

export function getMsalClient(): ConfidentialClientApplication {
  if (!_msalClient) _msalClient = createMsalClient();
  return _msalClient;
}

// Permite recrear el cliente tras actualizar parámetros en Parámetros del Sistema
export function resetMsalClient(): void {
  _msalClient = null;
}

export function getAzureRedirectUri(): string {
  return cfg('AZURE_REDIRECT_URI', 'http://localhost:5000/api/auth/microsoft/callback');
}

export const AZURE_SCOPES = ['user.read'];
