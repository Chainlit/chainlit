import { PropsWithChildren, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Translator } from 'components/i18n';

import ChevronDownIcon from 'assets/chevronDown';
import ChevronUpIcon from 'assets/chevronUp';

import type { IStep } from 'client-types/';

interface Props {
  step: IStep;
  isRunning?: boolean;
}

export default function Step({
  step,
  children,
  isRunning
}: PropsWithChildren<Props>) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const using = useMemo(() => {
    return isRunning && step.start && !step.end && !step.isError;
  }, [step, isRunning]);

  const hasOutput = step.output || step.steps?.length;
  const isError = step.isError;

  const stepName = step.name;

  return (
    <Stack flexGrow={1} direction="column" gap={1} width={0}>
      <Box
        display="flex"
        position="relative"
        alignItems="center"
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
        onClick={() => setOpen(!open)}
        id={`step-${stepName}`}
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
                {stepName}
              </>
            ) : (
              <>
                <Translator path="components.molecules.detailsButton.used" />{' '}
                {stepName}
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
        <Box
          flexGrow={1}
          pl={1}
          sx={{
            borderBottomLeftRadius: '10px',
            borderLeft: (theme) => `1px solid ${theme.palette.text.secondary}`,
            borderBottom: (theme) => `1px solid ${theme.palette.text.secondary}`
          }}
        >
          {children}
        </Box>
      )}
    </Stack>
  );
}
