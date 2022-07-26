import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import { snapId } from '../helpers/index';
import detectEthereumProvider from '@metamask/detect-provider';
import MetaMask from '../src/components/metamask';
import { useProfile } from '../src/hooks/useProfile';
import { useRouter } from 'next/router';
import { useSnap } from '../src/hooks/useSnap';

const Home: NextPage = () => {
  const profile = useProfile();
  const [profileBalances, setProfileBalances] = useState();
  const [tokens, setTokens] = useState();
  const router = useRouter();
  const { isSnapOn } = useSnap();

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
          // redirectUri: 'http://localhost:3000/api/integration/monerium',
        },
      ],
    });
    router.push(
      `https://sandbox.monerium.dev/partners/metamask/auth?${new URLSearchParams(
        response,
      ).toString()}`,
    );
    // window.open(
    //   `https://sandbox.monerium.dev/partners/metamask/auth?${new URLSearchParams(
    //     response,
    //   ).toString()}`,
    //   '_ blank',
    // );
  };

  // 6. Data received about the snap's authenticated user from AuthenticationProvider
  useEffect(() => {
    if (profile.id !== undefined) {
      console.log('Ive got profile info', profile);
      getBalances();
      getTokens();
    }
  }, [profile]);

  const getBalances = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'emi_getBalances',
          profileId: profile.id,
        },
      ],
    });
    console.log('profile balances', response);
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
    console.log('tokens', response);
    setTokens(response);
  };

  return (
    <div>
      <button onClick={() => connectToMonerium()}>Connect to Monerium</button>
      <MetaMask />
      {/* <button onClick={() => connect()}>connect</button> */}
    </div>
  );
};

export default Home;
