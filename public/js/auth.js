const Auth = {
  // Inactivity timeout: 5 minutes (300,000 milliseconds)
  INACTIVITY_LIMIT_MS: 5 * 60 * 1000,
  inactivityTimer: null,
  _inactivityTrackerStarted: false,

  getToken() {
    return localStorage.getItem('attendance_token');
  },

  getUser() {
    const u = localStorage.getItem('attendance_user');
    try {
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    localStorage.setItem('attendance_token', token);
    localStorage.setItem('attendance_user', JSON.stringify(user));
    this.clearTempAuth();
  },

  setTempAuth(tempToken, securityCode, role) {
    localStorage.setItem('temp_2fa_token', tempToken);
    localStorage.setItem('temp_2fa_code', securityCode);
    localStorage.setItem('temp_2fa_role', role);
  },

  getTempAuth() {
    return {
      tempToken: localStorage.getItem('temp_2fa_token'),
      securityCode: localStorage.getItem('temp_2fa_code'),
      role: localStorage.getItem('temp_2fa_role')
    };
  },

  clearTempAuth() {
    localStorage.removeItem('temp_2fa_token');
    localStorage.removeItem('temp_2fa_code');
    localStorage.removeItem('temp_2fa_role');
  },

  clearAuth() {
    localStorage.removeItem('attendance_token');
    localStorage.removeItem('attendance_user');
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  },

  getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  // Parse JWT token expiration safely
  isTokenExpired(token) {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      return currentTime >= payload.exp;
    } catch (e) {
      return false;
    }
  },

  redirectToDashboard(role) {
    switch (role) {
      case 'superadmin':
        window.location.href = '/superadmin/index.html';
        break;
      case 'admin':
        window.location.href = '/admin/index.html';
        break;
      case 'faculty':
        window.location.href = '/faculty/index.html';
        break;
      case 'student':
        window.location.href = '/student/index.html';
        break;
      default:
        window.location.href = '/login.html';
    }
  },

  // Client-Side Route Protection & Role Verification
  requireRole(allowedRoles) {
    const user = this.getUser();
    const token = this.getToken();

    if (!token || !user || this.isTokenExpired(token)) {
      this.clearAuth();
      if (window.location.pathname !== '/login.html' && window.location.pathname !== '/security.html') {
        window.location.href = '/login.html';
      }
      return null;
    }

    if (Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
      alert(`Security Protection: Your account role (${user.role.toUpperCase()}) is not authorized to access this section.`);
      this.redirectToDashboard(user.role);
      return null;
    }

    const currentPath = window.location.pathname;
    if (user.role === 'superadmin' && !currentPath.startsWith('/superadmin/')) {
      window.location.href = '/superadmin/index.html';
      return null;
    }
    if (user.role === 'admin' && !currentPath.startsWith('/admin/')) {
      window.location.href = '/admin/index.html';
      return null;
    }
    if (user.role === 'faculty' && !currentPath.startsWith('/faculty/')) {
      window.location.href = '/faculty/index.html';
      return null;
    }
    if (user.role === 'student' && !currentPath.startsWith('/student/')) {
      window.location.href = '/student/index.html';
      return null;
    }

    this.startInactivityTracker();
    return user;
  },

  startInactivityTracker() {
    if (this._inactivityTrackerStarted) return;
    this._inactivityTrackerStarted = true;

    const resetTimer = () => {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }

      this.inactivityTimer = setTimeout(() => {
        alert('Security Alert: You have been automatically logged out due to 5 minutes of inactivity.');
        this.logout();
      }, this.INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    resetTimer();
  },

  logout() {
    this.clearAuth();
    this.clearTempAuth();
    window.location.href = '/login.html';
  }
};

// Explicit global attachment
window.Auth = Auth;

const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  if (response.status === 401 && window.location.pathname !== '/login.html' && window.location.pathname !== '/security.html') {
    Auth.clearAuth();
    alert('Security Alert: Unauthorized request or expired session. Redirecting to login page...');
    window.location.href = '/login.html';
  }
  return response;
};
