import { useContext, useState } from 'react';
import { toast } from 'sonner';
import { MdOutlineStar } from "react-icons/md";
import { Star } from 'lucide-react';
import { FilePlus  } from 'lucide-react';
import { Translator } from '@chainlit/app/src/components/i18n';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';
import { Button } from '@chainlit/app/src/components/ui/button';

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

const EvoyaCreatorButton = (): JSX.Element => {
  const handleClick = async () => {
    const restoreContent = localStorage.getItem('evoya-creator');

    if (restoreContent) {
        const restoreContentObj = JSON.parse(restoreContent);

        // @ts-expect-error custom property
        window.openEvoyaCreator({output: restoreContentObj.content}, { type: restoreContentObj.type });
    }
  };

  return (
    <div>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
      <Button
        id="favorite-session-button"
        size="icon"
        variant="ghost"
        onClick={handleClick}
      >
        <FilePlus className="!size-5" />
      </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Translator path="components.molecules.evoyaCreatorButton.label" />
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default EvoyaCreatorButton
