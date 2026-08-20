'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdSchool,
  MdSearch,
  MdAdd,
  MdEdit,
  MdDelete,
  MdAccountTree,
  MdFilterList,
  MdCheckCircle,
  MdCancel,
  MdLayers,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';
import { IAcademicProgram, IDepartment } from 'types/attendance';

const COMMON_DEGREES = ['B.VOC', 'B.TECH', 'B.E.', 'M.TECH', 'MCA', 'B.SC', 'DIPLOMA'];

export default function AcademicProgramsPage() {
  const [programs, setPrograms] = useState<IAcademicProgram[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDegreeFilter, setSelectedDegreeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [degree, setDegree] = useState('B.VOC');
  const [customDegree, setCustomDegree] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [durationYears, setDurationYears] = useState(3);
  const [batches, setBatches] = useState('Batch-1, Batch-2, Batch-3, Batch-4, Batch-5');
  const [sections, setSections] = useState('A, B');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progRes, deptRes] = await Promise.all([
        fetchApi('/api/academic-programs'),
        fetchApi('/api/departments')
      ]);

      const progData = await progRes.json();
      const deptData = await deptRes.json();

      if (progData.success) {
        setPrograms(progData.programs || []);
      }
      if (deptData.success) {
        setDepartments(deptData.departments || []);
      }
    } catch (err) {
      console.error('Error loading academic programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setDegree('B.VOC');
    setCustomDegree('');
    setBranchName('');
    setBranchCode('');
    setDepartmentId(departments[0]?._id || '');
    setDurationYears(3);
    setBatches('Batch-1, Batch-2, Batch-3, Batch-4, Batch-5');
    setSections('A, B');
    setStatus('active');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prog: IAcademicProgram) => {
    setEditingId(prog._id);
    if (COMMON_DEGREES.includes(prog.degree)) {
      setDegree(prog.degree);
      setCustomDegree('');
    } else {
      setDegree('OTHER');
      setCustomDegree(prog.degree);
    }
    setBranchName(prog.branchName);
    setBranchCode(prog.branchCode);
    const dept = typeof prog.department === 'object' ? prog.department?._id : prog.department;
    setDepartmentId(dept || '');
    setDurationYears(prog.durationYears || 4);
    setBatches((prog.batches || []).join(', '));
    setSections((prog.sections || []).join(', '));
    setStatus(prog.status || 'active');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalDegree = (degree === 'OTHER' ? customDegree : degree).trim().toUpperCase();

    if (!finalDegree) {
      setFormError('Please select or specify a valid Degree.');
      return;
    }
    if (!branchName.trim()) {
      setFormError('Branch Name is required.');
      return;
    }
    if (!branchCode.trim()) {
      setFormError('Branch Code (e.g. SD, COMP, IT) is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        degree: finalDegree,
        branchName: branchName.trim(),
        branchCode: branchCode.trim().toUpperCase(),
        departmentId: departmentId || null,
        durationYears,
        batches: batches.split(',').map((b) => b.trim()).filter(Boolean),
        sections: sections.split(',').map((s) => s.trim()).filter(Boolean),
        status,
      };

      const endpoint = editingId ? `/api/academic-programs/${editingId}` : '/api/academic-programs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetchApi(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setFormError(data.message || 'Failed to save degree & branch.');
      }
    } catch (err: any) {
      setFormError('Error connecting to backend API.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove '${name}'?`)) return;
    try {
      const res = await fetchApi(`/api/academic-programs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to delete record');
      }
    } catch (err) {
      alert('Error deleting record');
    }
  };

  // Filtered Programs
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.degree.toLowerCase().includes(search.toLowerCase()) ||
      p.branchName.toLowerCase().includes(search.toLowerCase()) ||
      p.branchCode.toLowerCase().includes(search.toLowerCase());

    const matchesDegree =
      selectedDegreeFilter === 'ALL' || p.degree.toUpperCase() === selectedDegreeFilter;

    return matchesSearch && matchesDegree;
  });

  const distinctDegrees = Array.from(new Set(programs.map((p) => p.degree.toUpperCase()))).sort();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            Academic Degrees & Branches Configuration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define and manage institutional programs, degrees, specializations, and allowed batches
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700"
        >
          <MdAdd className="h-4 w-4" />
          <span>Configure Degree & Branch</span>
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card extra="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-navy-700 dark:text-white">
            <MdSchool className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Degrees</p>
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">{distinctDegrees.length}</h4>
          </div>
        </Card>

        <Card extra="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-navy-700 dark:text-green-400">
            <MdAccountTree className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Configured Branches</p>
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">{programs.length}</h4>
          </div>
        </Card>

        <Card extra="p-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-navy-700 dark:text-purple-400">
            <MdLayers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Allocations</p>
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">
              {programs.filter((p) => p.status === 'active').length} Active
            </h4>
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card extra="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex min-w-[280px] flex-1 items-center">
            <span className="absolute left-3.5 text-gray-400">
              <MdSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search Degree (B.Voc, B.Tech, B.E.) or Branch (Software, SD)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-xs text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          {/* Quick Degree Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedDegreeFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                selectedDegreeFilter === 'ALL'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-800 dark:text-gray-300'
              }`}
            >
              All Degrees
            </button>
            {distinctDegrees.map((deg) => (
              <button
                key={deg}
                onClick={() => setSelectedDegreeFilter(deg)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  selectedDegreeFilter === deg
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-800 dark:text-gray-300'
                }`}
              >
                {deg}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Degrees & Branches Table */}
      <Card extra="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-navy-700 dark:text-white">
            <thead>
              <tr className="border-b border-gray-200 pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:border-white/10">
                <th className="pb-3 pl-2">Degree</th>
                <th className="pb-3">Branch / Specialization</th>
                <th className="pb-3">Branch Code</th>
                <th className="pb-3">Department Link</th>
                <th className="pb-3">Batches</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                    Loading degree and branch records...
                  </td>
                </tr>
              ) : filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                    No degree and branch programs configured yet. Click "+ Configure Degree & Branch" to add one.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((prog) => {
                  const deptObj = typeof prog.department === 'object' ? prog.department : null;
                  return (
                    <tr key={prog._id} className="hover:bg-gray-50/50 dark:hover:bg-navy-700/50">
                      <td className="py-3.5 pl-2 font-bold">
                        <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-extrabold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                          {prog.degree}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold">
                        <div>{prog.branchName}</div>
                        <div className="text-[11px] font-normal text-gray-400">
                          Duration: {prog.durationYears || 4} Years • Sections: {(prog.sections || []).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                        {prog.branchCode}
                      </td>
                      <td className="py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {deptObj ? `${deptObj.name} (${deptObj.code})` : 'Unassigned'}
                      </td>
                      <td className="py-3.5 text-xs">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(prog.batches || []).slice(0, 3).map((b) => (
                            <span
                              key={b}
                              className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-navy-800 dark:text-gray-300"
                            >
                              {b}
                            </span>
                          ))}
                          {(prog.batches?.length || 0) > 3 && (
                            <span className="text-[10px] text-gray-400">
                              +{(prog.batches?.length || 0) - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            prog.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-navy-800 dark:text-gray-400'
                          }`}
                        >
                          {prog.status === 'active' ? <MdCheckCircle className="h-3 w-3" /> : <MdCancel className="h-3 w-3" />}
                          <span className="capitalize">{prog.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(prog)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-navy-800"
                            title="Edit"
                          >
                            <MdEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prog._id, `${prog.degree} ${prog.branchName}`)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-navy-800"
                            title="Delete"
                          >
                            <MdDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modal: Create / Edit Degree & Branch ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
              <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                {editingId ? 'Edit Degree & Branch' : 'Configure New Degree & Branch'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-700"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-500">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
              {/* Degree Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Degree Program*
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {COMMON_DEGREES.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => {
                        setDegree(d);
                        setCustomDegree('');
                      }}
                      className={`rounded-lg py-2 text-xs font-bold transition ${
                        degree === d
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-navy-700 dark:text-gray-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDegree('OTHER')}
                    className={`rounded-lg py-2 text-xs font-bold transition ${
                      degree === 'OTHER'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-navy-700 dark:text-gray-300'
                    }`}
                  >
                    + Custom
                  </button>
                </div>
                {degree === 'OTHER' && (
                  <input
                    type="text"
                    placeholder="Enter Custom Degree (e.g. M.SC, PH.D)"
                    value={customDegree}
                    onChange={(e) => setCustomDegree(e.target.value)}
                    required
                    className="mt-2 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs uppercase text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  />
                )}
              </div>

              {/* Branch Name & Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Branch Name*
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Development"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    required
                    className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Branch Code*
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SD"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    required
                    className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-mono uppercase text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Linked Department & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Linked Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  >
                    <option value="">-- Unassigned --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={durationYears}
                    onChange={(e) => setDurationYears(parseInt(e.target.value) || 3)}
                    className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Batches & Sections */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Batches (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch-1, Batch-2, Batch-3, Batch-4, Batch-5"
                  value={batches}
                  onChange={(e) => setBatches(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Status
                </label>
                <div className="mt-1.5 flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-navy-700 dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="accent-brand-500"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="accent-brand-500"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
