import { AttachFile } from '@mui/icons-material';
import { Link } from '@mui/material';

import { IFileElement } from '../types/element';

import { GreyButton } from '../buttons/GreyButton';

const FileElement = ({ element }: { element: IFileElement }) => {
  if (!element.url && !element.content) {
    return null;
  }

  return (
    <GreyButton
      disableElevation
      disableRipple
      sx={{
        textTransform: 'none'
      }}
      color="primary"
      variant="contained"
      className={`${element.display}-file`}
      startIcon={<AttachFile />}
      href={element.url || URL.createObjectURL(new Blob([element.content!]))}
      LinkComponent={({ ...props }) => (
        <Link download={element.name} {...props} />
      )}
    >
      {element.name}
    </GreyButton>
  );
};

export { FileElement };
