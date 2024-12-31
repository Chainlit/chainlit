import React from 'react';
import ReactDOM from 'react-dom/client';

import { type IStep } from '@chainlit/react-client';

import './src/index.css';
import './sonner.css';
import 'highlight.js/styles/monokai-sublime.css';

import AppWrapper from './src/appWrapper';
import { IWidgetConfig } from './src/types';

const id = 'chainlit-copilot';
let root: ReactDOM.Root | null = null;

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
    theme?: {
      light: Record<string, string>,
      dark: Record<string, string>,
    }
    mountChainlitWidget: (config: IWidgetConfig) => void;
    unmountChainlitWidget: () => void;
    sendChainlitMessage: (message: IStep) => void;
  }
}

window.mountChainlitWidget = (config: IWidgetConfig) => {
  const container = document.createElement('div');
  container.id = id;
  document.body.appendChild(container);

  root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
        <AppWrapper widgetConfig={config} />
    </React.StrictMode>
  );
};

window.unmountChainlitWidget = () => {
  root?.unmount();
};

window.sendChainlitMessage = () => {
  console.info('Copilot is not active. Please check if the widget is mounted.');
};
