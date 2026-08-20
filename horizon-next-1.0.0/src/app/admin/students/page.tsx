'use client';
import React, { useEffect, useState, useRef } from 'react';
import Card from 'components/card';
import {
  MdPeople,
  MdAdd,
  MdDelete,
  MdSearch,
  MdEdit,
  MdCheck,
  MdClose,
  MdSchool,
  MdCloudUpload,
  MdDownload,
  MdFormatListBulleted,
  MdCheckCircle,
  MdWarningAmber,
  MdVpnKey,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';
import { IDepartment, IUser, IAcademicProgram } from 'types/attendance';

interface IParsedStudent {
  rollNumber: string;
  name: string;
  email: string;
  password?: string;
  branch: string;
  batch: string;
  isValid: boolean;
  error?: string;
}

export default function ManageStudents() {
  const [students, setStudents] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [programs, setPrograms] = useState<IAcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Mode: Single vs Bulk
  const [enrollMode, setEnrollMode] = useState<'single' | 'bulk'>('single');

  // Single Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [branch, setBranch] = useState('SD');
  const [batch, setBatch] = useState('Batch-5');
  const [deptId, setDeptId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk Form state
  const [bulkText, setBulkText] = useState('');
  const [parsedStudents, setParsedStudents] = useState<IParsedStudent[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    success: boolean;
    count: number;
    skippedCount: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resStudents, resDepts, resProgs] = await Promise.all([
        fetchApi('/api/users?role=student'),
        fetchApi('/api/departments'),
        fetchApi('/api/academic-programs'),
      ]);

      const dataStudents = await resStudents.json();
      const dataDepts = await resDepts.json();
      const dataProgs = await resProgs.json();

      if (dataStudents.success) {
        setStudents(dataStudents.users || []);
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
      console.error('Error fetching students data:', err);
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

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const prefix = val.includes('@') ? val.split('@')[0] : val;
    setPassword(prefix);
  };

  const handleEnrollSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSubmitting(true);

    const emailPrefix = email.includes('@') ? email.split('@')[0] : email;
    const finalPass = password.trim() || emailPrefix;

    try {
      const res = await fetchApi('/api/users/student', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: finalPass,
          role: 'student',
          rollNumber: rollNumber.trim().toUpperCase(),
          branch: branch.trim().toUpperCase(),
          batch: batch.trim(),
          departmentId: deptId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({
          type: 'success',
          text: `Student "${name}" enrolled successfully with auto-generated password "${finalPass}"!`,
        });
        setName('');
        setEmail('');
        setPassword('');
        setRollNumber('');
        loadData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to enroll student' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error communicating with server.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Parse Bulk Text (CSV / TSV / Comma-separated) ──
  const parseRawText = (text: string) => {
    setBulkText(text);
    setBulkResult(null);

    const lines = text.split('\n');
    const parsed: IParsedStudent[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip header row if user pastes header like "Roll Number, Name, Email"
      if (
        i === 0 &&
        (line.toLowerCase().includes('roll') || line.toLowerCase().includes('email'))
      ) {
        continue;
      }

      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const cleanParts = parts.map((p) => p.trim());

      const rNum = cleanParts[0] || '';
      const sName = cleanParts[1] || '';
      const sEmail = cleanParts[2] || '';
      const sBranch = cleanParts[3] || branch;
      const sBatch = cleanParts[4] || batch;

      // Auto-derived password from email before @
      const emailPrefix = sEmail.includes('@') ? sEmail.split('@')[0] : sEmail;

      const isValid = Boolean(sName && sEmail && sEmail.includes('@'));
      parsed.push({
        rollNumber: rNum,
        name: sName,
        email: sEmail,
        password: emailPrefix,
        branch: sBranch.toUpperCase(),
        batch: sBatch,
        isValid,
        error: !sName
          ? 'Missing name'
          : !sEmail.includes('@')
          ? 'Invalid email'
          : undefined,
      });
    }

    setParsedStudents(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    const validStudents = parsedStudents.filter((p) => p.isValid);
    if (validStudents.length === 0) {
      alert('No valid student records to enroll. Please check your data format.');
      return;
    }

    setBulkLoading(true);
    setBulkResult(null);

    try {
      const payload = {
        students: validStudents.map((s) => ({
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber,
          branch: s.branch || branch,
          batch: s.batch || batch,
          departmentId: deptId,
          password: s.password || (s.email.includes('@') ? s.email.split('@')[0] : s.email),
        })),
        defaultDepartmentId: deptId,
        defaultBranch: branch,
        defaultBatch: batch,
      };

      const res = await fetchApi('/api/users/bulk-students', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setBulkResult({
          success: true,
          count: data.count || 0,
          skippedCount: data.skipped?.length || 0,
          message: data.message || 'Bulk student enrollment completed with auto-generated passwords.',
        });
        setBulkText('');
        setParsedStudents([]);
        loadData();
      } else {
        setBulkResult({
          success: false,
          count: 0,
          skippedCount: 0,
          message: data.message || 'Bulk enrollment failed.',
        });
      }
    } catch (err) {
      alert('Error during bulk enrollment connection.');
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sample = `Roll Number,Student Name,Institutional Email,Branch,Batch
1032251654,Bohra Idris,1032251654@tcetmumbai.in,SD,Batch-5
1032251655,Chandel Prisha,1032251655@tcetmumbai.in,SD,Batch-5
1032251656,Chaturvedi Vikas,1032251656@tcetmumbai.in,SD,Batch-5
1032251657,Fodkar Faris,1032251657@tcetmumbai.in,SD,Batch-5
1032251658,Gupta Vinay,1032251658@tcetmumbai.in,SD,Batch-5`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendms_sample_student_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEdit = (st: IUser) => {
    setEditingId(st._id);
    setEditName(st.name);
    setEditRoll(st.studentDetails?.rollNumber || '');
    setEditBranch(st.studentDetails?.branch || '');
    setEditBatch(st.studentDetails?.batch || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setEditLoading(true);
    try {
      const res = await fetchApi(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          studentDetails: {
            rollNumber: editRoll.trim(),
            branch: editBranch.trim().toUpperCase(),
            batch: editBatch.trim(),
            department: deptId,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        loadData();
      } else {
        alert(data.message || 'Failed to update student');
      }
    } catch (err) {
      alert('Error updating student');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete student "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetchApi(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to delete student');
      }
    } catch (err) {
      alert('Error deleting student');
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(term);
    const emailMatch = s.email.toLowerCase().includes(term);
    const rollMatch = s.studentDetails?.rollNumber?.toLowerCase().includes(term);
    const branchMatch = s.studentDetails?.branch?.toLowerCase().includes(term);
    return nameMatch || emailMatch || rollMatch || branchMatch;
  });

  const activeSelectedProg = programs.find((p) => p._id === selectedProgramId);
  const autoGeneratedPass = email ? (email.includes('@') ? email.split('@')[0] : email) : '1032251654';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            Student Enrollment & Roster Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enroll students with auto-generated passwords derived from institutional email IDs
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center rounded-2xl bg-gray-100 p-1.5 dark:bg-navy-800">
          <button
            onClick={() => setEnrollMode('single')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              enrollMode === 'single'
                ? 'bg-white text-brand-500 shadow-sm dark:bg-brand-500 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
            }`}
          >
            <MdAdd className="h-4 w-4" />
            <span>Single Student</span>
          </button>
          <button
            onClick={() => setEnrollMode('bulk')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              enrollMode === 'bulk'
                ? 'bg-white text-brand-500 shadow-sm dark:bg-brand-500 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
            }`}
          >
            <MdCloudUpload className="h-4 w-4" />
            <span>⚡ Bulk Enroll Roster</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: SINGLE STUDENT ENROLLMENT ── */}
      {enrollMode === 'single' && (
        <Card extra="p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <MdPeople className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                Enroll New Student
              </h3>
            </div>

            {/* Password Policy Badge */}
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <MdVpnKey className="h-3.5 w-3.5" />
              <span>
                Auto Password:{' '}
                <span className="font-mono underline">{autoGeneratedPass}</span>
              </span>
            </div>
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

          <form onSubmit={handleEnrollSingle} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Student Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Suthar Hitesh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Institutional Email (e.g. 1032251654@tcetmumbai.in)
              </label>
              <input
                type="email"
                placeholder="1032251654@tcetmumbai.in"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g. 1032251654 or BV25-SD17"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-mono text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
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

            {/* Department */}
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

            <div className="flex items-end md:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
              >
                <MdAdd className="h-5 w-5" />
                <span>{submitting ? 'Enrolling...' : 'Enroll Student'}</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ── MODE 2: BULK STUDENT ENROLLMENT (CSV / EXCEL PASTE) ── */}
      {enrollMode === 'bulk' && (
        <Card extra="p-6 border border-brand-500/20 bg-brand-50/10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <MdCloudUpload className="h-6 w-6 text-brand-500" />
              <div>
                <h3 className="text-base font-bold text-navy-700 dark:text-white">
                  ⚡ Bulk Student Enrollment & Roster Import
                </h3>
                <p className="text-xs text-gray-500">
                  Passwords are auto-generated from student email usernames (e.g.{' '}
                  <span className="font-mono font-bold text-brand-500">1032251654</span> for{' '}
                  <span className="font-mono text-brand-500">1032251654@tcetmumbai.in</span>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadSampleCSV}
                className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-navy-800 dark:text-gray-300"
              >
                <MdDownload className="h-4 w-4 text-brand-500" />
                <span>Download Sample CSV</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600"
              >
                <MdCloudUpload className="h-4 w-4" />
                <span>Upload CSV File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Bulk Program & Batch Defaults */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
                Target Degree & Branch Program
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => handleProgramSelect(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-bold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              >
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.degree} — {p.branchName} ({p.branchCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Default Batch Assignment
              </label>
              {activeSelectedProg && activeSelectedProg.batches && activeSelectedProg.batches.length > 0 ? (
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
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
                  className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Default Department Link
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paste Text Area */}
          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
              Paste Student Rows (Format: Roll Number, Name, Email, [Branch], [Batch])
            </label>
            <textarea
              rows={5}
              placeholder={`1032251654, Bohra Idris, 1032251654@tcetmumbai.in\n1032251655, Chandel Prisha, 1032251655@tcetmumbai.in\n1032251656, Chaturvedi Vikas, 1032251656@tcetmumbai.in`}
              value={bulkText}
              onChange={(e) => parseRawText(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 font-mono text-xs text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          {/* Bulk Execution Result Message */}
          {bulkResult && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl p-3.5 text-xs font-bold ${
                bulkResult.success
                  ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20'
                  : 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
              }`}
            >
              {bulkResult.success ? (
                <MdCheckCircle className="h-5 w-5" />
              ) : (
                <MdWarningAmber className="h-5 w-5" />
              )}
              <span>{bulkResult.message}</span>
            </div>
          )}

          {/* Parsed Live Preview Table & Submit Action */}
          {parsedStudents.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                    {parsedStudents.filter((p) => p.isValid).length} Valid Records
                  </span>
                  {parsedStudents.some((p) => !p.isValid) && (
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                      {parsedStudents.filter((p) => !p.isValid).length} Invalid Rows
                    </span>
                  )}
                </div>

                <button
                  onClick={handleBulkSubmit}
                  disabled={bulkLoading || parsedStudents.filter((p) => p.isValid).length === 0}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-green-500/20 transition hover:bg-green-700 disabled:opacity-50"
                >
                  <MdCheck className="h-4 w-4" />
                  <span>
                    {bulkLoading
                      ? 'Importing Roster...'
                      : `Confirm & Enroll (${parsedStudents.filter((p) => p.isValid).length}) Students`}
                  </span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-navy-900">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-navy-800">
                    <tr className="border-b border-gray-200 text-gray-500 dark:border-white/10">
                      <th className="p-2">#</th>
                      <th className="p-2">Roll No</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Auto Password</th>
                      <th className="p-2">Branch</th>
                      <th className="p-2">Batch</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {parsedStudents.map((st, idx) => (
                      <tr key={idx} className={st.isValid ? '' : 'bg-red-50/50 dark:bg-red-900/20'}>
                        <td className="p-2 font-mono">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-brand-500">{st.rollNumber || '—'}</td>
                        <td className="p-2 font-medium">{st.name || '—'}</td>
                        <td className="p-2">{st.email || '—'}</td>
                        <td className="p-2 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {st.password || '—'}
                        </td>
                        <td className="p-2 font-bold">{st.branch}</td>
                        <td className="p-2">{st.batch}</td>
                        <td className="p-2 font-bold">
                          {st.isValid ? (
                            <span className="text-green-600">✓ Ready</span>
                          ) : (
                            <span className="text-red-500">✕ {st.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Students Directory Table Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Enrolled Students Directory
            </h3>
            <p className="text-xs text-gray-400">Total Enrolled: {students.length} Students</p>
          </div>

          <div className="relative flex min-w-[260px] items-center">
            <span className="absolute left-3.5 text-gray-400">
              <MdSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by Roll No, Name, Branch..."
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
                <th className="pb-3 pl-2">Roll Number</th>
                <th className="pb-3">Student Name</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Branch</th>
                <th className="pb-3">Batch</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                    Loading student roster...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                    No students found. Enroll your first student using the form above.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const isEditing = editingId === st._id;
                  return (
                    <tr
                      key={st._id}
                      className="transition duration-150 hover:bg-gray-50/50 dark:hover:bg-navy-700/50"
                    >
                      <td className="py-3.5 pl-2 font-mono text-xs font-bold text-brand-500">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editRoll}
                            onChange={(e) => setEditRoll(e.target.value)}
                            className="h-8 w-28 rounded border px-2 text-xs"
                          />
                        ) : (
                          st.studentDetails?.rollNumber || 'N/A'
                        )}
                      </td>

                      <td className="py-3.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 w-full rounded border px-2 text-xs"
                          />
                        ) : (
                          st.name
                        )}
                      </td>

                      <td className="py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {st.email}
                      </td>

                      <td className="py-3.5 text-xs font-semibold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editBranch}
                            onChange={(e) => setEditBranch(e.target.value)}
                            className="h-8 w-20 rounded border px-2 text-xs"
                          />
                        ) : (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                            {st.studentDetails?.branch || 'SD'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 text-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editBatch}
                            onChange={(e) => setEditBatch(e.target.value)}
                            className="h-8 w-24 rounded border px-2 text-xs"
                          />
                        ) : (
                          <span className="rounded bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                            {st.studentDetails?.batch || 'Batch-1'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 pr-2 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(st._id)}
                              disabled={editLoading}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600"
                            >
                              <MdCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-navy-700 dark:text-white"
                            >
                              <MdClose className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(st)}
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-navy-800"
                              title="Edit Student"
                            >
                              <MdEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(st._id, st.name)}
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-navy-800"
                              title="Delete Student"
                            >
                              <MdDelete className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
