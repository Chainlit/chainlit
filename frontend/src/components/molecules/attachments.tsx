import { useRecoilValue } from 'recoil';

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { Attachment } from '@chainlit/react-components';

import CircularProgressIconButton from 'components/atoms/buttons/progressIconButton';
import { Translator } from 'components/i18n';

import { attachmentsState } from 'state/chat';

const Attachments = (): JSX.Element => {
  const attachments = useRecoilValue(attachmentsState);

  if (attachments.length === 0) return <></>;

  return (
    <Stack
      id="attachments"
      sx={{
        flexDirection: 'row',
        gap: 2,
        width: 'fit-content',
        flexWrap: 'wrap'
      }}
    >
      {attachments.map((attachment) => {
        const showProgress = !attachment.uploaded && attachment.cancel;

        const progress = showProgress ? (
          <Tooltip
            title={
              <Translator path="components.molecules.attachments.cancelUpload" />
            }
          >
            <Box
              sx={{
                position: 'absolute',
                right: -10,
                top: -10
              }}
            >
              <CircularProgressIconButton
                progress={attachment.uploadProgress || 0}
                onClick={attachment.cancel}
                sx={{
                  p: 0.5,
                  background: 'white',
                  backgroundColor: 'background.paper',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    backgroundColor: 'background.default'
                  }
                }}
              >
                <Close
                  sx={(theme) => ({
                    height: 20,
                    width: 20,
                    [theme.breakpoints.down('sm')]: {
                      height: 12,
                      width: 12
                    }
                  })}
                />
              </CircularProgressIconButton>
            </Box>
          </Tooltip>
        ) : null;

        const remove =
          !showProgress && attachment.remove ? (
            <Tooltip
              title={
                <Translator path="components.molecules.attachments.removeAttachment" />
              }
            >
              <IconButton
                sx={{
                  position: 'absolute',
                  p: 0.5,
                  right: -10,
                  top: -10,
                  background: 'white',
                  backgroundColor: 'background.paper',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    backgroundColor: 'background.default'
                  }
                }}
                onClick={attachment.remove}
              >
                <Close
                  sx={(theme) => ({
                    height: 20,
                    width: 20,
                    [theme.breakpoints.down('sm')]: {
                      height: 12,
                      width: 12
                    }
                  })}
                />
              </IconButton>
            </Tooltip>
          ) : null;

        return (
          <Attachment
            key={attachment.id}
            name={attachment.name}
            mime={attachment.type}
          >
            {progress}
            {remove}
          </Attachment>
        );
      })}
    </Stack>
  );
};

export { Attachments };
