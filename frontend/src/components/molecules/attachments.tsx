import { useRecoilValue } from 'recoil';

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { Attachment } from '@chainlit/react-components';

import CircularProgressIconButton from 'components/atoms/buttons/progressIconButton';

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
          <Tooltip title="Cancel upload">
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
                <Close sx={{ height: 20, width: 20 }} />
              </CircularProgressIconButton>
            </Box>
          </Tooltip>
        ) : null;

        const remove =
          !showProgress && attachment.remove ? (
            <Tooltip title="Remove attachment">
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
                <Close sx={{ height: 20, width: 20 }} />
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
