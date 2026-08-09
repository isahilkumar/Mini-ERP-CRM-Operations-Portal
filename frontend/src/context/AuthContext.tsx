import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  token: string;
}

interface AuthContextType {
  user: User | null;
  originalAdminUser: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  impersonate: (targetUserData: User) => void;
  exitImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('erp_user');
    const storedAdmin = localStorage.getItem('erp_admin_user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedAdmin) {
      setOriginalAdminUser(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setOriginalAdminUser(null);
    localStorage.setItem('erp_user', JSON.stringify(userData));
    localStorage.removeItem('erp_admin_user');
  };

  const logout = () => {
    setUser(null);
    setOriginalAdminUser(null);
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_admin_user');
  };

  const impersonate = (targetUserData: User) => {
    if (!user) return;
    // Save the active admin user if not already impersonating
    const adminToSave = originalAdminUser || user;
    setOriginalAdminUser(adminToSave);
    localStorage.setItem('erp_admin_user', JSON.stringify(adminToSave));

    setUser(targetUserData);
    localStorage.setItem('erp_user', JSON.stringify(targetUserData));
  };

  const exitImpersonation = () => {
    if (originalAdminUser) {
      setUser(originalAdminUser);
      localStorage.setItem('erp_user', JSON.stringify(originalAdminUser));
      setOriginalAdminUser(null);
      localStorage.removeItem('erp_admin_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        originalAdminUser,
        isLoading,
        login,
        logout,
        impersonate,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
