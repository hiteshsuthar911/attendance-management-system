document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.requireRole(['student']);
  if (!currentUser) return;

  document.getElementById('studentName').textContent = currentUser.name;
  document.getElementById('studentEmail').textContent = currentUser.email;

  const sd = currentUser.studentDetails || {};
  document.getElementById('studentRoll').textContent = sd.rollNumber || 'N/A';
  document.getElementById('studentBranch').textContent = sd.branch || 'N/A';
  document.getElementById('studentBatch').textContent = sd.batch || 'N/A';

  const deptName = sd.department ? (sd.department.name || sd.department) : 'N/A';
  document.getElementById('studentDept').textContent = deptName;

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    Auth.logout();
  });
});
