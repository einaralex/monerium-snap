// should live under AUthenticationProvider and take care of fetching and storing balances, orders, token etc.
import detectEthereumProvider from '@metamask/detect-provider';
import React, {
  useState,
  createContext,
  useEffect,
  useMemo,
  useContext,
} from 'react';
import { snapId } from '../../helpers';
import { useSnap } from '../hooks/useSnap';
import { AuthenticationContext } from './AuthenticationProvider';

export const DataContext = createContext({
  createRedirectUrl: '',
  balances: {},
  tokens: {},
  profile: {},
  orders: {},
  getTokens: () => {},
  getBalances: () => {},
  getOrders: () => {},
});

function DataProvider({ children }) {
  const profile = useContext(AuthenticationContext);
  const [balances, setBalances] = useState();
  const [tokens, setTokens] = useState();
  const [orders, setOrders] = useState();
  const { getSnapState } = useSnap();

  const createRedirectUrl = async ({ baseUrl = '' }) => {
    const response = await window.ethereum
      ?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'emi_connect',
            clientId: '4c9ccb2f-d5cb-417c-a236-b2a1aef1949c',
            redirectUri: 'http://localhost:3000',
          },
        ],
      })
      .catch((e) => console.error('emi_connect:', e));
    console.log('creating redirect', response);
    return `${baseUrl}/partners/metamask/auth?&${new URLSearchParams(
      response,
    ).toString()}`;
  };

  // 6. Data received about the snap's authenticated user from Authentication
  useEffect(() => {
    if (profile.id !== 'undefined') {
      const refetch = async () => {
        const { balances: b, orders: o, tokens: t } = await getSnapState();
        if (b) setBalances(b);
        else if (!b) getBalances();
        if (o) setOrders(o);
        else if (!o) getOrders();
        if (t) setTokens(t);
        else if (5) getTokens();
      };
      refetch();
    }
  }, [profile]);

  useEffect(() => {
    console.log(
      '%cbalances',
      'color:black; padding: 15px; background-color: lightblue',
      balances,
    );
  }, [balances]);
  useEffect(() => {
    console.log(
      '%corders',
      'color:black; padding: 15px; background-color: lightblue',
      orders,
    );
  }, [orders]);
  useEffect(() => {
    console.log(
      '%ctokens',
      'color:black; padding: 15px; background-color: lightblue',
      tokens,
    );
  }, [tokens]);
  useEffect(() => {
    console.log(
      '%cprofile',
      'color:black; padding: 15px; background-color: lightblue',
      profile,
    );
  }, [profile]);

  const getBalances = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'emi_getBalances',
        },
      ],
    });
    setBalances(response);
  };

  const getTokens = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'emi_getTokens',
        },
      ],
    });
    setTokens(response);
  };
  const getOrders = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'emi_getOrders',
        },
      ],
    });
    setOrders(response);
  };

  const placeOrder = async (params) => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'emi_placeOrder',
          kind: 'redeem',
          amount: params.amount,
          firstName: params.firstName,
          lastName: params.lastName,
          iban: params.iban,
          signature: params.signature,
          address: params.address,
          accountId: params.accountId,
          message: params.message,
        },
      ],
    });
    console.log('placed order', response);
  };

  const value = useMemo(
    () => ({
      createRedirectUrl: (options) => createRedirectUrl(options),
      getOrders: () => getOrders(),
      getTokens: () => getTokens(),
      getBalances: () => getBalances(),
      placeOrder: (orderDetail) => placeOrder(orderDetail),
      tokens,
      balances,
      orders,
      profile: profile,
    }),
    [profile, tokens, balances, orders, profile?.id],
  );
  // NOTE: you *might* need to memoize this value
  // Learn more in http://kcd.im/optimize-context
  // const value = { state, dispatch };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export { DataProvider };
