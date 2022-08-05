import { OnRpcRequestHandler } from '@metamask/snap-types';
import { createAuthParameters, customURLSearchParams } from '../lib';
import {
  Address,
  AuthParameters,
  AuthTokenResponse,
  Balances,
  ConnectProps,
  CustomerAuthProps,
  IBAN,
  Profile,
  Signature,
  Token,
} from '../types';
import * as emi from '../endpoints';

type State = {
  auth?: {
    code_verifier?: string;
    client_id?: string;
    redirect_uri?: string;
    token?: {
      created_at: string; // TODO: datetime
    } & AuthTokenResponse;
  };
  profile?: Profile;
  balances?: Balances[];
  tokens?: Token[];
  orders?: any; // TODO
};

const updateState = async (newState: State) => {
  return await wallet.request({
    method: 'snap_manageState',
    params: ['update', newState],
  });
};

let access_token: string;

module.exports.onRpcRequest = async ({ request }) => {
  const currentDateTime = new Date().toISOString();

  const state: State | undefined | null = await wallet.request({
    method: 'snap_manageState',
    params: ['get'],
  });

  if (!state) {
    // initialize state if empty and set default data
    console.log('- Initiate state -');
    await updateState({ auth: {} });
  }

  console.log('THE STATE', state);

  if (state?.auth?.token?.access_token) {
    access_token = state?.auth?.token?.access_token as string;
  }

  const checkTokenExpiry = async () => {
    if (state?.auth?.token?.created_at) {
      const rangeInMs =
        new Date().getTime() -
        new Date(state?.auth?.token.created_at).getTime();
      const expiresInMs = state?.auth?.token?.expires_in * 1000;
      const isTokenExpired = expiresInMs < rangeInMs;
      console.log('token expires in:', expiresInMs - rangeInMs);
      if (isTokenExpired) {
        console.log('TOKEN IS EXPIRED');
        access_token = await getRefreshToken();
      }
    }
  };

  console.log(
    '%c method',
    'color:white; padding: 10px 30px; background-color: darkgreen',
    request?.method,
  );

  switch (request.method) {
    case 'get_state':
      return state;
    case 'emi_connect':
      return moneriumConnect(request as unknown as ConnectProps);
    case 'emi_customerAuthentication': {
      return await moneriumCustomerAuth(
        request as unknown as CustomerAuthProps,
      );
    }
    case 'emi_getTokens':
      return await getTokens();
    case 'emi_getBalances':
      return await getBalances();
    case 'emi_reconnect':
      return state?.profile || null;
    case 'emi_placeOrder':
      return await placeOrder(request);
    case 'emi_getOrders':
      return await getOrders();
    default:
      throw new Error(request?.method + 'Method not found.');
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
  }: CustomerAuthProps): Promise<AuthTokenResponse> {
    const tokenData: AuthTokenResponse = await emi.fetchAccessToken(
      state?.auth?.client_id as string,
      state?.auth?.redirect_uri as string,
      state?.auth?.code_verifier as string,
      code,
    );

    access_token = tokenData?.access_token;
    const profile = await getProfile(tokenData?.profile);

    await updateState({
      ...state,
      auth: {
        ...state?.auth,
        token: {
          // record when token is added so we can know when it expires.
          created_at: currentDateTime,
          ...tokenData,
        },
      },
      profile: profile,
    });
    return profile;
  }
  async function getProfile(profileId: string) {
    await checkTokenExpiry();
    const profile = await emi
      .fetchProfile(profileId as string, access_token as string)
      .catch((err) => {
        throw err;
      });

    await updateState({
      ...state,
      profile: profile,
    });

    return profile;
  }
  async function getBalances() {
    await checkTokenExpiry();
    console.log('Getting balances, balances previous state:', state?.balances);
    if (!state?.profile?.id) {
      return { code: 404, status: 'Not Found', message: 'ProfileId Missing.' };
    }
    let balances;

    try {
      balances = await emi.fetchBalances(
        state?.profile?.id,
        access_token as string,
      );
    } catch (err) {
      return err;
    }

    await updateState({
      ...state,
      balances: balances,
    });
    return balances;
  }
  async function getTokens() {
    await checkTokenExpiry();

    let tokens;
    try {
      tokens = await emi.fetchTokens(access_token as string);
    } catch (err) {
      return err;
    }

    await updateState({
      ...state,
      tokens: tokens,
    });
    return tokens;
  }
  async function getOrders() {
    await checkTokenExpiry();

    if (!state?.profile?.id) {
      return { code: 404, status: 'Not Found', message: 'ProfileId Missing.' };
    }
    let orders;
    try {
      orders = await emi.fetchOrders(
        state?.profile?.id,
        access_token as string,
      );
    } catch (err) {
      return err;
    }
    await updateState({
      ...state,
      orders: orders,
    });
    return orders;
  }

  async function placeOrder({
    kind,
    amount,
    firstName,
    lastName,
    iban,
    signature,
    address,
    accountId,
    message,
  }: {
    kind: 'issue' | 'redeem';
    amount: string;
    firstName: string;
    lastName: string;
    iban: IBAN;
    signature: Signature;
    address: Address;
    accountId: string;
    message: string;
  }) {
    const order = await emi.placeOrder(
      state?.profile?.id,
      kind,
      amount,
      firstName,
      lastName,
      iban,
      signature,
      address,
      accountId,
      message,
      access_token,
    );

    await wallet.request({
      method: 'snap_notify',
      params: [
        {
          type: 'inApp',
          message:
            order.kind === 'redeem' &&
            `${order.amount} EUR sent to ${order.counterpart.identifier.iban}`,
        },
      ],
    });
    // await wallet.request({
    //   method: 'snap_confirm',
    //   params: [
    //     {
    //       prompt: `Hello, ${state?.profile?.name}!`,
    //       description: 'Your order is being processed',
    //       textAreaContent:
    //         order.kind === 'redeem' &&
    //         `${order.amount} EUR sent to ${order.counterpart.details.name} (IBAN: ${order.counterpart.identifier.iban})`,
    //     },
    //   ],
    // });
    return order;
  }
  async function getRefreshToken() {
    let token;
    try {
      token = await emi.fetchRefreshToken(
        state?.auth?.client_id as string,
        state?.auth?.token?.refresh_token as string,
      );
    } catch (err) {
      console.error('Could not get refresh token', err);
      return err;
    }
    await updateState({
      ...state,
      auth: {
        ...state?.auth,
        token: token,
      },
    });
    return token.access_token;
  }
};
