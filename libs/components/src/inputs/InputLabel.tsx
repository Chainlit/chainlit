import { NotificationCount } from 'src/NotificationCount';

import Info from '@mui/icons-material/Info';
import Box from '@mui/material/Box';
import MInputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';

import { NotificationCountProps } from 'src/types/NotificationCount';

type InputLabelProps = {
  id?: string;
  label: string | number;
  tooltip?: string;
  notificationsProps?: NotificationCountProps;
};

const InputLabel = ({
  id,
  label,
  tooltip,
  notificationsProps
}: InputLabelProps): JSX.Element => {
  return (
    <Box display="flex" justifyContent="space-between" width="100%">
      <Box display="flex" gap={0.5} alignItems="center">
        <MInputLabel
          htmlFor={id}
          sx={{
            fontWeight: 600,
            fontSize: '12px',
            color: 'grey.500'
          }}
        >
          {label}
        </MInputLabel>
        {tooltip ? (
          <Tooltip title={tooltip}>
            <Info sx={{ fontSize: 12, color: 'grey.600' }} />
          </Tooltip>
        ) : null}
      </Box>
      {notificationsProps ? (
        <NotificationCount {...notificationsProps} />
      ) : null}
    </Box>
  );
};

export { InputLabel };
