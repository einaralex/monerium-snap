import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
// import MetaMask from '../src/components/metamask';
import { useEMI } from '../src/hooks/useEMI';
import { useRouter } from 'next/router';

const Home: NextPage = () => {
  const {
    createRedirectUrl,
    getOrders,
    getBalances,
    getState,
    orders,
    balances,
    tokens,
    profile,
    getTokens,
  } = useEMI();

  const router = useRouter();
  const [state, setState] = useState();

  // 4. Connect and redirect to Monerium manage screen authentication flow.
  const connectToMonerium = async () => {
    const redirectUrl = await createRedirectUrl({
      baseUrl: 'https://sandbox.monerium.dev/',
    });
    router.push(redirectUrl);
  };

  useEffect(() => {
    console.log('state', state);
  }, [state]);

  return (
    <div>
      <button onClick={() => connectToMonerium()}>Connect to Monerium</button>
      <button onClick={async () => await getOrders()}>Get orders</button>
      <button onClick={async () => await getBalances()}>Get balances</button>
      <button onClick={async () => await getTokens()}>Get tokens</button>
      <button onClick={async () => setState(await getState())}>
        Get state
      </button>
      <p>State: {JSON.stringify(state)}</p>
      <p>Orders: {JSON.stringify(orders)}</p>
      <p>Balances: {JSON.stringify(balances)}</p>
      <p>tokens: {JSON.stringify(tokens)}</p>
      <p>profile: {JSON.stringify(profile)}</p>

      {/* <MetaMask /> */}
      {/* <button onClick={() => connect()}>connect</button> */}
    </div>
  );
};

export default Home;
