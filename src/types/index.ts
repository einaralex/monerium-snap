// Endpoint params

export interface AuthParameters {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

// RPC Props

export interface ConnectProps {
  clientId: string;
  redirectUri: string;
}

export interface CustomerAuthProps {
  code: string;
}
