import { useTranslation } from 'react-i18next';

type TranslatorProps = {
  path: string;
};

const Translator = ({ path }: TranslatorProps) => {
  const { t } = useTranslation();

  return <div>{t(path)}</div>;
};

export default Translator;
