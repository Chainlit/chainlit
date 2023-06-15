import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MessageContent from './content';
import { ITextElement } from 'state/element';

it('renders the message content', () => {
  const { getByText } = render(
    <MessageContent
      authorIsUser={false}
      actions={[]}
      elements={[]}
      content="Hello World"
    />
  );
  expect(getByText('Hello World')).toBeInTheDocument();
});

it('highlights multiple sources correctly (no substring matching)', () => {
  const { getByText } = render(
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
  );
  expect(getByText('source_1')).toBeInTheDocument();
  expect(getByText('source_12')).toBeInTheDocument();
  expect(getByText('source_121')).toBeInTheDocument();
});
