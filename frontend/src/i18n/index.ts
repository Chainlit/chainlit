import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const fallbackResources = {
  'en-US': {
    translation: {
      common: {
        actions: {
          cancel: 'Cancel',
          confirm: 'Confirm',
          continue: 'Continue',
          goBack: 'Go Back',
          reset: 'Reset',
          submit: 'Submit'
        }
      },
      navigation: {
        header: {
          theme: {
            light: 'Light Theme',
            dark: 'Dark Theme',
            system: 'Follow System'
          },
          chat: 'Chat',
          readme: 'Readme'
        },
        newChat: {
          dialog: {
            title: 'Create New Chat',
            description: 'This will clear your current chat history. Are you sure you want to continue?',
            tooltip: 'New Chat'
          }
        }
      },
      threadHistory: {
        thread: {
          untitled: 'Untitled Conversation',
          menu: {
            rename: 'Rename',
            delete: 'Delete'
          },
          actions: {
            rename: {
              title: 'Rename Thread',
              description: 'Enter a new name for this thread',
              form: {
                name: {
                  label: 'Name',
                  placeholder: 'Enter new name'
                }
              }
            }
          }
        }
      }
    }
  }
};

const i18nConfig = {
  fallbackLng: 'en-US',
  defaultNS: 'translation',
  resources: fallbackResources
};

export function i18nSetupLocalization(): void {
  i18n
    .use(initReactI18next)
    .init(i18nConfig)
    .catch((err) => console.error('[i18n] Failed to setup localization.', err));
}
