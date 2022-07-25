import { useEffect } from 'react';
import type { NextPage } from 'next';
import { snapId } from '../helpers/index';
import { useRouter } from 'next/router';

const Confirmed: NextPage = () => {
  const { query } = useRouter();

  useEffect(() => {
    authenticateCustomer(query?.code as string);
  }, [query]);
  async function authenticateCustomer(code: string) {
    const response = await window.ethereum
      ?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'monerium_customer_auth',
            code: code,
          },
        ],
      })
      .finally(() => window.close());
  }

  return null;
};

export default Confirmed;
