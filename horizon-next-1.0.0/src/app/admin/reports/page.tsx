'use client';
import React, { useEffect, useState, useRef } from 'react';
import Card from 'components/card';
import {
  MdAssessment,
  MdDownload,
  MdPrint,
  MdFilterList,
  MdEdit,
  MdTableChart,
  MdFormatListNumbered,
  MdRefresh,
} from 'react-icons/md';
import { fetchApi, Auth } from 'utils/auth';
import { IDepartment } from 'types/attendance';

interface ISignatureSettings {
  slot1Header: string; slot1Name: string; slot1Title: string;
  slot2Header: string; slot2Name: string; slot2Title: string;
  slot3Header: string; slot3Name: string; slot3Title: string;
  slot4Header: string; slot4Name: string; slot4Title: string;
  slot5Header: string; slot5Name: string; slot5Title: string;
  slot6Header: string; slot6Name: string; slot6Title: string;
  slot7Header: string; slot7Name: string; slot7Title: string;
  customRemarkText: string;
  customDueDate: string;
  customCompletionDate: string;
  customReason: string;
}

const DEFAULT_SIGNATURES: ISignatureSettings = {
  slot1Header: 'Prepared By', slot1Name: 'Prof. Shruti Mishra', slot1Title: 'Lecturer, B.Voc',
  slot2Header: 'Checked By', slot2Name: 'Dr. Manoj Chavan', slot2Title: 'HOD, B.Voc',
  slot3Header: 'Verified By', slot3Name: '', slot3Title: '',
  slot4Header: 'Reviewed By', slot4Name: '', slot4Title: '',
  slot5Header: 'Approved By', slot5Name: 'Sheetal Rathi', slot5Title: 'Dean Academics',
  slot6Header: 'Vice Principal', slot6Name: 'Dr. R. R. Sedamkar', slot6Title: 'Vice Principal',
  slot7Header: 'Principal', slot7Name: 'Dr. B. K. Mishra', slot7Title: 'Principal',
  customRemarkText: 'Regular Academic Attendance Record',
  customDueDate: '05/08/2026',
  customCompletionDate: '05/08/2026',
  customReason: '________________________________________',
};

