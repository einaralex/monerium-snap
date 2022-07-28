import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import { snapId } from '../helpers/index';
import MetaMask from '../src/components/metamask';
import { useProfile } from '../src/hooks/useProfile';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const profile = useProfile();
  const [profileBalances, setProfileBalances] = useState();
  const [tokens, setTokens] = useState();
  const [orders, setOrders] = useState();
  const router = useRouter();

  // 4. Connect and redirect to Monerium manage screen authentication flow.
  const connectToMonerium = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'emi_connect',
          clientId: '4c9ccb2f-d5cb-417c-a236-b2a1aef1949c',
          redirectUri: 'http://localhost:3000',
        },
      ],
    });
    console.log('connect', response);
    router.push(
      `https://sandbox.monerium.dev/partners/metamask/auth?&${new URLSearchParams(
        response,
      ).toString()}`,
    );
  };

  // 6. Data received about the snap's authenticated user from Authentication
  useEffect(() => {
    // console.log('profile', profile);
    // console.log('profileBalances', profileBalances);
    // console.log('orders', orders);
    // console.log('tokens', tokens);
    if (profile.id !== undefined) {
      console.log('Ive got profile info', profile);
      getBalances();
      getOrders();
      getTokens();
    } else {
      if (!profileBalances) getBalances();
      if (!orders) getOrders();
      if (!tokens) getTokens();
    }
  }, [profile]);

  useEffect(() => {
    console.log(
      '%cbalances',
      'color:black; padding: 15px; background-color: lightblue',
      profileBalances,
    );
  }, [profileBalances]);
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

  // TODO: take all of these and add it to a ContextProvider
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
    setProfileBalances(response);
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

  return (
    <div>
      <button onClick={() => connectToMonerium()}>Connect to Monerium</button>

      <MetaMask
        balances={profileBalances}
        tokens={tokens}
        orders={orders}
        placeOrder={placeOrder}
      />
      {/* <button onClick={() => connect()}>connect</button> */}
    </div>
  );
};

export default Home;
