'use client';
import React, { useEffect, useState } from 'react';
import Dropdown from 'components/dropdown';
import { FiAlignJustify } from 'react-icons/fi';
import NavLink from 'components/link/NavLink';
import { RiMoonFill, RiSunFill } from 'react-icons/ri';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { MdLogout, MdShield, MdPerson } from 'react-icons/md';
import { Auth } from 'utils/auth';
import { IUser } from 'types/attendance';

const Navbar = (props: {
  onOpenSidenav: () => void;
  brandText: string;
  secondary?: boolean | string;
  [x: string]: any;
}) => {
  const { onOpenSidenav, brandText } = props;
  const [darkmode, setDarkmode] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    setUser(Auth.getUser());
    if (typeof document !== 'undefined') {
      setDarkmode(document.body.classList.contains('dark'));
    }
  }, []);

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="ml-[6px]">
        <div className="h-6 w-[224px] pt-1">
          <a
            className="text-sm font-normal text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href="#"
          >
            Superadmin
            <span className="mx-1 text-sm text-navy-700 hover:text-navy-700 dark:text-white">
              {' '}/{' '}
            </span>
          </a>
          <NavLink
            className="text-sm font-normal capitalize text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href="#"
          >
            {brandText}
          </NavLink>
        </div>
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <NavLink
            href="#"
            className="font-bold capitalize hover:text-navy-700 dark:hover:text-white"
          >
            {brandText}
          </NavLink>
        </p>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-[280px] flex-grow items-center justify-end gap-3 rounded-full bg-white px-3 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:w-[320px] md:flex-grow-0">
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>

        {/* Notifications Dropdown */}
        <Dropdown
          button={
            <p className="cursor-pointer text-gray-600 hover:text-brand-500 dark:text-white">
              <IoMdNotificationsOutline className="h-5 w-5" />
            </p>
          }
          animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
          classNames={'py-2 top-4 -left-[230px] md:-left-[300px] w-max'}
        >
          <div className="flex w-[320px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-navy-700 dark:text-white">
                System Alerts
              </p>
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-bold text-brand-500">
                Live
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-lightPrimary p-3 dark:bg-navy-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                <MdShield className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-bold text-navy-700 dark:text-white">
                  2FA & Security Active
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Master reset password gate enabled.
                </p>
              </div>
            </div>
          </div>
        </Dropdown>

        {/* Dark Mode Toggle */}
        <div
          className="cursor-pointer text-gray-600 transition hover:text-brand-500 dark:text-white"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove('dark');
              setDarkmode(false);
            } else {
              document.body.classList.add('dark');
              setDarkmode(true);
            }
          }}
        >
          {darkmode ? (
            <RiSunFill className="h-5 w-5" />
          ) : (
            <RiMoonFill className="h-5 w-5" />
          )}
        </div>

        {/* Profile & Dropdown */}
        <Dropdown
          button={
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
          }
          classNames={'py-2 top-8 -left-[180px] w-max'}
        >
          <div className="flex w-60 flex-col rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
                  {user?.name || 'Super Admin'}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || 'superadmin@attendance.com'}
                </p>
              </div>
            </div>

            <div className="my-3 h-px w-full bg-gray-200 dark:bg-white/10" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <MdShield className="h-4 w-4 text-brand-500" />
                <span>Superadmin Role</span>
              </div>
              <button
                onClick={() => Auth.logout()}
                className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30"
              >
                <MdLogout className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
