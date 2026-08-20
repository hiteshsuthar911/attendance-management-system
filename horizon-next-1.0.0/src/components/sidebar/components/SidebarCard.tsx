'use client';
import React, { useEffect, useState } from 'react';
import { Auth } from 'utils/auth';
import { IUser } from 'types/attendance';
import { MdLogout, MdSecurity, MdSchool, MdPerson, MdAdminPanelSettings } from 'react-icons/md';

const SidebarCard = () => {
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    setUser(Auth.getUser());
  }, []);

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'superadmin':
        return <MdSecurity className="h-5 w-5" />;
      case 'admin':
        return <MdAdminPanelSettings className="h-5 w-5" />;
      case 'faculty':
        return <MdSchool className="h-5 w-5" />;
      case 'student':
        return <MdPerson className="h-5 w-5" />;
      default:
        return <MdSecurity className="h-5 w-5" />;
    }
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'superadmin':
        return '⚡ System Controller';
      case 'admin':
        return '🏫 Dept Administrator';
      case 'faculty':
        return '👩‍🏫 Faculty Instructor';
      case 'student':
        return `🎓 Roll: ${user?.studentDetails?.rollNumber || 'Enrolled'}`;
      default:
        return 'Authenticated User';
    }
  };

  return (
    <div className="relative mt-4 flex w-[236px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f6ef7] via-[#432CF3] to-brand-500 p-4 shadow-md shadow-brand-500/20">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
        {getRoleIcon()}
      </div>

      <div className="mt-2 flex flex-col items-center text-center">
        <p className="text-xs font-bold text-white">
          {user?.name || 'User'}
        </p>
        <p className="text-[11px] text-white/80 truncate max-w-[200px]">
          {user?.email || 'user@attendance.com'}
        </p>
        <span className="mt-1.5 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
          {getRoleBadge()}
        </span>

        <button
          onClick={() => Auth.logout()}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/15 py-1.5 text-xs font-bold text-white transition hover:bg-white/25 active:bg-white/30"
        >
          <MdLogout className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarCard;
