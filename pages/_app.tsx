import '../styles/globals.css';
import type { AppProps } from 'next/app';
import 'bootstrap/dist/css/bootstrap.css';
import { ToastProvider } from 'react-toast-notifications';
import { AuthenticationProvider } from '../src/providers/AuthenticationProvider';
import { SnapProvider } from '../src/providers/SnapProvider';
import { DataProvider } from '../src/providers/DataProvider';
import Head from 'next/head';
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SnapProvider>
        {/* Snap passes down `provider`, has to be on-top. */}
        <AuthenticationProvider>
          <DataProvider>
            <ToastProvider autoDismissTimeout={5000}>
              <Component {...pageProps} />
            </ToastProvider>
          </DataProvider>
        </AuthenticationProvider>
      </SnapProvider>
    </>
  );
}

export default MyApp;
