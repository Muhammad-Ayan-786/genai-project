import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/jetbrains-mono/400.css';
import './styles/index.css';
import { routes } from './app/routes.jsx';
import { AppToaster } from './shared/toast/AppToaster.jsx';
import { store } from './app/store.js';
import { initializeSession } from './features/auth/Hooks/session.js';

initializeSession();

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
      <AppToaster />
    </Provider>
  </React.StrictMode>,
);
