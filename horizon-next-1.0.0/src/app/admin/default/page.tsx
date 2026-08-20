'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Widget from 'components/widget/Widget';
import Card from 'components/card';
import {
  MdApartment,
  MdAdminPanelSettings,
  MdSchool,
  MdPeople,
  MdClass,
  MdArrowForward,
  MdWarningAmber,
  MdRefresh,
  MdAssessment,
} from 'react-icons/md';
import { fetchApi, Auth } from 'utils/auth';
import { IDepartment, IUser } from 'types/attendance';

export default function SuperadminOverview() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    departments: 0,
    admins: 0,
    faculty: 0,
    students: 0,
    lectures: 0,
  });
  const [departments, setDepartments] = useState<IDepartment[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const u = Auth.getUser();
      setCurrentUser(u);

      const [resStats, resAdmins, resDepts] = await Promise.all([
        fetchApi('/api/reports/all'),
        fetchApi('/api/users?role=admin'),
        fetchApi('/api/departments'),
      ]);

      const dataStats = await resStats.json();
      const dataAdmins = await resAdmins.json();
      const dataDepts = await resDepts.json();

      if (dataStats.success && dataStats.summary) {
        setStats({
          departments: dataStats.summary.totalDepartments || 0,
          admins:
            dataAdmins.success && dataAdmins.users
              ? dataAdmins.users.length
              : dataAdmins.count || 0,
          faculty: dataStats.summary.totalFaculty || 0,
          students: dataStats.summary.totalStudents || 0,
          lectures: dataStats.summary.totalLectures || 0,
        });
      }

      if (dataDepts.success) {
        setDepartments(dataDepts.departments || []);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const isSuperadmin = currentUser?.role === 'superadmin';

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            {isSuperadmin ? 'Superadmin System Overview' : 'Department Admin Dashboard'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSuperadmin
              ? 'Institution-wide aggregate metrics, programs, departments, and system governance'
              : 'Department student roster, lecture timetable scheduling, and monthly reports'}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
        >
          <MdRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Widget
          icon={<MdApartment className="h-7 w-7" />}
          title="Departments"
          subtitle={loading ? '...' : String(stats.departments)}
        />
        {isSuperadmin ? (
          <Widget
            icon={<MdAdminPanelSettings className="h-7 w-7" />}
            title="Dept Admins"
            subtitle={loading ? '...' : String(stats.admins)}
          />
        ) : (
          <Widget
            icon={<MdClass className="h-7 w-7" />}
            title="Lectures"
            subtitle={loading ? '...' : String(stats.lectures)}
          />
        )}
        <Widget
          icon={<MdSchool className="h-7 w-7" />}
          title="Faculty"
          subtitle={loading ? '...' : String(stats.faculty)}
        />
        <Widget
          icon={<MdPeople className="h-7 w-7" />}
          title="Students"
          subtitle={loading ? '...' : String(stats.students)}
        />
        <Widget
          icon={<MdAssessment className="h-7 w-7" />}
          title="Total Reports"
          subtitle={loading ? '...' : String(stats.lectures)}
        />
      </div>

      {/* Quick Navigation Cards — Tailored by Role */}
      {isSuperadmin ? (
        // Super Admin Cards: Overview, Degrees & Branches, Departments, Manage Admins, User Directory, System Reset
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Link href="/admin/programs">
            <Card extra="p-4 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-navy-700 dark:text-white">
                  <MdSchool className="h-5 w-5" />
                </div>
                <MdArrowForward className="h-4 w-4 text-gray-400" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                Degrees & Branches
              </h4>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Configure programs, degrees, branches & batches.
              </p>
            </Card>
          </Link>

          <Link href="/admin/departments">
            <Card extra="p-4 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  <MdApartment className="h-5 w-5" />
                </div>
                <MdArrowForward className="h-4 w-4 text-gray-400" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                Departments
              </h4>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Create and manage college departments.
              </p>
            </Card>
          </Link>

          <Link href="/admin/admins">
            <Card extra="p-4 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20">
                  <MdAdminPanelSettings className="h-5 w-5" />
                </div>
                <MdArrowForward className="h-4 w-4 text-gray-400" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                Manage Admins
              </h4>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Supervise department admin accounts and access.
              </p>
            </Card>
          </Link>

          <Link href="/admin/directory">
            <Card extra="p-4 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20">
                  <MdPeople className="h-5 w-5" />
                </div>
                <MdArrowForward className="h-4 w-4 text-gray-400" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                User Directory
              </h4>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                View all faculties & enrolled students across the institution.
              </p>
            </Card>
          </Link>

          <Link href="/admin/reset">
            <Card extra="p-4 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-red-500/30 bg-red-50/20 dark:bg-red-950/10">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
                  <MdWarningAmber className="h-5 w-5" />
                </div>
                <MdArrowForward className="h-4 w-4 text-red-400" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-red-600 dark:text-red-400">
                System Reset
              </h4>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Master database reset and cleanup tools.
              </p>
            </Card>
          </Link>
        </div>
      ) : (
        // Department Admin Cards: Students & Bulk Import, Faculty, Lectures Schedule, Attendance Reports
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/students">
            <Card extra="p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20 bg-brand-50/10">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20">
                  <MdPeople className="h-6 w-6" />
                </div>
                <MdArrowForward className="h-5 w-5 text-blue-400" />
              </div>
              <h4 className="mt-4 text-base font-bold text-navy-700 dark:text-white">
                ⚡ Students & Bulk Import
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enroll students, assign batches, and upload rosters in bulk.
              </p>
            </Card>
          </Link>

          <Link href="/admin/faculties">
            <Card extra="p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 dark:bg-green-500/20">
                  <MdSchool className="h-6 w-6" />
                </div>
                <MdArrowForward className="h-5 w-5 text-gray-400" />
              </div>
              <h4 className="mt-4 text-base font-bold text-navy-700 dark:text-white">
                Department Faculty
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Manage teachers and subject allocations for your department.
              </p>
            </Card>
          </Link>

          <Link href="/admin/lectures">
            <Card extra="p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20">
                  <MdClass className="h-6 w-6" />
                </div>
                <MdArrowForward className="h-5 w-5 text-gray-400" />
              </div>
              <h4 className="mt-4 text-base font-bold text-navy-700 dark:text-white">
                Lectures Schedule
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Create lecture timetables, allocate batches and rooms.
              </p>
            </Card>
          </Link>

          <Link href="/admin/reports">
            <Card extra="p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 dark:bg-orange-500/20">
                  <MdAssessment className="h-6 w-6" />
                </div>
                <MdArrowForward className="h-5 w-5 text-gray-400" />
              </div>
              <h4 className="mt-4 text-base font-bold text-navy-700 dark:text-white">
                Attendance Reports
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Generate monthly matrices, register grids & print sheets.
              </p>
            </Card>
          </Link>
        </div>
      )}

      {/* College Departments Summary Card */}
      <Card extra="p-6">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h3 className="text-xl font-bold text-navy-700 dark:text-white">
              Registered Departments Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All active academic departments configured in the system
            </p>
          </div>
          {isSuperadmin && (
            <Link
              href="/admin/departments"
              className="text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-white"
            >
              Manage All &rarr;
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 font-semibold text-gray-400">Code</th>
                <th className="pb-3 font-semibold text-gray-400">Department Name</th>
                <th className="pb-3 font-semibold text-gray-400">Description</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                    No departments created yet.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept._id}>
                    <td className="py-3 font-mono font-bold text-brand-500">
                      {dept.code}
                    </td>
                    <td className="py-3 font-semibold text-navy-700 dark:text-white">
                      {dept.name}
                    </td>
                    <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                      {dept.description || '—'}
                    </td>
                    <td className="py-3 text-right">
                      <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-500">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
