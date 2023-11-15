import { ReactNode } from 'react';

import Box from '@mui/material/Box';
import MDialog, { DialogProps as MDialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import grey from '@mui/material/colors/grey';

type DialogProps = {
  actions?: ReactNode;
  content?: ReactNode;
  title?: ReactNode;
} & Omit<MDialogProps, 'content' | 'title'>;

const Dialog = ({ actions, content, title, ...rest }: DialogProps) => {
  return (
    <MDialog
      {...rest}
      fullWidth
      sx={{
        border: (theme) =>
          theme.palette.mode === 'dark' ? `1px solid ${grey[800]}` : null,
        borderRadius: 1
      }}
    >
      <Box bgcolor="background.paper">
        {title ? (
          <DialogTitle>
            <>{title}</>
          </DialogTitle>
        ) : null}

        {content ? <DialogContent>{content}</DialogContent> : null}

        {actions ? (
          <DialogActions sx={{ padding: (theme) => theme.spacing(0, 3, 2) }}>
            <>{actions}</>
          </DialogActions>
        ) : null}
      </Box>
    </MDialog>
  );
};

export default Dialog;
