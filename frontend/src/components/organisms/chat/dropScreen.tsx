import { Image } from 'lucide-react';
import { Translator } from 'components/i18n';

const DropScreen = () => {
  return (
    <div className="fixed inset-0 bg-black/80 z-10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <Image className="w-24 h-24 text-gray-400" />
        <p className="text-2xl font-semibold text-gray-200">
          <Translator path="components.organisms.chat.dropScreen.dropYourFilesHere" />
        </p>
      </div>
    </div>
  );
};

export default DropScreen;