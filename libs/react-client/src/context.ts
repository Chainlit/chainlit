import { createContext } from 'react';

import { ChainlitAPI } from './api';

const defaultChainlitContext = undefined;

const ChainlitContext = createContext<ChainlitAPI>(
  new ChainlitAPI('http://localhost:8000', 'webapp')
);

export { ChainlitContext, defaultChainlitContext };
