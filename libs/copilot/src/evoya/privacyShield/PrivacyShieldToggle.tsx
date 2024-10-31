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
          <Box sx={{ display: 'flex', alignItems: 'center',color:'gray.main',marginRight: 1 }}>
            {enabled ? <LockOutlinedIcon sx={{marginRight: 1,width: 20, height: 20 }} /> : <LockOpenOutlinedIcon sx={{marginRight: 1, width: 20, height: 20}} />}
            Privacy Shield
          </Box>
        }
        labelPlacement="start"
      />
      <Box sx={{ margin: '0 !important'}}>
        <Tooltip
          title={enabledVisual ? <Translator path="components.organisms.privacyShield.hidePrivacyTable" /> : <Translator path="components.organisms.privacyShield.showPrivacyTable" />}
        >
          <IconButton edge="end" id="favorite-session-button" onClick={() => setEnabledVisual(!enabledVisual)} disabled={sections.length === 0}>
            {enabledVisual ? (<VisibilityOffIcon sx={{width: 20, height: 20,color:'gray.main' }} />) : (<VisibilityIcon sx={{width: 20, height: 20,color:'gray.main' }} />)}
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}

export default PrivacyShieldToggle;