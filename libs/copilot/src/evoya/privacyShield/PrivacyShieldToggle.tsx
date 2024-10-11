import { Switch, FormControlLabel, Box, IconButton, Tooltip } from '@mui/material';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Translator } from '@chainlit/app/src/components/i18n';

import { usePrivacyShield } from './usePrivacyShield';

const PrivacyShieldToggle = (): JSX.Element => {
  const {
    enabled,
    setEnabled,
    enabledVisual,
    setEnabledVisual,
    sections,
  } = usePrivacyShield();

  return (
    <>
      <FormControlLabel
        control={
          <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} name="privacy_shield" />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {enabled ? <LockOutlinedIcon sx={{marginRight: 1}} /> : <LockOpenOutlinedIcon sx={{marginRight: 1}} />}
            Privacy Shield
          </Box>
        }
        labelPlacement="start"
      />
      <Box>
        <Tooltip
          title={enabledVisual ? <Translator path="components.organisms.privacyShield.hidePrivacyTable" /> : <Translator path="components.organisms.privacyShield.showPrivacyTable" />}
        >
          <IconButton edge="end" id="favorite-session-button" onClick={() => setEnabledVisual(!enabledVisual)} disabled={sections.length === 0}>
            {enabledVisual ? (<VisibilityOffIcon sx={{ width: 20, height: 20 }} />) : (<VisibilityIcon sx={{ width: 20, height: 20 }} />)}
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}

export default PrivacyShieldToggle;