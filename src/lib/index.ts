import CryptoJS from 'crypto-js';
import type { AuthParameters } from '../types';

export const createAuthParameters = (
  clientId: string,
  redirectUri: string,
): { params: AuthParameters; codeVerifier: string } => {
  // Random generated string.
  const codeVerifier = CryptoJS.lib.WordArray.random(64).toString();

  // code_challenge = base64urlEncode(SHA256(ASCII(code_verifier)))
  const codeChallenge = CryptoJS.enc.Base64url.stringify(
    CryptoJS.SHA256(codeVerifier),
  );

  return {
    params: {
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    },
    codeVerifier: codeVerifier,
  };
};

/**
 * Replacement for URLSearchParams, snaps do not include node globals.
 * @param body a json format of the body ti be encoded
 * @returns 'application/x-www-form-urlencoded' compatible string
 */
export const customURLSearchParams = (
  body: Record<string, unknown>,
): string => {
  return Object.entries(body)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};
