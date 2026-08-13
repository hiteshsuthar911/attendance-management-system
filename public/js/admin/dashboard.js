document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = Auth.requireRole(['admin']);
  if (!currentUser) return;

  const adminName = document.getElementById('adminName');
  if (adminName) adminName.textContent = currentUser.name;

  const adminEmail = document.getElementById('adminEmail');
  if (adminEmail) adminEmail.textContent = currentUser.email;

  const adminDeptText = currentUser.departments && currentUser.departments.length > 0
    ? currentUser.departments.map(d => `${d.name} (${d.code})`).join(', ')
    : 'All Managed Departments';

  const adminDeptList = document.getElementById('adminDeptList');
  if (adminDeptList) adminDeptList.textContent = adminDeptText;

  const statMyDepts = document.getElementById('statMyDepts');
  if (statMyDepts) statMyDepts.textContent = adminDeptText;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }

  try {
    const resFac = await fetch('/api/users?role=faculty', { headers: Auth.getHeaders() });
    const dataFac = await resFac.json();
    const statFac = document.getElementById('statFaculties');
    if (statFac) {
      const facCount = (dataFac.success && dataFac.users) ? dataFac.users.length : (dataFac.count || 0);
      statFac.textContent = facCount;
    }

    const resSt = await fetch('/api/users?role=student', { headers: Auth.getHeaders() });
    const dataSt = await resSt.json();
    const statSt = document.getElementById('statStudents');
    if (statSt) {
      const stCount = (dataSt.success && dataSt.users) ? dataSt.users.length : (dataSt.count || 0);
      statSt.textContent = stCount;
    }

    const resLec = await fetch('/api/lectures', { headers: Auth.getHeaders() });
    const dataLec = await resLec.json();
    const statLec = document.getElementById('statLectures');
    if (statLec) {
      const lecCount = (dataLec.success && dataLec.lectures) ? dataLec.lectures.length : (dataLec.count || 0);
      statLec.textContent = lecCount;
    }
  } catch (err) {
    console.error('Error loading admin stats:', err);
  }
});
