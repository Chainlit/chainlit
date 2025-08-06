import { render, screen, fireEvent } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';

// Mock the useConfig hook
jest.mock('@chainlit/react-client', () => ({
  useConfig: () => ({
    language: 'en-US',
    setLanguage: jest.fn()
  })
}));

// Initialize i18n for testing
i18n.init({
  lng: 'en-US',
  resources: {
    'en-US': {
      translation: {}
    }
  }
});

describe('LanguageSwitcher', () => {
  const renderComponent = () =>
    render(
      <RecoilRoot>
        <I18nextProvider i18n={i18n}>
          <LanguageSwitcher />
        </I18nextProvider>
      </RecoilRoot>
    );

  it('renders the language switcher button', () => {
    renderComponent();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Switch language')).toBeInTheDocument();
  });

  it('shows language options when clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('हिन्दी')).toBeInTheDocument();
    expect(screen.getByText('தமிழ்')).toBeInTheDocument();
    expect(screen.getByText('ಕನ್ನಡ')).toBeInTheDocument();
  });

  it('disables the current language option', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button'));
    
    const englishOption = screen.getByText('English').closest('button');
    expect(englishOption).toBeDisabled();
  });
});
