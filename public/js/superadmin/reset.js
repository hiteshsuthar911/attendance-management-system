document.addEventListener('DOMContentLoaded', () => {
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

  const gateBox = document.getElementById('passwordGateBox');
  const gateForm = document.getElementById('passwordGateForm');
  const gateMsg = document.getElementById('gateMsg');
  const resetCard = document.getElementById('resetControlsCard');
  let verifiedMasterPassword = '';

  if (gateForm) {
    gateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = (document.getElementById('gatePasswordInput')?.value || '').trim();
      if (!pwd) return;

      if (gateMsg) {
        gateMsg.style.color = '#2563eb';
        gateMsg.textContent = 'Verifying password...';
      }

      try {
        const res = await fetch('/api/system/verify-reset-password', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();

        if (data.success) {
          verifiedMasterPassword = pwd;
          if (gateBox) gateBox.style.display = 'none';
          if (resetCard) resetCard.style.display = 'block';

          // Pre-fill the reset confirm password field for convenience
          const confirmPwdInput = document.getElementById('confirmPasswordInput');
          if (confirmPwdInput) confirmPwdInput.value = pwd;
        } else {
          if (gateMsg) {
            gateMsg.style.color = '#dc2626';
            gateMsg.textContent = data.message || 'Incorrect password.';
          }
        }
      } catch (err) {
        if (gateMsg) {
          gateMsg.style.color = '#dc2626';
          gateMsg.textContent = 'Server error verifying password.';
        }
      }
    });
  }

  const resetForm = document.getElementById('systemResetForm');
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selectedOption = document.querySelector('input[name="resetType"]:checked')?.value;
      const confirmText = (document.getElementById('confirmTextInput')?.value || '').trim();
      const resetPassword = (document.getElementById('confirmPasswordInput')?.value || '').trim();
      const msg = document.getElementById('resetMsg');

      if (!resetPassword) {
        if (msg) {
          msg.style.color = '#dc2626';
          msg.textContent = '❌ Please enter the Master Reset Password.';
        }
        return;
      }

      if (confirmText !== 'RESET') {
        if (msg) {
          msg.style.color = '#dc2626';
          msg.textContent = '❌ Security confirmation failed. You must type RESET in capital letters.';
        }
        return;
      }

      if (!confirm(`Are you absolutely sure you want to perform this system reset (${selectedOption})? This action cannot be undone.`)) {
        return;
      }

      if (msg) {
        msg.style.color = '#2563eb';
        msg.textContent = '⏳ Executing system cleanup reset...';
      }

      try {
        const res = await fetch('/api/system/reset', {
          method: 'POST',
          headers: Auth.getHeaders(),
          body: JSON.stringify({ resetType: selectedOption, confirmText, resetPassword })
        });
        const data = await res.json();

        if (data.success) {
          const s = data.summary || {};
          if (msg) {
            msg.style.color = '#16a34a';
            msg.innerHTML = `
              ✔ <b>${data.message}</b><br>
              Summary of cleared records:
              <ul>
                <li>Attendance Logs Removed: <b>${s.attendanceCleared}</b></li>
                <li>Lectures Removed: <b>${s.lecturesCleared}</b></li>
                <li>Departments Removed: <b>${s.departmentsCleared}</b></li>
                <li>User Accounts Removed: <b>${s.usersCleared}</b></li>
              </ul>
            `;
          }
          resetForm.reset();
        } else {
          if (msg) {
            msg.style.color = '#dc2626';
            msg.textContent = data.message || 'Failed to execute system reset.';
          }
        }
      } catch (err) {
        if (msg) {
          msg.style.color = '#dc2626';
          msg.textContent = 'Server error during system reset.';
        }
      }
    });
  }
});
