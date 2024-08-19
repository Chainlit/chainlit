import { memo } from 'react';
import { prepareContent } from 'utils/message';

import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Collapse } from 'components/atoms/Collapse';
import { InlinedElements } from 'components/atoms/elements/InlinedElements';
import { CURSOR_PLACEHOLDER } from 'components/molecules/BlinkingCursor';
import { Markdown } from 'components/molecules/Markdown';

import type { IMessageElement, IStep } from 'client-types/';

const COLLAPSE_MIN_LINES = 50; // Set this to the maximum number of lines you want to display before collapsing
const COLLAPSE_MIN_LENGTH = 3000; // Set this to the maximum number of characters you want to display before collapsing

export interface Props {
  elements: IMessageElement[];
  message: IStep;
  preserveSize?: boolean;
  allowHtml?: boolean;
  latex?: boolean;
}

const MessageContent = memo(
  ({ message, elements, preserveSize, allowHtml, latex }: Props) => {
    let lineCount = 0;
    let contentLength = 0;

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

    lineCount += output.split('\n').length;
    contentLength += output.length;

    const isMessage = message.type.includes('message');

    const outputMarkdown = (
      <Markdown
        allowHtml={allowHtml}
        latex={latex}
        refElements={outputRefElements}
      >
        {isMessage
          ? output
          : `#### Output:     
${output}`}
      </Markdown>
    );

    let inputMarkdown;

    if (message.input && message.showInput) {
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

      lineCount += input.split('\n').length;
      contentLength += input.length;

      inputMarkdown = (
        <Markdown
          allowHtml={allowHtml}
          latex={latex}
          refElements={inputRefElements}
        >
          {`#### Input:  
${input}`}
        </Markdown>
      );
    }

    const markdownContent = (
      <Typography
        sx={{
          minHeight: '20px',
          fontSize: '1rem',
          fontFamily: (theme) => theme.typography.fontFamily,
          overflowX: 'auto'
        }}
        component="div"
      >
        {inputMarkdown}
        {inputMarkdown && outputMarkdown ? <Divider sx={{ my: 1 }} /> : null}
        {outputMarkdown}
      </Typography>
    );

    const collapse =
      lineCount > COLLAPSE_MIN_LINES || contentLength > COLLAPSE_MIN_LENGTH;
    const messageContent = collapse ? (
      <Collapse defaultExpandAll={preserveSize}>{markdownContent}</Collapse>
    ) : (
      markdownContent
    );

    return (
      <Stack className="message-content" width="100%">
        {!!inputMarkdown || output ? messageContent : null}
        <InlinedElements elements={outputInlinedElements} />
      </Stack>
    );
  }
);

export { MessageContent };
