import size from 'lodash/size';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import { Box, Popover, Tab, Tabs } from '@mui/material';

import {
  useChatInteract,
  useChatMessages,
  useChatSession
} from '@chainlit/react-client';
import {
  InputStateHandler,
  Markdown,
  grey,
  useIsDarkMode
} from '@chainlit/react-components';

import { projectSettingsState } from 'state/project';

import NewChatDialog from './newChatDialog';

export default function ChatProfiles() {
  const pSettings = useRecoilValue(projectSettingsState);
  const { chatProfile, setChatProfile } = useChatSession();
  const { firstInteraction } = useChatMessages();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [chatProfileDescription, setChatProfileDescription] = useState('');
  const { clear } = useChatInteract();
  const [newChatProfile, setNewChatProfile] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const isDarkMode = useIsDarkMode();

  const handleClose = () => {
    setOpenDialog(false);
    setNewChatProfile(null);
  };

  const handleConfirm = (newChatProfileWithoutConfirm?: string) => {
    const chatProfile = newChatProfileWithoutConfirm || newChatProfile;
    if (!chatProfile) {
      // Should never happen
      throw new Error('Retry clicking on a profile before starting a new chat');
    }
    setChatProfile(chatProfile);
    setNewChatProfile(null);
    clear();
    handleClose();
  };

  if (!chatProfile && size(pSettings?.chatProfiles) > 0) {
    setChatProfile(pSettings?.chatProfiles[0].name);
  }

  if (typeof pSettings === 'undefined' || pSettings.chatProfiles.length <= 1) {
    return null;
  }

  const allowHtml = pSettings?.features?.unsafe_allow_html;
  const latex = pSettings?.features?.latex;

  const popoverOpen = Boolean(anchorEl);

  return (
    <Box pt={1} pb={2} alignSelf="center" maxWidth="min(60rem, 90vw)">
      <InputStateHandler id={'chat-profile-selector'}>
        <Box
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: 1,
            padding: 0.5
          }}
        >
          <Tabs
            value={chatProfile || ''}
            onChange={(event: React.SyntheticEvent, newValue: string) => {
              setNewChatProfile(newValue);
              if (firstInteraction) {
                setOpenDialog(true);
              } else {
                handleConfirm(newValue);
              }
            }}
            variant="scrollable"
            sx={{
              minHeight: '40px !important',

              '& .MuiButtonBase-root': {
                textTransform: 'none',
                zIndex: 1,
                color: grey[isDarkMode ? 600 : 500],
                fontSize: '14px',
                fontWeight: 500,
                padding: 0,
                minHeight: '40px !important',
                width: '125px'
              },
              '& .Mui-selected': {
                color: 'white !important'
              },
              '& .MuiTabs-indicator': {
                background: (theme) =>
                  isDarkMode
                    ? theme.palette.divider
                    : theme.palette.primary.main,
                height: '100%',
                borderRadius: '5px'
              }
            }}
          >
            {pSettings.chatProfiles.map((item) => (
              <Tab
                key={`tab-${item.name}`}
                className={`tab-${item.name}`}
                disableRipple
                label={item.name}
                value={item.name}
                sx={{
                  '& .chat-profile-icon': {
                    filter:
                      item.name !== chatProfile ? 'grayscale(100%)' : undefined
                  },
                  '&:hover': {
                    '& .chat-profile-icon': { filter: 'grayscale(0%)' }
                  }
                }}
                icon={
                  item.icon ? (
                    <img
                      src={item.icon}
                      className="chat-profile-icon"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        transition: 'filter 0.5s ease-in-out'
                      }}
                    />
                  ) : undefined
                }
                iconPosition="start"
                onMouseEnter={(event) => {
                  setChatProfileDescription(item.markdown_description);
                  setAnchorEl(event.currentTarget.parentElement);
                }}
                onMouseLeave={() => setAnchorEl(null)}
                data-test={`chat-profile:${item.name}`}
              />
            ))}
          </Tabs>
        </Box>
      </InputStateHandler>
      <Popover
        id="chat-profile-description"
        anchorEl={anchorEl}
        open={popoverOpen}
        PaperProps={{
          sx: {
            boxShadow: (theme) =>
              theme.palette.mode === 'light'
                ? '0px 2px 4px 0px #0000000D'
                : '0px 10px 10px 0px #0000000D'
          }
        }}
        sx={{
          pointerEvents: 'none',
          marginTop: 1.5
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
      >
        <Box
          p={2}
          sx={{
            fontFamily: (theme) => theme.typography.fontFamily
          }}
          maxWidth="20rem"
        >
          <Markdown allowHtml={allowHtml} latex={latex}>
            {chatProfileDescription}
          </Markdown>
        </Box>
      </Popover>
      <NewChatDialog
        open={openDialog}
        handleClose={handleClose}
        handleConfirm={() => handleConfirm()}
      />
    </Box>
  );
}
