import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useConfig } from '@chainlit/react-client';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'bn', label: 'বাংলা' }
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useConfig();
  const current = language;

  const handleLanguageChange = (langCode: string) => {
    console.log(`Switching to language: ${langCode}`);
    
    // Update both i18n and the persistent language state
    i18n.changeLanguage(langCode);
    setLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="language-switcher"
          variant="ghost"
          size="icon"
          className={className}
        >
          <Globe className="!size-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={current === lang.code}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
