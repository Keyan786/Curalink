import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // Here we could fetch user profile to verify token
      setUser({ userId: localStorage.getItem('userId'), onboarded: localStorage.getItem('onboarded') === 'true' });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('onboarded');
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = (newToken, userId, onboarded) => {
    localStorage.setItem('userId', userId);
    localStorage.setItem('onboarded', onboarded);
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const updateOnboarding = (status) => {
    localStorage.setItem('onboarded', status);
    setUser(prev => ({ ...prev, onboarded: status }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateOnboarding }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
