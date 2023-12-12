import { apiClient } from 'api';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import DeleteOutline from '@mui/icons-material/DeleteOutline';
import LoadingButton from '@mui/lab/LoadingButton';
import { IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { ClientError, accessTokenState } from '@chainlit/react-client';

interface Props {
  threadId: string;
  onDelete: () => void;
}

const DeleteThreadButton = ({ threadId, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const accessToken = useRecoilValue(accessTokenState);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    toast.promise(apiClient.deleteThread(threadId, accessToken), {
      loading: 'Deleting chat',
      success: () => {
        onDelete();
        return 'Chat deleted!';
      },
      error: (err) => {
        if (err instanceof ClientError) {
          return <span>{err.message}</span>;
        } else {
          return <span></span>;
        }
      }
    });
    handleClose();
  };

  return (
    <div>
      <IconButton size="small" onClick={handleClickOpen} sx={{ p: '2px' }}>
        <DeleteOutline sx={{ width: 16, height: 16 }} />
      </IconButton>
      {open && (
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: {
              backgroundImage: 'none'
            }
          }}
        >
          <DialogTitle id="alert-dialog-title">{'Delete Thread?'}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              This will delete the thread as well as it's messages and elements.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ color: 'text.secondary', p: 2 }}>
            <Button variant="outlined" color="inherit" onClick={handleClose}>
              Cancel
            </Button>
            <LoadingButton
              variant="outlined"
              color="primary"
              onClick={handleConfirm}
              autoFocus
            >
              Confirm
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export { DeleteThreadButton };
