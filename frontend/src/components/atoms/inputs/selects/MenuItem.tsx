import { grey } from 'theme/index';

import MMenuItem, {
  MenuItemProps as MMenuItemProps
} from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

import { NotificationCount } from 'components/molecules/messages/components/NotificationCount';

import { SelectItem } from './SelectInput';

interface MenuItemProps extends MMenuItemProps {
  isDarkMode: boolean;
  item: SelectItem;
  selected: boolean;
  value: string | number;
}

const MenuItem = ({
  item,
  value,
  selected,
  isDarkMode,
  icon,
  ...props
}: MenuItemProps & { icon?: JSX.Element }) => (
  <MMenuItem
    {...props}
    key={value}
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      fontWeight: 500,
      fontSize: '14px',
      color: selected ? 'primary.main' : isDarkMode ? grey[400] : grey[700],
      '&:hover': {
        backgroundColor: isDarkMode ? grey[800] : 'primary.light',
        color: 'primary.main',
        '& .notification-count': {
          backgroundColor: isDarkMode ? grey[850] : 'primary.light',
          color: isDarkMode ? grey[400] : 'primary.main'
        }
      }
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      {item.icon ? item.icon : null}
      <span>{item?.label || item.value}</span>
    </Stack>
    {item.notificationCount ? (
      <NotificationCount count={item.notificationCount} />
    ) : null}
  </MMenuItem>
);

export { MenuItem };
