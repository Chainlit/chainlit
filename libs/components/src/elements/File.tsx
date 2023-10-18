import { useState } from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IFileElement } from 'src/types/element';

const FileElement = ({
  element,
  onRemove
}: {
  element: IFileElement;
  onRemove?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!element.url && !element.content) {
    return null;
  }

  let children;
  const mime = element.mime ? element.mime.split('/').pop()! : 'file';

  if (element.mime?.includes('image') && !element.mime?.includes('svg')) {
    children = (
      <img
        style={{
          objectFit: 'cover',
          width: 90,
          height: '100%',
          borderRadius: '5px'
        }}
        src={element.url || URL.createObjectURL(new Blob([element.content!]))}
      />
    );
  } else {
    children = (
      <Stack
        sx={{
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.2,
          borderRadius: 1,
          px: 1.2,
          width: 160,
          border: (theme) => `1px solid ${theme.palette.primary.main}`,
          color: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.primary.main
              : theme.palette.text.primary,
          background: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.primary.light
              : theme.palette.primary.dark
        }}
      >
        <Box
          sx={{
            height: '30px',
            borderRadius: 1,
            '> svg': {
              height: '30px'
            }
          }}
        >
          <FileIcon {...defaultStyles[mime]} extension={mime} />
        </Box>
        <Typography
          sx={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            fontSize: '0.8rem',
            width: '70%'
          }}
        >
          {element.name}
        </Typography>
      </Stack>
    );
  }

  const fileElement = (
    <Box
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      height={50}
    >
      {isHovered && onRemove ? (
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

  if (!onRemove) {
    return (
      <Link
        className={`${element.display}-file`}
        download={element.name}
        href={element.url || URL.createObjectURL(new Blob([element.content!]))}
        sx={{
          textDecoration: 'none'
        }}
      >
        {fileElement}
      </Link>
    );
  } else {
    return fileElement;
  }
};

export { FileElement };
