import AppWrapper from 'AppWrapper';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';

import './index.css';

import { i18nSetupLocalization } from './i18n';

i18nSetupLocalization();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <AppWrapper />
    </RecoilRoot>
  </React.StrictMode>
);
