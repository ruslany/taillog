import { auth } from '@/lib/auth';
import { Navbar } from '@/components/navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userName={session?.user?.name} userImage={session?.user?.image} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
