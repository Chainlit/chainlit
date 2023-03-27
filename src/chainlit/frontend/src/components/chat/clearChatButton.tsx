import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  documentSideViewState,
  documentsState,
  messagesState,
} from "state/chat";
import { DeleteOutline } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useState } from "react";

export default function ClearChatButton() {
  const [open, setOpen] = useState(false);
  const messages = useRecoilValue(messagesState);
  const setMessages = useSetRecoilState(messagesState);
  const setDocuments = useSetRecoilState(documentsState);
  const setSideView = useSetRecoilState(documentSideViewState);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    window.socket?.disconnect();
    window.socket?.connect();
    setMessages([]);
    setDocuments({});
    setSideView(undefined);
    handleClose();
  };

  return (
    <div>
      <Tooltip title="Clear messages">
        <span>
          <IconButton
            disabled={messages.length === 0}
            edge="end"
            onClick={handleClickOpen}
          >
            <DeleteOutline />
          </IconButton>
        </span>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Clear messages?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This will clear the current messages and start a new conversation.
            The messages will still be available in the history.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Disagree</Button>
          <Button onClick={handleConfirm} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
