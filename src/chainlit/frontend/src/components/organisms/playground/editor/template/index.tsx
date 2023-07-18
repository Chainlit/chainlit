import { IPrompt } from 'state/chat';

import TemplatePromptEditor from './templatePromptEditor';

interface Props {
  prompt: IPrompt;
}

export default function TemplatePrompt({ prompt }: Props) {
  if (!prompt.template) {
    return null;
  }

  return <TemplatePromptEditor prompt={prompt} />;
}
