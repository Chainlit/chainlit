import { AttachFile } from '@mui/icons-material';
import { Link } from '@mui/material';

import { IFileElement } from '../types/element';

import { GreyButton } from '../buttons/GreyButton';

const FileElement = ({ element }: { element: IFileElement }) => {
  if (!element.url && !element.content) {
    return null;
  }
  const className = `${element.display}-file`;
  const src = element.url || URL.createObjectURL(new Blob([element.content!]));
  return (
    <GreyButton
      disableElevation
      disableRipple
      sx={{
        textTransform: 'none'
      }}
      color="primary"
      variant="contained"
      className={className}
      startIcon={<AttachFile />}
      href={src}
      LinkComponent={({ ...props }) => (
        <Link download={element.name} {...props} />
      )}
    >
      {element.name}
    </GreyButton>
  );
};

export { FileElement };
