import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

import { useChatSession, useConfig } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

import Starter from './Starter';

interface Props {
  className?: string;
}

export default function Starters({ className }: Props) {
  const { chatProfile } = useChatSession();
  const { config } = useConfig();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const starters = useMemo(() => {
    if (chatProfile) {
      const selectedChatProfile = config?.chatProfiles.find(
        (profile) => profile.name === chatProfile
      );
      if (selectedChatProfile?.starters) {
        return selectedChatProfile.starters;
      }
    }
    return config?.starters;
  }, [config, chatProfile]);

  const starterCategories = config?.starterCategories;

  if (starterCategories?.length) {
    const selectedCategoryData = starterCategories.find(
      (cat) => cat.label === selectedCategory
    );

    return (
      <div
        id="starters"
        className={cn('flex flex-col gap-4 items-center', className)}
      >
        <div className="flex gap-2 justify-center flex-wrap">
          {starterCategories.map((category) => (
            <Button
              key={category.label}
              variant={selectedCategory === category.label ? 'default' : 'outline'}
              className="rounded-full gap-2"
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.label ? null : category.label
                )
              }
            >
              {category.icon && (
                <img className="h-4 w-4" src={category.icon} alt="" />
              )}
              {category.label}
            </Button>
          ))}
        </div>
        {selectedCategoryData?.starters?.length && (
          <div className="flex gap-2 justify-center flex-wrap">
            {selectedCategoryData.starters.map((starter) => (
              <Starter key={starter.label} starter={starter} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!starters?.length) return null;

  return (
    <div
      id="starters"
      className={cn('flex gap-2 justify-center flex-wrap', className)}
    >
      {starters.map((starter, i) => (
        <Starter key={i} starter={starter} />
      ))}
    </div>
  );
}
