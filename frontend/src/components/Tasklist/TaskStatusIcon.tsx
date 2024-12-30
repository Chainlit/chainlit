import { Check, Dot, X } from 'lucide-react';

import { Loader } from '@/components/Loader';

import type { ITask } from './Task';

export const TaskStatusIcon = ({ status }: { status: ITask['status'] }) => {
  if (status === 'running') {
    return <Loader className="!size-5" />;
  }

  return (
    <>
      {status === 'done' && (
        <Check className="!size-4 text-green-500 mt-[1px]" />
      )}
      {status === 'ready' && <Dot className="!size-4 mt-[1px]" />}
      {status === 'failed' && <X className="!size-4 text-red-500 mt-[1px]" />}
    </>
  );
};
