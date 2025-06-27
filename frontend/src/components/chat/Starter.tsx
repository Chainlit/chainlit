import { useCallback, useContext } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import {
  ChainlitContext,
  IStarter,
  IStep,
  useAuth,
  useChatData,
  useChatInteract,
  commandsState,
  toggleCommandsState
} from '@chainlit/react-client';

import Icon from '@/components/Icon';
import { Button } from '@/components/ui/button';

import { IToggleable, persistentCommandState, toggleableStates } from '@/state/chat';

interface StarterProps {
  starter: IStarter;
}

export default function Starter({ starter }: StarterProps) {
  const apiClient = useContext(ChainlitContext);
  const [selectedCommand, setSelectedCommand] = useRecoilState(persistentCommandState);
  const [toggleables, setToggleables] = useRecoilState(toggleableStates);
  const { sendMessage } = useChatInteract();
  const { loading, connected } = useChatData();
  const { user } = useAuth();
  const commands = useRecoilValue(commandsState);
  const toggleCommands = useRecoilValue(toggleCommandsState);

  const disabled = loading || !connected;

  const onSubmit = useCallback(async () => {
    console.log("点击Starter，当前toggle状态:", toggleables);
    
    // 处理命令激活
    if (starter.commands && starter.commands.length > 0) {
      const commandToActivate = commands.find(cmd => cmd.id === starter.commands![0]);
      if (commandToActivate) {
        setSelectedCommand(commandToActivate);
      }
    } else {
      // 如果starter没有指定commands，则清除当前选中的command
      setSelectedCommand(undefined);
    }

    // 处理可切换命令激活
    let newToggleables: IToggleable[] = [];

    // 根据starter.toggle_commands处理toggleables
    if (starter.toggle_commands) {
      if (starter.toggle_commands.length > 0) {
        // 如果有指定的toggle_commands，先保留所有持久化的toggleables
        const persistentToggles = toggleables.filter(t => t.persistent);
        newToggleables.push(...persistentToggles);
        
        // 添加starter中指定的toggle_commands，确保它们被激活
        starter.toggle_commands.forEach(cmdId => {
          const toggleCmd = toggleCommands.find(cmd => cmd.id === cmdId);
          if (toggleCmd) {
            // 检查是否已经存在于新的toggleables中
            const existingIndex = newToggleables.findIndex(t => t.id === cmdId);
            
            if (existingIndex >= 0) {
              // 如果已存在，确保它是激活状态
              newToggleables[existingIndex] = {
                ...newToggleables[existingIndex],
                active: true
              };
            } else {
              // 如果不存在，添加新的toggleable
              newToggleables.push({
                id: toggleCmd.id,
                active: true,
                persistent: toggleCmd.persistent
              });
            }
          }
        });
      } else {
        // 如果toggle_commands是空数组，保留所有toggleables但设置为非激活状态
        newToggleables = toggleables.map(toggle => ({
          ...toggle,
          active: false
        }));
        console.log("重置所有toggleables为非激活状态:", newToggleables);
      }
    } else {
      // 如果toggle_commands不存在，保留所有持久化的toggleables
      const persistentToggles = toggleables.filter(t => t.persistent);
      newToggleables.push(...persistentToggles);
    }

    console.log("即将设置的新toggle状态:", newToggleables);
    
    // 直接构造消息对象并发送，不等待状态更新
    const message: IStep = {
      threadId: '',
      id: uuidv4(),
      command: starter.commands && starter.commands.length > 0 ? starter.commands[0] : undefined,
      toggleables: starter.toggle_commands && starter.toggle_commands.length > 0 
        ? starter.toggle_commands 
        : [],
      name: user?.identifier || 'User',
      type: 'user_message',
      output: starter.message,
      createdAt: new Date().toISOString(),
      metadata: { location: window.location.href }
    };

    // 发送消息
    sendMessage(message, []);
    
    // 然后更新UI状态，这样不会影响消息发送
    setToggleables(newToggleables);
    
  }, [user, selectedCommand, toggleables, commands, toggleCommands, sendMessage, starter, setSelectedCommand, setToggleables]);

  // 检查是否是图片URL
  const isImageUrl = (url: string): boolean => {
    return url.startsWith('http') || 
           url.startsWith('/') || 
           url.startsWith('./') || 
           url.startsWith('../');
  };

  return (
    <Button
      id={`starter-${starter.label.trim().toLowerCase().replaceAll(' ', '-')}`}
      variant="outline"
      className="w-fit justify-start rounded-3xl"
      disabled={disabled}
      onClick={onSubmit}
    >
      <div className="flex gap-2">
        {starter.icon ? (
          isImageUrl(starter.icon) ? (
            <img
              className="h-5 w-5 rounded-md"
              src={
                starter.icon?.startsWith('/public')
                  ? apiClient.buildEndpoint(starter.icon)
                  : starter.icon
              }
              alt={starter.label}
            />
          ) : (
            <Icon name={starter.icon} className="!h-5 !w-5" />
          )
        ) : null}
        <p className="text-sm text-muted-foreground truncate">
          {starter.label}
        </p>
      </div>
    </Button>
  );
}
