import PopOver from 'popover';
import { useState } from 'react';
import { IWidgetConfig } from 'types';

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Fade from '@mui/material/Fade';

import MessageCircleIcon from '@chainlit/app/src/assets/MessageCircle';

interface Props {
  config: IWidgetConfig;
}

export default function Widget({ config }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>();
  const customStyle = config.button?.style || {};
  const style = {
    width: customStyle.size || '60px',
    height: customStyle.size || '60px',
    bgcolor: customStyle.bgcolor || '#F80061',
    color: customStyle.color || 'white',
    '&:hover': {
      bgcolor: customStyle.bgcolorHover || '#DA0054'
    },
    borderColor: customStyle.borderColor || 'transparent',
    borderWidth: customStyle.borderWidth || '0px',
    borderStyle: customStyle.borderStyle || 'solid',
    borderRadius: customStyle.borderRadius || '50%',
    boxShadow: customStyle.boxShadow || '0 4px 10px 0 rgba(0,0,0,.05)!important'
  };

  const isPopoverOpen = Boolean(anchorEl);

  return (
    <>
      <PopOver anchorEl={anchorEl} />
      <Fab
        disableRipple
        aria-label="open copilot"
        id="chainlit-copilot-button"
        sx={{
          minHeight: 'auto',
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          ...style
        }}
        onClick={(event: React.MouseEvent<HTMLElement>) =>
          setAnchorEl(anchorEl ? null : event.currentTarget)
        }
      >
        <Fade in={!isPopoverOpen} timeout={300}>
          <Box
            position={'absolute'}
            top={0}
            left={0}
            bottom={0}
            right={0}
            p={1.5}
          >
            {config.button?.imageUrl ? (
              <img width="100%" src={config.button?.imageUrl} />
            ) : (
              <MessageCircleIcon
                color="inherit"
                sx={{ width: '90%', height: '90%' }}
              />
            )}
          </Box>
        </Fade>
        <Fade in={isPopoverOpen} timeout={300}>
          <Box
            position={'absolute'}
            top={0}
            left={0}
            bottom={0}
            right={0}
            p={1.5}
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <CloseIcon color="inherit" sx={{ width: '90%', height: '90%' }} />
          </Box>
        </Fade>
      </Fab>
    </>
  );
}
