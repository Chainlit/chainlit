import { expect, it, describe } from 'vitest';

// Extract the hasAssistantMessage function to test it directly
const hasAssistantMessage = (step: any): boolean => {
  return (
    step.steps?.some(
      (s: any) => 
        (s.type === 'assistant_message' && s.output.trim() !== '') || 
        hasAssistantMessage(s)
    ) || false
  );
};

describe('hasAssistantMessage function', () => {
  it('returns false when there are no steps', () => {
    const step = {
      id: 'run-1',
      name: 'on_message',
      type: 'run',
      steps: []
    };

    expect(hasAssistantMessage(step)).toBe(false);
  });

  it('returns false when assistant message has empty output', () => {
    const step = {
      id: 'run-1',
      name: 'on_message',
      type: 'run',
      steps: [
        {
          id: 'msg-1',
          type: 'assistant_message',
          output: '' // Empty output should not count
        }
      ]
    };

    expect(hasAssistantMessage(step)).toBe(false);
  });

  it('returns false when assistant message has only whitespace output', () => {
    const step = {
      id: 'run-1',
      name: 'on_message',
      type: 'run',
      steps: [
        {
          id: 'msg-1',
          type: 'assistant_message',
          output: '   \n\t  ' // Only whitespace should not count
        }
      ]
    };

    expect(hasAssistantMessage(step)).toBe(false);
  });

  it('returns true when assistant message has content', () => {
    const step = {
      id: 'run-1',
      name: 'on_message',
      type: 'run',
      steps: [
        {
          id: 'msg-1',
          type: 'assistant_message',
          output: 'Hello world' // Non-empty output should count
        }
      ]
    };

    expect(hasAssistantMessage(step)).toBe(true);
  });

  it('returns true when nested step has assistant message with content', () => {
    const step = {
      id: 'run-1',
      name: 'on_message',
      type: 'run',
      steps: [
        {
          id: 'nested-1',
          type: 'tool',
          steps: [
            {
              id: 'msg-1',
              type: 'assistant_message',
              output: 'Nested content'
            }
          ]
        }
      ]
    };

    expect(hasAssistantMessage(step)).toBe(true);
  });

  it('returns false when nested step has assistant message with empty content', () => {
    const step = {
      id: 'run-1',
      name: 'on_message',
      type: 'run',
      steps: [
        {
          id: 'nested-1',
          type: 'tool',
          steps: [
            {
              id: 'msg-1',
              type: 'assistant_message',
              output: '' // Empty nested content should not count
            }
          ]
        }
      ]
    };

    expect(hasAssistantMessage(step)).toBe(false);
  });

  it('returns false when there are non-assistant message steps', () => {
    const step = {
      id: 'run-1',
      name: 'on_message',
      type: 'run',
      steps: [
        {
          id: 'tool-1',
          type: 'tool',
          output: 'Tool output'
        },
        {
          id: 'user-1',
          type: 'user_message',
          output: 'User message'
        }
      ]
    };

    expect(hasAssistantMessage(step)).toBe(false);
  });
});