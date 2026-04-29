import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

import { useChatSession, useConfig } from '@chainlit/react-client';

import Starter from './Starter';
import StarterCategory from './StarterCategory';
import StarterCategoryCard from './StarterCategoryCard';

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
  const layout = config?.ui?.starters_layout ?? 'tabs';

  if (starterCategories?.length && layout === 'list') {
    const visible = starterCategories.filter((c) => c.starters?.length);
    if (!visible.length) return null;
    return (
      <div
        id="starters"
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl',
          className
        )}
      >
        {visible.map((category) => (
          <StarterCategoryCard key={category.label} category={category} />
        ))}
      </div>
    );
  }

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
            <StarterCategory
              key={category.label}
              category={category}
              isSelected={selectedCategory === category.label}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.label ? null : category.label
                )
              }
            />
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
