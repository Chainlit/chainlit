import { cn } from '@/lib/utils';
import { useContext, useMemo, useState } from 'react';

import {
  ChainlitContext,
  IStarter,
  useChatData,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

import Starter from './Starter';

interface Props {
  className?: string;
}

export default function Starters({ className }: Props) {
  const apiClient = useContext(ChainlitContext);
  const { chatProfile } = useChatSession();
  const { config } = useConfig();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { loading, connected } = useChatData();

  const disabled = loading || !connected;

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

  const displayedStarters = useMemo((): IStarter[] => {
    if (!starterCategories?.length || !selectedCategory) {
      return [];
    }
    const category = starterCategories.find(
      (cat) => cat.label === selectedCategory
    );
    return category?.starters || [];
  }, [starterCategories, selectedCategory]);

  // If we have categories, show the tabbed UI
  if (starterCategories?.length) {
    return (
      <div
        id="starters"
        className={cn('flex flex-col gap-4 items-center', className)}
      >
        <div className="flex gap-2 justify-center flex-wrap">
          {starterCategories.map((category) => {
            const isSelected = selectedCategory === category.label;
            return (
              <Button
                key={category.label}
                variant={isSelected ? 'default' : 'outline'}
                className="rounded-full gap-2"
                disabled={disabled}
                onClick={() =>
                  setSelectedCategory(isSelected ? null : category.label)
                }
              >
                {category.icon && (
                  <img
                    className="h-4 w-4"
                    src={
                      category.icon?.startsWith('/public')
                        ? apiClient.buildEndpoint(category.icon)
                        : category.icon
                    }
                    alt={category.label}
                  />
                )}
                {category.label}
              </Button>
            );
          })}
        </div>
        {displayedStarters.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap">
            {displayedStarters.map((starter) => (
              <Starter key={starter.label} starter={starter} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Fall back to flat starters
  if (!starters?.length) return null;

  return (
    <div
      id="starters"
      className={cn('flex gap-2 justify-center flex-wrap', className)}
    >
      {starters.map((starter) => (
        <Starter key={starter.label} starter={starter} />
      ))}
    </div>
  );
}
