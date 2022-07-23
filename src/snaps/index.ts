import { OnRpcRequestHandler } from '@metamask/snap-types';

const updateState = async (newState: any) => {
  return wallet.request({
    method: 'snap_manageState',
    params: ['update', newState],
  });
};
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  const state = await wallet.request({
    method: 'snap_manageState',
    params: ['get'],
  });

  if (!state) {
    // initialize state if empty and set default data
    await updateState({ token: '' });
  }

  let access_token = '';
  let metamaskAccount = '';
  switch (request.method) {
    case 'monerium_get_access_token':
      return await state?.token;
    case 'inApp':
      return await wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'inApp',
            message: `Hello!`,
          },
        ],
      });
    case 'native':
      return await wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'native',
            message: `Hello!`,
          },
        ],
      });
    case 'hello':
      return wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: `Hello!`,
            description: 'The address has been saved to your address book',
            textAreaContent: `test`,
          },
        ],
      });
    case 'monerium_connect':
      const response = await wallet.request({
        method: 'wallet_requestPermissions',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
      metamaskAccount = response?.find(
        (permission) => permission.parentCapability === 'eth_accounts',
      )?.caveats?.[0]?.value?.[0];

      await updateState({
        ...state,
        metamaskAddress: metamaskAccount,
      });

      return await connectToMonerium();
    default:
      throw new Error('Method not found.');
  }

  async function connectToMonerium() {
    const auth = await authenticate();
    access_token = auth.access_token;
    const context = await fetchContext();
    const profile = await fetchProfile(context.defaultProfile);
    const tokens = await fetchTokens();
    profile.tokens = tokens;
    const isLinked = !!profile.accounts.find(
      (item) => item.address.toLowerCase() === metamaskAccount.toLowerCase(),
    );
    profile.isLinked = isLinked;
    profile.metamaskAddress = metamaskAccount;
    profile.token = access_token;

    const updatedState = {
      ...state,
      profile: profile,
      isLinked: isLinked,
      metamaskAddress: metamaskAccount,
      tokens: tokens,
      token: access_token,
    };

    await updateState(updatedState);

    return updatedState;
  }

  async function authenticate() {
    const response = await fetch('https://api.monerium.dev/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'client_id=1b3a17ef-460f-47b0-84c6-4495e18589b3&client_secret=samplepassword&grant_type=client_credentials',
    });
    return await response.json();
  }

  async function fetchContext() {
    const response = await fetch('https://api.monerium.dev/auth/context', {
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
    });
    return await response.json();
  }

  async function fetchProfile(profileId: string) {
    const response = await fetch(
      `https://api.monerium.dev/profiles/${profileId}`,
      {
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      },
    );
    return await response.json();
  }

  async function fetchTokens() {
    const response = await fetch('https://api.monerium.dev/tokens', {
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
    });
    return await response.json();
  }
};
