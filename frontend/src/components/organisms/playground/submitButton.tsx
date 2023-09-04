import { ChainlitAPI } from 'api/chainlitApi';
import { cloneDeep } from 'lodash';
import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import AccentButton from 'components/atoms/buttons/accentButton';
import RegularButton from 'components/atoms/buttons/button';

import { playgroundState } from 'state/playground';
import { accessTokenState, userEnvState } from 'state/user';

import { getProviders } from './helpers';

export default function SubmitButton({ onSubmit }: { onSubmit: () => void }) {
  const [completionController, setCompletionController] = useState<
    AbortController | undefined
  >();
  const accessToken = useRecoilValue(accessTokenState);
  const [playground, setPlayground] = useRecoilState(playgroundState);

  const userEnv = useRecoilValue(userEnvState);

  const submit = async () => {
    try {
      const { provider } = getProviders(playground);
      const prompt = cloneDeep(playground.prompt)!;
      prompt.provider = provider.id;
      const controller = new AbortController();

      setCompletionController(controller);
      setPlayground((old) => {
        if (!old?.prompt) return old;

        return {
          ...old,
          prompt: {
            ...old.prompt!,
            completion: ''
          }
        };
      });

      await ChainlitAPI.getCompletion(
        prompt,
        userEnv,
        controller,
        accessToken,
        (done, token) => {
          onSubmit && onSubmit();

          if (done) {
            setCompletionController(undefined);
            return;
          }
          setPlayground((old) => {
            if (!old?.prompt) return old;

            return {
              ...old,
              prompt: {
                ...old.prompt!,
                completion: (old.prompt?.completion || '') + token
              }
            };
          });
        }
      );
    } catch (err) {
      setCompletionController(undefined);
    }
  };

  if (completionController) {
    return (
      <RegularButton
        onClick={() => {
          completionController.abort();
          setCompletionController(undefined);
        }}
      >
        Cancel
      </RegularButton>
    );
  } else {
    return (
      <AccentButton id="submit-prompt" variant="outlined" onClick={submit}>
        Submit
      </AccentButton>
    );
  }
}
