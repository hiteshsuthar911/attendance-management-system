document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['admin']);
  if (!currentUser) return;

  const adminNameElem = document.getElementById('adminName');
  if (adminNameElem) adminNameElem.textContent = currentUser.name;
  const adminEmailElem = document.getElementById('adminEmail');
  if (adminEmailElem) adminEmailElem.textContent = currentUser.email;

  const adminDeptText = currentUser.departments && currentUser.departments.length > 0
    ? currentUser.departments.map(d => `${d.name} (${d.code})`).join(', ')
    : 'All Departments';
  const adminDeptListElem = document.getElementById('adminDeptList');
  if (adminDeptListElem) adminDeptListElem.textContent = adminDeptText;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  const statusMsg = document.getElementById('exportStatusMsg');

  const setStatus = (msg, isError = false) => {
    if (!statusMsg) return;
    statusMsg.style.color = isError ? 'red' : 'green';
    statusMsg.textContent = msg;
    setTimeout(() => {
      statusMsg.textContent = '';
    }, 6000);
  };

  // ── Signature & Remarks Settings ──────────────────────────────
  const toggleSigBtn = document.getElementById('toggleSigSettingsBtn');
  const sigPanel = document.getElementById('signatureSettingsPanel');

  if (toggleSigBtn && sigPanel) {
    toggleSigBtn.addEventListener('click', () => {
      const isHidden = sigPanel.style.display === 'none' || !sigPanel.style.display;
      sigPanel.style.display = isHidden ? 'block' : 'none';
      toggleSigBtn.style.background = isHidden ? '#cbd5e1' : '#f1f5f9';
    });
  }

  const SIG_STORAGE_KEY = 'tcet_report_signatures_v4_fully_custom';

  const SIG_FIELD_IDS = [
    'slot1Header', 'slot1Name', 'slot1Title',
    'slot2Header', 'slot2Name', 'slot2Title',
    'slot3Header', 'slot3Name', 'slot3Title',
    'slot4Header', 'slot4Name', 'slot4Title',
    'slot5Header', 'slot5Name', 'slot5Title',
    'slot6Header', 'slot6Name', 'slot6Title',
    'slot7Header', 'slot7Name', 'slot7Title',
    'customRemarkText', 'customDueDate', 'customCompletionDate'
  ];

  const SAMPLE_DEFAULTS = {
    slot1Header: 'Prepared By', slot1Name: 'Prof. Shruti Mishra', slot1Title: 'Lecturer, B.Voc',
    slot2Header: 'Checked By', slot2Name: 'Dr. Manoj Chavan', slot2Title: 'HOD, B.Voc',
    slot3Header: 'Verified By', slot3Name: 'Dr. Rathod Thakur', slot3Title: 'Associate Dean\nSkill Development & Vocational',
    slot4Header: 'Reviewed By', slot4Name: 'Dr. Lochan Jolly', slot4Title: 'Dean\nStudent & Staff Welfare',
    slot5Header: 'Approved By', slot5Name: 'Sheetal Rathi', slot5Title: 'Dean\nAcademics',
    slot6Header: 'Vice Principal', slot6Name: 'Dr. R. R. Sedamkar', slot6Title: 'Vice Principal',
    slot7Header: 'Principal', slot7Name: 'Dr. B. K. Mishra', slot7Title: 'Principal',
    customRemarkText: '', customDueDate: '05/08/2026', customCompletionDate: '05/08/2026'
  };

  const loadSavedSignatures = () => {
    try {
      const saved = localStorage.getItem(SIG_STORAGE_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        SIG_FIELD_IDS.forEach(id => {
          const input = document.getElementById(id);
          if (input && obj[id] !== undefined) {
            input.value = obj[id];
          }
        });
      }
    } catch (e) {}
  };

  const saveSignaturesToStorage = () => {
    const obj = {};
    SIG_FIELD_IDS.forEach(id => {
      const input = document.getElementById(id);
      if (input) obj[id] = input.value.trim();
    });
    try {
      localStorage.setItem(SIG_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {}
  };

  // Clear all to blank
  const clearBtn = document.getElementById('clearAllSigsBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      SIG_FIELD_IDS.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
      });
      saveSignaturesToStorage();
      
      const activeReport = document.getElementById('printableReportArea');
      if (activeReport) loadMonthlyMatrixReport();
      setStatus('All signature labels and names cleared to custom blank inputs.');
    });
  }

  // Load Sample Labels & Names
  const sampleBtn = document.getElementById('loadDefaultSigsBtn');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      Object.keys(SAMPLE_DEFAULTS).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = SAMPLE_DEFAULTS[id];
      });
      saveSignaturesToStorage();
      
      const activeReport = document.getElementById('printableReportArea');
      if (activeReport) loadMonthlyMatrixReport();
      setStatus('Sample TCET labels and names loaded.');
    });
  }

  // Auto-sync input changes to report
  SIG_FIELD_IDS.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        saveSignaturesToStorage();

        // Direct DOM update if element exists
        const renderElem = document.getElementById('render_' + id);
        if (renderElem) {
          renderElem.textContent = input.value.trim() || '__________';
        }
      });
    }
  });

  loadSavedSignatures();

  const getSigValues = () => {
    const vals = {};
    SIG_FIELD_IDS.forEach(id => {
      const input = document.getElementById(id);
      vals[id] = (input && input.value.trim()) ? input.value.trim() : '';
    });
    return vals;
  };

  const fmtBlank = (val, defaultLine = '__________') => {
    return (val && val.trim()) ? val.trim() : defaultLine;
  };

  const attachInlineEditListeners = () => {
    SIG_FIELD_IDS.forEach(id => {
      const renderElem = document.getElementById('render_' + id);
      const input = document.getElementById(id);
      if (renderElem && input) {
        renderElem.addEventListener('input', () => {
          let text = renderElem.textContent;
          if (text === '__________') text = '';
          input.value = text;
          saveSignaturesToStorage();
        });
      }
    });
  };

  const updateDownloadLinkHrefs = () => {
    const deptElem = document.getElementById('reportDept');
    const branchElem = document.getElementById('reportBranch');
    const batchElem = document.getElementById('reportBatch');
    const monthElem = document.getElementById('reportMonth');
    const yearElem = document.getElementById('reportYear');

    const deptId = deptElem ? deptElem.value : '';
    const branch = branchElem ? branchElem.value.trim() : '';
    const batch = batchElem ? batchElem.value.trim() : '';
    const month = monthElem ? monthElem.value : '';
    const year = yearElem ? yearElem.value : '';
    const token = Auth.getToken();

    let q = `token=${encodeURIComponent(token)}&month=${month}&year=${year}`;
    if (deptId) q += `&departmentId=${encodeURIComponent(deptId)}`;
    if (branch) q += `&branch=${encodeURIComponent(branch)}`;
    if (batch) q += `&batch=${encodeURIComponent(batch)}`;

    const filenameBase = `Monthly_Attendance_Report_${year}_${month}`;

    const csvBtn = document.getElementById('exportCsvBtn');
    const excelBtn = document.getElementById('exportExcelBtn');

    if (csvBtn) {
      csvBtn.href = `/api/reports/csv?${q}`;
      csvBtn.setAttribute('download', `${filenameBase}.csv`);
    }

    if (excelBtn) {
      excelBtn.href = `/api/reports/excel?${q}`;
      excelBtn.setAttribute('download', `${filenameBase}.xlsx`);
    }
  };

  const getQueryParams = () => {
    const deptElem = document.getElementById('reportDept');
    const branchElem = document.getElementById('reportBranch');
    const batchElem = document.getElementById('reportBatch');
    const monthElem = document.getElementById('reportMonth');
    const yearElem = document.getElementById('reportYear');

    const deptId = deptElem ? deptElem.value : '';
    const branch = branchElem ? branchElem.value.trim() : '';
    const batch = batchElem ? batchElem.value.trim() : '';
    const month = monthElem ? monthElem.value : '';
    const year = yearElem ? yearElem.value : '';

    let q = `month=${month}&year=${year}`;
    if (deptId) q += `&departmentId=${encodeURIComponent(deptId)}`;
    if (branch) q += `&branch=${encodeURIComponent(branch)}`;
    if (batch) q += `&batch=${encodeURIComponent(batch)}`;
    return q;
  };

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments', { headers: Auth.getHeaders() });
      const data = await res.json();
      const select = document.getElementById('reportDept');
      if (!select) return;

      select.innerHTML = '<option value="">-- All Departments --</option>';

      if (data.success) {
        data.departments.forEach(dept => {
          const opt = document.createElement('option');
          opt.value = dept._id;
          opt.textContent = `${dept.name} (${dept.code})`;
          select.appendChild(opt);
        });
      }
      updateDownloadLinkHrefs();
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadMonthlyMatrixReport = async () => {
    updateDownloadLinkHrefs();
    const container = document.getElementById('reportContainer');
    if (!container) return;
    container.innerHTML = '<p style="padding:15px;">Generating monthly attendance matrix report...</p>';

    const query = getQueryParams();
    const s = getSigValues();

    try {
      const res = await fetch(`/api/reports/monthly-matrix?${query}`, { headers: Auth.getHeaders() });
      const data = await res.json();

      if (!data.success || !data.students || data.students.length === 0) {
        container.innerHTML = '<p style="color:red; font-weight: bold; padding:15px;">No student attendance data found for the selected criteria.</p>';
        return;
      }

      const h = data.header;
      const subjects = data.subjects || [];
      const students = data.students || [];

      let totalMlyLecAll = 0;
      let totalCumLecAll = 0;
      subjects.forEach(subj => {
        totalMlyLecAll += subj.mlyTotalLectures;
        totalCumLecAll += subj.cumTotalLectures;
      });

      const totalCols = 2 + (subjects.length * 4) + 4;
      const fontSize = totalCols > 20 ? '9px' : '10.5px';

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthElem = document.getElementById('reportMonth');
      const monthVal = monthElem ? parseInt(monthElem.value) : 7;
      const monthName = monthNames[monthVal - 1] || 'July';

      const yearElem = document.getElementById('reportYear');
      const yearVal = yearElem ? yearElem.value : '2026';

      const batchElem = document.getElementById('reportBatch');
      const batchVal = (batchElem && batchElem.value.trim()) ? batchElem.value.trim() : 'Batch-5';

      const branchElem = document.getElementById('reportBranch');
      const branchVal = (branchElem && branchElem.value.trim()) ? branchElem.value.trim() : 'SD';

      let html = `
        <div id="printableReportArea" style="background: white; padding: 20px; font-family: Arial, Helvetica, sans-serif; min-width: 1050px; color: #000; box-sizing: border-box;">
          
          <!-- TCET Official Banner Header -->
          <div style="text-align: center; margin-bottom: 10px;">
            <img src="/images/tcetbanner.jpg" alt="TCET College Header Banner" style="max-width: 100%; height: auto; max-height: 120px; display: block; margin: 0 auto; object-fit: contain;" onerror="this.style.display='none'">
          </div>

          <!-- Official Document Header Titles -->
          <div style="text-align: center; margin-bottom: 14px; font-size: 11px; line-height: 1.4;">
            <p style="margin: 2px 0; font-size: 12px; font-weight: bold;">S.Y.B.Voc Overall Attendance (${monthName} Monthly Attendance) ${yearVal} ${batchVal}</p>
            <p style="margin: 2px 0; font-weight: bold;">*Department : BACHELOR OF VOCATIONAL (${branchVal}) Section : S.Y.B.Voc (B)</p>
            <p style="margin: 2px 0; font-weight: bold;">Month wise and Span Wise Summary (Cr Yr Wise) Report for ${monthName} ${yearVal}</p>
            <p style="margin: 2px 0;">For Session ${yearVal}-${parseInt(yearVal)+1} (ODD)</p>
          </div>

          <!-- Attendance Table with min-width lock so columns don't smash on mobile -->
          <table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse; font-size: ${fontSize}; text-align: center; width: 100%; min-width: 1000px; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #ffffff;">
                <th rowspan="3" style="width: 75px; font-weight: bold; border: 1px solid #000;">Roll No.</th>
                <th rowspan="3" style="width: 140px; font-weight: bold; text-align: left; padding-left: 5px; border: 1px solid #000;">Name of Student</th>
      `;

      subjects.forEach(subj => {
        const shortName = subj.subjectName;
        html += `
          <th colspan="4" style="padding: 4px; font-size: ${fontSize}; border: 1px solid #000; min-width: 110px;">
            <b>${shortName}</b><br>
            <span style="font-weight: normal; font-size: 8.5px;">${subj.facultyName}</span>
          </th>`;
      });

      html += `<th colspan="4" style="border: 1px solid #000; font-weight: bold; min-width: 120px;">Total Attendance</th></tr>`;

      html += `<tr style="background-color: #ffffff;">`;
      subjects.forEach(() => {
        html += `<th colspan="2" style="border: 1px solid #000; font-weight: bold;">MLY</th><th colspan="2" style="border: 1px solid #000; font-weight: bold;">CUM</th>`;
      });
      html += `<th colspan="2" style="border: 1px solid #000; font-weight: bold;">MLY</th><th colspan="2" style="border: 1px solid #000; font-weight: bold;">CUM</th></tr>`;

      html += `<tr style="background-color: #ffffff;">`;
      subjects.forEach(() => {
        html += `<th style="border: 1px solid #000; font-weight: bold;">Att</th><th style="border: 1px solid #000; font-weight: bold;">%</th><th style="border: 1px solid #000; font-weight: bold;">Att</th><th style="border: 1px solid #000; font-weight: bold;">%</th>`;
      });
      html += `<th style="border: 1px solid #000; font-weight: bold;">Att</th><th style="border: 1px solid #000; font-weight: bold;">%</th><th style="border: 1px solid #000; font-weight: bold;">Att</th><th style="border: 1px solid #000; font-weight: bold;">%</th></tr>`;

      /* Total Lectures Header Row */
      html += `<tr style="background-color: #ffffff; font-weight: bold;">
        <td colspan="2" align="right" style="padding-right: 8px; border: 1px solid #000;">Total lectures --&gt;</td>`;
      subjects.forEach(subj => {
        html += `<td style="border: 1px solid #000;">${subj.mlyTotalLectures}</td><td style="border: 1px solid #000;">100</td><td style="border: 1px solid #000;">${subj.cumTotalLectures}</td><td style="border: 1px solid #000;">100</td>`;
      });
      html += `<td style="border: 1px solid #000;">${totalMlyLecAll}</td><td style="border: 1px solid #000;">100</td><td style="border: 1px solid #000;">${totalCumLecAll}</td><td style="border: 1px solid #000;">100</td></tr>`;

      html += `</thead><tbody>`;

      /* Student Rows */
      students.forEach(st => {
        html += `<tr>
          <td style="white-space: nowrap; border: 1px solid #000; font-weight: bold;">${st.rollNumber}</td>
          <td align="left" style="padding-left: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid #000;">${st.studentName}</td>`;

        subjects.forEach(subj => {
          const stats = (st.subjectStats && st.subjectStats[subj.subjectName]) || { mlyAttended: 0, mlyPercentage: 0, cumAttended: 0, cumPercentage: 0 };
          html += `
            <td style="border: 1px solid #000;">${stats.mlyAttended}</td>
            <td style="border: 1px solid #000; font-weight: bold;">${stats.mlyPercentage}</td>
            <td style="border: 1px solid #000;">${stats.cumAttended}</td>
            <td style="border: 1px solid #000; font-weight: bold;">${stats.cumPercentage}</td>
          `;
        });

        const ov = st.overall || { totalMlyAttended: 0, overallMlyPct: 0, totalCumAttended: 0, overallCumPct: 0 };
        html += `
          <td style="border: 1px solid #000;">${ov.totalMlyAttended}</td>
          <td style="border: 1px solid #000; font-weight: bold; color: ${ov.overallMlyPct >= 75 ? 'green' : 'red'};">${ov.overallMlyPct}</td>
          <td style="border: 1px solid #000;">${ov.totalCumAttended}</td>
          <td style="border: 1px solid #000; font-weight: bold; color: ${ov.overallCumPct >= 75 ? 'green' : 'red'};">${ov.overallCumPct}</td>
        </tr>`;
      });

      html += `</tbody></table>`;

      /* 100% Fully Custom Blank Signatures & Remarks Footer */
      html += `
        <div style="margin-top: 16px; font-size: 11px;">
          <p style="margin-bottom: 24px; font-weight: bold;">Remark: <span id="render_customRemarkText" contenteditable="true" style="font-weight: normal; border-bottom: 1px dashed #94a3b8; padding: 0 4px; min-width: 120px; display: inline-block;">${fmtBlank(s.customRemarkText, '________________________________________')}</span></p>
          
          <!-- Top Row Header Labels (All 5 Columns Custom Editable) -->
          <div style="display: flex; justify-content: space-between; text-align: center; font-size: 11px; font-weight: bold; margin-bottom: 35px; padding-inline: 10px;">
            <div id="render_slot1Header" contenteditable="true" style="width: 18%;">${fmtBlank(s.slot1Header, 'Prepared By')}</div>
            <div id="render_slot2Header" contenteditable="true" style="width: 18%;">${fmtBlank(s.slot2Header, 'Checked By')}</div>
            <div id="render_slot3Header" contenteditable="true" style="width: 18%;">${fmtBlank(s.slot3Header, 'Verified By')}</div>
            <div id="render_slot4Header" contenteditable="true" style="width: 18%;">${fmtBlank(s.slot4Header, 'Reviewed By')}</div>
            <div id="render_slot5Header" contenteditable="true" style="width: 18%;">${fmtBlank(s.slot5Header, 'Approved By')}</div>
          </div>

          <!-- Bottom Row 7 Signature Slots (All Custom Editable) -->
          <div style="display: flex; justify-content: space-between; text-align: center; font-size: 9.5px; line-height: 1.35; margin-bottom: 25px; padding-inline: 2px;">
            <div style="width: 14%;">
              <i>Sd/-</i><br>
              <b id="render_slot1Name" contenteditable="true" title="Click to edit name">${fmtBlank(s.slot1Name)}</b><br>
              <span id="render_slot1Title" contenteditable="true" title="Click to edit title">${fmtBlank(s.slot1Title)}</span>
            </div>

            <div style="width: 14%;">
              <i>Sd/-</i><br>
              <b id="render_slot2Name" contenteditable="true" title="Click to edit name">${fmtBlank(s.slot2Name)}</b><br>
              <span id="render_slot2Title" contenteditable="true" title="Click to edit title">${fmtBlank(s.slot2Title)}</span>
            </div>

            <div style="width: 14%;">
              <i>Sd/-</i><br>
              <b id="render_slot3Name" contenteditable="true" title="Click to edit name">${fmtBlank(s.slot3Name)}</b><br>
              <span id="render_slot3Title" contenteditable="true" title="Click to edit title">${fmtBlank(s.slot3Title)}</span>
            </div>

            <div style="width: 14%;">
              <i>Sd/-</i><br>
              <b id="render_slot4Name" contenteditable="true" title="Click to edit name">${fmtBlank(s.slot4Name)}</b><br>
              <span id="render_slot4Title" contenteditable="true" title="Click to edit title">${fmtBlank(s.slot4Title)}</span>
            </div>

            <div style="width: 14%;">
              <i>Sd/-</i><br>
              <b id="render_slot5Name" contenteditable="true" title="Click to edit name">${fmtBlank(s.slot5Name)}</b><br>
              <span id="render_slot5Title" contenteditable="true" title="Click to edit title">${fmtBlank(s.slot5Title)}</span>
            </div>

            <div style="width: 14%;">
              <i>Sd/-</i><br>
              <b id="render_slot6Name" contenteditable="true" title="Click to edit name">${fmtBlank(s.slot6Name)}</b><br>
              <span id="render_slot6Title" contenteditable="true" title="Click to edit title">${fmtBlank(s.slot6Title)}</span>
            </div>

            <div style="width: 14%;">
              <i>Sd/-</i><br>
              <b id="render_slot7Name" contenteditable="true" title="Click to edit name">${fmtBlank(s.slot7Name)}</b><br>
              <span id="render_slot7Title" contenteditable="true" title="Click to edit title">${fmtBlank(s.slot7Title)}</span>
            </div>
          </div>

          <div style="font-size: 9.5px; color: #000; line-height: 1.5; margin-top: 20px;">
            <p><b>Due date: <span id="render_customDueDate" contenteditable="true" style="font-weight: normal;">${fmtBlank(s.customDueDate, 'DD/MM/YYYY')}</span></b></p>
            <p><b>Completion Date: <span id="render_customCompletionDate" contenteditable="true" style="font-weight: normal;">${fmtBlank(s.customCompletionDate, 'DD/MM/YYYY')}</span></b></p>
            <p><b>If not as per the due date (Reason):</b> <span contenteditable="true" style="font-weight: normal;">________________________________________</span></p>
          </div>
        </div>
      </div>`;

      container.innerHTML = html;
      attachInlineEditListeners();
    } catch (err) {
      container.innerHTML = '<p style="color:red; font-weight: bold; padding:15px;">Error generating monthly matrix report.</p>';
      console.error(err);
    }
  };

  const loadRegisterGridReport = async () => {
    updateDownloadLinkHrefs();
    const container = document.getElementById('reportContainer');
    if (!container) return;
    container.innerHTML = '<p style="padding:15px;">Generating manual attendance register grid...</p>';

    const deptElem = document.getElementById('reportDept');
    const branchElem = document.getElementById('reportBranch');
    const batchElem = document.getElementById('reportBatch');

    const deptId = deptElem ? deptElem.value : '';
    const branch = branchElem ? branchElem.value.trim() : '';
    const batch = batchElem ? batchElem.value.trim() : '';
    const s = getSigValues();

    let url = `/api/reports/register-grid?`;
    if (deptId) url += `&departmentId=${deptId}`;
    if (branch) url += `&branch=${encodeURIComponent(branch)}`;
    if (batch) url += `&batch=${encodeURIComponent(batch)}`;

    try {
      const res = await fetch(url, { headers: Auth.getHeaders() });
      const data = await res.json();

      if (!data.success || !data.students || data.students.length === 0) {
        container.innerHTML = '<p style="color:red; font-weight: bold; padding:15px;">No register grid data found.</p>';
        return;
      }

      const m = data.meta || {};
      const cols = data.columns || [];
      const students = data.students || [];

      let html = `
        <div id="printableReportArea" style="background: white; padding: 20px; font-family: Arial, sans-serif; min-width: 900px;">
          <!-- TCET Official College Banner Header -->
          <div style="text-align: center; margin-bottom: 12px;">
            <img src="/images/tcetbanner.jpg" alt="TCET College Header Banner" style="max-width: 100%; height: auto; max-height: 120px; display: block; margin: 0 auto; object-fit: contain;" onerror="this.style.display='none'">
          </div>

          <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 12px; margin-bottom: 15px; border: 1px solid #000;">
            <tr><td width="20%"><b>FACULTY NAME</b></td><td><span contenteditable="true">${fmtBlank(s.slot1Name, m.facultyName || '__________')}</span></td></tr>
            <tr><td><b>SUBJECT NAME</b></td><td>${m.subjectName || 'N/A'}</td></tr>
            <tr><td><b>YEAR</b></td><td>${m.year || '2026'}</td></tr>
            <tr><td><b>BRANCH</b></td><td>${m.branch || 'ALL'}</td></tr>
            <tr><td><b>BATCH</b></td><td>${m.batch || 'ALL'}</td></tr>
          </table>

          <table border="1" cellpadding="6" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 11px; text-align: center; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="width: 40px; border: 1px solid #000;">Sr.No</th>
                <th style="width: 100px; border: 1px solid #000;">Roll. No</th>
                <th style="width: 150px; border: 1px solid #000;">Student Name</th>
      `;

      cols.forEach(c => {
        html += `<th style="border: 1px solid #000;">${c.date}<br><small>${c.timeSlot}</small></th>`;
      });
      html += `</tr></thead><tbody>`;

      students.forEach(st => {
        html += `<tr>
          <td style="border: 1px solid #000;">${st.srNo}</td>
          <td style="border: 1px solid #000;"><b>${st.rollNo}</b></td>
          <td align="left" style="padding-left: 5px; border: 1px solid #000;">${st.studentName}</td>`;

        (st.statusPerCol || []).forEach(status => {
          const colorStyle = status === 'P' ? 'color: green; font-weight: bold;' : 'color: red; font-weight: bold;';
          html += `<td style="${colorStyle}; border: 1px solid #000;">${status}</td>`;
        });
        html += `</tr>`;
      });

      html += `<tr style="background-color: #f9f9f9; font-weight: bold;">
        <td colspan="3" align="right" style="border: 1px solid #000;">Total Attendance</td>`;
      (data.columnSummaries || []).forEach(sum => {
        html += `<td style="color: blue; border: 1px solid #000;">${sum}</td>`;
      });
      html += `</tr>`;

      html += `<tr style="background-color: #fff;">
        <td colspan="3" align="right" style="border: 1px solid #000;"><b>Faculty Signature</b></td>`;
      cols.forEach(() => {
        html += `<td style="font-size: 10px; font-style: italic; color: #555; border: 1px solid #000;"><span contenteditable="true">${fmtBlank(s.slot1Name)}</span></td>`;
      });
      html += `</tr>`;

      html += `<tr style="background-color: #fff;">
        <td colspan="3" align="right" style="border: 1px solid #000;"><b>HoD Signature</b></td>`;
      cols.forEach(() => {
        html += `<td style="border: 1px solid #000;"><span contenteditable="true">${fmtBlank(s.slot2Name)}</span></td>`;
      });
      html += `</tr>`;

      html += `</tbody></table></div>`;

      container.innerHTML = html;
      attachInlineEditListeners();
    } catch (err) {
      container.innerHTML = '<p style="color:red; font-weight: bold; padding:15px;">Error generating register grid.</p>';
      console.error(err);
    }
  };

  // ── PDF Export ─────────────────────────────────────
  const exportToPDF = async () => {
    const elem = document.getElementById('printableReportArea');
    if (!elem) {
      setStatus('Please generate a report first before exporting to PDF.', true);
      return;
    }

    setStatus('Generating PDF — please wait...');

    const monthElem = document.getElementById('reportMonth');
    const yearElem = document.getElementById('reportYear');
    const month = monthElem ? monthElem.value : '08';
    const year = yearElem ? yearElem.value : '2026';
    const filename = `Monthly_Attendance_Report_${year}_${month}.pdf`;

    if (typeof html2pdf !== 'undefined') {
      try {
        const contentWidth = elem.scrollWidth;
        const contentHeight = elem.scrollHeight;

        let paperFormat = 'a3';
        let orientation = 'landscape';

        if (contentWidth > 1500) {
          paperFormat = [contentWidth / 96 + 1, Math.max(contentHeight / 96 + 1, 11.69)];
        }

        const opt = {
          margin:     [0.3, 0.3, 0.3, 0.3],
          filename:   filename,
          image:      { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale:        2,
            useCORS:      true,
            logging:      false,
            scrollX:      0,
            scrollY:      0,
            windowWidth:  contentWidth + 40,
            windowHeight: contentHeight + 40
          },
          jsPDF: {
            unit:        'in',
            format:      paperFormat,
            orientation: orientation
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(opt).from(elem).save();
        setStatus(`✔ PDF downloaded: ${filename}`);
      } catch (err) {
        console.error('html2pdf error:', err);
        fallbackPrintPDF(filename);
      }
    } else {
      fallbackPrintPDF(filename);
    }
  };

  const fallbackPrintPDF = (filename) => {
    setStatus('Opening print dialog — use "Save as PDF" to save...', false);

    const elem = document.getElementById('printableReportArea');
    if (!elem) { window.print(); return; }

    const printWin = window.open('', '_blank', 'width=1200,height=800');
    printWin.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>${filename}</title>
        <style>
          @page { size: A3 landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 9px; margin: 0; padding: 10px; }
          table { border-collapse: collapse; width: 100%; font-size: 9px; }
          th, td { border: 1px solid #333; padding: 3px 4px; text-align: center; }
          th { background: #f2f2f2; }
          h2 { font-size: 14px; margin: 0; }
          p { margin: 2px 0; }
        </style>
      </head><body>
        ${elem.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        <\/script>
      </body></html>
    `);
    printWin.document.close();
  };

  // ── Event bindings ─────────────────────────────────
  ['reportDept', 'reportBranch', 'reportBatch', 'reportMonth', 'reportYear'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('change', updateDownloadLinkHrefs);
      elem.addEventListener('keyup', updateDownloadLinkHrefs);
    }
  });

  const pdfBtn = document.getElementById('exportPdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportToPDF();
    });
  }

  const printBtn = document.getElementById('printReportBtn');
  if (printBtn) {
    printBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fallbackPrintPDF('Attendance_Report.pdf');
    });
  }

  const matrixBtn = document.getElementById('genMonthlyMatrixBtn');
  if (matrixBtn) {
    matrixBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadMonthlyMatrixReport();
    });
  }

  const gridBtn = document.getElementById('genRegisterGridBtn');
  if (gridBtn) {
    gridBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadRegisterGridReport();
    });
  }

  loadDepartments().then(loadMonthlyMatrixReport);
});
