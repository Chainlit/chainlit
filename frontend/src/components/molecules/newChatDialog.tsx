import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { AccentButton, RegularButton } from '@chainlit/components';

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
      <DialogTitle id="alert-dialog-title">{'Create a new chat?'}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          This will clear the current messages and start a new chat.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <RegularButton onClick={handleClose}>Cancel</RegularButton>
        <AccentButton
          id="confirm"
          variant="outlined"
          onClick={handleConfirm}
          autoFocus
        >
          Confirm
        </AccentButton>
      </DialogActions>
    </Dialog>
  );
}
