import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { Translator } from 'components/i18n';

import { projectSettingsState } from 'state/project';

import Readme from './readme';

export default function ReadmeButton() {
  const [open, setOpen] = useState(false);
  const projectSettings = useRecoilValue(projectSettingsState);

  if (!projectSettings?.markdown) {
    return null;
  }

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        id="readme-button"
        onClick={() => setOpen(true)}
        color="inherit"
        sx={{
          textTransform: 'none',
          justifyContent: 'start'
        }}
        startIcon={<HelpOutlineIcon />}
      >
        <Translator path="components.organisms.header.readme" />
      </Button>
      <Dialog
        open={open}
        maxWidth="lg"
        onClose={handleClose}
        scroll="paper"
        aria-labelledby="instructions"
        aria-describedby="how-to-use-this-app"
        PaperProps={{
          sx: {
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle id="instructions-dialog">
          <Translator path="components.organisms.header.readme" />
        </DialogTitle>
        <DialogContent dividers>
          <Readme
            markdown={projectSettings?.markdown}
            allowHtml={projectSettings?.features?.unsafe_allow_html}
            latex={projectSettings?.features?.latex}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
