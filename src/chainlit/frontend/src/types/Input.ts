import { SxProps } from '@mui/material';

interface IInput {
  className?: string;
  description?: string;
  disabled?: boolean;
  hasError?: boolean;
  id: string;
  label?: string;
  notificationsCount?: number | string;
  size?: 'small' | 'medium';
  sx?: SxProps;
  tooltip?: string;
}

export type { IInput };
