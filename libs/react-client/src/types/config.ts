export interface IStarter {
  label: string;
  message: string;
  icon?: string;
}

export interface ChatProfile {
  default: boolean;
  icon?: string;
  name: string;
  markdown_description: string;
  starters?: IStarter[];
}

export interface IAudioConfig {
  enabled: boolean;
  sample_rate: number;
}

export interface IAuthConfig {
  requireLogin: boolean;
  passwordAuth: boolean;
  headerAuth: boolean;
  oauthProviders: string[];
  default_theme?: 'light' | 'dark';
  ui?: IChainlitConfig['ui'];
}

export interface IChainlitConfig {
  markdown?: string;
  ui: {
    name: string;
    description?: string;
    font_family?: string;
    default_theme?: 'light' | 'dark';
    layout?: 'default' | 'wide';
    default_sidebar_state?: 'open' | 'closed';
    cot: 'hidden' | 'tool_call' | 'full';
    github?: string;
    custom_css?: string;
    custom_js?: string;
    custom_font?: string;
    login_page_image?: string;
    login_page_image_filter?: string;
    login_page_image_dark_filter?: string;
    custom_meta_image_url?: string;
    logo_file_url?: string;
    default_avatar_file_url?: string;
    header_links?: {
      name: string;
      display_name: string;
      icon_url: string;
      url: string;
    }[];
  };
  features: {
    spontaneous_file_upload?: {
      enabled?: boolean;
      max_size_mb?: number;
      max_files?: number;
      accept?: string[] | Record<string, string[]>;
    };
    audio: IAudioConfig;
    unsafe_allow_html?: boolean;
    user_message_autoscroll?: boolean;
    latex?: boolean;
    edit_message?: boolean;
    mcp?: {
      enabled?: boolean;
      sse?: {
        enabled?: boolean;
      };
      stdio?: {
        enabled?: boolean;
      };
    };
  };
  debugUrl?: string;
  userEnv: string[];
  dataPersistence: boolean;
  threadResumable: boolean;
  chatProfiles: ChatProfile[];
  starters?: IStarter[];
  translation: object;
}
