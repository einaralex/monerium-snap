import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import { snapId } from '../helpers/index';
import MetaMask from '../src/components/metamask';
import { useEMI } from '../src/hooks/useEMI';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const { createRedirectUrl } = useEMI();

  const router = useRouter();

  // 4. Connect and redirect to Monerium manage screen authentication flow.
  const connectToMonerium = async () => {
    const redirectUrl = await createRedirectUrl({
      baseUrl: 'https://sandbox.monerium.dev/',
    });
    router.push(redirectUrl);
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
