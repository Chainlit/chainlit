import { Translator } from 'components/i18n';



export default function WaterMark() {
  return (
    <div
      className="watermark"
      style={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none'
      }}
    >
      <div className="text-xs text-muted-foreground">
        <Translator path="chat.watermark" />
      </div>
    </div>
  );
}
