import React from 'react';
import styles from './index.module.css';
const MetaMask = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}></div>
      <div className={styles.account_options}>
        <div className={styles.account_connected}>✅ Connected</div>
        <div className={styles.account_details}>
          <div className={styles.account_name}>My bank account</div>
          <div className={styles.account_address}>0x222...1234</div>
        </div>
        <div className={styles.account_settings}>:</div>
      </div>
      <div className={styles.main}>
        <div className={styles.main_token_icon}>o</div>
        <div className={styles.main_token_amount}>0 ETH</div>
        <div className={styles.main_actions}>o o o</div>
      </div>
      <div className={styles.list_header}>
        <div className={styles.list_header_assets}>Assets</div>
        <div className={styles.list_header_activity}>Activity</div>
      </div>
      <div className={styles.token_list}>
        <div className={styles.token_icon}>o</div>
        <div className={styles.token_amount}>0 EURe</div>
        <div className={styles.token_detail}>{'>'}</div>
      </div>
      <div className={styles.footer}></div>
    </div>
  );
};
export default MetaMask;
