import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { MessageContent } from 'components/chat/Messages/Message/Content';
import { Markdown } from 'components/Markdown';

// Import the toBeInTheDocument function
import type { ITextElement } from '@chainlit/react-client';

it('renders the message content', () => {
  const { getByText } = render(
    <MessageContent
      message={{
        threadId: 'test',
        type: 'assistant_message',
        output: 'Hello World',
        id: 'test',
        name: 'User',
        createdAt: 0
      }}
      elements={[]}
    />
  );
  expect(getByText('Hello World')).toBeInTheDocument();
});

it('highlights multiple sources correctly (no substring matching)', () => {
  const { getByRole } = render(
    <MessageContent
      message={{
        threadId: 'test',
        type: 'assistant_message',
        output: `Hello world source_121, source_1, source_12`,
        id: 'test2',
        name: 'Test',
        createdAt: 0
      }}
      elements={[
        {
          name: 'source_1',
          type: 'text',
          display: 'side',
          url: 'source_1',
          forId: 'test2'
        } as ITextElement,
        {
          name: 'source_12',
          display: 'side',
          type: 'text',
          forId: 'test2',
          url: 'hi'
        } as ITextElement,
        {
          name: 'source_121',
          display: 'side',
          type: 'text',
          forId: 'test2',
          url: 'hi'
        } as ITextElement
      ]}
    />
  );
  expect(getByRole('link', { name: 'source_1' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source_12' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source_121' })).toBeInTheDocument();
});

it('highlights sources containing regex characters correctly', () => {
  const { getByRole } = render(
    <MessageContent
      message={{
        threadId: 'test',
        type: 'assistant_message',
        output: `Hello world: Document[1], source(12), page{12}`,
        id: 'test2',
        name: 'Test',
        createdAt: 0
      }}
      elements={[
        {
          name: 'Document[1]',
          display: 'side',
          type: 'text',
          url: 'hi',
          forId: 'test2'
        } as ITextElement,
        {
          name: 'source(12)',
          display: 'side',
          type: 'text',
          url: 'hi',
          forId: 'test2'
        } as ITextElement,
        {
          name: 'page{12}',
          display: 'side',
          type: 'text',
          url: 'hi',
          forId: 'test2'
        } as ITextElement
      ]}
    />
  );
  expect(getByRole('link', { name: 'Document[1]' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source(12)' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'page{12}' })).toBeInTheDocument();
});

it('renders KaTeX math expressions when latex is enabled', () => {
  const { container } = render(
    <Markdown latex={true}>
      {'This is an inline math expression: $E = mc^2$ and a block expression:\n\n$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$'}
    </Markdown>
  );
  
  // Check that KaTeX rendered math elements are present
  const mathElements = container.querySelectorAll('.katex');
  expect(mathElements.length).toBeGreaterThan(0);
  
  // Check that the equations were properly rendered
  expect(container.textContent).toContain('E'); // Inline math rendered
  expect(container.textContent).toContain('∫'); // Block math rendered with integral symbol
  expect(container.textContent).toContain('π'); // Block math rendered with pi symbol
});

it('does not render KaTeX math expressions when latex is disabled', () => {
  const { container } = render(
    <Markdown latex={false}>
      {'This is an inline math expression: $E = mc^2$ and a block expression:\n\n$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$'}
    </Markdown>
  );
  
  // Check that no KaTeX elements are present
  const mathElements = container.querySelectorAll('.katex');
  expect(mathElements.length).toBe(0);
  
  // The raw text should still be present
  expect(container.textContent).toContain('$E = mc^2$');
  expect(container.textContent).toContain('$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$');
});