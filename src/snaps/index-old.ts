import { OnRpcRequestHandler } from '@metamask/snap-types';
import CryptoJS from 'crypto-js';

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
  switch (request.method) {
    case 'get_state':
      return state;
    case 'monerium_get_balances':
      return await fetchBalances();
    case 'monerium_place_order':
      return await placeOrder(request?.kind, request?.amount);
    case 'monerium_get_orders':
      return await fetchOrders();
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
    case 'monerium_connect':
      console.log('REQ', request);
      console.log('REQ', request);
      console.log('REQ', request);
      return await connectToMonerium(request?.metamaskAddress);
    default:
      throw new Error('Method not found.');
  }

  async function connectToMonerium(metamaskAddress: string) {
    const mmAddress = metamaskAddress || state?.metamaskAddress;
    const auth = await authenticate();
    access_token = auth.access_token;
    const context = await fetchContext();
    const profile = await fetchProfile(context.defaultProfile);
    const tokens = await fetchTokens();
    const socket = new WebSocket(
      `wss://api.monerium.dev/orders?access_token=${access_token}&state=processed`,
    );
    socket.addEventListener('message', function (event) {
      console.log('Message from server ', event.data);
      // console.log('ORDER', order);
      wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'inApp',
            message: `orderrrrr`,
          },
        ],
      });
    });

    profile.tokens = tokens;
    const isLinked = !!profile.accounts.find(
      (item) => item.address?.toLowerCase() === mmAddress?.toLowerCase(),
    );
    profile.isLinked = isLinked;
    profile.token = access_token;

    const updatedState = {
      ...state,
      profile: profile,
      isLinked: isLinked,
      tokens: tokens,
      token: access_token,
      metamaskAddress: mmAddress,
    };

    console.log('updatedState', updatedState);

    await updateState(updatedState);

    return updatedState;
  }

  async function placeOrder(kind: 'issue' | 'redeem', amount: string) {
    const response = await fetch(
      `https://api.monerium.dev/profiles/${state?.profile?.id}/orders`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: kind,
          amount: amount,
          currency: 'EUR',
          counterpart: {
            identifier: {
              standard: 'iban',
              iban: 'GL6781554677225133',
            },
            details: {
              companyName: 'Company name',
              firstName: 'First name',
              lastName: 'Last name',
            },
          },
          memo: 'First order for Monerium',
          address: '0x798728D5410aB4FB49d2C277A49baC5048aB43ca',
          signature:
            'd4e984e8b7ba1c6c7f8ddc47ff6feebf9458061d7c169afacff590fa587c4ab909d661a32610ec8aeca5c79735378d9f4ea2bfe31df35456850f1c971b6e8f6a01',
          message:
            'Send EUR 1 to GL6781554677225133 at 2022-07-12T12:02:49.101452Z',
        }),
      },
    );

    const order = await response.json();

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
    await wallet.request({
      method: 'snap_confirm',
      params: [
        {
          prompt: `Hello, ${state?.profile?.name}!`,
          description: 'Your order is being processed',
          textAreaContent:
            order.kind === 'redeem' &&
            `${order.amount} EUR sent to ${order.counterpart.details.name} (IBAN: ${order.counterpart.identifier.iban})`,
        },
      ],
    });
    return order;
  }

  async function authenticate() {
    const response = await fetch('https://api.monerium.dev/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'client_id=69c15867-b06f-4813-bfa0-53da660cf7c1&client_secret=7b8c1a0a-0c91-45ea-9436-2af4b3453216&grant_type=client_credentials',
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
  async function fetchBalances() {
    const response = await fetch(
      `https://api.monerium.dev/profiles/${state?.profile?.id}/balances`,
      {
        headers: {
          Authorization: 'Bearer ' + state?.token,
        },
      },
    );
    const balances = await response.json();

    const updatedState = {
      ...state,
      balances: balances,
    };

    await updateState(updatedState);
    return balances;
  }

  async function fetchTokens() {
    const response = await fetch('https://api.monerium.dev/tokens', {
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
    });
    return await response.json();
  }

  async function fetchOrders() {
    const response = await fetch(
      `https://api.monerium.dev/profiles/${state?.profile?.id}/orders`,
      {
        headers: {
          Authorization: 'Bearer ' + state?.token,
        },
      },
    );
    const orders = await response.json();

    const updatedState = {
      ...state,
      orders: orders,
    };

    await updateState(updatedState);
    return orders;
  }
};
