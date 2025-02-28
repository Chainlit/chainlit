import { useContext } from 'react';
import { Translator } from 'components/i18n';

import 'assets/evoya_light.svg';
import LogoDark from 'assets/evoya_light.svg?react';
import LogoLight from 'assets/evoya_light.svg?react';

import { useTheme } from './ThemeProvider';
import { WidgetContext } from '@chainlit/copilot/src/context';

export default function WaterMark() {
  const { variant } = useTheme();
  const { evoya } = useContext(WidgetContext);
  const Logo = variant === 'light' ? LogoLight : LogoDark;
  return (
    <>
      {!evoya?.hideWaterMark && (
        <a
          href="https://evoya.ai"
          target="_blank"
          className="watermark"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none'
          }}
        >
          <div className="text-xs text-black">
            <span>Powered by</span>
          </div>
          <Logo
            style={{
              width: 20,
              height: 'auto',
              filter: 'grayscale(1)',
              marginLeft: '10px',
              marginRight: '5px'
            }}
          />
          <div className="text-xs text-black">
            <span>Evoya AI</span>
          </div>
        </a>
      )}
      {evoya?.additionalInfo && (
        <div className="text-center leading-[1.25]">
          <p className="text-xs text-muted-foreground tracking-normal">
            {evoya?.additionalInfo?.text ? (
              evoya?.additionalInfo?.text
            ) : (
              <Translator path="components.organisms.chat.inputBox.additionalInfo.text" />
            )}
            {evoya?.additionalInfo?.link && (
              <a
                href={evoya.additionalInfo.link}
                className="text-primary text-xs hover:underline font-normal ml-1"
              >
                {evoya.additionalInfo.linkText}
              </a>
            )}
          </p>
        </div>
      )}
    </>
  );
}

