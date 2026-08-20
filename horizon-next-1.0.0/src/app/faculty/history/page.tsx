'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from 'components/card';
import {
  MdHistory,
  MdCheckCircle,
  MdSearch,
  MdVisibility,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';

export default function FacultyHistory() {
  const [completedLectures, setCompletedLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await fetchApi('/api/lectures');
        const data = await res.json();
        if (data.success && data.lectures) {
          const completed = data.lectures.filter((l: any) => l.status === 'completed');
          setCompletedLectures(completed);
        }
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filteredHistory = completedLectures.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.subject?.toLowerCase().includes(term) ||
      l.branch?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Recorded Attendance History
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Audit of past attendance sessions recorded and submitted to the institutional ledger
        </p>
      </div>

      {/* History Table Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Conducted Sessions ({filteredHistory.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Completed student attendance sheets
            </p>
          </div>

          {/* Search Box */}
          <div className="flex h-10 w-full items-center rounded-xl bg-lightPrimary px-3 dark:bg-navy-900 sm:w-64">
            <MdSearch className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
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
                <th className="pb-3 font-semibold text-gray-400">Session Date</th>
                <th className="pb-3 font-semibold text-gray-400">Time Slot</th>
                <th className="pb-3 font-semibold text-gray-400">Subject</th>
                <th className="pb-3 font-semibold text-gray-400">Branch / Batch</th>
                <th className="pb-3 font-semibold text-gray-400">Status</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading history logs...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No completed attendance records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((lec) => {
                  const formattedDate = new Date(lec.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={lec._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="py-3 font-bold text-navy-700 dark:text-white">
                        {formattedDate}
                      </td>
                      <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                        {lec.timeSlot}
                      </td>
                      <td className="py-3 font-bold text-brand-500 dark:text-white">
                        {lec.subject}
                      </td>
                      <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                        {lec.branch} / {lec.batch}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
                          Completed
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/faculty/attendance?lectureId=${lec._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/10 px-3.5 py-1.5 text-xs font-bold text-purple-600 transition hover:bg-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400"
                        >
                          <MdVisibility className="h-3.5 w-3.5" />
                          <span>View Sheet</span>
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
