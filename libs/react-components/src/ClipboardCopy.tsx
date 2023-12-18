import { useCopyToClipboard, useToggle } from 'usehooks-ts';

import ContentPaste from '@mui/icons-material/ContentPaste';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

interface ClipboardCopyProps {
  value: string;
  theme?: 'dark' | 'light';
  edge?: IconButtonProps['edge'];
}

const ClipboardCopy = ({ value, edge }: ClipboardCopyProps): JSX.Element => {
  const [showTooltip, toggleTooltip] = useToggle();
  const [_, copy] = useCopyToClipboard();

  return (
    <Tooltip
      open={showTooltip}
      title={'Copied to clipboard!'}
      onClose={toggleTooltip}
      sx={{ zIndex: 2 }}
    >
      <IconButton
        color="inherit"
        edge={edge}
        onClick={() => {
          copy(value)
            .then(() => toggleTooltip())
            .catch((err) =>
              console.log('An error occurred while copying: ', err)
            );
        }}
      >
        <ContentPaste sx={{ height: 16, width: 16 }} />
      </IconButton>
    </Tooltip>
  );
};

export { ClipboardCopy };
