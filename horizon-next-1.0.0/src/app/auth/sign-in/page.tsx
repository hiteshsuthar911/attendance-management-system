'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Default from 'components/auth/variants/DefaultAuthLayout';
import { Auth, fetchApi } from 'utils/auth';
import {
  MdEmail,
  MdLock,
  MdSecurity,
  MdSchool,
  MdArrowBack,
  MdRefresh,
  MdCheckCircle,
  MdAdminPanelSettings,
  MdBadge,
} from 'react-icons/md';

type LoginMode = 'staff' | 'student';
type Step = 'credentials' | '2fa';

function SignInPage() {
  const router = useRouter();

  // Mode: Staff/Admin vs Student
  const [mode, setMode] = useState<LoginMode>('staff');
  const [step, setStep] = useState<Step>('credentials');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA State
  const [tempToken, setTempToken] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [userRole, setUserRole] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [refreshingCode, setRefreshingCode] = useState(false);

  // References for OTP inputs
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Clear errors on mode change
  const handleModeSwitch = (newMode: LoginMode) => {
    setMode(newMode);
    setError('');
    setEmail('');
    setPassword('');
  };

  // Step 1: Submit Credentials
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/auth/login-step1', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (data.success && data.tempToken) {
        setTempToken(data.tempToken);
        setSecurityCode(data.securityCode || '');
        setUserRole(data.role || '');
        setStep('2fa');
        setOtpDigits(['', '', '', '', '', '']);

        // Auto-focus first OTP input after state update
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 150);
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP Input Navigation
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const val = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (val.length > 1) {
      // Pasted multi-digit code
      const pasted = val.slice(0, 6).split('');
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Refresh Security Code
  const handleRefreshSecurityCode = async () => {
    if (!tempToken) return;
    setRefreshingCode(true);
    try {
      const res = await fetchApi('/api/auth/refresh-security-code', {
        method: 'POST',
        body: JSON.stringify({ tempToken }),
      });
      const data = await res.json();
      if (data.success && data.securityCode) {
        setSecurityCode(data.securityCode);
      }
    } catch (err) {
      console.error('Error refreshing security code:', err);
    } finally {
      setRefreshingCode(false);
    }
  };

  // Step 2: Verify 6-Digit Code
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputCode = otpDigits.join('');

    if (inputCode.length !== 6) {
      setError('Please enter the full 6-digit security code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetchApi('/api/auth/verify-security', {
        method: 'POST',
        body: JSON.stringify({
          tempToken,
          inputCode,
        }),
      });

      const data = await res.json();

      if (data.success && data.token && data.user) {
        Auth.setAuth(data.token, data.user);

        // Role-based routing to Horizon Next.js portals
        if (data.user.role === 'superadmin' || data.user.role === 'admin') {
          router.push('/admin/default');
        } else if (data.user.role === 'faculty') {
          router.push('/faculty/overview');
        } else if (data.user.role === 'student') {
          router.push('/student/overview');
        } else {
          router.push('/admin/default');
        }
      } else {
        setError(data.message || 'Incorrect security code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Default
      maincard={
        <div className="flex w-full items-center justify-center lg:justify-start">
          <div className="w-full max-w-[440px] flex-col">
            {/* Header Brand */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-md shadow-black/5 dark:bg-navy-700">
                <img
                  src="/tcetlogo.png"
                  alt="Thakur College Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-poppins text-xl font-extrabold text-navy-700 dark:text-white">
                  Attend<span className="text-brand-500">MS</span>
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {mode === 'staff' ? 'Staff & Administration' : 'Student Access Portal'}
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3.5 text-xs font-bold text-red-500 dark:bg-red-500/20">
                {error}
              </div>
            )}

            {step === 'credentials' ? (
              /* STEP 1: CREDENTIALS WITH SLIDING TOGGLE */
              <div>
                {/* Sliding Mode Switcher Pill */}
                <div className="relative mb-6 flex rounded-2xl bg-gray-100 p-1.5 dark:bg-navy-800">
                  <div
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-md transition-all duration-300 ease-out dark:bg-brand-500 ${
                      mode === 'staff' ? 'left-1.5' : 'left-[calc(50%+3px)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('staff')}
                    className={`relative z-10 flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-bold transition duration-200 ${
                      mode === 'staff'
                        ? 'text-brand-500 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MdAdminPanelSettings className="h-4 w-4" />
                    <span>Staff / Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeSwitch('student')}
                    className={`relative z-10 flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-bold transition duration-200 ${
                      mode === 'student'
                        ? 'text-brand-500 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MdSchool className="h-4 w-4" />
                    <span>Student Portal</span>
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-navy-700 dark:text-white">
                    {mode === 'staff' ? 'Staff & Admin Sign In' : 'Student Attendance Sign In'}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {mode === 'staff'
                      ? 'Sign in as Superadmin, Department Admin, or Faculty Member'
                      : 'Sign in with your registered college student email credentials'}
                  </p>
                </div>

                <form onSubmit={handleStep1Submit} className="flex flex-col gap-4">
                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                      {mode === 'staff' ? 'Institutional Email*' : 'Student Email*'}
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                      <span className="absolute left-3.5 text-gray-400">
                        <MdEmail className="h-5 w-5" />
                      </span>
                      <input
                        type="email"
                        placeholder={
                          mode === 'staff'
                            ? 'superadmin@attendance.com'
                            : 'student@tcetmumbai.in'
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                      Password*
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                      <span className="absolute left-3.5 text-gray-400">
                        <MdLock className="h-5 w-5" />
                      </span>
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3 text-sm text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
                  >
                    {loading ? 'Validating Credentials...' : 'Continue to 2-Step Verification →'}
                  </button>
                </form>

                {/* Role Guidance Tip */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-500 dark:border-white/10 dark:bg-navy-800 dark:text-gray-400">
                  ⚡ <b>2-Step Verification Active:</b> A 6-digit security code challenge will be required in the next step.
                </div>
              </div>
            ) : (
              /* STEP 2: 2-STEP VERIFICATION & CAPTCHA NUMBER INPUT */
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                  }}
                  className="mb-4 flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  <MdArrowBack className="h-4 w-4" />
                  <span>Back to login</span>
                </button>

                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                      <MdSecurity className="h-4 w-4" />
                    </span>
                    <h3 className="text-2xl font-bold text-navy-700 dark:text-white">
                      2-Step Verification
                    </h3>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Enter the 6-digit numeric security captcha code shown below to confirm your session
                  </p>
                </div>

                {/* Displayed Security Captcha Code Box */}
                <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-navy-800">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    Security Challenge Code
                  </span>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="rounded-xl bg-white px-5 py-2 text-2xl font-extrabold tracking-[8px] text-brand-500 shadow-sm dark:bg-navy-900 dark:text-white">
                      {securityCode || '------'}
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshSecurityCode}
                      disabled={refreshingCode}
                      className="rounded-xl bg-white p-2.5 text-gray-600 shadow-sm transition hover:text-brand-500 active:scale-95 dark:bg-navy-900 dark:text-gray-300"
                      title="Generate New Code"
                    >
                      <MdRefresh className={`h-5 w-5 ${refreshingCode ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <span className="mt-1.5 text-[10px] text-gray-400">
                    Type this 6-digit number into the boxes below
                  </span>
                </div>

                {/* 6-Digit OTP Inputs Form */}
                <form onSubmit={handleStep2Submit} className="flex flex-col gap-5">
                  <div>
                    <label className="text-center block text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white mb-2">
                      Enter 6-Digit Security Code
                    </label>
                    <div className="flex justify-between gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputsRef.current[idx] = el;
                          }}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="h-12 w-12 rounded-xl border border-gray-200 bg-white text-center text-lg font-bold text-navy-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length !== 6}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
                  >
                    <MdCheckCircle className="h-5 w-5" />
                    <span>{loading ? 'Verifying Code...' : 'Verify & Enter Portal'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}

export default SignInPage;
