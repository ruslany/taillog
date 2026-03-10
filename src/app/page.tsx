import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth';

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Taillog</h1>
        <p className="max-w-sm text-muted-foreground">
          Track the aircraft you&apos;ve flown on and follow them live on a map.
        </p>
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/dashboard' });
          }}
        >
          <Button type="submit" size="lg">
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
