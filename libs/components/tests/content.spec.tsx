import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { MessageContent } from 'src/messages/components/MessageContent';

import { ITextElement } from 'src/types/element';

it('renders the message content', () => {
  const { getByText } = render(
    <MessageContent authorIsUser={false} elements={[]} content="Hello World" />
  );
  expect(getByText('Hello World')).toBeInTheDocument();
});

it('highlights multiple sources correctly (no substring matching)', () => {
  const { getByRole } = render(
    <MessageContent
      authorIsUser={false}
      elements={[
        {
          name: 'source_1',
          type: 'text',
          display: 'side',
          content: 'source_1'
        } as ITextElement,
        {
          name: 'source_12',
          display: 'side',
          type: 'text',
          content: 'hi'
        } as ITextElement,
        {
          name: 'source_121',
          display: 'side',
          type: 'text',
          content: 'hi'
        } as ITextElement
      ]}
      content={`Hello world source_121, source_1, source_12`}
    />
  );
  expect(getByRole('link', { name: 'source_1' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source_12' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source_121' })).toBeInTheDocument();
});

it('highlights sources containing regex characters correctly', () => {
  const { getByRole } = render(
    <MessageContent
      authorIsUser={false}
      elements={[
        {
          name: 'Document[1]',
          display: 'side',
          type: 'text',
          content: 'hi'
        } as ITextElement,
        {
          name: 'source(12)',
          display: 'side',
          type: 'text',
          content: 'hi'
        } as ITextElement,
        {
          name: 'page{12}',
          display: 'side',
          type: 'text',
          content: 'hi'
        } as ITextElement
      ]}
      content={`Hello world: Document[1], source(12), page{12}`}
    />
  );
  expect(getByRole('link', { name: 'Document[1]' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source(12)' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'page{12}' })).toBeInTheDocument();
});

it('preserves the box size when collapsing', () => {
  const { getByRole } = render(
    <MessageContent
      authorIsUser={false}
      elements={[
        {
          name: 'source_1',
          type: 'text',
          display: 'side',
          content: 'source_1'
        } as ITextElement,
        {
          name: 'source_12',
          display: 'side',
          type: 'text',
          content: 'hi'
        } as ITextElement,
        {
          name: 'source_121',
          display: 'side',
          type: 'text',
          content: 'hi'
        } as ITextElement
      ]}
      content={'hello'.repeat(650)}
      preserveSize
    />
  );

  expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
});
