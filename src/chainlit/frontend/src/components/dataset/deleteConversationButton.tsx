import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { IconButton, Tooltip } from "@mui/material";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { getErrorMessage } from "helpers/apollo";
import LoadingButton from "@mui/lab/LoadingButton";

const DeleteConversationMutation = gql`
  mutation ($id: ID!) {
    deleteConversation(id: $id) {
      id
    }
  }
`;

interface Props {
  conversationId: string;
  onDelete: () => void;
}

export default function DeleteConversationButton({
  conversationId,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const [deleteConversation, { loading }] = useMutation(
    DeleteConversationMutation
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    try {
      await toast.promise(
        deleteConversation({ variables: { id: conversationId } }),
        {
          loading: "Deleting conversation...",
          success: "Conversation deleted!",
          error: (err) => {
            return <span>{getErrorMessage(err)}</span>;
          },
        }
      );
      onDelete();
      handleClose();
    } catch (err) {}
  };

  return (
    <div>
      {/* <Tooltip title="Delete conversation">
        <span> */}
          <IconButton size="small" color="error" onClick={handleClickOpen}>
            <DeleteOutline />
          </IconButton>
        {/* </span>
      </Tooltip> */}
      {open &&
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete conversation?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This will delete the conversation as well as it's messages and
            documents.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Disagree</Button>
          <LoadingButton loading={loading} onClick={handleConfirm} autoFocus>
            Agree
          </LoadingButton>
        </DialogActions>
      </Dialog>}
    </div>
  );
}
