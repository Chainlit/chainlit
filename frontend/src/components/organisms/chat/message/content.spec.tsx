import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { expect, it } from 'vitest';

import { ITextElement } from 'state/element';

import MessageContent from './content';

it('renders the message content', () => {
  const { getByText } = render(
    <RecoilRoot>
      <MessageContent
        authorIsUser={false}
        elements={[]}
        content="Hello World"
      />
    </RecoilRoot>
  );
  expect(getByText('Hello World')).toBeInTheDocument();
});

it('highlights multiple sources correctly (no substring matching)', () => {
  const { getByRole } = render(
    <RecoilRoot>
      <BrowserRouter>
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
          content={`Hello world
        source_121, source_1, source_12`}
        />
      </BrowserRouter>
    </RecoilRoot>
  );
  expect(getByRole('link', { name: 'source_1' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source_12' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source_121' })).toBeInTheDocument();
});

it('highlights sources containing regex characters correctly', () => {
  const { getByRole } = render(
    <RecoilRoot>
      <BrowserRouter>
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
      </BrowserRouter>
    </RecoilRoot>
  );
  expect(getByRole('link', { name: 'Document[1]' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'source(12)' })).toBeInTheDocument();
  expect(getByRole('link', { name: 'page{12}' })).toBeInTheDocument();
});
