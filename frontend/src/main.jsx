import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/literata/400.css';
import '@fontsource/literata/400-italic.css';
import '@fontsource/literata/600.css';
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
