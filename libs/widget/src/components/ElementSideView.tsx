import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { IMessageElement } from '@chainlit/react-client/src/types';
import { Element } from '@chainlit/react-components/src/elements/Element';

interface SideViewProps {
  element?: IMessageElement;
  isOpen: boolean;
  onClose: () => void;
}

const ElementSideView = ({ element, isOpen, onClose }: SideViewProps) => {
  return (
    <>
      <Box
        onClick={isOpen ? onClose : undefined}
        sx={{
          cursor: 'pointer',
          visibility: isOpen ? 'visible' : 'hidden',
          opacity: isOpen ? 1 : 0,
          height: '100%',
          width: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          position: 'absolute',
          top: 0,
          left: 0,
          transition: 'opacity 0.225s ease-in-out',
          zIndex: 999
        }}
      />
      <Box
        sx={{
          zIndex: 1000,
          position: 'absolute',
          bgcolor: (theme) => theme.palette.background.paper,
          borderTopRightRadius: '10px',
          borderTopLeftRadius: '10px',
          padding: 2,
          flex: 1,
          height: '80%',
          paddingBottom: '80px',
          bottom: 0,
          right: 0,
          left: 0,
          transition: 'transform 0.225s ease-in-out',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          visibility: isOpen ? 'visible' : 'hidden'
        }}
      >
        <Stack direction="row" alignItems="center">
          <Typography
            noWrap
            fontSize="24px"
            fontWeight={500}
            id="side-view-title"
          >
            {element?.name}
          </Typography>
          <IconButton edge="end" sx={{ ml: 'auto' }} onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
        <Box
          mt="1.5rem"
          id="side-view-content"
          sx={{
            height: '100%',
            pointerEvents: 'auto',
            overflow: 'auto'
          }}
        >
          <Element element={element} />
        </Box>
      </Box>
    </>
  );
};

export { ElementSideView };
