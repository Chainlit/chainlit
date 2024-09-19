import size from 'lodash/size';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, Popover } from '@mui/material';

import {
  ChainlitContext,
  useChatInteract,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import { SelectInput } from 'components/atoms/inputs';
import { Markdown } from 'components/molecules/Markdown';

import NewChatDialog from './newChatDialog';

export default function ChatProfiles() {
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const { chatProfile, setChatProfile } = useChatSession();
  const { firstInteraction } = useChatMessages();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [chatProfileDescription, setChatProfileDescription] = useState('');
  const { clear } = useChatInteract();
  const [newChatProfile, setNewChatProfile] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setOpenDialog(false);
    setNewChatProfile(null);
    navigate('/');
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

  if (!chatProfile && size(config?.chatProfiles) > 0) {
    setChatProfile(config?.chatProfiles[0].name);
  }

  if (typeof config === 'undefined' || config.chatProfiles.length <= 1) {
    return null;
  }

  const allowHtml = config?.features?.unsafe_allow_html;
  const latex = config?.features?.latex;

  const items = config.chatProfiles.map((item) => {
    const icon = item.icon?.includes('/public')
      ? apiClient.buildEndpoint(item.icon)
      : item.icon;
    return {
      label: item.name,
      value: item.name,
      icon: icon ? (
        <img
          src={icon}
          className="chat-profile-icon"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : undefined
    };
  });

  return (
    <>
      <Popover
        id="chat-profile-description"
        anchorEl={anchorEl}
        open={popoverOpen}
        PaperProps={{
          sx: {
            boxShadow: (theme) =>
              theme.palette.mode === 'light'
                ? '0px 2px 4px 0px #0000000D'
                : '0px 10px 10px 0px #0000000D',
            ml: 2,
            pointerEvents: 'auto' // Allow mouse interaction with the chat profile description
          }
        }}
        sx={{
          pointerEvents: 'none',
          marginTop: 1.5
        }}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left'
        }}
        disableRestoreFocus
        onMouseEnter={() => setPopoverOpen(true)}
        onMouseLeave={() => {
          setPopoverOpen(false);
          setAnchorEl(null);
        }}
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
      <SelectInput
        value={chatProfile || ''}
        items={items}
        id="chat-profile-selector"
        onItemMouseEnter={(event, itemName) => {
          const item = config.chatProfiles.find(
            (item) => item.name === itemName
          );
          if (!item) return;
          setChatProfileDescription(item.markdown_description);
          setAnchorEl(event.currentTarget);
          setPopoverOpen(true);
        }}
        onItemMouseLeave={() => setPopoverOpen(false)}
        onChange={(e) => {
          const newValue = e.target.value;

          // Close the chat profile description when any selection is made
          setPopoverOpen(false);
          setAnchorEl(null);

          // Handle user selection
          setNewChatProfile(newValue);
          if (firstInteraction) {
            setOpenDialog(true);
          } else {
            handleConfirm(newValue);
          }
        }}
        onClose={() => {
          setPopoverOpen(false);
          setAnchorEl(null);
        }}
      />
      <NewChatDialog
        open={openDialog}
        handleClose={handleClose}
        handleConfirm={() => handleConfirm()}
      />
    </>
  );
}
