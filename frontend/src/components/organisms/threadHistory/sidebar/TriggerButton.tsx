import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

interface TriggerButtonProps {
  onClick: () => void;
  open: boolean;
}
const commonBoxStyles = {
  height: '0.75rem',
  width: '0.25rem',
  backgroundColor: 'text.primary',
  borderRadius: '20px',
  transition: 'transform 0.3s ease'
};

const TriggerButton = ({ onClick, open }: TriggerButtonProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Tooltip
      title={
        open
          ? t(
              'components.organisms.threadHistory.sidebar.TriggerButton.closeSidebar'
            )
          : t(
              'components.organisms.threadHistory.sidebar.TriggerButton.openSidebar'
            )
      }
      placement="right"
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 2,
          '&:hover div:nth-child(1)': {
            transform: open ? 'rotate(15deg)' : 'rotate(-15deg)'
          },
          '&:hover div:nth-child(2)': {
            transform: open ? 'rotate(-15deg)' : 'rotate(15deg)'
          }
        }}
        onClick={onClick}
      >
        <Box sx={{ ...commonBoxStyles, marginTop: '0.25rem' }} />
        <Box sx={{ ...commonBoxStyles, marginTop: '-0.25rem' }} />
      </Box>
    </Tooltip>
  );
};

export default TriggerButton;
