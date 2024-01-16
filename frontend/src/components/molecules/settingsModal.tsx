import { useRecoilState, useRecoilValue } from 'recoil';

import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ExpandIcon from '@mui/icons-material/Expand';
import {
  Box,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader
} from '@mui/material';

import { SwitchInput } from '@chainlit/react-components';

import { Translator } from 'components/i18n';

import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

export default function SettingsModal() {
  const projectSettings = useRecoilValue(projectSettingsState);
  const [settings, setSettings] = useRecoilState(settingsState);

  return (
    <Dialog
      open={settings.open}
      onClose={() => setSettings((old) => ({ ...old, open: false }))}
      id="settings-dialog"
      PaperProps={{
        sx: {
          backgroundImage: 'none'
        }
      }}
    >
      <DialogContent>
        <List
          sx={{ width: '100%', maxWidth: 360 }}
          subheader={<ListSubheader>Settings</ListSubheader>}
        >
          <ListItem sx={{ display: 'flex', gap: 2 }}>
            <ListItemIcon>
              <ExpandIcon />
            </ListItemIcon>
            <ListItemText
              id="list-expand-all"
              primary={
                <Translator path="components.molecules.settingsModal.expandMessages" />
              }
            />
            <Box>
              <SwitchInput
                id="switch-expand-all"
                onChange={() =>
                  setSettings((old) => ({ ...old, expandAll: !old.expandAll }))
                }
                checked={settings.expandAll}
                inputProps={{
                  'aria-labelledby': 'switch-expand-all'
                }}
              />
            </Box>
          </ListItem>
          {projectSettings?.ui.hide_cot ? null : (
            <ListItem sx={{ display: 'flex', gap: 2 }}>
              <ListItemIcon>
                <EmojiObjectsIcon />
              </ListItemIcon>
              <ListItemText
                id="hide-cot"
                primary={
                  <Translator path="components.molecules.settingsModal.hideChainOfThought" />
                }
              />
              <Box>
                <SwitchInput
                  id="switch-hide-cot"
                  onChange={() =>
                    setSettings((old) => ({ ...old, hideCot: !old.hideCot }))
                  }
                  checked={settings.hideCot}
                  inputProps={{
                    'aria-labelledby': 'hide-cot'
                  }}
                />
              </Box>
            </ListItem>
          )}
          <ListItem sx={{ display: 'flex', gap: 2 }}>
            <ListItemIcon>
              <DarkModeOutlined />
            </ListItemIcon>
            <ListItemText
              id="switch-theme"
              primary={
                <Translator path="components.molecules.settingsModal.darkMode" />
              }
            />
            <Box>
              <SwitchInput
                id="switch-theme"
                onChange={() => {
                  const variant = settings.theme === 'light' ? 'dark' : 'light';
                  localStorage.setItem('themeVariant', variant);
                  setSettings((old) => ({ ...old, theme: variant }));
                }}
                checked={settings.theme === 'dark'}
                inputProps={{
                  'aria-labelledby': 'switch-theme'
                }}
              />
            </Box>
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
}
