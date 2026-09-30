import { useConfig } from '@chainlit/react-client';

interface Props {
  createdAt: number | string;
}

function MessageTimestamp({ createdAt }: Props) {
  const { config } = useConfig();

  if (!config?.ui?.show_message_timestamps) {
    return null;
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return (
    <time
      className="text-xs text-muted-foreground"
      dateTime={date.toISOString()}
      aria-label={date.toLocaleString()}
    >
      {date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      })}
    </time>
  );
}

export { MessageTimestamp };
