import { useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

import ContentPaste from '@mui/icons-material/ContentPaste';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

interface ClipboardCopyProps {
  value: string;
  theme?: 'dark' | 'light';
  edge?: IconButtonProps['edge'];
}

const ClipboardCopy = ({ value, edge }: ClipboardCopyProps): JSX.Element => {
  const [isCopied, setIsCopied] = useState(false);
  const [_, copy] = useCopyToClipboard();

  const handleCopy = () => {
    copy(value)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => console.log('An error occurred while copying: ', err));
  };

  const handleTooltipClose = () => {
    setIsCopied(false);
  };

  return (
    <Tooltip
      title={isCopied ? 'Copied to clipboard!' : 'Copy'}
      onClose={handleTooltipClose}
      sx={{ zIndex: 2 }}
    >
      <IconButton color="inherit" edge={edge} onClick={handleCopy}>
        <ContentPaste sx={{ height: 16, width: 16 }} />
      </IconButton>
    </Tooltip>
  );
};

export { ClipboardCopy };
