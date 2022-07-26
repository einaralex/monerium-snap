import detectEthereumProvider from '@metamask/detect-provider';
import router from 'next/router';
import Router, { useRouter } from 'next/router';
import React, { useState, createContext, useEffect } from 'react';
import { snapId } from '../../helpers';

export const SnapContext = createContext({ isSnapOn: false });

function SnapProvider({ children }) {
  const [provider, setProvider] = useState<unknown>();
  const [isSnapOn, setIsSnapOn] = useState<boolean>();

  // 1. Initiate provider
  useEffect(() => {
    const getProvider = async () => {
      setProvider(await detectEthereumProvider());
    };
    if (!provider) {
      getProvider();
    }
  }, []);

  // 2. Enable snap.
  useEffect(() => {
    if (provider) {
      console.log('WILL ENABLE');
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

  // async function reconnect() {
  //   const profile = await window.ethereum?.request({
  //     method: 'wallet_invokeSnap',
  //     params: [
  //       snapId,
  //       {
  //         method: 'dostuff',
  //         code: '',
  //       },
  //     ],
  //   });
  //   console.log('profile', profile);
  //   if (profile) {
  //     setProfile(profile);
  //   } else {
  //     console.log('No profile in snap.');
  //   }
  //   return profile;
  // }

  // NOTE: you *might* need to memoize this value
  // Learn more in http://kcd.im/optimize-context
  // const value = { state, dispatch };
  return (
    <SnapContext.Provider value={{ isSnapOn, provider }}>
      {children}
    </SnapContext.Provider>
  );
}

export { SnapProvider };
