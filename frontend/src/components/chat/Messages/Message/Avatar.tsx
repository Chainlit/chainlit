import { useContext, useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

import {
  ChainlitContext,
  useChatSession,
  useConfig
} from '@chainlit/react-client'
import { cn } from '@/lib/utils'

interface Props {
  author?: string
  hide?: boolean
}

const MessageAvatar = ({ author, hide }: Props) => {
  const apiClient = useContext(ChainlitContext)
  const { chatProfile } = useChatSession()
  const { config } = useConfig()

  const selectedChatProfile = useMemo(() => {
    return config?.chatProfiles.find((profile) => profile.name === chatProfile)
  }, [config, chatProfile])

  const avatarUrl = useMemo(() => {
    const isAssistant = !author || author === config?.ui.name
    if (isAssistant && selectedChatProfile?.icon) {
      return selectedChatProfile.icon
    }
    return apiClient?.buildEndpoint(`/avatars/${author || 'default'}`)
  }, [apiClient, selectedChatProfile, config, author])

  return (
    <span className={cn("inline-block", hide && "invisible")}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-6 w-6 mt-[2px]">
                <AvatarImage
                  src={avatarUrl}
                  alt={`Avatar for ${author || 'default'}`}
                  className="bg-transparent"
                />
              <AvatarFallback className="bg-transparent">
                {author?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{author}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  )
}

export { MessageAvatar }