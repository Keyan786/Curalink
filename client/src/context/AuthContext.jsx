import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setUser({ userId: localStorage.getItem('userId') });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = (newToken, userId) => {
    localStorage.setItem('userId', userId);
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
