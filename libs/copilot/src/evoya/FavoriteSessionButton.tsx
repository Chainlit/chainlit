import { useContext, useState } from 'react';
import { toast } from 'sonner';
import { MdOutlineStar } from "react-icons/md";
import { Star } from 'lucide-react';
import { Translator } from '@chainlit/app/src/components/i18n';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';
import { Button } from '@chainlit/app/src/components/ui/button';
import { WidgetContext } from '@/context';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
interface Props {
  sessionUuid: string;
}

const FavoriteSessionButton = ({ sessionUuid }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { accessToken, evoya } = useContext(WidgetContext);
  const [isFavorite, setIsFavorite] = useState<boolean>(!!evoya?.api?.favorite?.is_favorite);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClick = async () => {
    setIsLoading(true);
    if (evoya?.api?.favorite && accessToken) {
      if (isFavorite) {
        // remove favorite
        setIsLoading(true);
        try {
          const response = await fetch(evoya.api.favorite.remove.replace('{{uuid}}', sessionUuid), {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
              'X-CSRFTOKEN': evoya.api.csrf_token,
            },
            credentials: 'same-origin'
          });
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          toast.success(t("components.molecules.favoriteSession.messages.successRemove"));
          setIsFavorite(false);
          window.dispatchEvent(new CustomEvent('reload-chat-sidebar'));
        } catch (e) {
          toast.error(t("components.molecules.favoriteSession.messages.error"));
        } finally {
          setIsLoading(false);
        }
      } else {
        // add favorite
        setIsLoading(true);
        try {
          const response = await fetch(evoya.api.favorite.add.replace('{{uuid}}', sessionUuid), {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'X-CSRFTOKEN': evoya.api.csrf_token,
            },
            credentials: 'same-origin'
          });
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          toast.success(t("components.molecules.favoriteSession.messages.success"));
          setIsFavorite(true);
          window.dispatchEvent(new CustomEvent('reload-chat-sidebar'));
        } catch (e) {
          toast.error(t("components.molecules.favoriteSession.messages.error"));
        } finally {
          setIsLoading(false);
        }
      }
    }
  };
  return (
    <div>
      <Button
        id="favorite-session-button"
        size="icon"
        variant="ghost"
        onClick={handleClick}
      >

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              {
                isFavorite ? <Star fill='#5c5c5c' className="!size-5 text-muted-foreground" /> : <Star className="!size-5 text-muted-foreground" />
              }
            </TooltipTrigger>
            <TooltipContent>
              <p>
                <Translator path="components.molecules.favoriteSessionButton.favoriteSession" />
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Button>
    </div>
  );
}

export default FavoriteSessionButton


