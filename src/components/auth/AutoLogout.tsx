'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function AutoLogout() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Log the user out and redirect with a reason
        signOut({ redirect: false }).then(() => {
          router.push('/login?error=SessionExpired');
        });
      }, IDLE_TIMEOUT_MS);
    };

    // Listen for activity
    const events = ['mousemove', 'keydown', 'wheel', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [session, router]);

  return null; // This component is invisible
}