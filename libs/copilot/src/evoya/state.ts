import { atom } from 'recoil';
import { SectionItem } from 'evoya/types';


export const privacyShieldEnabledState = atom<boolean>({
  key: 'PrivacyShieldEnabled',
  default: false
});

export const privacyShieldEnabledVisualState = atom<boolean>({
  key: 'PrivacyShieldEnabledVisual',
  default: false
});

export const privacyShieldOpenState = atom<boolean>({
  key: 'PrivacyShieldOpen',
  default: false
});

export const privacyShieldTextState = atom<string>({
  key: 'PrivacyShieldText',
  default: ''
});

export const privacyShieldLoadingState = atom<boolean>({
  key: 'PrivacyShieldLoading',
  default: false
});

export const privacyShieldSectionsState = atom<SectionItem[]>({
  key: 'PrivacyShieldSections',
  default: []
});

export const privacyShieldCurrentSectionsState = atom<SectionItem[]>({
  key: 'PrivacyShieldCurrentSections',
  default: []
});
