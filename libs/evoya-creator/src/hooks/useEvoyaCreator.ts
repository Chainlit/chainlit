import {
  useMemo,
  useCallback,
  useContext,
} from 'react';
import {
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';

import {
  creatorActiveState,
  creatorContentState,
  creatorTypeState,
  creatorMessageState,
} from '@/state';

// import { EvoyaConfig } from 'evoya/types';
import { WidgetContext } from '@/context';

import type { IStep } from 'client-types/';

export default function useEvoyaCreator() {
  const { config } = useContext(WidgetContext);
  const active = useRecoilValue(creatorActiveState);
  const setActive = useSetRecoilState(creatorActiveState);
  const creatorType = useRecoilValue(creatorTypeState);
  const setCreatorType = useSetRecoilState(creatorTypeState);
  const creatorContent = useRecoilValue(creatorContentState);
  const setCreatorContent = useSetRecoilState(creatorContentState);
  const creatorMessage = useRecoilValue(creatorMessageState);
  const setCreatorMessage = useSetRecoilState(creatorMessageState);

  const openCreatorWithContent = (message: IStep, config: any) => {
    window.dispatchEvent(new CustomEvent('open-evoya-creator', { detail: { config }}));
    setCreatorType(config.type ?? 'markdown');
    setCreatorMessage(message);
    setCreatorContent(message.output);
    window.dispatchEvent(new CustomEvent('enable-creator-mode'));
    setActive(true);
    // @ts-expect-error is not a valid prop
    window.evoyaCreatorEnabled = true;
  }

  const closeCreatorOverlay = () => {
    window.dispatchEvent(new CustomEvent('disable-creator-mode'));
    setActive(false);
    // @ts-expect-error is not a valid prop
    window.evoyaCreatorEnabled = false;
  }
  
  return {
    enabled: config?.enabled ?? false,
    creatorType,
    active,
    setActive,
    creatorContent,
    setCreatorContent,
    creatorMessage,
    setCreatorMessage,
    openCreatorWithContent,
    closeCreatorOverlay,
  };
}