import { PlaygroundContext } from 'contexts/PlaygroundContext';
import cloneDeep from 'lodash/cloneDeep';
import { useContext, useState } from 'react';
import { AccentButton, RegularButton } from 'src/buttons';
import { getProviders } from 'src/playground/helpers/provider';

export default function SubmitButton({ onSubmit }: { onSubmit: () => void }) {
  const [completionController, setCompletionController] = useState<
    AbortController | undefined
  >();
  const { playground, setPlayground, createCompletion } =
    useContext(PlaygroundContext);

  if (!playground || !playground.providers || !createCompletion) {
    return null;
  }

  const submit = async () => {
    try {
      const { provider } = getProviders(playground);
      const generation = cloneDeep(playground.generation)!;
      generation.provider = provider.id;
      const controller = new AbortController();

      setCompletionController(controller);
      setPlayground((old) => {
        if (!old?.generation) return old;

        if (old.generation.type === 'CHAT') {
          return {
            ...old,
            generation: {
              ...old.generation!,
              messageCompletion: {
                ...(old.generation?.messageCompletion || { role: 'assistant' }),
                content: ''
              }
            }
          };
        } else {
          return {
            ...old,
            generation: {
              ...old.generation!,
              completion: ''
            }
          };
        }
      });

      await createCompletion(
        generation,
        controller,
        (done: boolean, token: string) => {
          onSubmit && onSubmit();

          if (done) {
            setCompletionController(undefined);
            return;
          }
          setPlayground((old) => {
            if (!old?.generation) return old;
            if (old.generation.type === 'CHAT') {
              return {
                ...old,
                generation: {
                  ...old.generation!,
                  messageCompletion: {
                    ...(old.generation?.messageCompletion || {
                      role: 'assistant'
                    }),
                    content:
                      (old.generation?.messageCompletion?.content || '') + token
                  }
                }
              };
            } else {
              return {
                ...old,
                generation: {
                  ...old.generation!,
                  completion: (old.generation?.completion || '') + token
                }
              };
            }
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
