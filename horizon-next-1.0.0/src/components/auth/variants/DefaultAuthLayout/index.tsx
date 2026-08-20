'use client';
import React from 'react';
import Image from 'next/image';
import {
  MdApartment,
  MdBarChart,
  MdSecurity,
  MdSchool,
  MdVerified,
} from 'react-icons/md';

function Default(props: { maincard: JSX.Element }) {
  const { maincard } = props;

  return (
    <div className="relative flex min-h-screen w-full bg-white dark:bg-navy-900">
      {/* Left Column — Sign In Form & Left-aligned Footer */}
      <div className="flex min-h-screen w-full flex-col justify-between px-6 py-8 sm:px-12 lg:w-[52%] lg:px-16 xl:w-[55%] xl:px-24">
        {/* Top Spacer or Mini Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              System Online • Academic 2026
            </span>
          </div>
        </div>

        {/* Center Main Card Form */}
        <div className="my-auto py-8">
          {maincard}
        </div>

        {/* Bottom Left Footer */}
        <div className="border-t border-gray-100 pt-4 dark:border-white/10">
          <p className="text-xs text-gray-400">
            © 2026 Thakur College of Engineering & Technology (TCET). Central Attendance System.
          </p>
        </div>
      </div>

      {/* Right Column — TCET Hero Visual Banner */}
      <div className="relative hidden min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#4318FF] via-[#3311c9] to-[#1a086b] p-10 text-white shadow-2xl lg:flex lg:rounded-l-[40px] xl:rounded-l-[60px]">
        {/* Glowing Background Circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
          {/* TCET College Logo Badge */}
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white p-3.5 shadow-2xl shadow-black/30 transition hover:scale-105 duration-300">
            <Image
              src="/tcetlogo.png"
              alt="Thakur College of Engineering & Technology Logo"
              width={96}
              height={96}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Title and Academic Tag */}
          <div className="mt-6">
            <h1 className="font-poppins text-3xl font-extrabold tracking-tight xl:text-4xl text-white">
              Attend<span className="text-brand-300">MS</span>
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-200">
              Thakur College of Engineering & Technology
            </p>
            <p className="mt-1 text-xs text-white/70">
              Centralized Academic Attendance Management & Reporting Portal
            </p>
          </div>

          {/* Feature Highlights Glass Cards Grid */}
          <div className="mt-8 grid w-full grid-cols-2 gap-3.5 text-left">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm">
                <MdApartment className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">All Departments</span>
                <span className="text-[10px] text-white/70">Unified Control</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm">
                <MdBarChart className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Live Matrices</span>
                <span className="text-[10px] text-white/70">Direct PDF/Excel Export</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm">
                <MdSecurity className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">2FA Security</span>
                <span className="text-[10px] text-white/70">Master Gate Protected</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 shadow-lg shadow-black/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm">
                <MdSchool className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Role-Based Access</span>
                <span className="text-[10px] text-white/70">Faculty & Student Roster</span>
              </div>
            </div>
          </div>

          {/* Bottom Accreditation Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              <MdVerified className="h-3.5 w-3.5 text-brand-300" />
              <span>Autonomous Engineering College</span>
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md">
              ISO 9001:2015
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Default;
