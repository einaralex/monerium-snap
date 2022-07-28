import { customURLSearchParams } from '../lib';

/**
 * Fetch information about a profile
 * @param profileId the id of the profile
 * @param access_token
 * @returns
 */
export const fetchProfile = (profileId: string, access_token: string) => {
  return fetch(`https://api.monerium.dev/profiles/${profileId}`, {
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw await res.json();
    } else {
      return res.json();
    }
  });
};
/**
 * Fetch off-chain account balances for a profile.
 * @param profileId the id of the profile
 * @param access_token
 * @returns
 */
export const fetchBalances = (profileId: string, access_token: string) => {
  return fetch(`https://api.monerium.dev/profiles/${profileId}/balances`, {
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw await res.json();
    } else {
      return res.json();
    }
  });
};
/**
 * Fetch details about Monerium's EURe, GBPe, USDe and ISKe tokens.
 * @param access_token
 * @returns
 */
export const fetchTokens = (access_token: string) => {
  return fetch('https://api.monerium.dev/tokens', {
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw await res.json();
    } else {
      return await res.json();
    }
  });
};
/**
 * Fetch profile details.
 * @param profileId the id of the profile
 * @param access_token
 * @returns
 */
export const fetchOrders = (profileId: string, access_token: string) => {
  return fetch(`https://api.monerium.dev/profiles/${profileId}/orders`, {
    headers: {
      Authorization: 'Bearer ' + access_token,
    },
  }).then(async (res) => {
    if (!res.ok) {
      throw await res.json();
    } else {
      return res.json();
    }
  });
};
/**
 * Fetches access_token from code challenge.
 * @param clientId the id of the client registered for the application in use.
 * @param redirectUri same url as used to acquire the `authorization_code`, the same url the customer is redirected to after PKCE flow, has to be whitelisted by client's application.
 * @param codeVerifier random, high entropy string between 43 and 128 characters, used in verifying the code_challenge
 * @param code a.k.a. authorization_code, acquired from the PKCE flow - used in verifying the code_challenge
 * @returns
 */
export const fetchAccessToken = (
  clientId: string,
  redirectUri: string,
  codeVerifier: string,
  code: string,
) => {
  return fetch('https://api.monerium.dev/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: customURLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      throw await res.json();
    } else {
      return await res.json();
    }
  });
};

/**
 * Use refresh_token to fetch a new access_token
 * @param clientId the public id of the client registered for the application
 * @param refreshToken
 * @returns
 */
export const fetchRefreshToken = (clientId: string, refreshToken: string) => {
  return fetch('https://api.monerium.dev/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: customURLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      throw await res.json();
    } else {
      return res.json();
    }
  });
};

export const placeOrder = async (
  profileId: string,
  kind: 'issue' | 'redeem',
  amount: string,
  firstName: string,
  lastName: string,
  iban: string,
  signature: string,
  address: string,
  accountId: string,
  message: string,
  access_token: string,
) => {
  return fetch(`https://api.monerium.dev/profiles/${profileId}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kind: kind,
      amount: amount,
      currency: 'EUR',
      counterpart: {
        identifier: {
          standard: 'iban',
          iban: iban,
        },
        details: {
          country: 'IS',
          companyName: '',
          firstName: firstName,
          lastName: lastName,
        },
      },
      memo: 'First order for Monerium',
      accountId: accountId,
      address: address,
      signature: signature,
      message: message,
    }),
  }).then(async (res) => {
    if (!res.ok) {
      throw await res.json();
    } else {
      return res.json();
    }
  });
};
