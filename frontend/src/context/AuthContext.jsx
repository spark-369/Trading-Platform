import { createContext, useContext, useState, useCallback } from 'react';
import { login as loginApi, register as registerApi } from '../api/auth';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    // Corrupt payload - drop it rather than crashing the app on boot.
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  // A stored session is restored synchronously from localStorage, so there is
  // no async work to wait for. Keeping this flag avoids a loading flash.
  const [loading] = useState(false);

  const persist = useCallback((data) => {
    localStorage.setItem('token', data.token);
    const userData = {
      token: data.token,
      tokenType: data.tokenType,
      userId: data.userId,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: data.roles,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  }, []);

  const login = async (usernameOrEmail, password) => {
    const data = await loginApi(usernameOrEmail, password);
    return persist(data);
  };

  const register = async (username, email, password, firstName, lastName) => {
    const data = await registerApi(username, email, password, firstName, lastName);
    return persist(data);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (role) => user?.roles?.includes(role) ?? false;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

