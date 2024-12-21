import { useAuth } from '@chainlit/react-client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';

export default function UserNav() {
  const { user, logout } = useAuth();

  if(!user) return null
  const displayName = user?.display_name || user?.identifier;

  return <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.metadata.image} alt="user image" />
        <AvatarFallback className='bg-primary text-primary-foreground'><User className='!size-5' /></AvatarFallback>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" align="end" forceMount>
    <DropdownMenuLabel className="font-normal">
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium leading-none">{displayName}</p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => logout(true)}>
      Log out
      <LogOut className='ml-auto' />
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
}
