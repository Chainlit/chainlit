import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@/components/LoginForm';

vi.mock('@chainlit/react-client', () => ({
  ClientError: class ClientError extends Error {
    detail?: string;

    constructor(detail?: string) {
      super(detail);
      this.detail = detail;
    }
  }
}));

vi.mock('@/components/i18n/Translator', () => ({
  __esModule: true,
  default: ({ path }: { path: string }) => {
    const translations: Record<string, string> = {
      'auth.login.title': 'Sign in',
      'auth.login.form.email.label': 'Username or email',
      'auth.login.form.email.placeholder': 'your_username',
      'auth.login.form.email.required': 'username or email is a required field',
      'auth.login.form.password.label': 'Password',
      'auth.login.form.password.required': 'password is a required field',
      'auth.login.form.actions.signin': 'Sign In',
      'auth.login.form.alternativeText.or': 'OR'
    };

    return <span>{translations[path] || path}</span>;
  },
  useTranslation: () => ({
    t: (key: string | string[]) => {
      const translations: Record<string, string> = {
        'auth.login.form.email.placeholder': 'your_username',
        'auth.login.form.email.required':
          'username or email is a required field',
        'auth.login.form.password.required': 'password is a required field',
        'auth.login.errors.default': 'Something went wrong'
      };

      if (Array.isArray(key)) {
        return translations[key[0]] || translations[key[1]] || key[0];
      }

      return translations[key] || key;
    }
  })
}));

describe('LoginForm', () => {
  it('renders a username-or-email field', () => {
    render(
      <LoginForm callbackUrl="/" providers={[]} onPasswordSignIn={vi.fn()} />
    );

    const input = screen.getByLabelText('Username or email');

    expect(input).toHaveAttribute('id', 'username');
    expect(input).toHaveAttribute('autocomplete', 'username');
    expect(input).toHaveAttribute('placeholder', 'your_username');
  });

  it('submits the username value to password sign-in', async () => {
    const onPasswordSignIn = vi.fn().mockResolvedValue(undefined);

    render(
      <LoginForm
        callbackUrl="/callback"
        providers={[]}
        onPasswordSignIn={onPasswordSignIn}
      />
    );

    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: 'plain-username' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(onPasswordSignIn).toHaveBeenCalledWith(
        'plain-username',
        'secret',
        '/callback'
      );
    });
  });

  it('shows required-field errors when submitted empty', async () => {
    render(
      <LoginForm callbackUrl="/" providers={[]} onPasswordSignIn={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(
      await screen.findByText('username or email is a required field')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('password is a required field')
    ).toBeInTheDocument();
  });

  it('shows an error when password sign-in fails', async () => {
    const onPasswordSignIn = vi
      .fn()
      .mockRejectedValue(new Error('Sign-in failed'));

    render(
      <LoginForm
        callbackUrl="/"
        providers={[]}
        onPasswordSignIn={onPasswordSignIn}
      />
    );

    fireEvent.change(screen.getByLabelText('Username or email'), {
      target: { value: 'plain-username' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });
});
