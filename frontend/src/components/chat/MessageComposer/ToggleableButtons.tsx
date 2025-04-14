import { cn } from '@/lib/utils';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useEffect } from 'react';

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
  
  // 添加useEffect以监听toggleables的变化
  useEffect(() => {
    console.log("ToggleableButtons: toggleables状态变化:", toggleables);
    
    // 重新渲染每个按钮以确保UI状态一致
    toggleCommands.forEach(cmd => {
      const isToggleActive = toggleables.some(t => t.id === cmd.id && t.active);
      console.log(`Toggle命令 ${cmd.id} 激活状态更新为:`, isToggleActive);
    });
  }, [toggleables, toggleCommands]);
  
  if (!toggleCommands.length) return null;
  
  const handleToggle = (command: IToggleCommand) => {
    // 查找该命令在toggleables中是否存在
    const index = toggleables.findIndex(t => t.id === command.id);
    
    if (index === -1) {
      // 不存在则添加，默认为激活状态
      const newToggleables = [...toggleables, { 
        id: command.id, 
        active: true,
        persistent: command.persistent
      }];
      console.log("添加新的toggle:", newToggleables);
      setToggleables(newToggleables);
    } else {
      // 存在则切换状态
      const newToggleables = [...toggleables];
      newToggleables[index] = { 
        ...newToggleables[index], 
        active: !newToggleables[index].active 
      };
      console.log("切换toggle状态:", newToggleables);
      setToggleables(newToggleables);
    }
  };
  
  // 获取命令的当前激活状态
  const isActive = (commandId: string): boolean => {
    const toggleable = toggleables.find(t => t.id === commandId);
    return toggleable ? toggleable.active : false;
  };

  // DEBUG: 添加控制台日志以查看toggleables状态
  console.log("ToggleableButtons渲染时的toggleables状态:", toggleables);

  return (
    <div className="flex gap-2 ml-1 flex-wrap">
      <TooltipProvider>
        {toggleCommands.map((command) => {
          const active = isActive(command.id);
          // DEBUG: 输出每个命令的状态
          console.log(`Toggle命令 ${command.id} 激活状态:`, active);
          
          return (
            <Tooltip key={command.id}>
              <TooltipTrigger asChild>
                <Button
                  id={`toggleable-${command.id}`}
                  variant="ghost"
                  disabled={disabled}
                  className={cn(
                    'p-2 h-9 text-[13px] font-medium rounded-full',
                    active &&
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
          );
        })}
      </TooltipProvider>
    </div>
  );
};

export default ToggleableButtons; 