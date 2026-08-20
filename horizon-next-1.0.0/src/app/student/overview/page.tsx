'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Widget from 'components/widget/Widget';
import Card from 'components/card';
import {
  MdSchool,
  MdCheckCircle,
  MdClass,
  MdPieChart,
  MdWarning,
  MdHistory,
} from 'react-icons/md';
import { fetchApi, Auth } from 'utils/auth';
import { IUser } from 'types/attendance';

export default function StudentOverview() {
  const [user, setUser] = useState<IUser | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = Auth.getUser();
      setUser(u);

      const res = await fetchApi('/api/attendance/my-attendance');
      const data = await res.json();

      if (data.success && data.records) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Error loading student attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = records.length;
  const attended = records.filter((r) => r.status === 'present').length;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  const isEligible = percentage >= 75;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Student Attendance Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Official attendance records and academic session metrics
        </p>
      </div>

      {/* Student Banner Card */}
      <Card extra="p-6 bg-gradient-to-r from-brand-500 to-indigo-600 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <MdSchool className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Enrolled Student
              </span>
              <h3 className="mt-1 text-2xl font-extrabold">{user?.name || 'Student'}</h3>
              <p className="text-xs text-white/80">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md">
              <span className="text-[10px] font-semibold uppercase text-white/70">Roll No</span>
              <p className="font-extrabold">{user?.studentDetails?.rollNumber || '—'}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md">
              <span className="text-[10px] font-semibold uppercase text-white/70">Branch / Batch</span>
              <p className="font-extrabold">
                {user?.studentDetails?.branch || 'SD'} / {user?.studentDetails?.batch || 'Batch-5'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Widget
          icon={<MdPieChart className="h-7 w-7" />}
          title="Overall Attendance"
          subtitle={loading ? '...' : `${percentage}%`}
        />
        <Widget
          icon={<MdClass className="h-7 w-7" />}
          title="Total Conducted Lectures"
          subtitle={loading ? '...' : String(total)}
        />
        <Widget
          icon={<MdCheckCircle className="h-7 w-7" />}
          title="Lectures Attended"
          subtitle={loading ? '...' : String(attended)}
        />
      </div>

      {/* Attendance Eligibility Alert */}
      <div
        className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold ${
          isEligible
            ? 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300'
            : 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300'
        }`}
      >
        {isEligible ? (
          <MdCheckCircle className="h-6 w-6 shrink-0 text-green-500" />
        ) : (
          <MdWarning className="h-6 w-6 shrink-0 text-red-500" />
        )}
        <div>
          <span className="font-bold">
            {isEligible ? 'Eligibility Status: Good Standing' : 'Eligibility Status: Attendance Warning'}
          </span>
          <p className="text-xs font-normal opacity-90">
            {isEligible
              ? 'Your aggregate attendance satisfies the college minimum threshold (75%). Keep it up!'
              : 'Your aggregate attendance is below 75%. Please attend upcoming lecture sessions to avoid exam detention.'}
          </p>
        </div>
      </div>

      {/* Recent Attendance Records */}
      <Card extra="p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Recent Attendance Records
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Latest lecture attendance marked by faculty
            </p>
          </div>
          <Link
            href="/student/logs"
            className="text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-white"
          >
            View All Logs &rarr;
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 font-semibold text-gray-400">Date & Slot</th>
                <th className="pb-3 font-semibold text-gray-400">Subject</th>
                <th className="pb-3 font-semibold text-gray-400">Faculty</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No attendance records found yet.
                  </td>
                </tr>
              ) : (
                records.slice(0, 8).map((rec) => {
                  const lec = rec.lecture || {};
                  const isPresent = rec.status === 'present';
                  const formattedDate = lec.date
                    ? new Date(lec.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={rec._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="py-3 text-navy-700 dark:text-white">
                        <div className="flex flex-col">
                          <span className="font-bold">{formattedDate}</span>
                          <span className="text-xs text-gray-400">{lec.timeSlot || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-brand-500 dark:text-white">
                        {lec.subject || 'Lecture'}
                      </td>
                      <td className="py-3 text-xs text-gray-600 dark:text-gray-300">
                        {lec.faculty?.name || 'Faculty Instructor'}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${
                            isPresent
                              ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                          }`}
                        >
                          {isPresent ? '✓ Present' : '✗ Absent'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
