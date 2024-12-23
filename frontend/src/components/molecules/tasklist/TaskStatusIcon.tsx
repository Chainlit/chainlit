import { Loader } from '@/components/Loader';
import type { ITask } from './Task';

export const TaskStatusIcon = ({ status }: { status: ITask['status'] }) => {
  if (status === 'running') {
    return <Loader />
  }

  return (
    <>
      {status === 'done' && (
        <>
          <circle cx={12} cy={12} r={9} className='fill-green-500' />
          <path
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="m15.333 9.5-4.583 4.583L8.667 12"
          />
        </>
      )}
      {status === 'ready' && (
        <circle cx={12} cy={12} r={8.25} className="stoke-gray-500" strokeWidth={1.5} />
      )}
      {status === 'failed' && (
        <>
          <circle cx={12} cy={12} r={9} className="fill-red-500" />
          <path
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="m14.5 9.5-5 5m0-5 5 5"
          />
        </>
      )}
      </>
  );
};
