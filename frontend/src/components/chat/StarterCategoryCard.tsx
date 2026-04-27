import { useContext } from 'react';

import { ChainlitContext, IStarterCategory } from '@chainlit/react-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import StarterRow from './StarterRow';

interface Props {
  category: IStarterCategory;
}

const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function StarterCategoryCard({ category }: Props) {
  const apiClient = useContext(ChainlitContext);
  const iconSrc = category.icon?.startsWith('/public')
    ? apiClient.buildEndpoint(category.icon)
    : category.icon;

  return (
    <Card
      className="starter-category-card"
      data-category={slugify(category.label)}
    >
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-4">
        {iconSrc && <img src={iconSrc} alt="" className="h-5 w-5 rounded" />}
        <CardTitle className="text-base font-semibold">
          {category.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2 divide-y">
        {category.starters.map((starter) => (
          <StarterRow key={starter.label} starter={starter} />
        ))}
      </CardContent>
    </Card>
  );
}
