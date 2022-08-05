import detectEthereumProvider from '@metamask/detect-provider';
import { useRouter } from 'next/router';
import React, { useState, createContext, useEffect, useMemo } from 'react';
import { snapId } from '../../helpers';

export const SnapContext = createContext({
  isSnapOn: false,
  selectedAddress: '',
  chainId: '',
});

function SnapProvider({ children }) {
  const [provider, setProvider] = useState<object>();
  const [isSnapInstalled, setIsSnapInstalled] = useState<boolean>();
  const [isSnapOn, setIsSnapOn] = useState<boolean>();
  const [selectedAddress, setSelectedAddress] = useState<string>();

  // 1. Initiate provider
  useEffect(() => {
    const getProvider = async () => {
      if (!provider) {
        setProvider(await detectEthereumProvider());
      }
    };
    if (!provider) {
      getProvider();
    }
  }, []);

  useEffect(() => {
    checkIfSnapIsInstalled();
  });
  // 2. Enable snap.
  useEffect(() => {
    if (provider) {
      enable();
    }

    // get the selectedAddress,
    // when the customer gets redirected from auth flow, the provider looses the selectedAddress.
    // but the signer is still there, so this doesn't trigger any metamask call-for-action (I guess)
    provider
      ?.request({ method: 'eth_requestAccounts' })
      .then((e) => {
        setSelectedAddress(e[0]);
      })
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });
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

  const checkIfSnapIsInstalled = async () => {
    const res = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });
    if (res[snapId]?.id !== undefined && res[snapId]?.version !== undefined) {
      setIsSnapInstalled(true);
      console.log(`Snap: 'on'`);
    } else {
      setIsSnapInstalled(false);
    }
  };

  const getSnapState = async () => {
    return window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'get_state',
        },
      ],
    });
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
  const value = useMemo(
    () => ({
      chainId: provider?.chainId,
      selectedAddress,
      provider: provider,
      isSnapOn,
      isSnapInstalled,
      getSnapState,

      // status: {

      // }
    }),
    [provider?.chainId, selectedAddress, isSnapOn],
  );
  // NOTE: you *might* need to memoize this value
  // Learn more in http://kcd.im/optimize-context
  // const value = { state, dispatch };
  return <SnapContext.Provider value={value}>{children}</SnapContext.Provider>;
}

export { SnapProvider };
