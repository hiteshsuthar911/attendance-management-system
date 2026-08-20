'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdCheckCircle,
  MdCancel,
  MdSave,
  MdPeople,
  MdClass,
  MdFilterList,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';

interface IStudentAttendance {
  studentId: string;
  name: string;
  rollNumber: string;
  status: 'present' | 'absent';
}

export default function MarkAttendance() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [roster, setRoster] = useState<IStudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadLectures = async () => {
      try {
        const res = await fetchApi('/api/lectures');
        const data = await res.json();
        if (data.success && data.lectures) {
          setLectures(data.lectures);
          if (data.lectures.length > 0) {
            // Check url params
            const params = new URLSearchParams(window.location.search);
            const paramId = params.get('lectureId');
            const targetId = paramId || data.lectures[0]._id;
            setSelectedLectureId(targetId);
            loadRoster(targetId, data.lectures);
          }
        }
      } catch (err) {
        console.error('Error loading lectures:', err);
      }
    };
    loadLectures();
  }, []);

  const loadRoster = async (lecId: string, lecsList = lectures) => {
    if (!lecId) return;
    setLoading(true);
    setSaveMsg(null);

    const lec = lecsList.find((l: any) => l._id === lecId);
    setActiveLecture(lec || null);

    try {
      // First check if attendance was already recorded
      const resAtt = await fetchApi(`/api/attendance/lecture/${lecId}`);
      const dataAtt = await resAtt.json();

      if (dataAtt.success && dataAtt.records && dataAtt.records.length > 0) {
        // Attendance already exists
        const formatted = dataAtt.records.map((r: any) => ({
          studentId: r.student?._id || r.student,
          name: r.student?.name || 'Student',
          rollNumber: r.student?.studentDetails?.rollNumber || '—',
          status: r.status,
        }));
        setRoster(formatted);
      } else {
        // Fetch student roster for this branch/batch
        let url = '/api/users?role=student';
        if (lec?.branch) url += `&branch=${encodeURIComponent(lec.branch)}`;
        if (lec?.batch) url += `&batch=${encodeURIComponent(lec.batch)}`;

        const resStudents = await fetchApi(url);
        const dataStudents = await resStudents.json();

        if (dataStudents.success && dataStudents.users) {
          const initial = dataStudents.users.map((s: any) => ({
            studentId: s._id,
            name: s.name,
            rollNumber: s.studentDetails?.rollNumber || '—',
            status: 'present' as const, // default present
          }));
          setRoster(initial);
        }
      }
    } catch (err) {
      console.error('Error loading attendance roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLectureChange = (lecId: string) => {
    setSelectedLectureId(lecId);
    loadRoster(lecId);
  };

  const toggleStudentStatus = (studentId: string) => {
    setRoster(
      roster.map((s) =>
        s.studentId === studentId
          ? { ...s, status: s.status === 'present' ? 'absent' : 'present' }
          : s
      )
    );
  };

  const markAll = (status: 'present' | 'absent') => {
    setRoster(roster.map((s) => ({ ...s, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedLectureId || roster.length === 0) return;
    setSaving(true);
    setSaveMsg(null);

    try {
      const records = roster.map((s) => ({
        student: s.studentId,
        status: s.status,
      }));

      const res = await fetchApi('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          lectureId: selectedLectureId,
          records,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSaveMsg({ type: 'success', text: 'Attendance recorded successfully!' });
      } else {
        setSaveMsg({ type: 'error', text: data.message || 'Failed to save attendance.' });
      }
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Network error saving attendance.' });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((s) => s.status === 'present').length;
  const absentCount = roster.filter((s) => s.status === 'absent').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Interactive Student Attendance Marking
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select scheduled lecture session and tap students to toggle Present / Absent status
        </p>
      </div>

      {/* Select Lecture Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Select Scheduled Lecture
            </label>
            <select
              value={selectedLectureId}
              onChange={(e) => handleLectureChange(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {lectures.map((l) => {
                const formattedDate = new Date(l.date).toLocaleDateString();
                return (
                  <option key={l._id} value={l._id}>
                    [{formattedDate} - {l.timeSlot}] {l.subject} ({l.branch} / {l.batch})
                  </option>
                );
              })}
            </select>
          </div>

          {activeLecture && (
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-50 p-3 dark:bg-navy-900">
                <span className="text-xs text-gray-500">Subject:</span>
                <p className="font-bold text-brand-500 dark:text-white">{activeLecture.subject}</p>
              </div>
              <div className="rounded-xl bg-brand-50 p-3 dark:bg-navy-900">
                <span className="text-xs text-gray-500">Batch:</span>
                <p className="font-bold text-navy-700 dark:text-white">
                  {activeLecture.branch} / {activeLecture.batch}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Roster & Actions Card */}
      <Card extra="p-6">
        {/* Roster Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                Present: {presentCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                Absent: {absentCount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => markAll('present')}
              className="rounded-xl bg-green-500/10 px-3.5 py-2 text-xs font-bold text-green-600 transition hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400"
            >
              ✓ Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('absent')}
              className="rounded-xl bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400"
            >
              ✗ Mark All Absent
            </button>
            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={saving || roster.length === 0}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
            >
              <MdSave className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save & Submit Attendance'}</span>
            </button>
          </div>
        </div>

        {saveMsg && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
              saveMsg.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
            }`}
          >
            {saveMsg.text}
          </div>
        )}

        {/* Student Roster Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              Loading student roster...
            </div>
          ) : roster.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              No students enrolled in this lecture batch.
            </div>
          ) : (
            roster.map((student) => {
              const isPresent = student.status === 'present';
              return (
                <div
                  key={student.studentId}
                  onClick={() => toggleStudentStatus(student.studentId)}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                    isPresent
                      ? 'border-green-500/30 bg-green-50/50 shadow-sm dark:border-green-500/30 dark:bg-green-950/20'
                      : 'border-red-500/30 bg-red-50/50 shadow-sm dark:border-red-500/30 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-brand-500 dark:text-brand-400">
                      {student.rollNumber}
                    </span>
                    <span className="text-sm font-bold text-navy-700 dark:text-white">
                      {student.name}
                    </span>
                  </div>

                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm ${
                      isPresent ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {isPresent ? (
                      <MdCheckCircle className="h-5 w-5" />
                    ) : (
                      <MdCancel className="h-5 w-5" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
