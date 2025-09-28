import AppWrapper from 'AppWrapper';
import { apiClient } from 'api';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RecoilRoot } from 'recoil';

import { ChainlitContext } from '@chainlit/react-client';

import './index.css';

import { i18nSetupLocalization } from './i18n';
import { store } from './redux/store';

i18nSetupLocalization();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ChainlitContext.Provider value={apiClient}>
        <RecoilRoot>
          <AppWrapper />
        </RecoilRoot>
      </ChainlitContext.Provider>
    </Provider>
  </React.StrictMode>
);
