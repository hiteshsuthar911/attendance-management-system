import React from 'react';
import {
  MdDashboard,
  MdApartment,
  MdAdminPanelSettings,
  MdPeople,
  MdWarningAmber,
  MdSchool,
  MdClass,
  MdAssessment,
  MdCheckCircle,
  MdHistory,
  MdCalendarMonth,
} from 'react-icons/md';
import { IRoute } from 'types/navigation';

export const superadminRoutes: IRoute[] = [
  {
    name: 'Overview',
    layout: '/admin',
    path: 'default',
    icon: <MdDashboard className="h-6 w-6" />,
  },
  {
    name: 'Degrees & Branches',
    layout: '/admin',
    path: 'programs',
    icon: <MdSchool className="h-6 w-6" />,
  },
  {
    name: 'Departments',
    layout: '/admin',
    path: 'departments',
    icon: <MdApartment className="h-6 w-6" />,
  },
  {
    name: 'Manage Admins',
    layout: '/admin',
    path: 'admins',
    icon: <MdAdminPanelSettings className="h-6 w-6" />,
  },
  {
    name: 'User Directory',
    layout: '/admin',
    path: 'directory',
    icon: <MdPeople className="h-6 w-6" />,
  },
  {
    name: 'System Reset',
    layout: '/admin',
    path: 'reset',
    icon: <MdWarningAmber className="h-6 w-6" />,
  },
];

export const adminRoutes: IRoute[] = [
  {
    name: 'Overview',
    layout: '/admin',
    path: 'default',
    icon: <MdDashboard className="h-6 w-6" />,
  },
  {
    name: 'Students & Bulk Import',
    layout: '/admin',
    path: 'students',
    icon: <MdPeople className="h-6 w-6" />,
  },
  {
    name: 'Faculty',
    layout: '/admin',
    path: 'faculties',
    icon: <MdSchool className="h-6 w-6" />,
  },
  {
    name: 'Lectures Schedule',
    layout: '/admin',
    path: 'lectures',
    icon: <MdClass className="h-6 w-6" />,
  },
  {
    name: 'Attendance Reports',
    layout: '/admin',
    path: 'reports',
    icon: <MdAssessment className="h-6 w-6" />,
  },
];

export const facultyRoutes: IRoute[] = [
  {
    name: 'Overview',
    layout: '/faculty',
    path: 'overview',
    icon: <MdDashboard className="h-6 w-6" />,
  },
  {
    name: 'My Schedule',
    layout: '/faculty',
    path: 'schedule',
    icon: <MdCalendarMonth className="h-6 w-6" />,
  },
  {
    name: 'Mark Attendance',
    layout: '/faculty',
    path: 'attendance',
    icon: <MdCheckCircle className="h-6 w-6" />,
  },
  {
    name: 'Attendance History',
    layout: '/faculty',
    path: 'history',
    icon: <MdHistory className="h-6 w-6" />,
  },
];

export const studentRoutes: IRoute[] = [
  {
    name: 'My Attendance',
    layout: '/student',
    path: 'overview',
    icon: <MdDashboard className="h-6 w-6" />,
  },
  {
    name: 'Attendance Logs',
    layout: '/student',
    path: 'logs',
    icon: <MdHistory className="h-6 w-6" />,
  },
];

export const getRoutesByRole = (role?: string): IRoute[] => {
  switch (role) {
    case 'superadmin':
      return superadminRoutes;
    case 'admin':
      return adminRoutes;
    case 'faculty':
      return facultyRoutes;
    case 'student':
      return studentRoutes;
    default:
      return superadminRoutes;
  }
};

const defaultRoutes: IRoute[] = [
  ...superadminRoutes,
  ...adminRoutes,
  ...facultyRoutes,
  ...studentRoutes,
];

export default defaultRoutes;
