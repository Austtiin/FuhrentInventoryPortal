// Authentication configuration for OAuth 2.0 providers

export interface AuthConfig {
  microsoft: {
    clientId: string;
    tenantId: string;
    redirectUri: string;
    scopes: string[];
  };
  google: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
  jwt: {
    expiresIn: string;
  };
}

export const authConfig: AuthConfig = {
  microsoft: {
    clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '',
    tenantId: process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || 'common',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/microsoft`,
    scopes: [
      'openid',
      'profile',
      'email',
      'User.Read',
      'offline_access'
    ]
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/google`,
    scopes: [
      'openid',
      'profile',
      'email'
    ]
  },
  jwt: {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

// Microsoft Graph API endpoints
export const microsoftEndpoints = {
  authority: `https://login.microsoftonline.com/${authConfig.microsoft.tenantId}`,
  authorize: `https://login.microsoftonline.com/${authConfig.microsoft.tenantId}/oauth2/v2.0/authorize`,
  token: `https://login.microsoftonline.com/${authConfig.microsoft.tenantId}/oauth2/v2.0/token`,
  userInfo: 'https://graph.microsoft.com/v1.0/me'
};

// Google OAuth endpoints
export const googleEndpoints = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

// Helper function to build OAuth URL
export const buildOAuthUrl = (provider: 'microsoft' | 'google', state?: string): string => {
  const baseParams = {
    response_type: 'code',
    client_id: '',
    redirect_uri: '',
    scope: '',
    state: state || Math.random().toString(36).substring(7)
  };

  if (provider === 'microsoft') {
    return `${microsoftEndpoints.authorize}?${new URLSearchParams({
      ...baseParams,
      client_id: authConfig.microsoft.clientId,
      redirect_uri: authConfig.microsoft.redirectUri,
      scope: authConfig.microsoft.scopes.join(' '),
      response_mode: 'query'
    }).toString()}`;
  }

  if (provider === 'google') {
    return `${googleEndpoints.authorize}?${new URLSearchParams({
      ...baseParams,
      client_id: authConfig.google.clientId,
      redirect_uri: authConfig.google.redirectUri,
      scope: authConfig.google.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    }).toString()}`;
  }

  throw new Error(`Unsupported OAuth provider: ${provider}`);
};

// Validate environment variables
export const validateAuthConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!authConfig.microsoft.clientId) {
    errors.push('NEXT_PUBLIC_MICROSOFT_CLIENT_ID is required');
  }

  if (!authConfig.google.clientId) {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is required');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};