import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/common`,
    clientSecret: process.env.AZURE_CLIENT_SECRET ?? '',
  },
};

export const msalClient = new ConfidentialClientApplication(msalConfig);

export const AZURE_REDIRECT_URI =
  process.env.AZURE_REDIRECT_URI ?? 'http://localhost:5000/api/auth/microsoft/callback';

export const AZURE_SCOPES = ['user.read'];
