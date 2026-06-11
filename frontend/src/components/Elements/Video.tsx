

import { Skeleton } from '@/components/ui/skeleton';
import { type IVideoElement } from '@chainlit/react-client';

// On utilise 'any' ici pour le type du composant dynamique.
// C'est la solution la plus stable pour react-player dans Next.js
// car les exports de types de cette lib sont souvent inconsistants.
const ReactPlayer = React.lazy(
  () => import('react-player').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-video rounded-xl" />
  }
) as any;

const VideoElement = ({ element }: { element: IVideoElement }) => {
  if (!element.url) {
    return null;
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border bg-zinc-950 shadow-sm">
      <ReactPlayer
        className={`${element.display}-video`}
        width="100%"
        height="100%"
        controls={true}
        url={element.url}
        // On s'assure que config est au moins un objet vide
        config={element.playerConfig || {}}
        // Optionnel : Ã©vite les problÃ¨mes de lecture automatique sur certains navigateurs
        playsinline={true}
      />
    </div>
  );
};

export { VideoElement };