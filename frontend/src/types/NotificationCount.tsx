export type NotificationCountProps = {
  count?: number | string;
  inputProps?: {
    id: string;
    max?: number;
    min?: number;
    onChange: (event: any) => void;
    step?: number;
  };
};
