'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdSchool,
  MdAdd,
  MdDelete,
  MdSearch,
  MdEdit,
  MdCheck,
  MdClose,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';
import { IDepartment, IUser } from 'types/attendance';

export default function ManageFaculties() {
  const [faculties, setFaculties] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepts, setEditDepts] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resFaculties, resDepts] = await Promise.all([
        fetchApi('/api/users?role=faculty'),
        fetchApi('/api/departments'),
      ]);

      const dataFaculties = await resFaculties.json();
      const dataDepts = await resDepts.json();

      if (dataFaculties.success) {
        setFaculties(dataFaculties.users || []);
      }
      if (dataDepts.success) {
        setDepartments(dataDepts.departments || []);
        if (selectedDepts.length === 0 && dataDepts.departments.length > 0) {
          setSelectedDepts([dataDepts.departments[0]._id]);
        }
      }
    } catch (err) {
      console.error('Error loading faculties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDeptCheckbox = (deptId: string) => {
    if (selectedDepts.includes(deptId)) {
      setSelectedDepts(selectedDepts.filter((id) => id !== deptId));
    } else {
      setSelectedDepts([...selectedDepts, deptId]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetchApi('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: 'faculty',
          departments: selectedDepts,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMsg({ type: 'success', text: 'Faculty member created successfully!' });
        setName('');
        setEmail('');
        setPassword('');
        loadData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to create faculty.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (user: IUser) => {
    setEditingId(user._id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDepts(
      user.departments
        ? user.departments.map((d: any) => d._id || d)
        : []
    );
  };

  const handleUpdate = async (id: string) => {
    setEditLoading(true);
    try {
      const res = await fetchApi(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          departments: editDepts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        loadData();
      } else {
        alert(data.message || 'Failed to update faculty');
      }
    } catch (err) {
      alert('Error updating faculty');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete faculty member "${userName}"?`)) {
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
        alert(data.message || 'Failed to delete faculty member');
      }
    } catch (err) {
      alert('Error deleting faculty');
    }
  };

  const filteredFaculties = faculties.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Manage Department Faculties
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create, edit, and assign department faculty instructors for lecture sessions
        </p>
      </div>

      {/* Create Faculty Form Card */}
      <Card extra="p-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20">
            <MdAdd className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Add New Faculty Instructor
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Faculties can conduct lectures and record real-time student attendance
            </p>
          </div>
        </div>

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

        <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Faculty Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Prof. Shruti Mishra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Institutional Email
              </label>
              <input
                type="email"
                placeholder="e.g. shrutimishra@attendance.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Initial Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>
          </div>

          {/* Assigned Departments */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Department Assignment
            </label>
            <div className="mt-2 flex flex-wrap gap-2.5 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-navy-900">
              {departments.length === 0 ? (
                <p className="text-xs text-gray-400">No departments found.</p>
              ) : (
                departments.map((dept) => {
                  const isChecked = selectedDepts.includes(dept._id);
                  return (
                    <button
                      key={dept._id}
                      type="button"
                      onClick={() => toggleDeptCheckbox(dept._id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        isChecked
                          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-brand-500/50 dark:border-white/10 dark:bg-navy-800 dark:text-gray-300'
                      }`}
                    >
                      <span>{isChecked ? '✓' : '+'}</span>
                      <span>{dept.name}</span>
                      <span className="opacity-75">({dept.code})</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
            >
              <MdAdd className="h-5 w-5" />
              <span>{submitting ? 'Adding...' : 'Add Faculty Member'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Faculties Directory Table Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Registered Faculty Roster ({filteredFaculties.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Department instructors authorized to mark student attendance
            </p>
          </div>

          {/* Search Box */}
          <div className="flex h-10 w-full items-center rounded-xl bg-lightPrimary px-3 dark:bg-navy-900 sm:w-64">
            <MdSearch className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty..."
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
                <th className="pb-3 font-semibold text-gray-400">#</th>
                <th className="pb-3 font-semibold text-gray-400">Faculty Name</th>
                <th className="pb-3 font-semibold text-gray-400">Email Address</th>
                <th className="pb-3 font-semibold text-gray-400">Assigned Department(s)</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Loading faculties...
                  </td>
                </tr>
              ) : filteredFaculties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No faculty members registered yet.
                  </td>
                </tr>
              ) : (
                filteredFaculties.map((fac, idx) => (
                  <React.Fragment key={fac._id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="py-3 text-gray-400">{idx + 1}</td>
                      <td className="py-3 font-medium text-navy-700 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                            {fac.name.charAt(0).toUpperCase()}
                          </span>
                          <span>{fac.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {fac.email}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {fac.departments && fac.departments.length > 0 ? (
                            fac.departments.map((d: any) => (
                              <span
                                key={d._id || d}
                                className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                              >
                                {d.name ? `${d.name} (${d.code})` : d}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No departments assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(fac)}
                            className="rounded-lg p-1.5 text-brand-500 transition hover:bg-brand-500/10 dark:text-brand-400"
                            title="Edit"
                          >
                            <MdEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fac._id, fac.name)}
                            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
                            title="Delete"
                          >
                            <MdDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Edit Row */}
                    {editingId === fac._id && (
                      <tr className="bg-lightPrimary/50 dark:bg-navy-900">
                        <td colSpan={5} className="p-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Name"
                              className="h-9 min-w-[180px] rounded-lg border border-gray-300 px-2 text-xs font-bold text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white"
                            />
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Email"
                              className="h-9 min-w-[200px] rounded-lg border border-gray-300 px-2 text-xs text-navy-700 dark:border-white/10 dark:bg-navy-800 dark:text-white"
                            />
                            <button
                              onClick={() => handleUpdate(fac._id)}
                              disabled={editLoading}
                              className="flex h-9 items-center gap-1 rounded-lg bg-green-500 px-3 text-xs font-bold text-white hover:bg-green-600"
                            >
                              <MdCheck className="h-4 w-4" /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex h-9 items-center gap-1 rounded-lg bg-gray-200 px-3 text-xs font-bold text-gray-700 hover:bg-gray-300 dark:bg-navy-700 dark:text-white"
                            >
                              <MdClose className="h-4 w-4" /> Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
