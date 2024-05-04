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

import { Translator } from 'components/i18n';

import { apiClientState } from 'state/apiClient';

interface Props {
  threadId: string;
  onDelete: () => void;
}

const DeleteThreadButton = ({ threadId, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const accessToken = useRecoilValue(accessTokenState);
  const apiClient = useRecoilValue(apiClientState);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    toast.promise(apiClient.deleteThread(threadId, accessToken), {
      loading: (
        <Translator path="components.organisms.threadHistory.sidebar.DeleteThreadButton.deletingChat" />
      ),
      success: () => {
        onDelete();
        return (
          <Translator path="components.organisms.threadHistory.sidebar.DeleteThreadButton.chatDeleted" />
        );
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
              <Translator path="components.organisms.threadHistory.sidebar.DeleteThreadButton.confirmMessage" />
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ color: 'text.secondary', p: 2 }}>
            <Button variant="outlined" color="inherit" onClick={handleClose}>
              <Translator path="components.organisms.threadHistory.sidebar.DeleteThreadButton.cancel" />
            </Button>
            <LoadingButton
              variant="outlined"
              color="primary"
              onClick={handleConfirm}
              autoFocus
            >
              <Translator path="components.organisms.threadHistory.sidebar.DeleteThreadButton.confirm" />
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export { DeleteThreadButton };
