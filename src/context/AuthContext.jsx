import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  fetchCurrentUser,
  setAuthToken,
  getAuthToken,
} from '../lib/api';

/**
 * Real auth backed by the FastAPI /api/auth endpoints.
 *
 * Login → JWT stored via setAuthToken (api.js attaches it as a Bearer
 * header on every subsequent request). On app load we try /api/auth/me
 * with whatever token is in localStorage so a refresh keeps the
 * session alive.
 *
 * Roles map onto the schema's enum (admin / manager / sub_user). The
 * sidebar still uses the older capitalised labels (Admin / Manager /
 * Cashier) — `hasAccess` normalises both forms.
 */
const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const normaliseRole = (role) => {
  if (!role) return null;
  const r = String(role).toLowerCase();
  if (r === 'admin') return 'Admin';
  if (r === 'manager') return 'Manager';
  if (r === 'sub_user' || r === 'cashier') return 'Cashier';
  return role;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session from a stored JWT
  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setIsLoading(false); return; }
    fetchCurrentUser()
      .then((u) => {
        setUser({ ...u, role: normaliseRole(u.role), permission: u.permission || null });
      })
      .catch(() => {
        // Token expired or invalid — api.js already cleared it
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await apiLogin(email, password);
    setAuthToken(result.access_token);
    const u = { ...result.user, role: normaliseRole(result.user.role), permission: result.user.permission || null };
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const hasAccess = useCallback((requiredRoles) => {
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    // requiredRoles arrives in the sidebar's title-cased form
    // (Admin / Manager / Cashier) — match against our normalised role.
    return requiredRoles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
