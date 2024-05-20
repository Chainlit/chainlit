import size from 'lodash/size';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Box, Popover } from '@mui/material';

import {
  useChatInteract,
  useChatMessages,
  useChatSession
} from '@chainlit/react-client';

import { SelectInput } from 'components/atoms/inputs';
import { Markdown } from 'components/molecules/Markdown';

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

  if (!chatProfile && size(pSettings?.chatProfiles) > 0) {
    setChatProfile(pSettings?.chatProfiles[0].name);
  }

  if (typeof pSettings === 'undefined' || pSettings.chatProfiles.length <= 1) {
    return null;
  }

  const allowHtml = pSettings?.features?.unsafe_allow_html;
  const latex = pSettings?.features?.latex;

  const popoverOpen = Boolean(anchorEl);

  const items = pSettings.chatProfiles.map((item) => ({
    label: item.name,
    value: item.name,
    icon: item.icon ? (
      <img
        src={item.icon}
        className="chat-profile-icon"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          objectFit: 'cover'
        }}
      />
    ) : undefined
  }));

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
                : '0px 10px 10px 0px #0000000D'
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
      <SelectInput
        value={chatProfile || ''}
        items={items}
        id="chat-profile-selector"
        onItemMouseEnter={(event, itemName) => {
          const item = pSettings.chatProfiles.find(
            (item) => item.name === itemName
          );
          if (!item) return;
          setChatProfileDescription(item.markdown_description);
          setAnchorEl(event.currentTarget);
        }}
        onItemMouseLeave={() => setAnchorEl(null)}
        onChange={(e) => {
          const newValue = e.target.value;
          setNewChatProfile(newValue);
          if (firstInteraction) {
            setOpenDialog(true);
          } else {
            handleConfirm(newValue);
          }
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
