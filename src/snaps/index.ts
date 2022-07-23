import { OnRpcRequestHandler } from '@metamask/snap-types';

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin: originLocation,
  request,
}) => {
  let state = await wallet.request({
    method: 'snap_manageState',
    params: ['get'],
  });

  if (!state) {
    state = { token: '' };
    // initialize state if empty and set default data
    await wallet.request({
      method: 'snap_manageState',
      params: ['update', state],
    });
  }

  let access_token = '';
  let metamaskAccount = '';
  switch (request.method) {
    case 'monerium_get_access_token':
      return await state?.token;
    case 'linkToMonerium':
      return await linkToMonerium();
    case 'connectToMonnerium':
      const response = await wallet.request({
        method: 'wallet_requestPermissions',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
      metamaskAccount = response.find(
        (permission) => permission.parentCapability === 'eth_accounts',
      )?.caveats?.[0]?.value?.[0];
      return await connectToMonerium();
    case 'hello':
      return wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: `Hello, ${originLocation}!`,
            description:
              'This custom confirmation is just for display purposes.',
            textAreaContent:
              'But you can edit the snap source code to make it do something, if you want to!',
          },
        ],
      });
    default:
      throw new Error('Method not found.');
  }

  // function getAccessToken() {
  //   return access_token;
  // }

  async function connectToMonerium() {
    const response = await fetch('https://api.monerium.dev/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'client_id=1b3a17ef-460f-47b0-84c6-4495e18589b3&client_secret=samplepassword&grant_type=client_credentials',
    });
    const res = await response.json();
    access_token = res.access_token;
    const context = await fetchContext();
    const profile = await fetchProfile(context.defaultProfile);
    const tokens = await fetchTokens();
    profile.tokens = tokens;
    console.log;
    const isLinked = !!profile.accounts.find(
      (item) => item.address.toLowerCase() === metamaskAccount.toLowerCase(),
    );
    profile.isLinked = isLinked;
    profile.metamaskAddress = metamaskAccount;
    profile.token = access_token;
    state = {
      ...state,
      profile: profile,
      isLinked: isLinked,
      metamaskAddress: metamaskAccount,
      tokens: tokens,
      token: access_token,
    };

    await wallet.request({
      method: 'snap_manageState',
      params: ['update', state],
    });

    return state;
  }

  async function linkToMonerium() {}

  async function fetchContext() {
    const response = await fetch('https://api.monerium.dev/auth/context', {
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
    });
    return await response.json();
  }

  async function fetchProfile(profileId) {
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
