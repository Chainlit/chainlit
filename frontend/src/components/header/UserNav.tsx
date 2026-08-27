import capitalize from 'lodash/capitalize';
import { LogOut } from 'lucide-react';
import { useContext } from 'react';

import { ChainlitContext, useAuth, useConfig } from '@chainlit/react-client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Translator } from 'components/i18n';

export default function UserNav() {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const apiClient = useContext(ChainlitContext);

  if (!user) return null;
  const displayName = user?.display_name || user?.identifier;
  const menuLinks = config?.ui?.user_menu_links || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="user-nav-button"
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.metadata.image} alt="user image" />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {capitalize(displayName[0])}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-26" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuLinks.map((link, index) => (
          <DropdownMenuItem key={`${link.name}-${index}`} asChild>
            <a
              href={link.url}
              target={link.target ?? '_blank'}
              rel="noopener noreferrer"
            >
              <span>{link.display_name || link.name}</span>
              {link.icon_url ? (
                <img
                  src={
                    link.icon_url.startsWith('/public')
                      ? apiClient.buildEndpoint(link.icon_url)
                      : link.icon_url
                  }
                  className="ml-auto size-4"
                  alt=""
                />
              ) : null}
            </a>
          </DropdownMenuItem>
        ))}
        {menuLinks.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => logout(true)}>
          <Translator path="navigation.user.menu.logout" />
          <LogOut className="ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
