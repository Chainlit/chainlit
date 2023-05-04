import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import App from './App';
import './index.css';
import { Auth0Provider } from '@auth0/auth0-react';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Toaster />
    <RecoilRoot>
      <Auth0Provider
        domain="https://auth.chainlit.io"
        clientId="ADo93BBXDn8Z35lEi8arCWiR7C0ncrjx"
        authorizationParams={{
          redirect_uri: `${window.location.origin}/api/auth/callback`
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        <App />
      </Auth0Provider>
    </RecoilRoot>
  </React.StrictMode>
);
