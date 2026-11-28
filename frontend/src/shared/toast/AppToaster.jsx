import { Toaster } from 'react-hot-toast';

/** Mounted once in main.jsx. Its looks come from ToastCard, not react-hot-toast defaults. */
export function AppToaster() {
  return <Toaster position="top-center" gutter={10} containerStyle={{ top: 18 }} />;
}
