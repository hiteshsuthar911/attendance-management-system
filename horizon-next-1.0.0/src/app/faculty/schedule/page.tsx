'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from 'components/card';
import {
  MdCalendarMonth,
  MdCheckCircle,
  MdSchedule,
  MdSearch,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';

export default function FacultySchedule() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadLectures = async () => {
      setLoading(true);
      try {
        const res = await fetchApi('/api/lectures');
        const data = await res.json();
        if (data.success) {
          setLectures(data.lectures || []);
        }
      } catch (err) {
        console.error('Error fetching timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLectures();
  }, []);

  const filteredLectures = lectures.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.subject?.toLowerCase().includes(term) ||
      l.branch?.toLowerCase().includes(term) ||
      l.timeSlot?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Faculty Lecture Timetable & Allocations
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete timetable of assigned lecture sessions across subjects and batches
        </p>
      </div>

      {/* Lectures Table Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Scheduled Allocations ({filteredLectures.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Timetable sessions scheduled by Department Administrators
            </p>
          </div>

          {/* Search Box */}
          <div className="flex h-10 w-full items-center rounded-xl bg-lightPrimary px-3 dark:bg-navy-900 sm:w-64">
            <MdSearch className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 w-full bg-transparent text-xs font-medium text-navy-700 outline-none placeholder:text-gray-400 dark:text-white"
            />
          </div>
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
                    Loading timetable...
                  </td>
                </tr>
              ) : filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No scheduled lectures found.
                  </td>
                </tr>
              ) : (
                filteredLectures.map((lec) => {
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
                          <span>Mark Attendance</span>
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
