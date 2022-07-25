import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
// import styles from '../styles/Home.module.css';
// import snapCfg from '../snap.config';
import Cookies from 'cookies';
import CryptoJS from 'crypto-js';
// import snapManifest from '../snap.manifest.json';
import { snapId } from '../helpers/index';
import { useRouter } from 'next/router';
// import { ethers } from 'ethers';
// import { Web3Provider } from '@ethersproject/providers';
// import { useToasts } from 'react-toast-notifications';
import detectEthereumProvider from '@metamask/detect-provider';
import io from 'Socket.IO-client';
let socket;

const Home: NextPage = () => {
  const router = useRouter();
  const [provider, setProvider] = useState<unknown>();
  const [isSnapOn, setIsSnapOn] = useState<boolean>();
  const [test, setTest] = useState();
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
    await socketInitializer();
    // router.push(
    //   `https://sandbox.monerium.dev/partners/metamask/auth?${new URLSearchParams(
    //     response,
    //   ).toString()}`,
    // );
  };

  // useEffect(() => {
  //   socketInitializer();
  //   return () => {
  //     socket.removeAllListeners();
  //   };
  // }, []);

  async function socketInitializer() {
    await fetch('/api/integration/monerium');
    socket = io();

    socket.on('connect', () => {
      console.log('Socket listening to /api/monerium/integration');
    });

    socket.on('code', (code) => {
      console.log('GOT THE CODE', code);
      window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'monerium_customer_auth',
            code: code,
          },
        ],
      });
    });
    // socket.disconnect();
  }
  // 5. Grab the query params from Authentication Flow

  return (
    <div>
      <button onClick={() => connectToMonerium()}>Connect to Monerium</button>
      {/* <button onClick={() => connect()}>connect</button> */}
    </div>
  );
};

export default Home;
