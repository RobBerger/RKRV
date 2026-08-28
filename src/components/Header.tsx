import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          RV Park Tracker
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="hidden sm:inline">{user.email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
