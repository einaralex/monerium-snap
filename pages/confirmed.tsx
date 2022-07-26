import { useEffect } from 'react';
import type { NextPage } from 'next';
import { snapId } from '../helpers/index';
import { useRouter } from 'next/router';

const Confirmed: NextPage = () => {
  const { query } = useRouter();

  useEffect(() => {
    if (query && query?.code) {
      authenticateCustomer(query?.code as string);
    }
  }, [query]);
  async function authenticateCustomer(code: string) {
    const response = await window.ethereum
      ?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'emi_customer_auth',
            code: code,
          },
        ],
      })
      .finally(() => window.close());
  }

  return null;
};

export default Confirmed;
