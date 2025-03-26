import React from 'react';
import ReactDOM from 'react-dom/client';

import { type IStep } from '@chainlit/react-client';

// Change the imports to handle CSS properly
import sonnercss from './sonner.css?inline';
import tailwindcss from './src/index.css?inline';
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
    mountChainlitWidget: (config: IWidgetConfig, evoya: EvoyaConfig) => void;
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

  const resetStyles = document.createElement('style');
  resetStyles.textContent = `
    :host {
      all: initial;
    }
    #cl-shadow-root {
      font-family: sans-serif;
      color: inherit;
      box-sizing: border-box;
    }
  `;
  shadowContainer.appendChild(resetStyles);

  const tailwindStyles = document.createElement('style');
  tailwindStyles.textContent = tailwindcss.toString();
  shadowContainer.appendChild(tailwindStyles);

  const sonnerStyles = document.createElement('style');
  sonnerStyles.textContent = sonnercss.toString();
  shadowContainer.appendChild(sonnerStyles);

  const hlStyles = document.createElement('style');
  hlStyles.textContent = hljscss.toString();
  shadowContainer.appendChild(hlStyles);

  root = ReactDOM.createRoot(shadowRootElement);
  root.render(
    <React.StrictMode>
      <AppWrapper widgetConfig={config} evoya={evoya} />
    </React.StrictMode>
  );
};

window.unmountChainlitWidget = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};

window.sendChainlitMessage = (message: IStep) => {
  console.info('Copilot is not active. Please check if the widget is mounted.');
};
