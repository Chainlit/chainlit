import { GreyButton } from 'src/buttons/GreyButton';

import { AttachFile } from '@mui/icons-material';
import { Link } from '@mui/material';

import { IFileElement } from 'src/types/element';

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
