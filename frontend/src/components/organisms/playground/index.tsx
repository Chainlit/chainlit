import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import { IGeneration, accessTokenState } from '@chainlit/react-client';
import {
  IPlaygroundContext,
  PromptPlayground
} from '@chainlit/react-components';

import { useLLMProviders } from 'hooks/useLLMProviders';

import { apiClientState } from 'state/apiClient';
import {
  functionState,
  modeState,
  playgroundState,
  variableState
} from 'state/playground';
import { userEnvState } from 'state/user';

export default function PlaygroundWrapper() {
  const accessToken = useRecoilValue(accessTokenState);
  const userEnv = useRecoilValue(userEnvState);
  const [variableName, setVariableName] = useRecoilState(variableState);
  const [functionIndex, setFunctionIndex] = useRecoilState(functionState);
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const [promptMode, setPromptMode] = useRecoilState(modeState);
  const apiClient = useRecoilValue(apiClientState);

  const shoulFetchProviders =
    playground?.generation && !playground?.providers?.length;

  useLLMProviders(shoulFetchProviders);

  const onNotification: IPlaygroundContext['onNotification'] = useCallback(
    (type, content) => {
      switch (type) {
        case 'error':
          toast.error(content);
          return;
        case 'success':
          toast.success(content);
          return;
        default:
          return;
      }
    },
    []
  );

  const createCompletion = useCallback(
    (
      generation: IGeneration,
      controller: AbortController,
      cb: (done: boolean, token: string) => void
    ) => {
      return apiClient.getGeneration(
        generation,
        userEnv,
        controller,
        accessToken,
        cb
      );
    },
    [accessToken]
  );

  return (
    <PromptPlayground
      context={{
        setFunctionIndex,
        functionIndex,
        setVariableName,
        variableName,
        setPlayground,
        playground,
        onNotification,
        createCompletion,
        promptMode,
        setPromptMode
      }}
    />
  );
}
