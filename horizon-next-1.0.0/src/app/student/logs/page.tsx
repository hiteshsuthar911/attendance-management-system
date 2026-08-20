'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdHistory,
  MdCheckCircle,
  MdCancel,
  MdSearch,
  MdClass,
  MdFilterList,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';

export default function StudentLogs() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const res = await fetchApi('/api/attendance/my-attendance');
        const data = await res.json();
        if (data.success && data.records) {
          setRecords(data.records);
        }
      } catch (err) {
        console.error('Error fetching student logs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  // Compute subject-wise statistics
  const subjectStats: { [subject: string]: { total: number; attended: number } } = {};
  records.forEach((r) => {
    const subj = r.lecture?.subject || 'Other';
    if (!subjectStats[subj]) {
      subjectStats[subj] = { total: 0, attended: 0 };
    }
    subjectStats[subj].total += 1;
    if (r.status === 'present') {
      subjectStats[subj].attended += 1;
    }
  });

  const filteredRecords = records.filter((r) => {
    const lec = r.lecture || {};
    const term = search.toLowerCase();
    const subMatch = lec.subject?.toLowerCase().includes(term);
    const facMatch = lec.faculty?.name?.toLowerCase().includes(term);

    const statusMatch =
      statusFilter === 'all' ? true : r.status === statusFilter;

    return (subMatch || facMatch) && statusMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Detailed Attendance Logs & Subject Audit
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete subject-wise lecture breakdown and chronological attendance logs
        </p>
      </div>

      {/* Subject-Wise Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Object.keys(subjectStats).map((subj) => {
          const stat = subjectStats[subj];
          const pct = Math.round((stat.attended / stat.total) * 100);
          const isGood = pct >= 75;

          return (
            <Card key={subj} extra="p-4 border border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/20">
                  <MdClass className="h-5 w-5" />
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isGood
                      ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  }`}
                >
                  {pct}%
                </span>
              </div>
              <h4 className="mt-3 truncate text-sm font-bold text-navy-700 dark:text-white" title={subj}>
                {subj}
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Attended {stat.attended} of {stat.total} sessions
              </p>
            </Card>
          );
        })}
      </div>

      {/* Full Attendance Logs Table Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Attendance Log Sheet ({filteredRecords.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chronological log of verified session attendance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex rounded-xl bg-lightPrimary p-1 dark:bg-navy-900">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-navy-700 shadow-sm dark:bg-navy-800 dark:text-white'
                    : 'text-gray-500'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('present')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === 'present'
                    ? 'bg-white text-green-600 shadow-sm dark:bg-navy-800 dark:text-green-400'
                    : 'text-gray-500'
                }`}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('absent')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === 'absent'
                    ? 'bg-white text-red-600 shadow-sm dark:bg-navy-800 dark:text-red-400'
                    : 'text-gray-500'
                }`}
              >
                Absent
              </button>
            </div>

            {/* Search Box */}
            <div className="flex h-10 w-full items-center rounded-xl bg-lightPrimary px-3 dark:bg-navy-900 sm:w-56">
              <MdSearch className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subject, faculty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-2 w-full bg-transparent text-xs font-medium text-navy-700 outline-none placeholder:text-gray-400 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 font-semibold text-gray-400">#</th>
                <th className="pb-3 font-semibold text-gray-400">Session Date</th>
                <th className="pb-3 font-semibold text-gray-400">Time Slot</th>
                <th className="pb-3 font-semibold text-gray-400">Subject</th>
                <th className="pb-3 font-semibold text-gray-400">Faculty Instructor</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading attendance logs...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No matching attendance logs found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const lec = rec.lecture || {};
                  const isPresent = rec.status === 'present';
                  const formattedDate = lec.date
                    ? new Date(lec.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={rec._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="py-3 text-gray-400">{idx + 1}</td>
                      <td className="py-3 font-bold text-navy-700 dark:text-white">
                        {formattedDate}
                      </td>
                      <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                        {lec.timeSlot || '—'}
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
