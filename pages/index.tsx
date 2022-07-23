import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import snapCfg from '../snap.config';
import snapManifest from '../snap.manifest.json';
import { JsonRpcError } from 'json-rpc-engine';
import { ethers } from 'ethers';

const Home: NextPage = () => {
  const [snapId, setSnapId] = useState('');
  const [isLinked, setIsLinked] = useState('');
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [signature, setSignature] = useState();
  const [snapState, setSnapState] = useState();

  const signatureMessage = 'I hereby declare that I am the address owner.';

  const signMessageRequest = async () => {
    console.log('signer', signer);
    setSignature(await signer?.signMessage(signatureMessage));
  };

  const setSnap = () => {
    if (window.location.hostname === 'localhost') {
      setSnapId(
        `local:${window.location.protocol}//${window.location.hostname}:${snapCfg.cliOptions.port}`,
      );
    } else {
      setSnapId(`npm:${snapManifest.source.location.npm.packageName}`);
    }
  };

  // run only client-side
  useEffect(() => {
    setSnap();
    setProvider(new ethers.providers.Web3Provider(window.ethereum));
  }, []);

  useEffect(() => {
    const requestAccess = async () => {
      await provider?.send('eth_requestAccounts', []);
    };

    console.log('provider', provider);
    if (provider) {
      requestAccess().then(() => {
        console.log('p', provider);
        setSigner(provider?.getSigner());
      });
    }
  }, [provider]);

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
            // 'Content-Type': 'application/x-www-form-urlencoded',
          }),
          body: JSON.stringify({
            address: snapState?.metamaskAddress,
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
  }, [signature]);

  const connectToMonerium = async () => {
    try {
      const response = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'connectToMonnerium',
          },
        ],
      });
      console;
      setSnapState(response);
      setIsLinked(
        "address '" + response?.metamaskAddress + "'" + response?.isLinked,
      );
    } catch (err) {
      console.error(err);
      alert('Problem happened: ' + err.message || err);
    }
  };
  const linkToMonerium = async () => {
    try {
      const response = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'linkToMonerium',
          },
        ],
      });
      console.log(response);
    } catch (err) {
      console.error(err);
      alert('Problem happened: ' + err?.message || err);
    }
  };

  const connect = async () => {
    await window.ethereum?.request({
      method: 'wallet_enable',
      params: [
        {
          wallet_snap: { [snapId]: {} },
        },
      ],
    });
  };

  const getAccessToken = async () => {
    const res = await window.ethereum?.request({
      method: 'wallet_invokeSnap',
      params: [
        snapId,
        {
          method: 'monerium_get_access_token',
        },
      ],
    });
    // .then((res) => console.log('res', res));
    console.log('res2', res);
  };
  const sendHello = async () => {
    try {
      const response = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: [
          snapId,
          {
            method: 'hello',
          },
        ],
      });
    } catch (err) {
      console.error(err);
      alert('Problem happened: ' + (err as JsonRpcError).message || err);
    }
  };
  return (
    <div className={styles.container}>
      <h1>Hello, Snaps!</h1>
      <p>Wallet is linked:</p>
      <p>{isLinked}</p>
      <details>
        <summary>Instructions</summary>
        <ul>
          {/* eslint-disable-next-line react/no-unescaped-entities*/}
          <li>First, click "Connect". Then, try out the other buttons!</li>
          <li>Please note that:</li>
          <ul>
            <li>
              The <code>snap.manifest.json</code> and <code>package.json</code>{' '}
              must be located in the server root directory..
            </li>
            <li>
              The Snap bundle must be hosted at the location specified by the{' '}
              <code>location</code> field of <code>snap.manifest.json</code>.
            </li>
          </ul>
        </ul>
      </details>
      <br />

      <button className="connect" onClick={() => connect()}>
        Connect
      </button>
      <button className="sendHello" onClick={() => sendHello()}>
        Send Hello
      </button>
      <button className="connectToMonerium" onClick={() => connectToMonerium()}>
        Connect
      </button>
      <button className="linkToMonerium" onClick={() => linkToMonerium()}>
        Link
      </button>
      <button className="getAccessToken" onClick={() => getAccessToken()}>
        AccessToken
      </button>
      <button
        className="signMessageRequest"
        onClick={() => signMessageRequest()}
      >
        Link address
      </button>
    </div>
  );
};

export default Home;
