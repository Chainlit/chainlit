import { Info } from '@mui/icons-material';
import { Box, InputLabel, Tooltip } from '@mui/material';

import NotificationCount from 'components/atoms/notificationCount';

type InputLabelProps = {
  id?: string;
  label: string | number;
  tooltip?: string;
  notificationsCount?: number | string;
};

export default function inputLabel({
  id,
  label,
  tooltip,
  notificationsCount
}: InputLabelProps): JSX.Element {
  return (
    <Box display="flex" justifyContent="space-between" width="100%">
      <Box display="flex" gap={0.5} alignItems="center">
        <InputLabel
          htmlFor={id}
          sx={{
            fontWeight: 600,
            fontSize: '12px',
            color: 'grey.500'
          }}
        >
          {label}
        </InputLabel>
        {tooltip ? (
          <Tooltip title={tooltip}>
            <Info sx={{ fontSize: 12, color: 'grey.600' }} />
          </Tooltip>
        ) : null}
      </Box>
      {notificationsCount ? (
        <NotificationCount notificationsCount={notificationsCount} />
      ) : null}
    </Box>
  );
}
