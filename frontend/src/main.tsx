import AppWrapper from 'AppWrapper';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';

import './index.css';

import { i18nSetupLocalization } from './i18n';

i18nSetupLocalization();

const EVOYA_JWT_STORAGE_KEY = 'token';
const EVOYA_SESSION_STORAGE_KEY = 'session_token';

const searchParams = new URLSearchParams(location.search);
if (searchParams.get('access_token')) {
  localStorage.removeItem(EVOYA_JWT_STORAGE_KEY);
  localStorage.removeItem(EVOYA_SESSION_STORAGE_KEY);
  localStorage.removeItem('input_history');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <AppWrapper />
    </RecoilRoot>
  </React.StrictMode>
);
