import React from 'react';
import ReactDOM from 'react-dom/client';

import { type IStep } from '@chainlit/react-client';

// @ts-expect-error inline css
import sonnercss from './sonner.css?inline';
// @ts-expect-error inline css
import tailwindcss from './src/index.css?inline';
// @ts-expect-error inline css
import hljscss from 'highlight.js/styles/monokai-sublime.css?inline';

import AppWrapper from './src/appWrapper';
import { IWidgetConfig } from './src/types';
import { EvoyaConfig } from './src/evoya/types';

const id = 'chainlit-copilot';
let root: ReactDOM.Root | null = null;

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    mountChainlitWidget: (config: IWidgetConfig,  evoya: EvoyaConfig) => void;
    unmountChainlitWidget: () => void;
    toggleChainlitCopilot: () => void;
    sendChainlitMessage: (message: IStep) => void;
  }
}

window.mountChainlitWidget = (config: IWidgetConfig, evoya: EvoyaConfig) => {
  const container = document.createElement('div');
  container.id = id;

  if (evoya.container !== null) {
    container.style.height = '100%';
    container.style.width = '100%';
    evoya.container.appendChild(container);
  } else {
    document.body.appendChild(container);
  }

  const shadowContainer = container.attachShadow({ mode: 'open' });
  const shadowRootElement = document.createElement('div');
  shadowRootElement.id = 'cl-shadow-root';
  shadowContainer.appendChild(shadowRootElement);
  if (evoya.container !== null) {
    shadowRootElement.style.height = '100%';
    shadowRootElement.style.width = '100%';
  }

  window.cl_shadowRootElement = shadowRootElement;

  root = ReactDOM.createRoot(shadowRootElement);
  root.render(
    <React.StrictMode>
      <style type="text/css">{tailwindcss.toString()}</style>
      <style type="text/css">{sonnercss.toString()}</style>
      <style type="text/css">{hljscss.toString()}</style>
      <AppWrapper widgetConfig={config} evoya={evoya} />
    </React.StrictMode>
  );
};

window.unmountChainlitWidget = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};

window.sendChainlitMessage = () => {
  console.info('Copilot is not active. Please check if the widget is mounted.');
};
