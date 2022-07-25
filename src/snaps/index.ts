import { OnRpcRequestHandler } from '@metamask/snap-types';
import { createAuthParameters, customURLSearchParams } from '../lib';
import { AuthParameters, ConnectProps, CustomerAuthProps } from '../types';
import { URLSearchParams as Params } from 'url';
const updateState = async (newState: any) => {
  return wallet.request({
    method: 'snap_manageState',
    params: ['update', newState],
  });
};

type State = {
  code_verifier?: string;
  client_id?: string;
  redirect_uri?: string;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  const state: State | undefined | null = await wallet.request({
    method: 'snap_manageState',
    params: ['get'],
  });

  if (!state) {
    // initialize state if empty and set default data
    await updateState({});
  }

  switch (request.method) {
    case 'monerium_connect':
      return moneriumConnect(request as unknown as ConnectProps);
    case 'monerium_customer_auth': {
      return moneriumCustomerAuth(request as unknown as CustomerAuthProps);
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
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });
    return params;
  }
  async function moneriumCustomerAuth({ code }: CustomerAuthProps) {
    console.log('type:', typeof Params);
    const response = await fetch('https://api.monerium.dev/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: customURLSearchParams({
        client_id: state?.client_id,
        code: code,
        redirect_uri: state?.redirect_uri,
        grant_type: 'authorization_code',
        code_verifier: state?.code_verifier,
      }),
    });
    console.log('auth_token', await response.json());
    return 'ok';
  }
};
