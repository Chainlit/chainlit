import { IAction } from '@chainlit/react-client';

import { ActionButton } from './ActionButton';

interface Props {
  actions: IAction[];
}

export default function MessageActions({ actions }: Props) {
  // 分类 actions：全宽（每行一个）和普通（内联）
  const fullWidthActions = actions.filter(a => a.fullWidth);
  const inlineActions = actions.filter(a => !a.fullWidth);

  return (
    <div className="flex flex-col w-full gap-2">
      {/* 内联 actions 组 */}
      {inlineActions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {inlineActions.map((a) => (
            <ActionButton action={a} key={a.id} />
          ))}
        </div>
      )}
      
      {/* 全宽 actions，每行一个 */}
      {fullWidthActions.length > 0 && (
        <div className="flex flex-col w-full space-y-1 mt-1">
          {fullWidthActions.map((a) => (
            <ActionButton action={a} key={a.id} />
          ))}
        </div>
      )}
    </div>
  );
}