export default function AttendanceReports() {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [programs, setPrograms] = useState<IAcademicProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [branch, setBranch] = useState('SD');
  const [batch, setBatch] = useState('Batch-5');
  const [month, setMonth] = useState('7');
  const [year, setYear] = useState('2026');
  const [reportMode, setReportMode] = useState<'monthly' | 'register'>('monthly');

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [registerData, setRegisterData] = useState<any>(null);

  // Signatures State
  const [sigs, setSigs] = useState<ISignatureSettings>(DEFAULT_SIGNATURES);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [resDepts, resProgs] = await Promise.all([
          fetchApi('/api/departments'),
          fetchApi('/api/academic-programs'),
        ]);
        const dataDepts = await resDepts.json();
        const dataProgs = await resProgs.json();

        if (dataDepts.success && dataDepts.departments.length > 0) {
          setDepartments(dataDepts.departments);
          setDeptId(dataDepts.departments[0]._id);
        }
        if (dataProgs.success && dataProgs.programs.length > 0) {
          setPrograms(dataProgs.programs);
          const first = dataProgs.programs[0];
          setSelectedProgramId(first._id);
          setBranch(first.branchCode);
          if (first.batches && first.batches.length > 0) {
            setBatch(first.batches[0]);
          }
        }
      } catch (err) {
        console.error('Error loading report filters:', err);
      }
    };
    loadInitialData();

    // Load saved signatures from localStorage
    try {
      const saved = localStorage.getItem('tcet_report_sigs_v5');
      if (saved) {
        setSigs({ ...DEFAULT_SIGNATURES, ...JSON.parse(saved) });
      }
    } catch (e) {}
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

  const updateSigField = (key: keyof ISignatureSettings, val: string) => {
    setSigs((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem('tcet_report_sigs_v5', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleGenerateMonthly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setReportMode('monthly');
    setLoading(true);

    try {
      const url = `/api/reports/monthly-matrix?departmentId=${encodeURIComponent(deptId)}&branch=${encodeURIComponent(branch)}&batch=${encodeURIComponent(batch)}&month=${month}&year=${year}`;
      const res = await fetchApi(url);
      const data = await res.json();

      if (data.success) {
        setReportData(data);
      } else {
        alert(data.message || 'Failed to generate monthly matrix');
      }
    } catch (err: any) {
      alert('Error fetching monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRegister = async () => {
    setReportMode('register');
    setLoading(true);

    try {
      const url = `/api/reports/register-grid?departmentId=${encodeURIComponent(deptId)}&branch=${encodeURIComponent(branch)}&batch=${encodeURIComponent(batch)}`;
      const res = await fetchApi(url);
      const data = await res.json();

      if (data.success) {
        setRegisterData(data);
      } else {
        alert(data.message || 'Failed to generate register grid');
      }
    } catch (err: any) {
      alert('Error fetching register grid');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const token = Auth.getToken();
    const url = `/api/reports/export-csv?departmentId=${encodeURIComponent(deptId)}&branch=${encodeURIComponent(branch)}&batch=${encodeURIComponent(batch)}&month=${month}&year=${year}&token=${encodeURIComponent(token || '')}`;
    window.open(url, '_blank');
  };

  const exportExcel = () => {
    const token = Auth.getToken();
    const url = `/api/reports/export-excel?departmentId=${encodeURIComponent(deptId)}&branch=${encodeURIComponent(branch)}&batch=${encodeURIComponent(batch)}&month=${month}&year=${year}&token=${encodeURIComponent(token || '')}`;
    window.open(url, '_blank');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const activeMonthName = monthNames[parseInt(month) - 1] || 'July';

  return (
    <div className="flex flex-col gap-6">
      {/* Scoped Print CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          aside,
          nav,
          header,
          footer,
          .print-hide,
          .navbar-container {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .printable-report {
            width: 100% !important;
            min-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .printable-report table {
            width: 100% !important;
            font-size: 8px !important;
          }
          .printable-report th,
          .printable-report td {
            padding: 2px 2px !important;
          }
          [contenteditable] {
            border: none !important;
            outline: none !important;
          }
        }
      `}</style>

      {/* Header — Hidden on Print */}
      <div className="print-hide flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            Institutional Attendance Reports & Matrix
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate official TCET attendance matrices, register grids, and export sheets with inline editable signatures
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSigs(DEFAULT_SIGNATURES);
              try { localStorage.removeItem('tcet_report_sigs_v5'); } catch (e) {}
            }}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-navy-800 dark:text-gray-300"
            title="Reset default signature blanks"
          >
            <MdRefresh className="h-4 w-4 text-brand-500" />
            <span>Reset Signatures</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <MdDownload className="h-4 w-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-green-700"
          >
            <MdDownload className="h-4 w-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-brand-600"
          >
            <MdPrint className="h-4 w-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters Card — Hidden on Print */}
      <Card extra="print-hide p-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
          <MdFilterList className="h-5 w-5 text-brand-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy-700 dark:text-white">
            Report Parameters & Action Mode
          </h3>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Degree & Branch
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramSelect(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-brand-500/30 bg-brand-50/20 px-2 text-xs font-bold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.degree} - {p.branchCode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Branch Code
            </label>
            <input
              type="text"
              placeholder="e.g. SD"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Batch
            </label>
            <input
              type="text"
              placeholder="e.g. Batch-5"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Department
            </label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-gray-200 bg-white px-2 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code} ({d.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Month & Year
            </label>
            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="mt-1.5 flex h-11 w-2/3 rounded-xl border border-gray-200 bg-white px-2 text-xs font-medium text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={String(idx + 1)}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1.5 flex h-11 w-1/3 rounded-xl border border-gray-200 bg-white px-2 text-xs text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-end gap-1.5">
            <button
              type="button"
              onClick={() => handleGenerateMonthly()}
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-brand-500 px-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
            >
              <MdTableChart className="h-4 w-4" />
              <span>{loading && reportMode === 'monthly' ? '...' : 'Matrix'}</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateRegister}
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 px-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
            >
              <MdFormatListNumbered className="h-4 w-4" />
              <span>{loading && reportMode === 'register' ? '...' : 'Grid'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* ── Official HTML Report Area (Exact TCET Print Format) ── */}
      {reportMode === 'monthly' && reportData && (
        <Card extra="printable-report p-6 bg-white overflow-x-auto print:p-0 print:border-none print:shadow-none">
          <div className="min-w-[1050px] p-4 text-black bg-white font-sans">
            
            {/* TCET College Banner */}
            <div className="mb-3 text-center">
              <img
                src="/images/tcetbanner.jpg"
                alt="TCET Banner"
                className="mx-auto block max-h-24 w-auto object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>

            {/* Official Document Header Titles */}
            <div className="mb-4 text-center text-xs leading-relaxed">
              <p className="text-sm font-bold">
                {branch} Overall Attendance ({activeMonthName} Monthly Attendance) {year} {batch}
              </p>
              <p className="font-bold">
                *Department : BACHELOR OF VOCATIONAL ({branch}) Section : S.Y.B.Voc (B)
              </p>
              <p className="font-bold">
                Month wise and Span Wise Summary (Cr Yr Wise) Report for {activeMonthName} {year}
              </p>
              <p>For Session {year}-{parseInt(year) + 1} (ODD)</p>
            </div>

            {/* Attendance Matrix Table (Exact Bordered 3-Tier Header Format) */}
            <table className="w-full border-collapse border border-black text-center text-[10px]">
              <thead>
                <tr className="bg-white">
                  <th rowSpan={3} className="w-16 border border-black p-1 font-bold">
                    Roll No.
                  </th>
                  <th rowSpan={3} className="w-36 border border-black p-1 text-left font-bold pl-2">
                    Name of Student
                  </th>
                  {reportData.subjects?.map((s: any) => (
                    <th key={s.subjectName} colSpan={4} className="border border-black p-1 font-bold min-w-[100px]">
                      <div>{s.subjectName}</div>
                      <span className="text-[8.5px] font-normal text-gray-700">{s.facultyName}</span>
                    </th>
                  ))}
                  <th colSpan={4} className="border border-black p-1 font-bold min-w-[110px]">
                    Total Attendance
                  </th>
                </tr>

                <tr className="bg-white">
                  {reportData.subjects?.map((s: any) => (
                    <React.Fragment key={s.subjectName}>
                      <th colSpan={2} className="border border-black font-bold">MLY</th>
                      <th colSpan={2} className="border border-black font-bold">CUM</th>
                    </React.Fragment>
                  ))}
                  <th colSpan={2} className="border border-black font-bold">MLY</th>
                  <th colSpan={2} className="border border-black font-bold">CUM</th>
                </tr>

                <tr className="bg-white">
                  {reportData.subjects?.map((s: any) => (
                    <React.Fragment key={s.subjectName}>
                      <th className="border border-black font-bold">Att</th>
                      <th className="border border-black font-bold">%</th>
                      <th className="border border-black font-bold">Att</th>
                      <th className="border border-black font-bold">%</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-black font-bold">Att</th>
                  <th className="border border-black font-bold">%</th>
                  <th className="border border-black font-bold">Att</th>
                  <th className="border border-black font-bold">%</th>
                </tr>

                {/* Total Lectures Row */}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="border border-black pr-2 text-right">
                    Total lectures --&gt;
                  </td>
                  {reportData.subjects?.map((s: any) => (
                    <React.Fragment key={s.subjectName}>
                      <td className="border border-black">{s.mlyTotalLectures || 0}</td>
                      <td className="border border-black">100</td>
                      <td className="border border-black">{s.cumTotalLectures || 0}</td>
                      <td className="border border-black">100</td>
                    </React.Fragment>
                  ))}
                  <td className="border border-black font-extrabold">
                    {reportData.subjects?.reduce((acc: number, s: any) => acc + (s.mlyTotalLectures || 0), 0)}
                  </td>
                  <td className="border border-black">100</td>
                  <td className="border border-black font-extrabold">
                    {reportData.subjects?.reduce((acc: number, s: any) => acc + (s.cumTotalLectures || 0), 0)}
                  </td>
                  <td className="border border-black">100</td>
                </tr>
              </thead>

              <tbody>
                {reportData.students?.map((st: any) => {
                  const ov = st.overall || {};
                  return (
                    <tr key={st.studentId || st.rollNumber} className="hover:bg-yellow-50/50">
                      <td className="border border-black p-1 font-bold whitespace-nowrap">
                        {st.rollNumber}
                      </td>
                      <td className="border border-black p-1 text-left pl-2 font-medium whitespace-nowrap">
                        {st.studentName}
                      </td>

                      {reportData.subjects?.map((s: any) => {
                        const stats = st.subjectStats?.[s.subjectName] || {};
                        return (
                          <React.Fragment key={s.subjectName}>
                            <td className="border border-black">{stats.mlyAttended || 0}</td>
                            <td className="border border-black font-bold">{stats.mlyPercentage || 0}</td>
                            <td className="border border-black">{stats.cumAttended || 0}</td>
                            <td className="border border-black font-bold">{stats.cumPercentage || 0}</td>
                          </React.Fragment>
                        );
                      })}

                      <td className="border border-black font-semibold">{ov.totalMlyAttended || 0}</td>
                      <td className="border border-black font-bold" style={{ color: (ov.overallMlyPct || 0) >= 75 ? 'green' : 'red' }}>
                        {ov.overallMlyPct || 0}
                      </td>
                      <td className="border border-black font-semibold">{ov.totalCumAttended || 0}</td>
                      <td className="border border-black font-bold" style={{ color: (ov.overallCumPct || 0) >= 75 ? 'green' : 'red' }}>
                        {ov.overallCumPct || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── 100% Fully Editable Official Remarks & 7-Slot Signature Footer ── */}
            <div className="mt-6 text-xs">
              <p className="mb-6 font-bold">
                Remark:{' '}
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateSigField('customRemarkText', e.currentTarget.textContent || '')}
                  className="font-normal border-b border-dashed border-gray-400 px-2 outline-none hover:bg-yellow-100 transition"
                  title="Click to edit remark"
                >
                  {sigs.customRemarkText}
                </span>
              </p>

              {/* Top 5 Header Labels (Inline Editable) */}
              <div className="mb-8 flex justify-between px-2 text-center font-bold">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateSigField('slot1Header', e.currentTarget.textContent || '')}
                  className="w-[18%] outline-none hover:bg-yellow-100 transition"
                  title="Click to edit header"
                >
                  {sigs.slot1Header || 'Prepared By'}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateSigField('slot2Header', e.currentTarget.textContent || '')}
                  className="w-[18%] outline-none hover:bg-yellow-100 transition"
                  title="Click to edit header"
                >
                  {sigs.slot2Header || 'Checked By'}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateSigField('slot3Header', e.currentTarget.textContent || '')}
                  className="w-[18%] outline-none hover:bg-yellow-100 transition"
                  title="Click to edit header"
                >
                  {sigs.slot3Header || 'Verified By'}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateSigField('slot4Header', e.currentTarget.textContent || '')}
                  className="w-[18%] outline-none hover:bg-yellow-100 transition"
                  title="Click to edit header"
                >
                  {sigs.slot4Header || 'Reviewed By'}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateSigField('slot5Header', e.currentTarget.textContent || '')}
                  className="w-[18%] outline-none hover:bg-yellow-100 transition"
                  title="Click to edit header"
                >
                  {sigs.slot5Header || 'Approved By'}
                </div>
              </div>

              {/* 7 Signatures with Sd/- (Inline Editable) */}
              <div className="flex justify-between px-1 text-center text-[10px] leading-tight">
                {/* Slot 1 */}
                <div className="w-[14%]">
                  <i>Sd/-</i><br />
                  <b
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot1Name', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit name"
                  >
                    {sigs.slot1Name || '__________'}
                  </b><br />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot1Title', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit title"
                  >
                    {sigs.slot1Title || '__________'}
                  </span>
                </div>

                {/* Slot 2 */}
                <div className="w-[14%]">
                  <i>Sd/-</i><br />
                  <b
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot2Name', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit name"
                  >
                    {sigs.slot2Name || '__________'}
                  </b><br />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot2Title', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit title"
                  >
                    {sigs.slot2Title || '__________'}
                  </span>
                </div>

                {/* Slot 3 */}
                <div className="w-[14%]">
                  <i>Sd/-</i><br />
                  <b
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot3Name', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit name"
                  >
                    {sigs.slot3Name || '__________'}
                  </b><br />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot3Title', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit title"
                  >
                    {sigs.slot3Title || '__________'}
                  </span>
                </div>

                {/* Slot 4 */}
                <div className="w-[14%]">
                  <i>Sd/-</i><br />
                  <b
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot4Name', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit name"
                  >
                    {sigs.slot4Name || '__________'}
                  </b><br />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot4Title', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit title"
                  >
                    {sigs.slot4Title || '__________'}
                  </span>
                </div>

                {/* Slot 5 */}
                <div className="w-[14%]">
                  <i>Sd/-</i><br />
                  <b
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot5Name', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit name"
                  >
                    {sigs.slot5Name || '__________'}
                  </b><br />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot5Title', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit title"
                  >
                    {sigs.slot5Title || '__________'}
                  </span>
                </div>

                {/* Slot 6 */}
                <div className="w-[14%]">
                  <i>Sd/-</i><br />
                  <b
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot6Name', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit name"
                  >
                    {sigs.slot6Name || '__________'}
                  </b><br />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot6Title', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit title"
                  >
                    {sigs.slot6Title || '__________'}
                  </span>
                </div>

                {/* Slot 7 */}
                <div className="w-[14%]">
                  <i>Sd/-</i><br />
                  <b
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot7Name', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit name"
                  >
                    {sigs.slot7Name || '__________'}
                  </b><br />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('slot7Title', e.currentTarget.textContent || '')}
                    className="outline-none hover:bg-yellow-100 transition"
                    title="Click to edit title"
                  >
                    {sigs.slot7Title || '__________'}
                  </span>
                </div>
              </div>

              {/* Due Date & Completion Footer (Inline Editable) */}
              <div className="mt-6 text-[10px] space-y-1">
                <p>
                  <b>Due date:</b>{' '}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('customDueDate', e.currentTarget.textContent || '')}
                    className="font-normal outline-none hover:bg-yellow-100 px-1"
                    title="Click to edit due date"
                  >
                    {sigs.customDueDate}
                  </span>
                </p>
                <p>
                  <b>Completion Date:</b>{' '}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('customCompletionDate', e.currentTarget.textContent || '')}
                    className="font-normal outline-none hover:bg-yellow-100 px-1"
                    title="Click to edit completion date"
                  >
                    {sigs.customCompletionDate}
                  </span>
                </p>
                <p>
                  <b>If not as per the due date (Reason):</b>{' '}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateSigField('customReason', e.currentTarget.textContent || '')}
                    className="font-normal outline-none hover:bg-yellow-100 px-1"
                    title="Click to edit reason"
                  >
                    {sigs.customReason}
                  </span>
                </p>
              </div>
            </div>

          </div>
        </Card>
      )}

      {/* ── Register Grid View (Exact Format) ── */}
      {reportMode === 'register' && registerData && (
        <Card extra="printable-report p-6 bg-white overflow-x-auto print:p-0 print:border-none print:shadow-none">
          <div className="min-w-[950px] p-4 text-black bg-white font-sans">
            {/* TCET College Banner */}
            <div className="mb-3 text-center">
              <img
                src="/images/tcetbanner.jpg"
                alt="TCET Banner"
                className="mx-auto block max-h-20 w-auto object-contain"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>

            <table className="mb-4 w-full border-collapse border border-black text-xs">
              <tbody>
                <tr><td className="w-1/4 p-1.5 font-bold border border-black">FACULTY NAME</td><td className="p-1.5 border border-black">{sigs.slot1Name}</td></tr>
                <tr><td className="p-1.5 font-bold border border-black">SUBJECT NAME</td><td className="p-1.5 border border-black">{registerData.meta?.subjectName || 'All Subjects'}</td></tr>
                <tr><td className="p-1.5 font-bold border border-black">BRANCH / BATCH</td><td className="p-1.5 border border-black">{branch} / {batch}</td></tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border border-black text-center text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-12 border border-black p-1.5">Sr.No</th>
                  <th className="w-28 border border-black p-1.5">Roll No</th>
                  <th className="w-44 border border-black p-1.5 text-left pl-2">Student Name</th>
                  {registerData.columns?.map((c: any) => (
                    <th key={c.lectureId} className="border border-black p-1">
                      <div>{c.date}</div>
                      <span className="text-[9px] text-gray-500">{c.timeSlot}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registerData.students?.map((st: any) => (
                  <tr key={st.srNo}>
                    <td className="border border-black p-1">{st.srNo}</td>
                    <td className="border border-black p-1 font-bold">{st.rollNo}</td>
                    <td className="border border-black p-1 text-left pl-2">{st.studentName}</td>
                    {st.statusPerCol?.map((status: string, idx: number) => (
                      <td
                        key={idx}
                        className="border border-black p-1 font-bold"
                        style={{ color: status === 'P' ? 'green' : 'red' }}
                      >
                        {status}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
