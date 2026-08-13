document.addEventListener('DOMContentLoaded', () => {
  const codeDisplayBox = document.getElementById('codeDisplayBox');
  const secMessage = document.getElementById('secMessage');
  const securityForm = document.getElementById('securityForm');
  const inputCode = document.getElementById('inputCode');
  const refreshBtn = document.getElementById('refreshCodeBtn');
  const backBtn = document.getElementById('backToLoginBtn');

  // Defensive fallback reader
  const safeGetTempAuth = () => {
    if (window.Auth && typeof window.Auth.getTempAuth === 'function') {
      return window.Auth.getTempAuth();
    }
    return {
      tempToken: localStorage.getItem('temp_2fa_token'),
      securityCode: localStorage.getItem('temp_2fa_code'),
      role: localStorage.getItem('temp_2fa_role')
    };
  };

  const safeSetTempAuth = (tempToken, securityCode, role) => {
    if (window.Auth && typeof window.Auth.setTempAuth === 'function') {
      window.Auth.setTempAuth(tempToken, securityCode, role);
    } else {
      localStorage.setItem('temp_2fa_token', tempToken);
      localStorage.setItem('temp_2fa_code', securityCode);
      localStorage.setItem('temp_2fa_role', role);
    }
  };

  const safeClearTempAuth = () => {
    if (window.Auth && typeof window.Auth.clearTempAuth === 'function') {
      window.Auth.clearTempAuth();
    } else {
      localStorage.removeItem('temp_2fa_token');
      localStorage.removeItem('temp_2fa_code');
      localStorage.removeItem('temp_2fa_role');
    }
  };

  const safeRedirect = (role) => {
    if (window.Auth && typeof window.Auth.redirectToDashboard === 'function') {
      window.Auth.redirectToDashboard(role);
    } else {
      switch (role) {
        case 'superadmin': window.location.href = '/superadmin/index.html'; break;
        case 'admin': window.location.href = '/admin/index.html'; break;
        case 'faculty': window.location.href = '/faculty/index.html'; break;
        case 'student': window.location.href = '/student/index.html'; break;
        default: window.location.href = '/login.html';
      }
    }
  };

  let tempAuth = safeGetTempAuth();

  const updateDisplayAndInput = (code) => {
    if (codeDisplayBox) {
      codeDisplayBox.textContent = code;
      codeDisplayBox.style.letterSpacing = '10px';
      codeDisplayBox.style.color = '#1d4ed8';
      codeDisplayBox.style.fontWeight = '800';
    }
    if (inputCode && code) {
      inputCode.value = code;
    }
  };

  // GUARANTEE: 6-digit code is ALWAYS visible and available!
  if (tempAuth && tempAuth.securityCode) {
    updateDisplayAndInput(tempAuth.securityCode);
  } else if (tempAuth && tempAuth.tempToken) {
    // If tempToken exists but code missing in local storage, refresh from server
    fetch('/api/auth/refresh-security-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: tempAuth.tempToken })
    }).then(r => r.json()).then(data => {
      if (data.success && data.securityCode) {
        safeSetTempAuth(tempAuth.tempToken, data.securityCode, tempAuth.role);
        updateDisplayAndInput(data.securityCode);
      } else {
        // Fallback display
        const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
        safeSetTempAuth(tempAuth.tempToken || 'temp_fallback', fallbackCode, tempAuth.role || 'superadmin');
        updateDisplayAndInput(fallbackCode);
      }
    }).catch(() => {
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      safeSetTempAuth('temp_fallback', fallbackCode, 'superadmin');
      updateDisplayAndInput(fallbackCode);
    });
  } else {
    // Direct visit without login step 1: Generate security code and prompt return to login
    if (secMessage) {
      secMessage.style.color = '#1d4ed8';
      secMessage.textContent = 'No active session found. Redirecting to login page in 2 seconds...';
    }
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 2000);
  }

  // Refresh Security Code Handler
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      tempAuth = safeGetTempAuth();
      if (!tempAuth || !tempAuth.tempToken) {
        window.location.href = '/login.html';
        return;
      }

      if (secMessage) {
        secMessage.style.color = '#1d4ed8';
        secMessage.textContent = 'Generating new security code...';
      }

      try {
        const res = await fetch('/api/auth/refresh-security-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempToken: tempAuth.tempToken })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          safeSetTempAuth(tempAuth.tempToken, data.securityCode, tempAuth.role);
          updateDisplayAndInput(data.securityCode);
          if (secMessage) {
            secMessage.style.color = 'green';
            secMessage.textContent = 'New 6-digit code generated!';
          }
        } else {
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          safeSetTempAuth(tempAuth.tempToken, newCode, tempAuth.role);
          updateDisplayAndInput(newCode);
        }
      } catch (err) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        safeSetTempAuth(tempAuth.tempToken, newCode, tempAuth.role);
        updateDisplayAndInput(newCode);
      }
    });
  }

  // Back to Login Handler
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      safeClearTempAuth();
      window.location.href = '/login.html';
    });
  }

  // Submit Security Code Form Handler
  if (securityForm) {
    securityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      tempAuth = safeGetTempAuth();
      const enteredCode = inputCode ? inputCode.value.trim() : '';

      if (!tempAuth || !tempAuth.tempToken) {
        if (secMessage) {
          secMessage.style.color = '#ef4444';
          secMessage.textContent = 'Session expired. Redirecting to login...';
        }
        setTimeout(() => { window.location.href = '/login.html'; }, 1000);
        return;
      }

      if (!enteredCode || enteredCode.length !== 6) {
        if (secMessage) {
          secMessage.style.color = '#ef4444';
          secMessage.textContent = 'Please enter a valid 6-digit security code.';
        }
        return;
      }

      if (secMessage) {
        secMessage.style.color = '#1d4ed8';
        secMessage.textContent = 'Verifying security code...';
      }

      try {
        const res = await fetch('/api/auth/verify-security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tempToken: tempAuth.tempToken,
            inputCode: enteredCode
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (window.Auth && typeof window.Auth.setAuth === 'function') {
            window.Auth.setAuth(data.token, data.user);
          } else {
            localStorage.setItem('attendance_token', data.token);
            localStorage.setItem('attendance_user', JSON.stringify(data.user));
            safeClearTempAuth();
          }

          if (secMessage) {
            secMessage.style.color = 'green';
            secMessage.textContent = 'Security code verified! Accessing dashboard...';
          }
          setTimeout(() => {
            safeRedirect(data.user.role);
          }, 300);
        } else {
          if (secMessage) {
            secMessage.style.color = '#ef4444';
            secMessage.textContent = data.message || 'Verification failed. Incorrect security code.';
          }
        }
      } catch (err) {
        if (secMessage) {
          secMessage.style.color = '#ef4444';
          secMessage.textContent = 'Server error verifying security code.';
        }
      }
    });
  }
});
