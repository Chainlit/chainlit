import React, { useState } from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IFileResponse } from './types/file';

interface AttachmentsProps {
  attachments: IFileResponse[];
  setAttachments: React.Dispatch<React.SetStateAction<IFileResponse[]>>;
}

const Attachment = ({
  attachment,
  onRemove
}: {
  attachment: IFileResponse;
  onRemove: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const extension = attachment.type.split('/')[1];
  let children;

  if (attachment.type.includes('image')) {
    children = (
      <img
        style={{
          objectFit: 'cover',
          width: 100,
          height: 70,
          borderRadius: 8
        }}
        src={URL.createObjectURL(new Blob([attachment.content!]))}
      />
    );
  } else {
    children = (
      <Stack
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          borderRadius: 1,
          px: 1,
          maxWidth: 150,
          height: 70,

          color: (theme) => theme.palette.primary.main,
          background: (theme) => theme.palette.primary.light,
          '&:hover': {
            background: (theme) => theme.palette.primary.light
          }
        }}
      >
        <Box
          sx={{
            padding: 0.5,
            borderRadius: 1,
            '> svg': {
              height: '60px'
            }
          }}
        >
          <FileIcon
            {...defaultStyles[extension]}
            extension={defaultStyles[extension] ? extension : 'file'}
          />
        </Box>
        <Typography
          sx={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontSize: '12px',
            width: '70%'
          }}
        >
          {attachment.name}
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
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
          onClick={onRemove}
        >
          <Close sx={{ height: 20, width: 20 }} />
        </IconButton>
      ) : null}
      {children}
    </Box>
  );
};

const Attachments = ({
  attachments,
  setAttachments
}: AttachmentsProps): JSX.Element => {
  if (attachments.length === 0) return <></>;

  const onRemove = (index: number) => {
    setAttachments((prev) =>
      prev.filter((_, prevIndex) => index !== prevIndex)
    );
  };

  return (
    <Stack
      sx={{
        flexDirection: 'row',
        gap: 2,
        width: 'fit-content'
      }}
    >
      {attachments.map((attachment, index) => {
        return (
          <Attachment
            key={index}
            attachment={attachment}
            onRemove={() => onRemove(index)}
          />
        );
      })}
    </Stack>
  );
};

export { Attachments };
