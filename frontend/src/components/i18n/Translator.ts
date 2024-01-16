import { useTranslation } from 'react-i18next';

type TranslatorProps = {
  path: string;
};

const Translator = ({ path }: TranslatorProps) => {
  const { t } = useTranslation();

  return t(path);
};

export default Translator;
