import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import { snapId } from '../helpers/index';
import detectEthereumProvider from '@metamask/detect-provider';

const Home: NextPage = () => {
  const [provider, setProvider] = useState<unknown>();
  const [isSnapOn, setIsSnapOn] = useState<boolean>();

  // 1. Initiate provider
  useEffect(() => {
    const getProvider = async () => {
      setProvider(await detectEthereumProvider());
    };
    getProvider();
  }, []);

  // 2. Enable snap.
  useEffect(() => {
    if (provider) {
      enable();
    }
  }, [provider]);

  // 3. Enabling snap
  const enable = async () => {
    const response = await window.ethereum
      ?.request({
        method: 'wallet_enable',
        params: [
          {
            wallet_snap: { [snapId]: {} },
          },
        ],
      })
      .then((res) => {
        if (Object.keys(res.snaps).find((s) => s === snapId)) {
          setIsSnapOn(true);
        }

        // automatic connectToMonerium() here?

        return res;
      })
      .catch(
        (error: Error) => console.error(error),
        // addToast(error.message, { appearance: 'error' }),
      );
    console.log('enable: ', response);
  };

  // 4. Connect and redirect to Monerium manage screen authentication flow.
  const connectToMonerium = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'monerium_connect',
          clientId: '4c9ccb2f-d5cb-417c-a236-b2a1aef1949c',
          redirectUri: 'http://localhost:3000/confirmed',
          // redirectUri: 'http://localhost:3000/api/integration/monerium',
        },
      ],
    });
    window.open(
      `https://sandbox.monerium.dev/partners/metamask/auth?${new URLSearchParams(
        response,
      ).toString()}`,
      '_ blank',
    );
  };

  return (
    <div>
      <button onClick={() => connectToMonerium()}>Connect to Monerium</button>
      {/* <button onClick={() => connect()}>connect</button> */}
    </div>
  );
};

export default Home;
