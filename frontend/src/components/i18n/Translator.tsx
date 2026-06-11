
import i18n, { TOptions } from 'i18next';
import { initReactI18next, useTranslation as usei18nextTranslation } from 'react-i18next';

type TranslatorOptions = TOptions;
type TranslatorProps = {
  path: string | string[];
  suffix?: string;
  options?: TranslatorOptions;
};

const translations = {
  auth: {
    login: {
      title: "Connexion",
      form: {
        email: { label: "Email" },
        password: { label: "Mot de passe" },
        actions: { signin: "Se connecter" },
        alternativeText: { or: "Ou" },
      }
    }
  },
  chat: {
    input: {
      placeholder: "Posez votre question Ã  Copilote OCP...",
      actions: {
        attachFiles: "Joindre des fichiers",
        send: "Envoyer",
        stop: "ArrÃªter",
      }
    },
    fileUpload: {
      browse: "Parcourir",
      dragDrop: "Glissez-dÃ©posez vos fichiers ici",
      sizeLimit: "Taille maximale : {{size}}",
    },
    messages: {
      feedback: {
        positive: "Utile",
        negative: "Pas utile",
        edit: "Modifier le feedback",
        dialog: {
          title: "Votre feedback",
          submit: "Envoyer",
        }
      },
      status: {
        used: "UtilisÃ©",
        using: "En cours d'utilisation",
      },
      // âœ… NOUVEAU : Ajout des actions pour les messages
      actions: {
        copy: {
          button: "Copier"
        }
      }
    },
    // âœ… NOUVEAU : Ajout du watermark en bas de page
    watermark: "PropulsÃ© par Copilote OCP",
    settings: {
      title: "ParamÃ¨tres",
    }
  },
  common: {
    actions: {
      cancel: "Annuler",
      confirm: "Confirmer",
    },
    status: {
      error: {
        serverConnection: "Impossible de se connecter au serveur",
      }
    }
  },
  navigation: {
    header: {
      readme: "Readme",
      theme: {
        dark: "Sombre",
        light: "Clair",
        system: "SystÃ¨me",
      }
    },
    newChat: {
      dialog: {
        title: "Nouvelle conversation",
        description: "Commencer une nouvelle conversation ?",
        tooltip: "Nouvelle conversation",
      }
    },
    user: {
      menu: {
        apiKeys: "ClÃ©s API",
        logout: "DÃ©connexion",
      }
    }
  },
  threadHistory: {
    sidebar: {
      empty: "Aucune conversation",
      filters: {
        search: "Rechercher...",
        placeholder: "Rechercher une conversation...",
      },
      actions: {
        open: "Ouvrir l'historique",
        close: "Fermer l'historique",
      },
      timeframes: {
        today: "Aujourd'hui",
        yesterday: "Hier",
        previous7days: "7 derniers jours",
        previous30days: "30 derniers jours",
      }
    },
    thread: {
      untitled: "Sans titre",
      menu: {
        delete: "Supprimer",
        rename: "Renommer",
        share: "Partager",
      },
      actions: {
        delete: {
          title: "Supprimer la conversation",
          description: "Cette action est irrÃ©versible. La conversation sera dÃ©finitivement supprimÃ©e.",
          inProgress: "Suppression en cours...",
          success: "Conversation supprimÃ©e",
        },
        rename: {
          title: "Renommer la conversation",
          description: "Entrez un nouveau nom pour cette conversation.",
          inProgress: "Renommage en cours...",
          success: "Conversation renommÃ©e",
          form: {
            name: {
              label: "Nom",
              placeholder: "Nouveau nom...",
            }
          }
        },
        share: {
          title: "Partager la conversation",
          button: "Partager",
          status: {
            created: "Lien crÃ©Ã©",
            copied: "Lien copiÃ© !",
            unshared: "Partage annulÃ©",
          },
          error: {
            create: "Erreur lors de la crÃ©ation du lien",
            unshare: "Erreur lors de l'annulation du partage",
          }
        }
      }
    }
  }
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      fallbackLng: 'fr',
      lng: 'fr',
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      resources: {
        fr: { translation: translations },
        en: { translation: translations },
      }
    })
    .catch((err) => console.error('[i18n] Erreur initialisation', err));
} else {
  i18n.addResourceBundle('fr', 'translation', translations, true, true);
  i18n.addResourceBundle('en', 'translation', translations, true, true);
}

const Translator = ({ path, options, suffix }: TranslatorProps) => {
  const { t } = usei18nextTranslation();
  return (
    <span>
      {String(t(path as any, options as any))}
      {suffix}
    </span>
  );
};

export const useTranslation = () => {
  const { t, ready, i18n: i18nInstance } = usei18nextTranslation();
  return {
    t: (path: string | string[], options?: TranslatorOptions): string => {
      return t(path as any, options as any) as string;
    },
    ready,
    i18n: i18nInstance
  };
};

export default Translator;