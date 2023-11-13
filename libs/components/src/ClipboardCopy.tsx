import { grey } from 'theme/palette';
import { useCopyToClipboard, useToggle } from 'usehooks-ts';

import CopyAll from '@mui/icons-material/CopyAll';
import { IconProps } from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

interface ClipboardCopyProps {
  value: string;
  theme?: 'dark' | 'light';
  size?: IconProps['fontSize'];
}

const ClipboardCopy = ({
  value,
  size,
  theme
}: ClipboardCopyProps): JSX.Element => {
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
          right: 0,
          top: 0
        }}
        onClick={() => {
          copy(value)
            .then(() => toggleTooltip())
            .catch((err) =>
              console.log('An error occurred while copying: ', err)
            );
        }}
      >
        <CopyAll fontSize={size} />
      </IconButton>
    </Tooltip>
  );
};

export { ClipboardCopy };
