import { Toaster } from 'react-hot-toast';

/** Mounted once in main.jsx. Its looks come from ToastCard, not react-hot-toast defaults. */
export function AppToaster() {
  return <Toaster position="bottom-right" gutter={12} containerStyle={{ bottom: 20, right: 20 }} />;
}
