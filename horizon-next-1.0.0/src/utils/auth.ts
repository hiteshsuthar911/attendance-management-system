import { IUser } from 'types/attendance';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const Auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('attendance_token');
  },

  getUser(): IUser | null {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('attendance_user');
    try {
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setAuth(token: string, user: IUser) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('attendance_token', token);
    localStorage.setItem('attendance_user', JSON.stringify(user));
  },

  clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('attendance_token');
    localStorage.removeItem('attendance_user');
  },

  getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  },

  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'superadmin';
  },

  logout() {
    this.clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/sign-in';
    }
  },
};

export async function fetchApi(url: string, options: RequestInit = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const headers = {
    ...Auth.getHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    Auth.clearAuth();
    window.location.href = '/auth/sign-in';
  }

  return response;
}
