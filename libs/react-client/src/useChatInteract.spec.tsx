// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ISession,
  chatProfileState,
  configState,
  messagesState,
  sessionIdState,
  sessionState,
  threadIdToResumeState,
  unavailableThreadIdState
} from './state';
import { IChainlitConfig } from './types';
import { useChatInteract } from './useChatInteract';

vi.hoisted(() => {
  URL.createObjectURL = () => 'blob:test-audio';
});

afterEach(cleanup);

describe('clear after an unavailable profile', () => {
  function setup(
    unavailableId: string | undefined,
    profile: string | undefined,
    profiles = [
      { name: 'first', default: false },
      { name: 'active', default: true }
    ]
  ) {
    const socket = { emit: vi.fn(), disconnect: vi.fn() };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RecoilRoot
        initializeState={({ set }) => {
          set(chatProfileState, profile);
          set(configState, { chatProfiles: profiles } as IChainlitConfig);
          set(unavailableThreadIdState, unavailableId);
          set(threadIdToResumeState, 'old-thread');
          set(sessionIdState, 'old-session');
          set(sessionState, {
            socket: socket as unknown as ISession['socket']
          });
        }}
      >
        {children}
      </RecoilRoot>
    );
    const hook = renderHook(
      () => ({
        ...useChatInteract(),
        profile: useRecoilValue(chatProfileState),
        unavailableId: useRecoilValue(unavailableThreadIdState),
        resumeId: useRecoilValue(threadIdToResumeState),
        sessionId: useRecoilValue(sessionIdState),
        messages: useRecoilValue(messagesState)
      }),
      { wrapper }
    );
    return { ...hook, socket };
  }

  it('discards the stale profile together with the unavailable session', () => {
    const { result, socket } = setup('old-thread', 'deleted');
    act(() => result.current.clear());
    expect(result.current.profile).toBe('active');
    expect(result.current.unavailableId).toBeUndefined();
    expect(result.current.resumeId).toBeUndefined();
    expect(result.current.sessionId).not.toBe('old-session');
    expect(result.current.messages).toEqual([]);
    expect(socket.emit).toHaveBeenCalledWith('clear_session');
    expect(socket.disconnect).toHaveBeenCalledOnce();
  });

  it('preserves the selected profile when clearing a normal chat', () => {
    const { result } = setup(undefined, 'active');
    act(() => result.current.clear());
    expect(result.current.profile).toBe('active');
    expect(result.current.sessionId).not.toBe('old-session');
  });

  it('keeps an unset profile unset when no profiles are available', () => {
    const { result } = setup('old-thread', undefined, []);
    act(() => result.current.clear());
    expect(result.current.profile).toBeUndefined();
  });

  it('preserves a valid selected profile when leaving unavailable history', () => {
    const { result } = setup('old-thread', 'first');
    act(() => result.current.clear());
    expect(result.current.profile).toBe('first');
  });

  it('uses the first available profile when there is no default', () => {
    const { result } = setup('old-thread', 'deleted', [
      { name: 'first', default: false }
    ]);
    act(() => result.current.clear());
    expect(result.current.profile).toBe('first');
  });

  it('clears a stale selected profile when no profiles remain', () => {
    const { result } = setup('old-thread', 'deleted', []);
    act(() => result.current.clear());
    expect(result.current.profile).toBeUndefined();
  });
});
