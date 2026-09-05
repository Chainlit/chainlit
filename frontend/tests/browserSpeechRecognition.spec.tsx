import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BrowserSpeechRecognition,
  SpeechResultEvent,
  useBrowserSpeechRecognition
} from '@/hooks/useBrowserSpeechRecognition';

class Recognition implements BrowserSpeechRecognition {
  static instances: Recognition[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: BrowserSpeechRecognition['onresult'] = null;
  onerror: BrowserSpeechRecognition['onerror'] = null;
  onend: BrowserSpeechRecognition['onend'] = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    Recognition.instances.push(this);
  }
}

const finalResult = (transcript: string) => ({
  isFinal: true,
  0: { transcript }
});

describe('browser speech recognition', () => {
  beforeEach(() => {
    Recognition.instances = [];
    vi.stubGlobal('SpeechRecognition', Recognition);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  const setup = (enabled = true) => {
    const onTranscript = vi.fn();
    const onError = vi.fn();
    const hook = renderHook(
      ({ enabled }) =>
        useBrowserSpeechRecognition({
          enabled,
          language: 'fr-FR',
          onTranscript,
          onError
        }),
      { initialProps: { enabled } }
    );
    return { ...hook, onTranscript, onError };
  };

  it('starts only on request and uses the selected language', () => {
    const { result } = setup();
    expect(Recognition.instances).toHaveLength(0);
    act(() => result.current.toggle());
    expect(Recognition.instances[0].start).toHaveBeenCalledOnce();
    expect(Recognition.instances[0].lang).toBe('fr-FR');
    expect(result.current.listening).toBe(true);
  });

  it('uses the WebKit-prefixed API when needed', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', Recognition);
    const { result } = setup();
    expect(result.current.supported).toBe(true);
    act(() => result.current.toggle());
    expect(Recognition.instances[0].start).toHaveBeenCalledOnce();
  });

  it('does not start when disabled or unsupported', () => {
    const { result } = setup(false);
    act(() => result.current.toggle());
    expect(Recognition.instances).toHaveLength(0);
    vi.stubGlobal('SpeechRecognition', undefined);
    const unsupported = setup();
    expect(unsupported.result.current.supported).toBe(false);
    act(() => unsupported.result.current.toggle());
    expect(Recognition.instances).toHaveLength(0);
  });

  it('delivers final results once and ignores interim results', () => {
    const { result, onTranscript } = setup();
    act(() => result.current.toggle());
    const event: SpeechResultEvent = {
      resultIndex: 0,
      results: [
        finalResult(' Hello '),
        { isFinal: false, 0: { transcript: 'wor' } }
      ]
    };
    act(() => Recognition.instances[0].onresult?.(event));
    expect(onTranscript).toHaveBeenCalledWith('Hello');
    event.resultIndex = 1;
    event.results = [finalResult('Hello'), finalResult('world')];
    act(() => Recognition.instances[0].onresult?.(event));
    act(() => Recognition.instances[0].onresult?.(event));
    expect(onTranscript.mock.calls).toEqual([['Hello'], ['world']]);
  });

  it('keeps final results when stopping and resets when the browser ends', () => {
    const { result, onTranscript } = setup();
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    const recognition = Recognition.instances[0];
    expect(recognition.stop).toHaveBeenCalledOnce();
    act(() =>
      recognition.onresult?.({ resultIndex: 0, results: [finalResult('Done')] })
    );
    act(() => recognition.onend?.());
    expect(onTranscript).toHaveBeenCalledWith('Done');
    expect(result.current.listening).toBe(false);
    act(() => result.current.toggle());
    expect(Recognition.instances).toHaveLength(2);
  });

  it.each(['cancel', 'disable', 'unmount'])(
    'aborts on %s and detaches callbacks',
    (action) => {
      const { result, rerender, unmount, onTranscript } = setup();
      act(() => result.current.toggle());
      const recognition = Recognition.instances[0];
      if (action === 'cancel') act(() => result.current.cancel());
      if (action === 'disable') rerender({ enabled: false });
      if (action === 'unmount') unmount();
      expect(recognition.abort).toHaveBeenCalledOnce();
      expect(recognition.onresult).toBeNull();
      expect(recognition.onend).toBeNull();
      expect(onTranscript).not.toHaveBeenCalled();
    }
  );

  it('reports microphone permission errors and allows retrying', () => {
    const { result, onError } = setup();
    act(() => result.current.toggle());
    act(() => Recognition.instances[0].onerror?.({ error: 'not-allowed' }));
    expect(onError).toHaveBeenCalledWith('not-allowed');
    expect(result.current.listening).toBe(false);
    act(() => result.current.toggle());
    expect(Recognition.instances).toHaveLength(2);
  });

  it('recovers when starting throws', () => {
    class FailingRecognition extends Recognition {
      start = vi.fn(() => {
        throw new Error('microphone unavailable');
      });
    }
    vi.stubGlobal('SpeechRecognition', FailingRecognition);
    const { result, onError } = setup();
    act(() => result.current.toggle());
    expect(onError).toHaveBeenCalledWith('microphone unavailable');
    expect(result.current.listening).toBe(false);
  });
});
