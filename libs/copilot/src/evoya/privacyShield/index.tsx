import {
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Telegram from '@mui/icons-material/Telegram';

import { usePrivacyShield } from './usePrivacyShield';
import TextSections from './TextSections';

import { Translator } from '@chainlit/app/src/components/i18n';

interface Props {
  submit: (text: string) => void;
}

const PrivacyShieldOverlay = ({ submit }: Props): JSX.Element => {
  const {
    open,
    loading,
    setOpen,
    anonText,
    lockSections,
    resetSections,
  } = usePrivacyShield();

  if (!open) {
    return (<></>);
  }

  const cancelAction = () => {
    resetSections();
    setOpen(false);
  }

  const submitAction = () => {
    submit(anonText);
    setOpen(false);
    lockSections();
  }

  return (
    <Box 
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        padding: 2,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            padding: 2,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LockOutlined />
          <Box sx={{marginLeft: 1, fontWeight: 'bold'}}>Privacy Shield</Box>
        </Box>
        <Box
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.palette.background.default,
            overflow: 'hidden'
          })}
        >
          {loading &&
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
              <CircularProgress />
            </Box>
          }
          {!loading && 
            <TextSections />
          }
        </Box>
        <Box
          sx={{
            padding: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2
          }}
        >
          <Button variant="outlined" onClick={cancelAction}>
            <Translator path="components.organisms.privacyShield.actions.cancel" />
          </Button>
          <Button variant="contained" endIcon={<Telegram />} onClick={submitAction}>
            <Translator path="components.organisms.privacyShield.actions.submit" />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default PrivacyShieldOverlay;