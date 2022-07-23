import '../styles/globals.css';
import type { AppProps } from 'next/app';
import 'bootstrap/dist/css/bootstrap.css';
import { ToastProvider } from 'react-toast-notifications';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider autoDismissTimeout={5000}>
      <Component {...pageProps} />
    </ToastProvider>
  );
}

export default MyApp;
