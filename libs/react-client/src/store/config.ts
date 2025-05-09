import { create } from 'zustand';

import { IChainlitConfig } from '..';

interface ConfigState {
  config?: IChainlitConfig;
  setConfig: (config: IChainlitConfig) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  setConfig: (config: IChainlitConfig) => {
    set({ config });
  }
}));
