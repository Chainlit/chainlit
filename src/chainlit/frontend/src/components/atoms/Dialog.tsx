import { ReactElement } from 'react';

import {
  Box,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog as MDialog,
  DialogProps as MDialogProps,
  Theme
} from '@mui/material';
import { grey } from '@mui/material/colors';

type DialogProps = {
  id?: string;
  title?: ReactElement;
  content?: ReactElement;
  actions?: ReactElement;
} & Omit<MDialogProps, 'title'>;

const Dialog = (props: DialogProps): JSX.Element => {
  const { title, content, actions, ...rest } = props;

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
        {title ? <DialogTitle>{title}</DialogTitle> : null}
        {content ? <DialogContent>{content}</DialogContent> : null}
        {actions ? (
          <DialogActions
            sx={{ padding: (theme: Theme) => theme.spacing(0, 3, 2) }}
          >
            {actions}
          </DialogActions>
        ) : null}
      </Box>
    </MDialog>
  );
};

export default Dialog;
