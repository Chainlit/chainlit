import { cn } from '@/lib/utils';
import { useRecoilState, useRecoilValue } from 'recoil';

import { IToggleCommand, toggleCommandsState } from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { IToggleable, toggleableStates } from '@/state/chat';

interface Props {
  disabled?: boolean;
}

export const ToggleableButtons = ({ disabled = false }: Props) => {
  const toggleCommands = useRecoilValue(toggleCommandsState);
  const [toggleables, setToggleables] = useRecoilState(toggleableStates);
  
  if (!toggleCommands.length) return null;
  
  const handleToggle = (command: IToggleCommand) => {
    // 查找该命令在toggleables中是否存在
    const index = toggleables.findIndex(t => t.id === command.id);
    
    if (index === -1) {
      // 不存在则添加，默认为激活状态
      setToggleables([...toggleables, { 
        id: command.id, 
        active: true,
        persistent: command.persistent
      }]);
    } else {
      // 存在则切换状态
      const newToggleables = [...toggleables];
      newToggleables[index] = { 
        ...newToggleables[index], 
        active: !newToggleables[index].active 
      };
      setToggleables(newToggleables);
    }
  };
  
  // 获取命令的当前激活状态
  const isActive = (commandId: string): boolean => {
    const toggleable = toggleables.find(t => t.id === commandId);
    return toggleable ? toggleable.active : false;
  };

  return (
    <div className="flex gap-2 ml-1 flex-wrap">
      <TooltipProvider>
        {toggleCommands.map((command) => (
          <Tooltip key={command.id}>
            <TooltipTrigger asChild>
              <Button
                id={`toggleable-${command.id}`}
                variant="ghost"
                disabled={disabled}
                className={cn(
                  'p-2 h-9 text-[13px] font-medium rounded-full',
                  isActive(command.id) &&
                    'border-transparent text-[#08f] hover:text-[#08f] bg-[#DAEEFF] hover:bg-[#BDDCF4] dark:bg-[#2A4A6D] dark:text-[#48AAFF] dark:hover:bg-[#1A416A]'
                )}
                onClick={() => handleToggle(command)}
              >
                <Icon name={command.icon} className="!h-5 !w-5" />
                {command.id}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{command.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default ToggleableButtons; 