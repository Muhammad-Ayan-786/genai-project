import { LoginPage } from '../features/auth/UI/pages/LoginPage.jsx';
import { RegisterPage } from '../features/auth/UI/pages/RegisterPage.jsx';
import { AccountPage } from '../features/auth/UI/pages/AccountPage.jsx';
import { GuestRoute, ProtectedRoute, SessionGate } from '../features/auth/UI/components/SessionGate.jsx';
import { ChatPage } from '../features/conversation/UI/pages/ChatPage.jsx';
import { LandingPage } from '../features/landing/UI/pages/LandingPage.jsx';
import { NotFoundPage } from './NotFoundPage.jsx';

export const routes = [
  {
    element: <SessionGate />,
    children: [
      {
        // Signed-in visitors skip these and land in /chat.
        element: <GuestRoute />,
        children: [
          { path: '/', element: <LandingPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          // One route for both, so switching chats never remounts the page.
          { path: '/chat/:conversationId?', element: <ChatPage /> },
          { path: '/account', element: <AccountPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
