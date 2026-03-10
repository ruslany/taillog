'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

interface NavbarProps {
  userName?: string | null;
  userImage?: string | null;
}

const themes = ['light', 'dark', 'system'] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function Navbar({ userName, userImage }: NavbarProps) {
  const { theme, setTheme } = useTheme();

  function cycleTheme() {
    const current = themes.indexOf((theme as (typeof themes)[number]) ?? 'system');
    setTheme(themes[(current + 1) % themes.length]);
  }

  // resolvedTheme is undefined on the server, so fall back to Monitor to avoid hydration mismatch
  const { resolvedTheme } = useTheme();
  const ThemeIcon = themeIcons[(resolvedTheme as keyof typeof themeIcons) ?? 'system'] ?? Monitor;

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <nav className="flex h-14 items-center justify-between border-b bg-background px-4">
      <span className="text-lg font-semibold tracking-tight">Taillog</span>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
          <ThemeIcon className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarImage src={userImage ?? undefined} alt={userName ?? 'User'} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => signOut({ callbackUrl: '/' })}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          className="hidden md:flex gap-2"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </nav>
  );
}
