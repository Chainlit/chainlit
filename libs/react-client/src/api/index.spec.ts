import { describe, expect, it } from 'vitest';

import { ChainlitAPI } from '../index';

describe('getLogoEndpoint', () => {
  const api = new ChainlitAPI('http://localhost:8000/my-app', 'webapp');

  it('prefixes a configured logo served from the public directory with the base path', () => {
    expect(api.getLogoEndpoint('light', '/public/logo.png')).toBe(
      'http://localhost:8000/my-app/public/logo.png'
    );
  });

  it('leaves a configured external logo URL untouched', () => {
    expect(
      api.getLogoEndpoint('light', 'https://cdn.example.com/logo.png')
    ).toBe('https://cdn.example.com/logo.png');
  });

  it('falls back to the built-in /logo endpoint when unconfigured', () => {
    expect(api.getLogoEndpoint('light')).toBe(
      'http://localhost:8000/my-app/logo?theme=light'
    );
  });
});
