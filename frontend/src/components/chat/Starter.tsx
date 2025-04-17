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
    // 处理命令激活
    if (starter.commands && starter.commands.length > 0) {
      const commandToActivate = commands.find(cmd => cmd.id === starter.commands![0]);
      if (commandToActivate) {
        setSelectedCommand(commandToActivate);
      }
    }

    // 处理可切换命令激活
    if (starter.toggle_commands && starter.toggle_commands.length > 0) {
      const newToggleables: IToggleable[] = [...toggleables];
      
      // 移除所有非持久的toggleables
      const persistentOnly = newToggleables.filter(t => t.persistent);
      
      // 添加starter中指定的toggle_commands
      starter.toggle_commands.forEach(cmdId => {
        const toggleCmd = toggleCommands.find(cmd => cmd.id === cmdId);
        if (toggleCmd) {
          persistentOnly.push({
            id: toggleCmd.id,
            active: true,
            persistent: toggleCmd.persistent
          });
        }
      });
      
      setToggleables(persistentOnly);
    }

    const message: IStep = {
      threadId: '',
      id: uuidv4(),
      command: starter.commands && starter.commands.length > 0 ? starter.commands[0] : selectedCommand?.id,
      toggleables: starter.toggle_commands || [],
      name: user?.identifier || 'User',
      type: 'user_message',
      output: starter.message,
      createdAt: new Date().toISOString(),
      metadata: { location: window.location.href }
    };

    sendMessage(message, []);
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
