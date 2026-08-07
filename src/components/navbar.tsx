'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Camera, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NavbarProps {
  user: {
    userId: number;
    username: string;
    role: 'user' | 'admin';
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully.',
      });
      router.push('/login');
      router.refresh();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Logout Error',
        description: 'Failed to log out.',
      });
    }
  };

  return (
    <header className="bg-background border-b sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl font-headline">
            <Camera className="h-6 w-6 text-primary" />
            <span>PhotoNamer</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                {user.role === 'admin' ? (
                  <Shield className="h-4 w-4 text-amber-500" />
                ) : (
                  <UserIcon className="h-4 w-4 text-primary" />
                )}
                <span className="font-medium text-foreground">{user.username}</span>
                <span className="text-xs bg-background px-2 py-0.5 rounded border capitalize font-semibold">
                  {user.role}
                </span>
              </div>

              {user.role === 'admin' && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4 text-amber-500" />
                    Admin View
                  </Link>
                </Button>
              )}

              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
