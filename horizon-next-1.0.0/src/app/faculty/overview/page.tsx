'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Widget from 'components/widget/Widget';
import Card from 'components/card';
import {
  MdClass,
  MdCheckCircle,
  MdSchedule,
  MdArrowForward,
  MdCalendarMonth,
  MdHistory,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';

export default function FacultyOverview() {
  const [loading, setLoading] = useState(true);
  const [lectures, setLectures] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    conducted: 0,
    pending: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/lectures');
      const data = await res.json();

      if (data.success && data.lectures) {
        const lecs = data.lectures;
        setLectures(lecs);
        const conducted = lecs.filter((l: any) => l.status === 'completed').length;
        setStats({
          totalSessions: lecs.length,
          conducted,
          pending: lecs.length - conducted,
        });
      }
    } catch (err) {
      console.error('Error loading faculty stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Faculty Lecture & Attendance Portal
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Overview of scheduled lecture allocations and student attendance sessions
        </p>
      </div>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Widget
          icon={<MdClass className="h-7 w-7" />}
          title="Allocated Lectures"
          subtitle={loading ? '...' : String(stats.totalSessions)}
        />
        <Widget
          icon={<MdCheckCircle className="h-7 w-7" />}
          title="Attendance Completed"
          subtitle={loading ? '...' : String(stats.conducted)}
        />
        <Widget
          icon={<MdSchedule className="h-7 w-7" />}
          title="Pending Sessions"
          subtitle={loading ? '...' : String(stats.pending)}
        />
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Link href="/faculty/attendance">
          <Card extra="p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 dark:bg-green-500/20">
                <MdCheckCircle className="h-6 w-6" />
              </div>
              <MdArrowForward className="h-5 w-5 text-gray-400" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-navy-700 dark:text-white">
              Mark Student Attendance
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Open active session roster and take real-time attendance.
            </p>
          </Card>
        </Link>

        <Link href="/faculty/schedule">
          <Card extra="p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-500/20">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/20">
                <MdCalendarMonth className="h-6 w-6" />
              </div>
              <MdArrowForward className="h-5 w-5 text-gray-400" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-navy-700 dark:text-white">
              My Lecture Timetable
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              View upcoming sessions, subject schedules & time slots.
            </p>
          </Card>
        </Link>

        <Link href="/faculty/history">
          <Card extra="p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20">
                <MdHistory className="h-6 w-6" />
              </div>
              <MdArrowForward className="h-5 w-5 text-gray-400" />
            </div>
            <h4 className="mt-4 text-lg font-bold text-navy-700 dark:text-white">
              Attendance History
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Review past recorded attendance logs and student presence.
            </p>
          </Card>
        </Link>
      </div>

      {/* Upcoming Lectures Schedule Table */}
      <Card extra="p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Upcoming & Active Lecture Schedule
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scheduled lectures ready for student attendance marking
            </p>
          </div>
          <Link
            href="/faculty/attendance"
            className="text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-white"
          >
            Go to Attendance &rarr;
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 font-semibold text-gray-400">Date & Slot</th>
                <th className="pb-3 font-semibold text-gray-400">Subject</th>
                <th className="pb-3 font-semibold text-gray-400">Branch / Batch</th>
                <th className="pb-3 font-semibold text-gray-400">Status</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Loading lectures...
                  </td>
                </tr>
              ) : lectures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No lectures allocated.
                  </td>
                </tr>
              ) : (
                lectures.slice(0, 6).map((lec) => {
                  const formattedDate = new Date(lec.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={lec._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="py-3 text-navy-700 dark:text-white">
                        <div className="flex flex-col">
                          <span className="font-bold">{formattedDate}</span>
                          <span className="text-xs text-gray-400">{lec.timeSlot}</span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-brand-500 dark:text-white">
                        {lec.subject}
                      </td>
                      <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                        {lec.branch} / {lec.batch}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                            lec.status === 'completed'
                              ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}
                        >
                          {lec.status || 'scheduled'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/faculty/attendance?lectureId=${lec._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600"
                        >
                          <MdCheckCircle className="h-3.5 w-3.5" />
                          <span>Take Attendance</span>
                        </Link>
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
