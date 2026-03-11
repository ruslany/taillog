'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, LogOut, User } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AircraftList } from '@/components/aircraft-list';
import { AircraftWithLive } from '@/types/aircraft';

interface AppSidebarProps {
  aircraft: AircraftWithLive[];
  loading: boolean;
  liveError: boolean;
  onSelectAircraft: (aircraft: AircraftWithLive) => void;
  onAdded: (newAircraft: AircraftWithLive) => void;
  onDeleted: (id: string) => void;
  onEdited: (updated: AircraftWithLive) => void;
}

const themes = ['light', 'dark', 'system'] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function AppSidebar(props: AppSidebarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  function cycleTheme() {
    const current = themes.indexOf((theme as (typeof themes)[number]) ?? 'system');
    setTheme(themes[(current + 1) % themes.length]);
  }

  const ThemeIcon = mounted ? (themeIcons[theme as keyof typeof themeIcons] ?? Monitor) : Monitor;

  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const userImage = session?.user?.image;
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : undefined;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <span className="text-lg font-semibold tracking-tight">Taillog</span>
      </SidebarHeader>

      <SidebarContent>
        <AircraftList {...props} />
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={userImage ?? undefined} alt={userName ?? 'User'} />
                <AvatarFallback className="text-xs">
                  {initials ?? <User className="h-3.5 w-3.5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                {userName && (
                  <span className="truncate text-sm font-medium leading-tight">{userName}</span>
                )}
                {userEmail && (
                  <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" side="top" align="start">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
            <ThemeIcon className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
