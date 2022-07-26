import detectEthereumProvider from '@metamask/detect-provider';
import router from 'next/router';
import Router, { useRouter } from 'next/router';
import React, { useState, createContext, useEffect } from 'react';
import { snapId } from '../../helpers';
import { useSnap } from '../hooks/useSnap';

export const AuthenticationContext = createContext({ id: undefined });

function AuthenticationProvider({ children }) {
  const [profile, setProfile] = useState({ id: undefined });
  const router = useRouter();
  const { query } = router;
  const { isSnapOn, provider } = useSnap();

  useEffect(() => {
    if (query && query.code !== 'undefined' && !profile.id) {
      authenticateCustomer(query?.code as string);
    }
  }, [query]);

  useEffect(() => {
    console.log('isSnapOn', isSnapOn, provider);
    if (isSnapOn) reconnect();
  }, [isSnapOn]);

  async function authenticateCustomer(code: string) {
    if (code) {
      const profile = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'emi_customerAuthentication',
            code: code,
          },
        ],
      });
      console.log('profile', profile);
      console.log('profile', profile);
      setProfile(profile);

      // clear the query params
      window.localStorage.setItem('profile', profile.id);
      router.push('/', undefined, { shallow: true });
    }
  }

  async function reconnect() {
    const profile = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'emi_reconnect',
        },
      ],
    });
    console.log('profile', profile);
    if (profile) {
      setProfile(profile);
    } else {
      console.log('No profile in snap.');
    }
    return profile;
  }

  // NOTE: you *might* need to memoize this value
  // Learn more in http://kcd.im/optimize-context
  // const value = { state, dispatch };
  return (
    <AuthenticationContext.Provider value={profile}>
      {children}
    </AuthenticationContext.Provider>
  );
}

export { AuthenticationProvider };
