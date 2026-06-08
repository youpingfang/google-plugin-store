import { createContext, useContext, useState, useEffect } from 'react';
import { api, auth as authStore } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if we have a stored token, try to validate it.
  useEffect(() => {
    const token = authStore.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token expired or invalid — drop it
        authStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (githubToken) => {
    const { token, user: u } = await api.login(githubToken);
    authStore.setToken(token);
    setUser(u);
    return u;
  };

  const logout = () => {
    authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
