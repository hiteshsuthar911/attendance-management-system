'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdApartment,
  MdAdd,
  MdEdit,
  MdDelete,
  MdCheck,
  MdClose,
  MdSearch,
  MdSchool,
  MdAccountTree,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';
import { IDepartment, IAcademicProgram } from 'types/attendance';

const COMMON_DEGREES = ['B.VOC', 'B.TECH', 'B.E.', 'M.TECH', 'MCA', 'B.SC', 'DIPLOMA'];

export default function ManageDepartments() {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [programs, setPrograms] = useState<IAcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create form state
  const [degree, setDegree] = useState('B.VOC');
  const [branch, setBranch] = useState('SD');
  const [name, setName] = useState('BVOC IN SD');
  const [code, setCode] = useState('BVOC-SD');
  const [description, setDescription] = useState('B.Voc in Software Development Department');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resDepts, resProgs] = await Promise.all([
        fetchApi('/api/departments'),
        fetchApi('/api/academic-programs'),
      ]);

      const dataDepts = await resDepts.json();
      const dataProgs = await resProgs.json();

      if (dataDepts.success) {
        setDepartments(dataDepts.departments || []);
      }
      if (dataProgs.success) {
        setPrograms(dataProgs.programs || []);
      }
    } catch (err) {
      console.error('Error fetching departments & programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update name & code automatically on degree or branch change
  const applyDegreeAndBranch = (d: string, b: string) => {
    const cleanD = d.trim().toUpperCase();
    const cleanB = b.trim().toUpperCase();
    setDegree(cleanD);
    setBranch(cleanB);
    if (cleanD && cleanB) {
      setName(`${cleanD} IN ${cleanB}`);
      setCode(`${cleanD}-${cleanB}`);
      setDescription(`${cleanD} in ${cleanB} Department`);
    }
  };

  const handleProgramPick = (prog: IAcademicProgram) => {
    applyDegreeAndBranch(prog.degree, prog.branchCode);
    setDescription(`${prog.degree} in ${prog.branchName} Department`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetchApi('/api/departments', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMsg({ type: 'success', text: `Department "${name}" created successfully!` });
        loadData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to create department.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (dept: IDepartment) => {
    setEditingId(dept._id);
    setEditName(dept.name);
    setEditCode(dept.code);
    setEditDesc(dept.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setEditLoading(true);
    try {
      const res = await fetchApi(`/api/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          description: editDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        loadData();
      } else {
        alert(data.message || 'Failed to update department');
      }
    } catch (err) {
      alert('Error updating department');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string, deptCode: string) => {
    if (!window.confirm(`Are you sure you want to delete department "${deptCode}"? This will unlink it from users.`)) {
      return;
    }

    try {
      const res = await fetchApi(`/api/departments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Failed to delete department');
      }
    } catch (err) {
      alert('Error deleting department');
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Manage College Departments
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create, edit, and organize academic departments connected with configured Degree Programs
        </p>
      </div>

      {/* Create Department Card */}
      <Card extra="p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-500/20">
              <MdApartment className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                Configure New Department
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select or type Degree and Branch to auto-generate Department Name & Code
              </p>
            </div>
          </div>
        </div>

        {/* Quick Pick from Configured Academic Programs */}
        {programs.length > 0 && (
          <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-50/20 p-3.5 dark:bg-navy-900">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 mb-2">
              <MdSchool className="h-4 w-4" />
              <span>Quick Pick Configured Program (Click to fill form):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {programs.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => handleProgramPick(p)}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-navy-700 shadow-sm border border-gray-200 transition hover:border-brand-500 hover:bg-brand-50 dark:bg-navy-800 dark:border-white/10 dark:text-white"
                >
                  <span className="text-brand-500">{p.degree}</span> in {p.branchCode} ({p.branchName})
                </button>
              ))}
            </div>
          </div>
        )}

        {msg && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
              msg.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Degree / Program
            </label>
            <div className="mt-1.5 flex gap-1">
              <select
                value={COMMON_DEGREES.includes(degree) ? degree : 'CUSTOM'}
                onChange={(e) => {
                  if (e.target.value !== 'CUSTOM') {
                    applyDegreeAndBranch(e.target.value, branch);
                  }
                }}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              >
                {COMMON_DEGREES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="CUSTOM">+ Custom Degree</option>
              </select>
            </div>
            {!COMMON_DEGREES.includes(degree) && (
              <input
                type="text"
                placeholder="Type Custom Degree (e.g. B.Tech)"
                value={degree}
                onChange={(e) => applyDegreeAndBranch(e.target.value, branch)}
                className="mt-1.5 flex h-9 w-full rounded-xl border border-brand-500/40 bg-white px-3 text-xs uppercase text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Branch / Specialization
            </label>
            <input
              type="text"
              placeholder="e.g. SD, CS, IT, AIDS"
              value={branch}
              onChange={(e) => applyDegreeAndBranch(degree, e.target.value)}
              required
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-mono uppercase text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Department Name
            </label>
            <input
              type="text"
              placeholder="e.g. BVOC IN SD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Department Code
            </label>
            <input
              type="text"
              placeholder="e.g. BVOC-SD"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-mono uppercase text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. B.Voc in Software Development Department"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div className="flex items-end md:col-span-2 lg:col-span-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
            >
              <MdAdd className="h-5 w-5" />
              <span>{submitting ? 'Creating...' : 'Create Department'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Departments Directory Table */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Configured Academic Departments
            </h3>
            <p className="text-xs text-gray-400">Total Departments: {departments.length}</p>
          </div>

          <div className="relative flex min-w-[260px] items-center">
            <span className="absolute left-3.5 text-gray-400">
              <MdSearch className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by Code or Name..."
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
                <th className="pb-3 pl-2">Department Code</th>
                <th className="pb-3">Department Name</th>
                <th className="pb-3">Description</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                    Loading departments...
                  </td>
                </tr>
              ) : filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                    No departments found. Use the form above to configure one.
                  </td>
                </tr>
              ) : (
                filteredDepts.map((dept) => {
                  const isEditing = editingId === dept._id;
                  return (
                    <tr
                      key={dept._id}
                      className="transition duration-150 hover:bg-gray-50/50 dark:hover:bg-navy-700/50"
                    >
                      <td className="py-3.5 pl-2 font-mono font-bold text-brand-500">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="h-8 w-28 rounded border px-2 text-xs"
                          />
                        ) : (
                          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-extrabold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                            {dept.code}
                          </span>
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
                          dept.name
                        )}
                      </td>

                      <td className="py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="h-8 w-full rounded border px-2 text-xs"
                          />
                        ) : (
                          dept.description || '—'
                        )}
                      </td>

                      <td className="py-3.5 pr-2 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(dept._id)}
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
                              onClick={() => startEdit(dept)}
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-navy-800"
                              title="Edit Department"
                            >
                              <MdEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(dept._id, dept.code)}
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-navy-800"
                              title="Delete Department"
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
