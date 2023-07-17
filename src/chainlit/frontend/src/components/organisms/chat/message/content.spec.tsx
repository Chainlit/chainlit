import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import { ITextElement } from 'state/element';

import MessageContent from './content';

it('renders the message content', () => {
  const { getByText } = render(
    <RecoilRoot>
      <MessageContent
        authorIsUser={false}
        actions={[]}
        elements={[]}
        content="Hello World"
      />
    </RecoilRoot>
  );
  expect(getByText('Hello World')).toBeInTheDocument();
});

it('highlights multiple sources correctly (no substring matching)', () => {
  const { getByText } = render(
    <RecoilRoot>
      <BrowserRouter>
        <MessageContent
          authorIsUser={false}
          actions={[]}
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
  expect(getByText('source_1')).toBeInTheDocument();
  expect(getByText('source_12')).toBeInTheDocument();
  expect(getByText('source_121')).toBeInTheDocument();
});
