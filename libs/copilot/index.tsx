import React from 'react';
import ReactDOM from 'react-dom/client';

import AppWrapper from './src/appWrapper';
import { IWidgetConfig } from './src/types';
import { EvoyaConfig } from './src/evoya/types';

const id = 'chainlit-copilot';
let root: ReactDOM.Root | null = null;

// @ts-expect-error is not a valid prop
window.mountChainlitWidget = (config: IWidgetConfig, evoya: EvoyaConfig) => {
  const div = document.createElement('div');
  div.id = id;
  if (evoya.container !== null) {
    div.style.height = '100%';
    div.style.width = '100%';
    evoya.container.appendChild(div);
  } else {
    document.body.appendChild(div);
  }

  root = ReactDOM.createRoot(div);
  root.render(
    <React.StrictMode>
      <AppWrapper config={config} evoya={evoya} />
    </React.StrictMode>
  );
};

// @ts-expect-error is not a valid prop
window.unmountChainlitWidget = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};
