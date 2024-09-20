export interface EvoyaConfig {
  container: HTMLElement | null;
  reset: boolean;
  chat_uuid: string;
  session_uuid?: string;
  type: string; // options: 'default' | 'container' | 'dashboard'
  getEvoyaAccessToken: (chat_uuid: string, session_uuid: string | undefined) => string | undefined;
  api?: EvoyaApiConfig;
  logo?: string | null;
  hideWaterMark?: boolean;
  additionalInfo?: EvoyaAdditionalInfo;
}

export interface EvoyaAdditionalInfo {
  text?: string;
  link?: string;
  linkText?: string;
}

export interface SectionItem {
  string: string;
  type: string;
  id: string;
  isAnon: boolean;
  isLocked: boolean;
}

export interface PrivacyCategories {
  [key: string]: TextSection[];
}

export interface TextSection {
  string: string;
  type?: string;
  id?: string;
  anonString?: string;
  isAnon?: boolean;
  isLocked?: boolean;
}

export interface EvoyaFavoriteApiConfig {
  is_favorite: boolean;
  add: string;
  remove: string;
}

export interface EvoyaShareApiConfig {
  add: string;
  remove: string;
  check: string;
}

export interface EvoyaPrivacyShieldApiConfig {
  privacyAgent: string;
  apiKey: string;
}

export interface EvoyaApiConfig {
  favorite: EvoyaFavoriteApiConfig;
  share: EvoyaShareApiConfig;
  csrf_token: string;
  baseUrl: string;
  privacyShield: EvoyaPrivacyShieldApiConfig;
}

export interface EvoyaShareLink {
  url?: string;
  type?: string; // static | global
  expire?: number;
}


