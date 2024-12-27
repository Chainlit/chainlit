import { MessageContext } from 'contexts/MessageContext';
import { useCallback, useContext, useMemo, useState } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
  } from '@/components/ui/tooltip';

import { ChainlitContext, useChatSession, type IAction, accessTokenState } from '@chainlit/react-client';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/Loader';
import { toast } from 'sonner';
import { useRecoilValue } from 'recoil';

interface ActionProps {
  action: IAction;
}

const ActionButton = ({ action }: ActionProps) => {
  const { loading, askUser } = useContext(MessageContext);
  const apiClient = useContext(ChainlitContext)
  const {sessionId} = useChatSession()
  const [isRunning, setIsRunning] = useState(false)
  const accessToken = useRecoilValue(accessTokenState)

  const content = useMemo(() => {
    return action.icon ?  action.label : action.label ? action.label : action.name
  }, [action])

  const icon = useMemo(() => {
    if(isRunning) return <Loader />
    if (action.icon) return <img className='h-4 w-4' src={action.icon} />
    return null
  }, [action, isRunning])

  const handleClick = useCallback(async () => {
    try {
        setIsRunning(true)
        await apiClient.callAction(action, sessionId, accessToken)
    } catch(err) {
        toast.error(String(err))
    } finally {
        setIsRunning(false)
    }
  }, [action, sessionId, apiClient, accessToken])

  const isAskingAction = askUser?.spec.type === 'action';
  const ignore = isAskingAction && askUser?.spec.keys?.includes(action.id);
  
  if(ignore) return null

  const button = <Button onClick={handleClick} size="sm" variant="ghost" className='text-muted-foreground' disabled={loading || isRunning}>
  {icon}
  {content}
  </Button>

  if(action.tooltip) {
    return (
        <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.tooltip}</p>
            </TooltipContent>
            </Tooltip>
            </TooltipProvider>
    )
  } else {
    return button
  }
};

export { ActionButton };
