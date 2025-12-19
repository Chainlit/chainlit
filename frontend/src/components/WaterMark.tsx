import { Markdown } from '@/components/Markdown';
import { useTranslation } from '@/components/i18n/Translator';

export default function WaterMark() {
  const { t } = useTranslation();

  return (
    <div
      className="watermark"
      style={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none'
      }}
    >
      <Markdown className="[&_p]:m-0 [&_p]:leading-snug [&_div]:leading-snug [&_div]:mt-0 [&_strong]:font-semibold text-xs text-muted-foreground">
        {t('chat.watermark')}
      </Markdown>
    </div>
  );
}
