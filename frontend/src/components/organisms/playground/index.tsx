import { ChainlitAPI } from 'api/chainlitApi';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  IPlaygroundContext,
  IPrompt,
  PromptPlayground
} from '@chainlit/components';

import { useLLMProviders } from 'hooks/useLLMProviders';

import { modeState, playgroundState, variableState } from 'state/playground';
import { accessTokenState, userEnvState } from 'state/user';

export default function PlaygroundWrapper() {
  const accessToken = useRecoilValue(accessTokenState);
  const userEnv = useRecoilValue(userEnvState);
  const [variableName, setVariableName] = useRecoilState(variableState);
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const [promptMode, setPromptMode] = useRecoilState(modeState);

  const shoulFetchProviders =
    playground?.prompt && !playground?.providers?.length;

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
      prompt: IPrompt,
      controller: AbortController,
      cb: (done: boolean, token: string) => void
    ) => {
      return ChainlitAPI.getCompletion(
        prompt,
        userEnv,
        controller,
        accessToken,
        cb
      );
    },
    [accessToken]
  );

  return (
    <>
      <PromptPlayground
        context={{
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
    </>
  );
}
