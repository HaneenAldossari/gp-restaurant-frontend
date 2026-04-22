import { createContext, useContext, useState, useEffect } from 'react';
import { users } from '../data/mockData';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('salesAnalyticsUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        const foundUser = users.find(
          u => u.username === username && u.password === password
        );

        if (foundUser) {
          const userData = {
            id: foundUser.id,
            username: foundUser.username,
            name: foundUser.name,
            role: foundUser.role,
            avatar: foundUser.avatar
          };
          setUser(userData);
          localStorage.setItem('salesAnalyticsUser', JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('salesAnalyticsUser');
  };

  const hasAccess = (requiredRoles) => {
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
