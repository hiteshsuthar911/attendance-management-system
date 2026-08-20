'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdAdminPanelSettings,
  MdAdd,
  MdDelete,
  MdSearch,
  MdShield,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';
import { IDepartment, IUser } from 'types/attendance';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState<IUser[]>([]);
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [resAdmins, resDepts] = await Promise.all([
        fetchApi('/api/users?role=admin'),
        fetchApi('/api/departments'),
      ]);

      const dataAdmins = await resAdmins.json();
      const dataDepts = await resDepts.json();

      if (dataAdmins.success) {
        setAdmins(dataAdmins.users || []);
      }
      if (dataDepts.success) {
        setDepartments(dataDepts.departments || []);
      }
    } catch (err) {
      console.error('Error loading admins:', err);
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
      const res = await fetchApi('/api/users/admin', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          departmentIds: selectedDepts,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMsg({ type: 'success', text: 'Admin account created successfully!' });
        setName('');
        setEmail('');
        setPassword('');
        setSelectedDepts([]);
        loadData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to create admin.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, adminName: string) => {
    if (!window.confirm(`Are you sure you want to delete admin account "${adminName}"?`)) {
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
        alert(data.message || 'Failed to delete admin account');
      }
    } catch (err) {
      alert('Error deleting admin account');
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Manage Department Admins
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create administrative accounts and assign them access to manage designated college departments
        </p>
      </div>

      {/* Create Admin Form Card */}
      <Card extra="p-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20">
            <MdAdd className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Create Department Admin Account
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Department admins can manage faculties, enroll students, and schedule lectures
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
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. SD Department Admin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. sdadmin@attendance.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>
          </div>

          {/* Assigned Departments Multi-Checkboxes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Assigned Department(s)
            </label>
            <div className="mt-2 flex flex-wrap gap-2.5 rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-white/10 dark:bg-navy-900">
              {departments.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No departments available. Create a department first.
                </p>
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
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50"
            >
              <MdAdd className="h-5 w-5" />
              <span>{submitting ? 'Creating Account...' : 'Create Admin Account'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Department Admins Table Card */}
      <Card extra="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Department Admins Directory ({filteredAdmins.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Accounts authorized with department-level administrative permissions
            </p>
          </div>

          {/* Search Box */}
          <div className="flex h-10 w-full items-center rounded-xl bg-lightPrimary px-3 dark:bg-navy-900 sm:w-64">
            <MdSearch className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search admins..."
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
                <th className="pb-3 font-semibold text-gray-400">Admin Name</th>
                <th className="pb-3 font-semibold text-gray-400">Email</th>
                <th className="pb-3 font-semibold text-gray-400">Assigned Department(s)</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Loading admins...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No department admins registered yet.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin, idx) => (
                  <tr key={admin._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                    <td className="py-3 text-gray-400">{idx + 1}</td>
                    <td className="py-3 font-medium text-navy-700 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{admin.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {admin.email}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {admin.departments && admin.departments.length > 0 ? (
                          admin.departments.map((d: any) => (
                            <span
                              key={d._id || d}
                              className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
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
                      <button
                        onClick={() => handleDelete(admin._id, admin.name)}
                        className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
                        title="Delete Admin"
                      >
                        <MdDelete className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
