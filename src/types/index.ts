// Endpoint params

export interface AuthParameters {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

export interface AuthTokenResponse {
  access_token: string;
  expires_in: number;
  profile: string;
  refresh_token: string;
  token_type: 'Bearer';
  userId: string;
}

// RPC Props

export interface ConnectProps {
  clientId: string;
  redirectUri: string;
}

export interface CustomerAuthProps {
  code: string;
}
