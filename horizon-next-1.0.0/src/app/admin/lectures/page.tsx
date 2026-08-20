'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdClass,
  MdAdd,
  MdDelete,
  MdSearch,
  MdCalendarMonth,
  MdSchedule,
  MdSchool,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';
import { IDepartment, IUser, IAcademicProgram } from 'types/attendance';

export default function ManageLectures() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [programs, setPrograms] = useState<IAcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form state
  const [subject, setSubject] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [branch, setBranch] = useState('SD');
  const [batch, setBatch] = useState('Batch-5');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('9:30am to 11:30am');
  const [remarks, setRemarks] = useState('Regular Lecture');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const presetSlots = [
    '9:30am to 11:30am',
    '11:30am to 1:00pm',
    '1:30pm to 3:00pm',
    '3:00pm to 4:30pm',
    '10:00am to 11:30am',
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [resLectures, resFaculties, resDepts, resProgs] = await Promise.all([
        fetchApi('/api/lectures'),
        fetchApi('/api/users?role=faculty'),
        fetchApi('/api/departments'),
        fetchApi('/api/academic-programs'),
      ]);

      const dataLectures = await resLectures.json();
      const dataFaculties = await resFaculties.json();
      const dataDepts = await resDepts.json();
      const dataProgs = await resProgs.json();

      if (dataLectures.success) {
        setLectures(dataLectures.lectures || []);
      }
      if (dataFaculties.success) {
        setFaculties(dataFaculties.users || []);
        if (!facultyId && dataFaculties.users.length > 0) {
          setFacultyId(dataFaculties.users[0]._id);
        }
      }
      if (dataDepts.success) {
        setDepartments(dataDepts.departments || []);
        if (!deptId && dataDepts.departments.length > 0) {
          setDeptId(dataDepts.departments[0]._id);
        }
      }
      if (dataProgs.success) {
        setPrograms(dataProgs.programs || []);
        if (dataProgs.programs.length > 0) {
          const firstProg = dataProgs.programs[0];
          setSelectedProgramId(firstProg._id);
          setBranch(firstProg.branchCode);
          if (firstProg.batches && firstProg.batches.length > 0) {
            setBatch(firstProg.batches[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching lecture schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProgramSelect = (progId: string) => {
    setSelectedProgramId(progId);
    const selected = programs.find((p) => p._id === progId);
    if (selected) {
      setBranch(selected.branchCode);
      if (selected.batches && selected.batches.length > 0) {
        setBatch(selected.batches[0]);
      }
      if (selected.department) {
        const dId = typeof selected.department === 'object' ? selected.department._id : selected.department;
        if (dId) setDeptId(dId);
      }
    }
  };

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);

    try {
      const res = await fetchApi('/api/lectures', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          faculty: facultyId,
          department: deptId,
          branch: branch.trim().toUpperCase(),
          batch: batch.trim(),
          date,
          timeSlot,
          remarks,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: `Lecture for "${subject}" scheduled successfully!` });
        setSubject('');
        loadData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to schedule lecture' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Error communicating with server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, subj: string) => {
    if (!window.confirm(`Are you sure you want to cancel the lecture for "${subj}"?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/api/lectures/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to delete lecture');
      }
    } catch (err) {
      alert('Error deleting lecture');
    }
  };

  const filteredLectures = lectures.filter((l) => {
    const term = search.toLowerCase();
    const subMatch = l.subject?.toLowerCase().includes(term);
    const facMatch = l.faculty?.name?.toLowerCase().includes(term);
    const branchMatch = l.branch?.toLowerCase().includes(term);
    return subMatch || facMatch || branchMatch;
  });

  const activeSelectedProg = programs.find((p) => p._id === selectedProgramId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Lecture Timetable & Session Scheduling
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create, schedule, and allocate lectures to faculties under configured Degree Programs
        </p>
      </div>

      {/* Schedule Lecture Form Card */}
      <Card extra="p-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
          <MdSchedule className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy-700 dark:text-white">
            Schedule New Lecture Session
          </h3>
        </div>

        {msg && (
          <div
            className={`mt-4 rounded-xl p-3.5 text-xs font-bold ${
              msg.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20'
                : 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCreateLecture} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Subject Name*
            </label>
            <input
              type="text"
              placeholder="e.g. Software Engineering"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Assigned Faculty*
            </label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              required
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {faculties.length === 0 ? (
                <option value="">-- No Faculties Found (Create in Faculty Tab first) --</option>
              ) : (
                faculties.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Department
            </label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Degree & Branch Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Degree & Branch Program
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramSelect(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-brand-500/30 bg-brand-50/20 px-3 text-xs font-bold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.degree} — {p.branchName} ({p.branchCode})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Batch Selection
            </label>
            {activeSelectedProg && activeSelectedProg.batches && activeSelectedProg.batches.length > 0 ? (
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              >
                {activeSelectedProg.batches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. Batch-5"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Lecture Date*
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          {/* Time Slot with Quick Chips */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Time Slot*
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {presetSlots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    timeSlot === slot
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-700 dark:text-gray-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              required
              className="mt-2 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Session Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Regular Lecture"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div className="flex items-end md:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
            >
              <MdAdd className="h-5 w-5" />
              <span>{submitting ? 'Scheduling...' : 'Schedule Lecture Session'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Lectures Timetable Table Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Scheduled Lectures Timetable
            </h3>
            <p className="text-xs text-gray-400">Total Sessions: {lectures.length} Lectures</p>
          </div>

          <div className="relative flex min-w-[260px] items-center">
            <span className="absolute left-3.5 text-gray-400">
              <MdSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by Subject, Faculty, Branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-xs text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-navy-700 dark:text-white">
            <thead>
              <tr className="border-b border-gray-200 pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:border-white/10">
                <th className="pb-3 pl-2">Date & Time Slot</th>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Faculty</th>
                <th className="pb-3">Branch / Batch</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                    Loading timetable sessions...
                  </td>
                </tr>
              ) : filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                    No lecture sessions found. Schedule your first session using the form above.
                  </td>
                </tr>
              ) : (
                filteredLectures.map((lec) => {
                  const dStr = lec.date ? new Date(lec.date).toLocaleDateString() : 'N/A';
                  return (
                    <tr
                      key={lec._id}
                      className="transition duration-150 hover:bg-gray-50/50 dark:hover:bg-navy-700/50"
                    >
                      <td className="py-3.5 pl-2">
                        <div className="font-bold">{dStr}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {lec.timeSlot}
                        </div>
                      </td>

                      <td className="py-3.5 font-bold text-navy-700 dark:text-white">
                        {lec.subject}
                      </td>

                      <td className="py-3.5 text-xs font-semibold text-brand-500">
                        {lec.faculty?.name || 'Unassigned'}
                      </td>

                      <td className="py-3.5 text-xs">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                          {lec.branch}
                        </span>
                        <span className="ml-1.5 rounded bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                          {lec.batch}
                        </span>
                      </td>

                      <td className="py-3.5 text-xs">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            lec.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                          }`}
                        >
                          {lec.status || 'scheduled'}
                        </span>
                      </td>

                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => handleDelete(lec._id, lec.subject)}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-navy-800"
                          title="Delete Session"
                        >
                          <MdDelete className="h-4 w-4" />
                        </button>
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
