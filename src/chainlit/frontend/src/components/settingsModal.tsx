import {
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch
} from '@mui/material';
import { useRecoilState } from 'recoil';
import { settingsState } from 'state/settings';
import ExpandIcon from '@mui/icons-material/Expand';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';

export default function SettingsModal() {
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
          <ListItem>
            <ListItemIcon>
              <ExpandIcon />
            </ListItemIcon>
            <ListItemText id="switch-expand-all" primary="Expand Messages" />
            <Switch
              edge="end"
              onChange={() =>
                setSettings((old) => ({ ...old, expandAll: !old.expandAll }))
              }
              checked={settings.expandAll}
              inputProps={{
                'aria-labelledby': 'switch-expand-all'
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <EmojiObjectsIcon />
            </ListItemIcon>
            <ListItemText id="hide-cot" primary="Hide Chain of Thought" />
            <Switch
              edge="end"
              onChange={() =>
                setSettings((old) => ({ ...old, hideCot: !old.hideCot }))
              }
              checked={settings.hideCot}
              inputProps={{
                'aria-labelledby': 'hide-cot'
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <DarkModeOutlined />
            </ListItemIcon>
            <ListItemText id="switch-theme" primary="Dark mode" />
            <Switch
              edge="end"
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
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
}
