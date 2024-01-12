import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';

import EmbedWidget, { IWidgetConfig } from './widget';

// @ts-expect-error foo is not a valid prop
window.renderButtonWidget = (config: IWidgetConfig) => {
  const div = document.createElement('div');
  div.id = 'chainlit-embed';
  document.body.appendChild(div);

  ReactDOM.createRoot(div).render(
    <React.StrictMode>
      <RecoilRoot>
        <EmbedWidget config={config} />
      </RecoilRoot>
    </React.StrictMode>
  );
};
