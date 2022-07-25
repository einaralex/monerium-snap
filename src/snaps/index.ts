import { OnRpcRequestHandler } from '@metamask/snap-types';
import { createAuthParameters, customURLSearchParams } from '../lib';
import {
  AuthParameters,
  AuthTokenResponse,
  ConnectProps,
  CustomerAuthProps,
} from '../types';
import * as emi from '../endpoints';
import { URLSearchParams as Params } from 'url';

type State = {
  auth?: {
    code_verifier?: string;
    client_id?: string;
    redirect_uri?: string;
    token?: {
      created_at: string; // TODO: datetime
    } & AuthTokenResponse;
  };
  profile?: any; // TODO
  balances?: any; // TODO
  tokens?: any; // TODO
  orders?: any; // TODO
};

const updateState = async (newState: State) => {
  return wallet.request({
    method: 'snap_manageState',
    params: ['update', newState],
  });
};

let access_token: string;

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  const currentDateTime = new Date().toISOString();
  console.log('---');
  console.log('---', currentDateTime);
  console.log('---');

  const state: State | undefined | null = await wallet.request({
    method: 'snap_manageState',
    params: ['get'],
  });

  if (!state) {
    // initialize state if empty and set default data
    await updateState({ auth: {} });
  }

  access_token = state?.auth?.token?.access_token as string;

  const checkTokenExpiry = async () => {
    const isTokenExpired =
      ((new Date().toISOString() - state?.auth?.token?.created_at) as number) >
      state?.auth?.token?.expires_in;

    if (isTokenExpired) {
      access_token = await getRefreshToken();
    }
  };

  switch (request.method) {
    case 'monerium_connect':
      return moneriumConnect(request as unknown as ConnectProps);
    case 'monerium_customer_auth': {
      const authStatus = await moneriumCustomerAuth(
        request as unknown as CustomerAuthProps,
      );
      if (authStatus === 'ok') {
        return {
          profile: await getProfile(),
          balances: getBalances(),
          tokens: getTokens(),
          orders: getOrders(),
          // TODO: also fetch on-chain tx
        };
      } else {
        throw authStatus;
      }
    }
    default:
      console.log('method', request?.method);
      throw new Error('Method not found.');
  }

  async function moneriumConnect({
    clientId,
    redirectUri,
  }: ConnectProps): Promise<AuthParameters> {
    const { params, codeVerifier } = createAuthParameters(
      clientId,
      redirectUri,
    );
    // codeVerifier is secret, don't share un-encrypted.
    await updateState({
      auth: {
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      },
    });
    return params;
  }
  async function moneriumCustomerAuth({
    code,
  }: CustomerAuthProps): Promise<string | Error> {
    const tokenData: AuthTokenResponse = await emi.fetchAccessToken(
      state?.auth?.client_id as string,
      state?.auth?.redirect_uri as string,
      state?.auth?.code_verifier as string,
      code,
    );

    updateState({
      ...state,
      auth: {
        ...state?.auth,
        token: {
          // record when token is added so we can know when it expires.
          created_at: currentDateTime,
          ...tokenData,
        },
      },
    });
    return 'ok';
  }
  async function getProfile() {
    await checkTokenExpiry();

    const profile = await emi
      .fetchProfile(
        state?.auth?.token?.profile as string,
        access_token as string,
      )
      .catch((err) => {
        throw err;
      });

    updateState({
      ...state,
      profile: profile,
    });

    return profile;
  }
  async function getBalances() {
    await checkTokenExpiry();

    const balances = await emi
      .fetchBalances(
        state?.auth?.token?.profile as string,
        access_token as string,
      )
      .catch((err) => {
        throw err;
      });

    updateState({
      ...state,
      balances: balances,
    });

    return balances;
  }
  async function getTokens() {
    await checkTokenExpiry();

    const tokens = await emi
      .fetchTokens(access_token as string)
      .catch((err) => {
        throw err;
      });

    updateState({
      ...state,
      tokens: tokens,
    });
    return tokens;
  }
  async function getOrders() {
    await checkTokenExpiry();

    const orders = await emi
      .fetchOrders(
        state?.auth?.token?.profile as string,
        access_token as string,
      )
      .catch((err) => {
        throw err;
      });

    updateState({
      ...state,
      orders: orders,
    });

    return orders;
  }
  async function getRefreshToken() {
    const token = await emi
      .fetchRefreshToken(
        state?.auth?.client_id as string,
        state?.auth?.token?.refresh_token as string,
      )
      .catch((err) => {
        throw err;
      });

    updateState({
      ...state,
      auth: {
        ...state?.auth,
        token: token,
      },
    });

    return token.access_token;
  }
};
