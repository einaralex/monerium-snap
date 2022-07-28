import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useSnap } from '../../hooks/useSnap';
import { ethers } from 'ethers';
import styles from './index.module.css';
const MetaMask = ({ tokens, balances, orders, placeOrder }) => {
  const { selectedAddress, chainId } = useSnap();
  const { profile } = useProfile();
  const [provider, setProvider] = useState();

  const [listToggle, setListToggle] = useState<'assets' | 'activity'>('assets');
  const [fiatScreen, setFiatScreen] = useState<boolean>(false);

  const currentChain = '0x1' === chainId ? 'ethereum' : 'polygon';
  const [accountData, setAccountData] = useState();
  const [paymentAccountDetail, setPaymentAccountDetail] = useState();

  useEffect(() => {
    if (balances) {
      balances?.find((b) => {
        return (
          b.address.toLowerCase() === selectedAddress?.toLowerCase() &&
          b.chain === currentChain
        );
      }),
        setAccountData(
          balances?.find(
            (b) =>
              b.address.toLowerCase() === selectedAddress?.toLowerCase() &&
              b.chain === currentChain,
          ),
        );
    }
  }, [selectedAddress, currentChain, balances]);
  useEffect(() => {
    let provider = new ethers.providers.Web3Provider(window?.ethereum);
    async () => await provider.send('eth_requestAccounts', []);
    setProvider(provider);
  }, []);
  useEffect(() => {
    if (profile) {
      setPaymentAccountDetail(
        profile?.accounts?.filter(
          (a) =>
            a.address.toLowerCase() === selectedAddress.toLowerCase() &&
            a.chain === currentChain,
        ),
      );
    }
  }, [profile]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}></div>
      <div className={styles.account_options}>
        <div className={styles.account_connected}>✅ Connected</div>
        <div className={styles.account_details}>
          <div className={styles.account_name}>BYOB</div>
          <div className={styles.account_address}>
            {selectedAddress?.slice(0, 5) +
              '...' +
              selectedAddress?.slice(-5, -1)}
          </div>
        </div>
        <div className={styles.account_settings}>:</div>
      </div>
      {fiatScreen ? (
        <>
          <button
            className="btn btn-link"
            style={{ width: '100px', height: '50px' }}
            onClick={() => setFiatScreen(false)}
          >
            Go back
          </button>
          <form
            className={styles.send_wrapper}
            onSubmit={async (e) => {
              e.preventDefault();
              let signature = await provider?.getSigner()?.signMessage('hallo');
              console.log('signer', signature);
              placeOrder({
                amount: e.target.amount.value || '1',
                firstName: e.target.firstName.value || 'John',
                lastName: e.target.lastName.value || 'Doe',
                iban: e.target.iban.value || 'GL67 8155 4677 2251 33',
                signature: signature,
                accountId: 'd80f3cc6-0da3-11ed-ac2f-4a76448b7b21',
                message:
                  'Send EUR 1 to GL6781554677225133 at Wed, 27 Jul 2022 23:24 +00:00',
                address: selectedAddress,
              });
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>Send</span>
              <input
                id="amount"
                type="text"
                className={`form-control ${styles.send_input} ${styles.input_amount}`}
                placeholder="0.00"
              ></input>{' '}
              <span style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>
                EUR to
              </span>
            </span>
            <input
              id="iban"
              type="text"
              className={`form-control ${styles.send_input} ${styles.input_iban}`}
              defaultValue="GL67 8155 4677 2251 33"
              placeholder="IBAN"
            ></input>
            <div className={styles.input_names}>
              <input
                id="firstName"
                type="text"
                className={`form-control ${styles.send_input} ${styles.input_name}`}
                defaultValue=""
                placeholder="First name"
              ></input>{' '}
              <input
                id="lastName"
                type="text"
                className={`form-control ${styles.send_input} ${styles.input_name}`}
                defaultValue=""
                placeholder="Last name"
              ></input>{' '}
            </div>
            <button
              type="submit"
              style={{ marginTop: '8px' }}
              className="btn btn-success btn-md"
            >
              Send
            </button>
          </form>
        </>
      ) : (
        <>
          <div className={styles.main}>
            <div className={styles.main_token_icon}>
              <img src="/ethereum.svg"></img>
            </div>
            <div className={styles.main_token_amount}>0 ETH</div>
            <div className={styles.main_actions}>
              <span></span>
              <span></span>
              <span></span>
              <span onClick={() => setFiatScreen(true)}></span>
            </div>
          </div>

          <ul className={`nav nav-tabs ${styles.list_header}`}>
            <li className={`nav-item ${styles.list_header_assets}`}>
              <a
                className={`nav-link ${
                  listToggle === 'assets'
                    ? `${styles.list_header_assets_active}`
                    : ''
                }`}
                aria-current="page"
                href="#"
                onClick={() => setListToggle('assets')}
              >
                Assets
              </a>
            </li>
            <li className={`nav-item ${styles.list_header_assets}`}>
              <a
                className={`nav-link ${
                  listToggle === 'activity'
                    ? `${styles.list_header_assets_active}`
                    : ''
                }`}
                href="#"
                onClick={() => setListToggle('activity')}
              >
                Activity
              </a>
            </li>
          </ul>

          <ul className={styles.list}>
            {listToggle === 'assets' ? (
              tokens?.map((t) => {
                if (t.chain === currentChain) {
                  return (
                    <li key={t.ticker + t.chain} className={styles.item_token}>
                      <div className={styles.token_icon}>
                        <img src={`/tokens/${t.currency}.svg`}></img>
                      </div>
                      <div className={styles.token_amount}>
                        {accountData?.balances.find(
                          (b) => b.currency === t.currency,
                        ).amount || '-'}{' '}
                        {t.symbol}
                        <span className={styles.token_account_iban}>
                          {
                            paymentAccountDetail?.find(
                              (a) => a.currency === t.currency,
                            ).iban
                          }
                        </span>
                      </div>
                      <div className={styles.token_detail}>{'>'}</div>
                    </li>
                  );
                }
              })
            ) : (
              <>
                {orders?.map((order) => {
                  const account = profile?.accounts?.find(
                    (a) =>
                      a.id === order.accountId &&
                      a.address.toLowerCase() === selectedAddress &&
                      a.chain === currentChain,
                  );

                  if (order.accountId === account?.id) {
                    return (
                      <li key={order.id} className={styles.item_orders}>
                        {order.kind === 'issue' ? (
                          <>
                            <p>
                              {order.amount} {order.currency.toUpperCase()}{' '}
                              <strong style={{ color: 'green' }}>from</strong>{' '}
                              {order?.counterpart?.details.name}
                            </p>
                            <span className={styles.item_orders_iban}>
                              {order?.counterpart?.identifier.iban}
                            </span>
                          </>
                        ) : (
                          <>
                            <p>
                              {order.amount} {order.currency.toUpperCase()}{' '}
                              <strong style={{ color: 'red' }}>to</strong>{' '}
                              {order?.counterpart?.details.name}
                            </p>
                            <span className={styles.item_orders_iban}>
                              {order?.counterpart?.identifier.iban}
                            </span>
                          </>
                        )}
                      </li>
                    );
                  }
                })}
              </>
            )}
          </ul>
        </>
      )}

      {/* <div className={styles.footer}></div> */}
    </div>
  );
};
export default MetaMask;
