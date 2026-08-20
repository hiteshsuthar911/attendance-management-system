'use client';
import React, { useEffect, useState } from 'react';
import Card from 'components/card';
import {
  MdPeople,
  MdSearch,
  MdFilterList,
  MdDelete,
  MdSchool,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';
import { IDepartment, IUser } from 'types/attendance';

export default function UserDirectory() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      let url = '/api/users?';
      if (roleFilter) url += `role=${encodeURIComponent(roleFilter)}&`;
      if (deptFilter) url += `departmentId=${encodeURIComponent(deptFilter)}&`;

      const [resUsers, resDepts] = await Promise.all([
        fetchApi(url),
        fetchApi('/api/departments'),
      ]);

      const dataUsers = await resUsers.json();
      const dataDepts = await resDepts.json();

      if (dataUsers.success) {
        setUsers(dataUsers.users || []);
      }
      if (dataDepts.success) {
        setDepartments(dataDepts.departments || []);
      }
    } catch (err) {
      console.error('Error fetching directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, deptFilter]);

  const handleDelete = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
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
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const nameMatch = u.name.toLowerCase().includes(term);
    const emailMatch = u.email.toLowerCase().includes(term);
    const rollMatch = u.studentDetails?.rollNumber?.toLowerCase().includes(term);
    const branchMatch = u.studentDetails?.branch?.toLowerCase().includes(term);
    return nameMatch || emailMatch || rollMatch || branchMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
          Faculties & Students Directory
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Global user directory covering faculty instructors and enrolled students across departments
        </p>
      </div>

      {/* Filter Toolbar Card */}
      <Card extra="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <MdFilterList className="h-5 w-5 text-gray-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Filters:
            </span>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              <option value="">All Roles (Faculty & Students)</option>
              <option value="faculty">Faculty Only</option>
              <option value="student">Students Only</option>
            </select>
          </div>

          <div className="w-full sm:w-56">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="flex h-10 flex-1 min-w-[200px] items-center rounded-xl bg-lightPrimary px-3 dark:bg-navy-900">
            <MdSearch className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, roll number, branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 w-full bg-transparent text-xs font-medium text-navy-700 outline-none placeholder:text-gray-400 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Directory Table Card */}
      <Card extra="p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Directory Records ({filteredUsers.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing matching faculty and student accounts
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 font-semibold text-gray-400">User Name</th>
                <th className="pb-3 font-semibold text-gray-400">Email Address</th>
                <th className="pb-3 font-semibold text-gray-400">Role</th>
                <th className="pb-3 font-semibold text-gray-400">Academic Details</th>
                <th className="pb-3 text-right font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Loading directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No users found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isFaculty = user.role === 'faculty';
                  const isStudent = user.role === 'student';
                  const isAdmin = user.role === 'admin';

                  return (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50">
                      <td className="py-3 font-medium text-navy-700 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              isFaculty
                                ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                                : isStudent
                                ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                : 'bg-gray-500/10 text-gray-600'
                            }`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>

                      <td className="py-3 text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>

                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                            isFaculty
                              ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                              : isStudent
                              ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                              : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 text-xs text-gray-600 dark:text-gray-300">
                        {isStudent && user.studentDetails ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-navy-700 dark:text-white">
                              Roll: {user.studentDetails.rollNumber || '—'}
                            </span>
                            <span className="text-gray-400">
                              Branch: {user.studentDetails.branch || '—'} | Batch: {user.studentDetails.batch || '—'}
                            </span>
                          </div>
                        ) : isFaculty && user.departments && user.departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.departments.map((d: any) => (
                              <span
                                key={d._id || d}
                                className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-navy-900 dark:text-gray-300"
                              >
                                {d.name ? `${d.name} (${d.code})` : d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        {user.role !== 'superadmin' && (
                          <button
                            onClick={() => handleDelete(user._id, user.name)}
                            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
                            title="Delete User"
                          >
                            <MdDelete className="h-4 w-4" />
                          </button>
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
