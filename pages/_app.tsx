import '../styles/globals.css';
import type { AppProps } from 'next/app';
import 'bootstrap/dist/css/bootstrap.css';
import { ToastProvider } from 'react-toast-notifications';
import { AuthenticationProvider } from '../src/providers/AuthenticationProvider';
import { SnapProvider } from '../src/providers/SnapProvider';
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SnapProvider>
      {/* Snap passes down `provider`, has to be on-top. */}
      <AuthenticationProvider>
        <ToastProvider autoDismissTimeout={5000}>
          <Component {...pageProps} />
        </ToastProvider>
      </AuthenticationProvider>
    </SnapProvider>
  );
}

export default MyApp;
