import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Refresh } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useClearChat from "hooks/clearChat";

export default function ClearChatButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const clearChat = useClearChat();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    clearChat();
    navigate("/");
    handleClose();
  };

  return (
    <div>
      <Tooltip title="Clear messages">
        <span>
          <IconButton edge="end" onClick={handleClickOpen}>
            <Refresh />
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
