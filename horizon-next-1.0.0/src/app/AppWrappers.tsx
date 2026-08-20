'use client';
import React, { ReactNode, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import 'styles/App.css';
import 'styles/Contact.css';
import 'styles/MiniCalendar.css';
import 'styles/index.css';

import dynamic from 'next/dynamic';
import { Auth } from 'utils/auth';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 Minutes Auto-Logout

const _NoSSR: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Service worker unregister to prevent stale asset cache
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  // 2. Client Route Guard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isAuthPage = pathname.startsWith('/auth');
    const token = Auth.getToken();
    const user = Auth.getUser();

    if (!token || !user) {
      if (!isAuthPage) {
        router.replace('/auth/sign-in');
      }
    } else {
      // If user is on an unauthorized section, route accordingly
      if (pathname.startsWith('/admin') && user.role !== 'superadmin' && user.role !== 'admin') {
        router.replace(user.role === 'faculty' ? '/faculty/overview' : '/student/overview');
      } else if (pathname.startsWith('/faculty') && user.role !== 'faculty' && user.role !== 'superadmin' && user.role !== 'admin') {
        router.replace('/student/overview');
      } else if (pathname.startsWith('/student') && user.role !== 'student' && user.role !== 'superadmin' && user.role !== 'admin') {
        router.replace('/admin/default');
      }
    }
  }, [pathname, router]);

  // 3. 5-Minute Inactivity Auto-Logout Tracker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname.startsWith('/auth')) return;

    const resetInactivityTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const token = Auth.getToken();
        if (token) {
          Auth.clearAuth();
          window.location.href = '/auth/sign-in?reason=session_timeout';
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [pathname]);

  return <React.Fragment>{children}</React.Fragment>;
};

const NoSSR = dynamic(() => Promise.resolve(_NoSSR), {
  ssr: false,
});

export default function AppWrappers({ children }: { children: ReactNode }) {
  return <NoSSR>{children}</NoSSR>;
}
