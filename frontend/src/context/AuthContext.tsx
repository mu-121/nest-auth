import React, { createContext, useContext, useState } from 'react';
import CryptoJS from 'crypto-js';

interface User {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  apiSecret: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  signMessage: (message: string) => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const signMessage = (message: string) => {
    if (!user) return '';
    return CryptoJS.HmacSHA256(message, user.apiSecret).toString(CryptoJS.enc.Hex);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
