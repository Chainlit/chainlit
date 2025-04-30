import { useTranslation } from 'components/i18n/Translator';
import { Auth0 } from 'components/icons/Auth0';
import { Cognito } from 'components/icons/Cognito';
import { Descope } from 'components/icons/Descope';
import { GitHub } from 'components/icons/Github';
import { Gitlab } from 'components/icons/Gitlab';
import { Google } from 'components/icons/Google';
import { Microsoft } from 'components/icons/Microsoft';
import { Okta } from 'components/icons/Okta';

import { Button } from './ui/button';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getProviderName(provider: string) {
  switch (provider) {
    case 'azure-ad':
    case 'azure-ad-hybrid':
      return 'Microsoft';
    case 'github':
      return 'GitHub';
    case 'okta':
      return 'Okta';
    case 'descope':
      return 'Descope';
    case 'aws-cognito':
      return 'Cognito';
    default:
      return capitalizeFirstLetter(provider);
  }
}

function renderProviderIcon(provider: string) {
  switch (provider) {
    case 'google':
      return <Google />;
    case 'github':
      return <GitHub />;
    case 'azure-ad':
    case 'azure-ad-hybrid':
      return <Microsoft />;
    case 'okta':
      return <Okta />;
    case 'auth0':
      return <Auth0 />;
    case 'descope':
      return <Descope />;
    case 'aws-cognito':
      return <Cognito />;
    case 'gitlab':
      return <Gitlab />;
    default:
      return null;
  }
}

interface ProviderButtonProps {
  provider: string;
  onClick: () => void;
}

const ProviderButton = ({
  provider,
  onClick
}: ProviderButtonProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      {renderProviderIcon(provider.toLowerCase())}
      {t('auth.provider.continue', {
        provider: getProviderName(provider)
      })}
    </Button>
  );
};

export { ProviderButton };
