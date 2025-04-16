import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import AppWrapper from './src/appWrapper';
import {
  EvoyaCreatorConfig,
  SelectionContext,
} from './src/types';

import type { IStep } from 'client-types/';

const id = 'evoya-md-editor';
let root: ReactDOM.Root | null = null;

declare global {
  interface Window {
    // cl_shadowRootElement: HTMLDivElement;
    mountEvoyaCreatorWidget: (config: EvoyaCreatorConfig) => void;
    unmountEvoyaCreatorWidget: () => void;
    openEvoyaCreator: (message: IStep, config: any) => void;
    getEvoyaCreatorContent: () => string | null;
    getEvoyaCreatorContentSelection: () => SelectionContext | null;
    // updateEvoyaCreator: (message: string) => void;
    updateEvoyaCreator: (message: IStep) => void;
  }
}

window.mountEvoyaCreatorWidget = (config: EvoyaCreatorConfig) => {
  const container = document.createElement('div');
  container.id = id;
  config.container.appendChild(container);
  container.style.height = '100%';

  const cache = createCache({
    key: 'css',
    prepend: true,
    container: container
  });

  root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <CacheProvider value={cache}>
        <AppWrapper config={config} />
      </CacheProvider>
    </React.StrictMode>
  );
};

window.unmountEvoyaCreatorWidget = () => {
  root?.unmount();
  document.getElementById(id)?.remove();
};

window.openEvoyaCreator = () => {
  console.info('Evoya Creator not initialized');
};

window.getEvoyaCreatorContent = () => null;
window.getEvoyaCreatorContentSelection = () => null;
window.updateEvoyaCreator = () => null;
