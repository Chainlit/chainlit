import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { AccentButton, RegularButton } from '@chainlit/react-components';

import { Translator } from 'components/i18n';

type Props = {
  open: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
};

export default function NewChatDialog({
  open,
  handleClose,
  handleConfirm
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      id="new-chat-dialog"
      PaperProps={{
        sx: {
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle id="alert-dialog-title">
        {<Translator path="components.molecules.newChatDialog.createNewChat" />}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <Translator path="components.molecules.newChatDialog.clearChat" />
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <RegularButton onClick={handleClose}>
          <Translator path="components.molecules.newChatDialog.cancel" />
        </RegularButton>
        <AccentButton
          id="confirm"
          variant="outlined"
          onClick={handleConfirm}
          autoFocus
        >
          <Translator path="components.molecules.newChatDialog.confirm" />
        </AccentButton>
      </DialogActions>
    </Dialog>
  );
}
