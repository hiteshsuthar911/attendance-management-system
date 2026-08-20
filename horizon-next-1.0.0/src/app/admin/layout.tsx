'use client';
// Layout components
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import routes from 'routes';
import {
  getActiveNavbar,
  getActiveRoute,
  isWindowAvailable,
} from 'utils/navigation';
import React from 'react';
import Navbar from 'components/navbar';
import Sidebar from 'components/sidebar';
import Footer from 'components/footer/Footer';

export default function Admin({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (isWindowAvailable()) document.documentElement.dir = 'ltr';

  return (
    <div className="flex min-h-screen w-full bg-background-100 dark:bg-background-900">
      <Sidebar routes={routes} open={open} setOpen={setOpen} variant="admin" />
      {/* Navbar & Main Content */}
      <div className="flex min-h-screen w-full flex-col justify-between font-dm dark:bg-navy-900">
        {/* Main Content */}
        <main className="mx-2.5 flex flex-1 flex-col justify-between transition-all dark:bg-navy-900 md:pr-2 xl:ml-[323px]">
          <div>
            <Navbar
              onOpenSidenav={() => setOpen(!open)}
              brandText={getActiveRoute(routes, pathname)}
              secondary={getActiveNavbar(routes, pathname)}
            />
            <div className="mx-auto p-2 !pt-[10px] md:p-2">
              {children}
            </div>
          </div>
          <div className="p-3">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
