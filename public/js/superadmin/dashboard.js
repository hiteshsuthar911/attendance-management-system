document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = Auth.requireRole(['superadmin']);
  if (!currentUser) return;

  const saName = document.getElementById('superadminName');
  if (saName) saName.textContent = currentUser.name;

  const saEmail = document.getElementById('superadminEmail');
  if (saEmail) saEmail.textContent = currentUser.email;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  try {
    const [resStats, resAdmins] = await Promise.all([
      fetch('/api/reports/all', { headers: Auth.getHeaders() }),
      fetch('/api/users?role=admin', { headers: Auth.getHeaders() })
    ]);

    const dataStats = await resStats.json();
    const dataAdmins = await resAdmins.json();

    if (dataStats.success && dataStats.summary) {
      const statDepts = document.getElementById('statDepts');
      const statAdmins = document.getElementById('statAdmins');
      const statFaculties = document.getElementById('statFaculties');
      const statStudents = document.getElementById('statStudents');
      const statLectures = document.getElementById('statLectures');

      if (statDepts) statDepts.textContent = dataStats.summary.totalDepartments || 0;
      if (statAdmins) statAdmins.textContent = (dataAdmins.success && dataAdmins.users) ? dataAdmins.users.length : (dataAdmins.count || 0);
      if (statFaculties) statFaculties.textContent = dataStats.summary.totalFaculty || 0;
      if (statStudents) statStudents.textContent = dataStats.summary.totalStudents || 0;
      if (statLectures) statLectures.textContent = dataStats.summary.totalLectures || 0;
    }
  } catch (err) {
    console.error('Error loading superadmin stats:', err);
  }
});
