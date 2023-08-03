import { preparePrompt } from 'helpers/format';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilState, useRecoilValue } from 'recoil';

import AccentButton from 'components/atoms/buttons/accentButton';
import RegularButton from 'components/atoms/buttons/button';

import { clientState } from 'state/client';
import { playgroundState } from 'state/playground';
import { userEnvState } from 'state/user';

import { getProviders } from './helpers';

export default function SubmitButton() {
  const [completionController, setCompletionController] = useState<
    AbortController | undefined
  >();
  const client = useRecoilValue(clientState);
  const [playground, setPlayground] = useRecoilState(playgroundState);

  const userEnv = useRecoilValue(userEnvState);

  const submit = async () => {
    try {
      const { provider } = getProviders(playground);
      const prompt = preparePrompt(playground.prompt);
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

      await client.getCompletion(prompt, userEnv, controller, (done, token) => {
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
      });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
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
      <AccentButton variant="outlined" onClick={submit}>
        Submit
      </AccentButton>
    );
  }
}
