import StarOutline from '@mui/icons-material/StarOutline';
import Star from '@mui/icons-material/Star';
import { toast } from 'sonner';

import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Translator } from '@chainlit/app/src/components/i18n';
import { sessionIdState } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';

import { WidgetContext } from 'context';
import { useContext, useState } from 'react';

export default function FavoriteSessionButton() {
  const { evoya, accessToken, apiClient } = useContext(WidgetContext);
  const [isFavorite, setIsFavorite] = useState<boolean>(!!evoya?.api?.favorite?.is_favorite);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const sessionId = useRecoilValue(sessionIdState);

  const handleClick = async () => {
    setIsLoading(true);
    if (evoya?.api?.favorite && accessToken) {
      let session_uuid = evoya.session_uuid;
      if (!evoya.session_uuid) {
        const sessionResponse = await apiClient.get(`/chat_session_uuid/${sessionId}/`, accessToken);
        const sessionJson = await sessionResponse.json();
        session_uuid = sessionJson.session_uuid;
      }
      if (isFavorite) {
        // remove favorite
        setIsLoading(true);
        try {
          const response = await fetch(evoya.api.favorite.remove.replace('{{uuid}}', session_uuid), {
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
          toast.success(<Translator path="components.molecules.favoriteSession.messages.successRemove" />);
          setIsFavorite(false);
          window.dispatchEvent(new CustomEvent('reload-chat-sidebar'));
        } catch(e) {
          toast.error(<Translator path="components.molecules.favoriteSession.messages.error" />);
        } finally {
          setIsLoading(false);
        }
      } else {
        // add favorite
        setIsLoading(true);
        try {
          const response = await fetch(evoya.api.favorite.add.replace('{{uuid}}', session_uuid), {
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
          toast.success(<Translator path="components.molecules.favoriteSession.messages.success" />);
          setIsFavorite(true);
          window.dispatchEvent(new CustomEvent('reload-chat-sidebar'));
        } catch(e) {
          toast.error(<Translator path="components.molecules.favoriteSession.messages.error" />);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <Box>
      <Tooltip
        title={<Translator path="components.molecules.favoriteSession.favoriteButton" />}
      >
        <IconButton edge="end" id="favorite-session-button" onClick={handleClick}>
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            isFavorite ? <Star sx={{ width: 20, height: 20 }} /> : <StarOutline sx={{ width: 20, height: 20 }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
