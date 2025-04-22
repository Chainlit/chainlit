import { MessageContext } from 'contexts/MessageContext';

import { useContext } from 'react';
import {
  type IStep,
} from '@chainlit/react-client';

import { FilePlus  } from 'lucide-react';

import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from '@/components/i18n';

interface Props {
  message: IStep;
}

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)|(\${1})/g;
  const res = text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket, dollarSign) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$\n${squareBracket}\n$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      } else if (dollarSign) {
        return '\\$';
      }
      return match;
    },
  );
  return res;
}

export function EvoyaCreatorButton({ message }: Props) {
  const { showEvoyaCreatorButton } = useContext(MessageContext);

  const handleClick = () => {
    console.log(message.output);
    // @ts-expect-error custom property
    window.openEvoyaCreator({...message, output: escapeBrackets(message.output)}, { type: 'markdown' });
  };

  if (!showEvoyaCreatorButton) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              variant="ghost"
              size="icon"
              className={`text-muted-foreground`}
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Translator path="components.molecules.evoyaCreatorButton.label" />
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default EvoyaCreatorButton;
