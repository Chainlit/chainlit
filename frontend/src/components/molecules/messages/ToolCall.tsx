import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { MessageContent } from './components/MessageContent';
import { Translator } from 'components/i18n';

import ChevronDownIcon from 'assets/chevronDown';
import ChevronUpIcon from 'assets/chevronUp';

import type { IStep } from 'client-types/';

interface Props {
  steps: IStep[];
}

export default function ToolCall({ steps }: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const using = useMemo(() => {
    return steps.find((step) => step.start && !step.end && !step.isError);
  }, [steps]);

  const hasOutput = steps.some((step) => step.output);
  const isError = steps.some((step) => step.isError);

  if (!steps.length) {
    return null;
  }

  const toolName = steps[0].name;

  return (
    <Stack width="100%" direction="column" alignItems="start" gap={1}>
      <Box
        display="flex"
        alignItems="center"
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
        onClick={() => setOpen(!open)}
      >
        <Box>
          <Typography
            variant="button"
            sx={{
              textTransform: 'none',
              cursor: hasOutput ? 'pointer' : 'default',
              color: isError
                ? 'error.main'
                : hover
                ? 'text.primary'
                : 'text.secondary',
              fontFamily: (theme) => theme.typography.fontFamily
            }}
          >
            {using ? (
              <>
                <Translator path="components.molecules.detailsButton.using" />{' '}
                {toolName}
              </>
            ) : (
              <>
                <Translator path="components.molecules.detailsButton.used" />{' '}
                {toolName}
              </>
            )}
          </Typography>{' '}
          {using && (
            <LinearProgress
              color="inherit"
              sx={{ borderRadius: '1rem', height: '3px' }}
            />
          )}
        </Box>

        {hasOutput && (hover || open) ? (
          open ? (
            <ChevronUpIcon sx={{ height: 18, with: 18, cursor: 'pointer' }} />
          ) : (
            <ChevronDownIcon sx={{ height: 18, with: 18, cursor: 'pointer' }} />
          )
        ) : null}
      </Box>
      {open && (
        <Stack width="100%" direction="column" gap={2}>
          {steps
            .filter((step) => step.output)
            .map((step) => (
              <MessageContent
                key={step.id}
                elements={[]}
                message={step}
                preserveSize={true}
              />
            ))}
        </Stack>
      )}
    </Stack>
  );
}
