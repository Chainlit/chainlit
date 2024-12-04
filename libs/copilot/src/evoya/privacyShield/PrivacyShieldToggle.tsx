import { Switch, FormControlLabel, Box, IconButton, Tooltip,  Menu, MenuItem } from '@mui/material';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Translator } from '@chainlit/app/src/components/i18n';
import useMediaQuery from '@mui/material/useMediaQuery';

import {useState } from 'react';

import { usePrivacyShield } from './usePrivacyShield';

const PrivacyShieldToggle = (): JSX.Element => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isSmallScreen = useMediaQuery('(max-width: 1199px)');
  
  const {
    enabled,
    setEnabled,
    enabledVisual,
    setEnabledVisual,
    sections,
  } = usePrivacyShield();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <FormControlLabel
         control={
          !isSmallScreen ? (
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              name="privacy_shield"
            />
          ) : (
            <Box sx={{ display: 'none' }} /> 
          )
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center',color:'gray.main', marginRight: isSmallScreen ? 1:0 }}>
            {
              isSmallScreen ? (
                <>
              <IconButton
                aria-label="privacy-shield-menu"
                onClick={handleMenuOpen}
              >
                {enabled ? (
                  <LockOutlinedIcon sx={{ width: 20, height: 20, color:'primary.main' }} />
                ) : (
                  <LockOpenOutlinedIcon sx={{ width: 20, height: 20 }} />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleMenuClose}>
                  <Switch
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    name="privacy_shield"
                    size="small"
                    />
                    Privacy Shield
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <Switch
                    checked={enabledVisual}
                    onChange={() => setEnabledVisual(!enabledVisual)}
                    name="view"
                    size="small"
                    disabled={sections.length === 0}
                    />
                    View
                </MenuItem>
              </Menu>
            </>
              ):(
                <>
                {enabled ? <LockOutlinedIcon sx={{marginRight: 1,width: 20, height: 20 }} /> : <LockOpenOutlinedIcon sx={{marginRight: 1, width: 20, height: 20}} />}
                Privacy Shield
                </>
              )
            }
          </Box>
        }
        labelPlacement="start"
      />
      {!isSmallScreen &&<Box sx={{ margin: '0 !important'}}>
        <Tooltip
          title={enabledVisual ? <Translator path="components.organisms.privacyShield.hidePrivacyTable" /> : <Translator path="components.organisms.privacyShield.showPrivacyTable" />}
        >
          <IconButton edge="end" id="favorite-session-button" onClick={() => setEnabledVisual(!enabledVisual)} disabled={sections.length === 0}>
            {enabledVisual ? (<VisibilityOffIcon sx={{width: 20, height: 20,color:'gray.main' }} />) : (<VisibilityIcon sx={{width: 20, height: 20,color:'gray.main' }} />)}
          </IconButton>
        </Tooltip>
      </Box>}
    </>
  );
}

export default PrivacyShieldToggle;