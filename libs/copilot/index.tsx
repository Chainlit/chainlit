import React from 'react';
import ReactDOM from 'react-dom/client';

import AppWrapper from './src/appWrapper';
import { IWidgetConfig } from './src/types';

const id = 'chainlit-copilot';
let root: ReactDOM.Root | null = null;

// @ts-expect-error is not a valid prop
window.mountChainlitWidget = (config: IWidgetConfig, container: HTMLElement | null) => {
  const div = document.createElement('div');
  div.id = id;
  if (container !== null) {
    container.appendChild(div);
  } else {
    document.body.appendChild(div);
  }

  root = ReactDOM.createRoot(div);
  root.render(
    <React.StrictMode>
      <AppWrapper config={{...config, isEmbedded: !!container}} />
    </React.StrictMode>
  );
};

// @ts-expect-error is not a valid prop
window.unmountChainlitWidget = () => {
  root?.unmount();
};
