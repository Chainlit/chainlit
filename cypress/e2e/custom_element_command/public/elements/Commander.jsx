import { Button } from '@/components/ui/button';

export default function Commander() {
  return (
    <div id="custom-commander" className="mt-4 flex flex-col gap-2">
      <Button
        id="send"
        onClick={() =>
          sendUserMessage('Hello from custom element', 'my_command')
        }
      >
        {' '}
        Send with command
      </Button>
    </div>
  );
}
