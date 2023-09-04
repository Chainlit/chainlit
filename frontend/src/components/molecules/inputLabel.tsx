import Info from '@mui/icons-material/Info';
import { Box, InputLabel, Tooltip } from '@mui/material';

import NotificationCount, {
  NotificationCountProps
} from 'components/atoms/notificationCount';

type InputLabelProps = {
  id?: string;
  label: string | number;
  tooltip?: string;
  notificationsProps?: NotificationCountProps;
};

export default function inputLabel({
  id,
  label,
  tooltip,
  notificationsProps
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
      {notificationsProps ? (
        <NotificationCount {...notificationsProps} />
      ) : null}
    </Box>
  );
}
