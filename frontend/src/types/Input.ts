import { NotificationCountProps } from './NotificationCount';

interface IInput {
  className?: string;
  description?: string;
  disabled?: boolean;
  hasError?: boolean;
  id: string;
  label?: string;
  notificationsProps?: NotificationCountProps;
  tooltip?: string;
}

export type { IInput };
