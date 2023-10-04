import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { MessageContent } from 'src/messages/components/MessageContent';

import { ITextElement } from 'src/types/element';

it('renders the message content', () => {
  const { getByText } = render(
    <MessageContent
      message={{
        authorIsUser: false,
        content: 'Hello World',
        id: 'test',
        author: 'User',
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
        authorIsUser: false,
        content: `Hello world source_121, source_1, source_12`,
        id: 'test2',
        author: 'Test',
        createdAt: 0
      }}
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
        authorIsUser: false,
        content: `Hello world: Document[1], source(12), page{12}`,
        id: 'test2',
        author: 'Test',
        createdAt: 0
      }}
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
    />
  );
  expect(getByRole('link', { name: 'Document[1]' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source(12)' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'page{12}' })).toBeInTheDocument();
});

it('preserves the box size when collapsing', () => {
  const { getByRole } = render(
    <MessageContent
      message={{
        authorIsUser: false,
        content: 'hello'.repeat(650),
        id: 'test2',
        author: 'Test',
        createdAt: 0
      }}
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
      preserveSize
    />
  );

  expect(getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
});
