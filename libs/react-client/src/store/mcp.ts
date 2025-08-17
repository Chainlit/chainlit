import { persist } from 'zustand/middleware';
import { create } from 'zustand/react';

import { IMcp } from '../types';
import { stateOrSetter } from './utils';

interface McpState {
  mcps: IMcp[];
  setMcps: (mcpsOrSetter: ((prev: IMcp[]) => IMcp[]) | IMcp[]) => void;
}

export const useMcpStore = create<McpState>()(
  persist(
    (set) => ({
      mcps: [] as IMcp[],
      setMcps: (mcpsOrSetter) => stateOrSetter(set, 'mcps', mcpsOrSetter)
    }),
    {
      name: 'mcp_storage_key'
    }
  )
);
