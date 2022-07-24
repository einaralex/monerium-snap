import { MetaMaskInpageProvider } from '@metamask/providers';
import { ExternalProvider } from 'ethers';
declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider | ExternalProvider;
  }
}

// declare global {
//   interface Window {
//       ethereum: {
//           isMetaMask: boolean;
//           // eslint-disable-next-line @typescript-eslint/no-explicit-any
//           send: <T>(request: SnapRpcMethodRequest | {method: string; params?: any[]}) => Promise<T>;
//           on: (eventName: unknown, callback: unknown) => unknown;
//           // requestIndex: () => Promise<{getSnapApi: (origin: string) => Promise<FilecoinApi>}>;
//       }
//   }
// }
