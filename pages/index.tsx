import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import styles from '../styles/Home.module.css';
import snapCfg from '../snap.config';
import Cookies from 'cookies';
import CryptoJS from 'crypto-js';
import snapManifest from '../snap.manifest.json';
import router, { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { useToasts } from 'react-toast-notifications';

const Home: NextPage = ({ params }) => {
  const { addToast } = useToasts();
  const router = useRouter();
  const [snapId, setSnapId] = useState('');
  const [isLinked, setIsLinked] = useState('');
  const [provider, setProvider] = useState<Web3Provider>();
  const [signer, setSigner] = useState();
  const [signature, setSignature] = useState();
  const [snapState, setSnapState] = useState();
  const [isFlask, setIsFlask] = useState();
  const [isSnapOn, setIsSnapOn] = useState<boolean>();
  const [isSnapInstalled, setIsSnapInstalled] = useState<boolean>();
  const [orders, setOrders] = useState();
  const [isMounted, setIsMounted] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<
    'on' | 'off' | 'not-installed' | 'not-compatible'
  >();
  const [isIban, setIsIban] = useState<boolean>();
  const [iban, setIban] = useState<string>();

  const signatureMessage = 'I hereby declare that I am the address owner.';

  // if (router.query) {

  // }

  const signMessageRequest = async () => {
    console.log('signer', signer);
    setSignature(await signer?.signMessage(signatureMessage));
  };

  const fetchSnapId = () => {
    if (window.location.hostname === 'localhost') {
      setSnapId(
        `local:${window.location.protocol}//${window.location.hostname}:${snapCfg.cliOptions.port}`,
      );
    } else {
      setSnapId(`npm:${snapManifest.source.location.npm.packageName}`);
    }
  };

  const checkIfSnapIsInstalled = async () => {
    const res = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });
    if (res[snapId]?.id !== undefined && res[snapId]?.version !== undefined) {
      setIsSnapInstalled(true);
    } else {
      setIsSnapInstalled(false);
    }
  };

  useEffect(() => {
    checkIfSnapIsInstalled();
  });
  // run only client-side
  useEffect(() => {
    setIsMounted(true);
    fetchSnapId();
    setProvider(new ethers.providers.Web3Provider(window.ethereum));
  }, []);

  useEffect(() => {
    const requestAccess = async () => {
      await provider?.send('eth_requestAccounts', []);
    };

    const checkForFlask = async () => {
      setIsFlask(
        (
          await provider?.provider?.request({ method: 'web3_clientVersion' })
        )?.includes('flask') && provider,
      );
    };

    if (provider) {
      checkForFlask();
      requestAccess().then(() => {
        setSigner(provider?.getSigner());
      });
      if (status === 'on') {
        fetchSnapState();
      }
    }
  }, [isMounted, provider]);

  useEffect(() => {
    if (status === 'on' && provider) {
      connectToMonerium(provider?.provider?.selectedAddress);
    }
    if (status === 'off') {
      connect();
    }
  }, [status, provider, isMounted]);

  useEffect(() => {
    console.log('signature', signature);
    console.log('signatureMessage', signatureMessage);
    console.log('snapState', snapState);
    if (snapState?.isLinked) {
      console.log('already linked');
    }
    if (
      signature &&
      signatureMessage &&
      snapState?.profile?.id &&
      !snapState?.isLinked
    ) {
      fetch(
        `https://api.monerium.dev/profiles/${snapState?.profile?.id}/addresses`,
        {
          method: 'POST',
          headers: new Headers({
            Authorization: `Bearer ${snapState?.token}`,
          }),
          body: JSON.stringify({
            address: window?.ethereum?.selectedAddress,
            accounts: [
              { currency: 'eur', chain: 'ethereum', network: 'rinkeby' },
              { currency: 'eur', chain: 'polygon', network: 'mumbai' },
            ],
            signature: signature,
            message: signatureMessage,
          }),
        },
      );
    }
  }, [signature, signer]);

  const fetchSnapState = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'get_state',
        },
      ],
    });
    // console.log('get_state', response);
    setSnapState(response);
    return response;
  };

  const placeOrder = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'monerium_place_order',
          kind: 'redeem',
          amount: '1',
        },
      ],
    });
    console.log('response', response);
  };
  const getOrders = async () => {
    const response = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'monerium_get_orders',
        },
      ],
    });
    console.log('orders', orders);
    setOrders(response);
  };
  const connectToMonerium = async (selectedAddress) => {
    const state = await fetchSnapState();

    try {
      const response = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'monerium_connect',
            metamaskAddress: selectedAddress,
          },
        ],
      });
      console.log('connect response', response);
      setSnapState(response);
      setIsLinked(response?.isLinked);
      fetchBalances();
    } catch (err) {
      console.error(err);
      alert('Problem happened: ' + (err as Error).message || err);
    }
  };

  const fetchBalances = async () => {
    const balances = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'monerium_get_balances',
        },
      ],
    });
    let state = snapState;
    if (!state) {
      state = await fetchSnapState();
    }
    console.log('state', state);

    const selectedAddress =
      state?.metamaskAddress?.toLowerCase() ||
      window?.ethereum?.selectedAddress?.toLowerCase();
    state?.profile?.accounts.map((paymentAccount) => {
      console.log('bal', bal);
      let bal = balances?.filter(
        (d) =>
          d.address?.toLowerCase() === selectedAddress &&
          d.chain === paymentAccount.chain &&
          d,
      );
      const res = bal[0]?.balances?.filter((b) => b?.currency === 'eur');
      setAmount(res?.[0]?.amount);
    });
  };

  const connect = async () => {
    await window.ethereum
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
      })
      .catch((error: Error) =>
        addToast(error.message, { appearance: 'error' }),
      );
  };

  const hasIban = async () => {
    const selectedAddress =
      window?.ethereum?.selectedAddress || snapState?.metamaskAddress;
    const iban = snapState?.profile?.accounts.find(
      (account) =>
        account.address?.toLowerCase() === selectedAddress?.toLowerCase() &&
        account?.iban,
    )?.iban;

    setIsIban(!!iban);
    setIban(iban);
  };

  const customerFlow = async () => {
    router.push(
      `https://sandbox.monerium.dev/partners/metamask/auth?${new URLSearchParams(
        params,
      ).toString()}`,
    );
  };

  useEffect(() => {
    setStatus(
      isFlask
        ? isSnapInstalled
          ? isSnapOn
            ? 'on'
            : 'off'
          : 'not-installed'
        : 'not-compatible',
    );
  }, [isFlask, isSnapInstalled, isSnapOn]);

  useEffect(() => {
    if (isLinked) {
      if (!snapState?.balances) {
        fetchBalances();
      }
      hasIban();
    }
  }, [isLinked, status]);

  useEffect(() => {
    if (isLinked && status === 'on') {
      getOrders();
    }
  }, [isLinked, status, snapState]);

  return (
    <div className={styles.container}>
      <div className="snap_control">
        {status === 'not-compatible' && (
          <p>You need Metamask Flask for this plugin</p>
        )}
        {status === 'not-installed' && (
          <div className={styles.inactive_snap}>
            <button
              className={`btn btn-outline-dark inactive_connect`}
              onClick={() => connect()}
            >
              Install Monerium snap
            </button>
          </div>
        )}
        {status === 'on' && (
          <div className={styles.active_snap}>
            <div className={styles.top}>
              {isLinked ? (
                <p>✅ Connected to Monerium</p>
              ) : (
                <div className={styles.connect}>
                  <button
                    className="btn btn-primary"
                    onClick={() => signMessageRequest()}
                  >
                    Connect address to Monerium
                  </button>
                </div>
              )}
              <>
                {isLinked && !isIban && (
                  <button
                    className={styles.ibanButton}
                    onClick={() => customerFlow()}
                  >
                    <img src="/monerium.svg" alt="me" width="24" height="24" />
                    Create IBAN
                  </button>
                )}
              </>
              <>{isLinked && isIban && <p>{iban}</p>}</>
              <>
                {status === 'on' ? (
                  <p className={styles.currency_amount}>
                    {amount !== undefined && amount !== ''
                      ? `${amount} EUR`
                      : ''}
                  </p>
                ) : (
                  ''
                )}
              </>
            </div>
            {isLinked && (
              <>
                <div className={styles.send_wrapper}>
                  <span>Send </span>
                  <input
                    className={`form-control ${styles.send_input} ${styles.input_amount}`}
                    placeholder="0.00"
                  ></input>{' '}
                  <span style={{ whiteSpace: 'nowrap' }}>EUR to</span>
                  <input
                    className={`form-control ${styles.send_input} ${styles.input_iban}`}
                    defaultValue="GL67 8155 4677 2251 33"
                    placeholder="IBAN"
                  ></input>{' '}
                  <button
                    className="btn btn-success btn-md"
                    onClick={() => placeOrder()}
                  >
                    Send
                  </button>
                </div>

                <>
                  {isMounted && (
                    <details className={styles.dropdown}>
                      <summary>Transaction history</summary>
                      <ul>
                        {orders?.map((order) => {
                          return (
                            <li key={order?.id}>
                              {order.kind === 'redeem' &&
                                `${order.amount} EUR sent to IBAN: ${
                                  order.counterpart.identifier.iban
                                } - ${order.meta?.placedAt.slice(0, 10)}`}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                </>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const cookies = new Cookies(req, res);
  // Random generated string.
  const codeVerifier = CryptoJS.lib.WordArray.random(64).toString();

  // code_challenge = base64urlEncode(SHA256(ASCII(code_verifier)))
  const codeChallenge = CryptoJS.enc.Base64url.stringify(
    CryptoJS.SHA256(codeVerifier),
  );

  // A server endpoint of yours, that can't expose secrets to the client.
  const redirectUri = `http://localhost:3000`;
  // const redirectUri = `${baseUrl}/`;
  const cookieName = 'monerium-cookie';

  const params = {
    client_id: '4c9ccb2f-d5cb-417c-a236-b2a1aef1949c',
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: cookieName,
  };

  cookies.set(
    cookieName,
    JSON.stringify({ ...params, code_verifier: codeVerifier }),
  );

  return {
    props: { params }, // will be passed to the page component as props
  };
};

export default Home;
