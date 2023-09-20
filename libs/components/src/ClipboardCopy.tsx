import { grey } from 'theme/palette';
import { useCopyToClipboard, useToggle } from 'usehooks-ts';

import CopyAll from '@mui/icons-material/CopyAll';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

interface ClipboardCopyProps {
  value: string;
  theme?: 'dark' | 'light';
}

const ClipboardCopy = ({ value, theme }: ClipboardCopyProps): JSX.Element => {
  const [showTooltip, toggleTooltip] = useToggle();
  const isDarkMode = useIsDarkMode();
  const [_, copy] = useCopyToClipboard();

  const getColor = () => {
    if (theme) {
      if (theme === 'dark') return grey[200];
      else if (theme === 'light') return grey[800];
    }

    return isDarkMode ? grey[200] : grey[800];
  };

  return (
    <Tooltip
      open={showTooltip}
      title={'Copied to clipboard!'}
      onClose={toggleTooltip}
      sx={{ zIndex: 2 }}
    >
      <IconButton
        sx={{
          color: getColor(),
          position: 'absolute',
          right: 4,
          top: 4
        }}
        onClick={() => {
          copy(value)
            .then(() => toggleTooltip())
            .catch((err) =>
              console.log('An error occurred while copying: ', err)
            );
        }}
      >
        <CopyAll />
      </IconButton>
    </Tooltip>
  );
};

export { ClipboardCopy };
