import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Link } from '@mui/material';

import { IFileElement } from 'state/element';

import GreyButton from '../buttons/greyButton';

interface Props {
  element: IFileElement;
}

export default function FileElement({ element }: Props) {
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
      startIcon={<AttachFileIcon />}
      href={src}
      LinkComponent={({ ...props }) => (
        <Link download={element.name} {...props} />
      )}
    >
      {element.name}
    </GreyButton>
  );
}
