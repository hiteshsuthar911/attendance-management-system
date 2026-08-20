'use client';
import React, { useState } from 'react';
import Card from 'components/card';
import {
  MdWarningAmber,
  MdLock,
  MdDeleteForever,
  MdCheckCircle,
  MdShield,
} from 'react-icons/md';
import { fetchApi } from 'utils/auth';

export default function SystemReset() {
  // Gate state
  const [unlocked, setUnlocked] = useState(false);
  const [gatePassword, setGatePassword] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');

  // Reset execution state
  const [resetType, setResetType] = useState('attendance_only');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{
    success: boolean;
    message: string;
    summary?: any;
  } | null>(null);

  const handleUnlockGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatePassword.trim()) return;

    setGateLoading(true);
    setGateError('');

    try {
      const res = await fetchApi('/api/system/verify-reset-password', {
        method: 'POST',
        body: JSON.stringify({ password: gatePassword }),
      });
      const data = await res.json();

      if (data.success) {
        setUnlocked(true);
        setConfirmPassword(gatePassword);
      } else {
        setGateError(data.message || 'Incorrect security reset password.');
      }
    } catch (err: any) {
      setGateError(err.message || 'Verification failed. Check network connection.');
    } finally {
      setGateLoading(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetResult(null);

    if (confirmText.trim() !== 'RESET') {
      alert('You must type RESET in capital letters to confirm.');
      return;
    }

    if (!confirmPassword) {
      alert('Please enter your authorization password.');
      return;
    }

    if (
      !window.confirm(
        `CRITICAL WARNING: You are about to perform system reset (${resetType.toUpperCase()}). This action CANNOT be undone. Proceed?`,
      )
    ) {
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetchApi('/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType,
          confirmText: 'RESET',
          resetPassword: confirmPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResetResult({
          success: true,
          message: data.message || 'System reset completed successfully.',
          summary: data.summary,
        });
        setConfirmText('');
      } else {
        setResetResult({
          success: false,
          message: data.message || 'Failed to execute system reset.',
        });
      }
    } catch (err: any) {
      setResetResult({
        success: false,
        message: err.message || 'System reset request failed.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          <MdWarningAmber className="h-7 w-7" />
          System Data Reset & Cleanup
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Dangerous operations: Perform targeted database cleanups or complete system factory reset
        </p>
      </div>

      {!unlocked ? (
        /* Security Gate Card */
        <div className="mx-auto w-full max-w-md">
          <Card extra="p-8 text-center flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
              <MdLock className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-navy-700 dark:text-white">
              Security Reset Password Required
            </h3>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              To access system cleanup controls, enter the Master Reset Password (
              <code className="rounded bg-gray-100 px-1 py-0.5 font-bold text-brand-500 dark:bg-navy-900">
                RESET@2026
              </code>
              ) or your Superadmin password.
            </p>

            {gateError && (
              <div className="mt-4 w-full rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-500">
                {gateError}
              </div>
            )}

            <form onSubmit={handleUnlockGate} className="mt-6 flex w-full flex-col gap-4">
              <input
                type="password"
                placeholder="Enter Reset Password"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                required
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-center text-sm font-bold tracking-widest text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={gateLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
              >
                <MdShield className="h-5 w-5" />
                <span>{gateLoading ? 'Verifying...' : 'Unlock Reset Controls'}</span>
              </button>
            </form>
          </Card>
        </div>
      ) : (
        /* Unlocked Reset Options Panel */
        <Card extra="p-6 md:p-8">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
              <MdDeleteForever className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                Select Database Cleanup Action
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select option, re-verify password, and type RESET to execute
              </p>
            </div>
          </div>

          {resetResult && (
            <div
              className={`mt-5 rounded-2xl p-5 text-sm ${
                resetResult.success
                  ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {resetResult.success ? (
                  <MdCheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <MdWarningAmber className="h-5 w-5 text-red-500" />
                )}
                <span>{resetResult.message}</span>
              </div>

              {resetResult.summary && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4 font-semibold">
                  <div className="rounded-lg bg-white/60 p-2 dark:bg-navy-900/60">
                    Attendance Cleared: {resetResult.summary.attendanceCleared ?? 0}
                  </div>
                  <div className="rounded-lg bg-white/60 p-2 dark:bg-navy-900/60">
                    Lectures Cleared: {resetResult.summary.lecturesCleared ?? 0}
                  </div>
                  <div className="rounded-lg bg-white/60 p-2 dark:bg-navy-900/60">
                    Departments Cleared: {resetResult.summary.departmentsCleared ?? 0}
                  </div>
                  <div className="rounded-lg bg-white/60 p-2 dark:bg-navy-900/60">
                    Users Cleared: {resetResult.summary.usersCleared ?? 0}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleExecuteReset} className="mt-6 flex flex-col gap-5">
            {/* Options List */}
            <div className="flex flex-col gap-3">
              {/* Option 1 */}
              <label
                onClick={() => setResetType('attendance_only')}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                  resetType === 'attendance_only'
                    ? 'border-brand-500 bg-brand-50/40 dark:border-brand-400 dark:bg-navy-900'
                    : 'border-gray-200 hover:border-gray-300 dark:border-white/10 dark:bg-navy-800'
                }`}
              >
                <input
                  type="radio"
                  name="resetType"
                  value="attendance_only"
                  checked={resetType === 'attendance_only'}
                  onChange={() => setResetType('attendance_only')}
                  className="mt-1 h-4 w-4 text-brand-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-navy-700 dark:text-white">
                    1. Clear Attendance Logs Only
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Deletes all recorded attendance sheets while keeping scheduled lectures, departments, faculty, and student user accounts intact.
                  </p>
                </div>
              </label>

              {/* Option 2 */}
              <label
                onClick={() => setResetType('lectures_only')}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                  resetType === 'lectures_only'
                    ? 'border-brand-500 bg-brand-50/40 dark:border-brand-400 dark:bg-navy-900'
                    : 'border-gray-200 hover:border-gray-300 dark:border-white/10 dark:bg-navy-800'
                }`}
              >
                <input
                  type="radio"
                  name="resetType"
                  value="lectures_only"
                  checked={resetType === 'lectures_only'}
                  onChange={() => setResetType('lectures_only')}
                  className="mt-1 h-4 w-4 text-brand-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-navy-700 dark:text-white">
                    2. Clear All Scheduled Lectures & Attendance Logs
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Deletes all scheduled lectures and attendance records. User accounts and department structures remain saved.
                  </p>
                </div>
              </label>

              {/* Option 3 */}
              <label
                onClick={() => setResetType('users_only')}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                  resetType === 'users_only'
                    ? 'border-brand-500 bg-brand-50/40 dark:border-brand-400 dark:bg-navy-900'
                    : 'border-gray-200 hover:border-gray-300 dark:border-white/10 dark:bg-navy-800'
                }`}
              >
                <input
                  type="radio"
                  name="resetType"
                  value="users_only"
                  checked={resetType === 'users_only'}
                  onChange={() => setResetType('users_only')}
                  className="mt-1 h-4 w-4 text-brand-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-navy-700 dark:text-white">
                    3. Clear All Faculty, Student & Admin User Accounts
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Deletes all enrolled students, faculty members, and department admins. Preserves Superadmin login.
                  </p>
                </div>
              </label>

              {/* Option 4 */}
              <label
                onClick={() => setResetType('full_system')}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                  resetType === 'full_system'
                    ? 'border-red-500 bg-red-50/60 dark:border-red-500 dark:bg-red-950/20'
                    : 'border-red-200 bg-red-50/20 dark:border-red-900/30'
                }`}
              >
                <input
                  type="radio"
                  name="resetType"
                  value="full_system"
                  checked={resetType === 'full_system'}
                  onChange={() => setResetType('full_system')}
                  className="mt-1 h-4 w-4 text-red-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <MdWarningAmber className="h-4 w-4" />
                    MASTER WIPE: Full System Reset (Factory Reset)
                  </h4>
                  <p className="mt-0.5 text-xs text-red-700/80 dark:text-red-300/80">
                    Wipes all attendance logs, lectures, departments, faculty members, students, and department admins. Only Superadmin is preserved.
                  </p>
                </div>
              </label>
            </div>

            {/* Confirm Inputs */}
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Enter Master Reset Password
                </label>
                <input
                  type="password"
                  placeholder="Master or Superadmin Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-navy-700 outline-none transition focus:border-red-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Type "RESET" to Confirm
                </label>
                <input
                  type="text"
                  placeholder="Type RESET in capital letters"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  required
                  className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold tracking-widest text-navy-700 outline-none transition focus:border-red-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-2">
              <button
                type="submit"
                disabled={resetLoading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-8 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
              >
                <MdDeleteForever className="h-5 w-5" />
                <span>
                  {resetLoading ? 'Executing Reset...' : 'Execute System Reset'}
                </span>
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
