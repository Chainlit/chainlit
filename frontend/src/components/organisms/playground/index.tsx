import { ChainlitAPI } from 'api/chainlitApi';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  IPlayground,
  IPlaygroundContext,
  IPrompt,
  PromptPlayground
} from '@chainlit/components';

import { useApi } from 'hooks/useApi';

import { modeState, playgroundState, variableState } from 'state/playground';
import { accessTokenState, userEnvState } from 'state/user';

export default function PlaygroundWrapper() {
  const accessToken = useRecoilValue(accessTokenState);
  const userEnv = useRecoilValue(userEnvState);
  const [variableName, setVariableName] = useRecoilState(variableState);
  const [playground, setPlayground] = useRecoilState(playgroundState);
  const [promptMode, setPromptMode] = useRecoilState(modeState);

  const { data, error } = useApi<IPlayground>('/project/llm-providers');

  useEffect(() => {
    if (error) {
      toast.error(`Failed to fetch providers: ${error}`);
    }
    if (!data) return;
    setPlayground((old) => ({ ...old, providers: data.providers }));
  }, [data, error]);

  const onNotification: IPlaygroundContext['onNotification'] = (
    type,
    content
  ) => {
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
  };

  const createCompletion = (
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
  };

  return (
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
  );
}
