import { prepareContent } from '@/lib/message';
import { memo } from 'react';

import type { IMessageElement, IStep } from '@chainlit/react-client';

import { CURSOR_PLACEHOLDER } from '@/components/BlinkingCursor';
import Markdown from '@/components/Markdown';

import { InlinedElements } from './InlinedElements';

export interface Props {
  elements: IMessageElement[];
  message: IStep;
  allowHtml?: boolean;
  latex?: boolean;
}

const MessageContent = memo(
  ({ message, elements, allowHtml, latex }: Props) => {
    const outputContent =
      message.streaming && message.output
        ? message.output + CURSOR_PLACEHOLDER
        : message.output;

    const {
      preparedContent: output,
      inlinedElements: outputInlinedElements,
      refElements: outputRefElements
    } = prepareContent({
      elements,
      id: message.id,
      content: outputContent,
      language: message.language
    });

    const displayInput = message.input && message.showInput;

    const isMessage = message.type.includes('message');

    const outputMarkdown = (
      <p className="flex flex-col gap-2">
        {!isMessage && displayInput ? (
          <div className="text-lg font-semibold leading-none tracking-tight">
            Output
          </div>
        ) : null}
        <Markdown
          allowHtml={allowHtml}
          latex={latex}
          refElements={outputRefElements}
        >
          {output}
        </Markdown>
      </p>
    );

    let inputMarkdown;

    if (displayInput) {
      const inputContent =
        message.streaming && message.input
          ? message.input + CURSOR_PLACEHOLDER
          : message.input;
      const { preparedContent: input, refElements: inputRefElements } =
        prepareContent({
          elements,
          id: message.id,
          content: inputContent,
          language:
            typeof message.showInput === 'string'
              ? message.showInput
              : undefined
        });

      inputMarkdown = (
        <p className="flex flex-col gap-2">
          <div className="text-lg font-semibold leading-none tracking-tight">
            Input
          </div>
          <Markdown
            allowHtml={allowHtml}
            latex={latex}
            refElements={inputRefElements}
          >
            {input}
          </Markdown>
        </p>
      );
    }

    const markdownContent = (
      <div className="flex flex-col gap-4">
        {inputMarkdown}
        {outputMarkdown}
      </div>
    );

    return (
      <div className="message-content w-full flex flex-col gap-2">
        {!!inputMarkdown || output ? markdownContent : null}
        <InlinedElements elements={outputInlinedElements} />
      </div>
    );
  }
);

export { MessageContent };
