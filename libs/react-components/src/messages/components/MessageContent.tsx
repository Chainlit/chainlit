import { memo } from 'react';
import { Collapse } from 'src/Collapse';
import { Markdown } from 'src/Markdown';
import { InlinedElements } from 'src/elements/InlinedElements';
import { prepareContent } from 'utils/message';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { IMessageElement, IStep } from 'client-types/';

const COLLAPSE_MIN_LINES = 25; // Set this to the maximum number of lines you want to display before collapsing
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
    const isUser = 'role' in message && message.role === 'user';

    let lineCount = 0;
    let contentLength = 0;

    const {
      preparedContent: output,
      inlinedElements: outputInlinedElements,
      refElements: outputRefElements
    } = prepareContent({
      elements,
      id: message.id,
      content: message.output,
      language: message.language
    });

    lineCount += output.split('\n').length;
    contentLength += output.length;

    const outputMarkdown = (
      <Markdown
        allowHtml={allowHtml}
        latex={latex}
        refElements={outputRefElements}
      >
        {output}
      </Markdown>
    );

    let inputMarkdown;

    if (message.input && message.showInput) {
      const { preparedContent: input, refElements: inputRefElements } =
        prepareContent({
          elements,
          id: message.id,
          content: message.input,
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
          {input}
        </Markdown>
      );
    }

    const markdownContent = (
      <Typography
        sx={{
          width: '100%',
          minHeight: '20px',
          fontSize: '1rem',
          lineHeight: '1.5rem',
          fontFamily: (theme) => theme.typography.fontFamily,
          fontWeight: isUser ? 500 : 300
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
      <Stack width="100%" direction="row">
        <Box width="100%" sx={{ minWidth: '100px' }}>
          {output ? messageContent : null}
          <InlinedElements elements={outputInlinedElements} />
        </Box>
      </Stack>
    );
  }
);

export { MessageContent };
