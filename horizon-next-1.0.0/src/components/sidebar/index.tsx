'use client';
import React, { useEffect, useState } from 'react';
import { HiX } from 'react-icons/hi';
import Links from './components/Links';
import SidebarCard from 'components/sidebar/components/SidebarCard';
import { IRoute } from 'types/navigation';
import { getRoutesByRole } from 'routes';
import { Auth } from 'utils/auth';
import { IUser } from 'types/attendance';
import Image from 'next/image';

function SidebarHorizon(props: { routes?: IRoute[]; open: boolean; setOpen: (val: boolean) => void; [x: string]: any }) {
  const { open, setOpen } = props;
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    setUser(Auth.getUser());
  }, []);

  const activeRoutes = getRoutesByRole(user?.role);

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'superadmin':
        return 'TCET Superadmin';
      case 'admin':
        return 'Department Admin';
      case 'faculty':
        return 'Faculty Portal';
      case 'student':
        return 'Student Portal';
      default:
        return 'Attendance System';
    }
  };

  return (
    <div
      className={`duration-175 linear fixed !z-50 flex h-full max-h-screen flex-col bg-white pb-6 shadow-2xl shadow-white/5 transition-all dark:!bg-navy-800 dark:text-white md:!z-50 lg:!z-50 xl:!z-0 overflow-y-auto ${
        open ? 'translate-x-0' : '-translate-x-96 xl:translate-x-0'
      }`}
    >
      <span
        className="absolute right-4 top-4 block cursor-pointer xl:hidden text-gray-600 dark:text-white"
        onClick={() => setOpen(false)}
      >
        <HiX className="h-6 w-6" />
      </span>

      <div className="mx-[28px] mt-[28px] flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-brand-500/10 dark:bg-navy-700">
          <Image
            src="/tcetlogo.png"
            alt="Thakur College Logo"
            width={36}
            height={36}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div className="flex flex-col">
          <div className="font-poppins text-[18px] font-extrabold uppercase tracking-tight text-navy-700 dark:text-white">
            Attend<span className="text-brand-500">MS</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500 dark:text-brand-400">
            {getRoleLabel()}
          </span>
        </div>
      </div>
      <div className="mb-4 mt-4 h-px bg-gray-200 dark:bg-white/10" />

      {/* Nav item */}
      <ul className="mb-auto pt-1">
        <Links routes={activeRoutes} />
      </ul>

      {/* User Status Card */}
      <div className="flex justify-center px-3">
        <SidebarCard />
      </div>
    </div>
  );
}

export default SidebarHorizon;
