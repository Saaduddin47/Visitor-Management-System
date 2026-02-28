import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = async (payload) => {
    const { data } = await authApi.login(payload);
    setUser(data.user);
    return data.user;
  };

  const ssoEmployee = async (payload) => {
    const { data } = await authApi.ssoEmployee(payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, ssoEmployee, refreshMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
