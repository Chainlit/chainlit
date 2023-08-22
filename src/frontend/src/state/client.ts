import { ChainlitClient } from 'api';
import { atom } from 'recoil';

export const clientState = atom<ChainlitClient>({
  key: 'Client',
  default: new ChainlitClient()
});
