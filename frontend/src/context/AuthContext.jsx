import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

// Create default Axios instance
export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subExpired, setSubExpired] = useState(false);
  const [language, setLanguageState] = useState(localStorage.getItem('language') || 'English');
  const navigate = useNavigate();

  const changeLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  // Axios Interceptors for Token expiry & Subscription errors
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // 401 Unauthorized -> Attempt refresh token rotation
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const currentRefreshToken = localStorage.getItem('refreshToken');
            if (currentRefreshToken) {
              const res = await axios.post('/api/v1/auth/refresh', { refreshToken: currentRefreshToken });
              const { token, refreshToken, ...userData } = res.data;
              
              localStorage.setItem('token', token);
              localStorage.setItem('refreshToken', refreshToken);
              localStorage.setItem('user', JSON.stringify(userData));
              
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              
              setUser(userData);
              return api(originalRequest);
            }
          } catch (refreshError) {
            logout();
          }
        }

        // 403 Forbidden -> Check if expired subscription message
        if (error.response?.status === 403) {
          const errMsg = error.response.data?.message || '';
          if (errMsg.toLowerCase().includes('expired') || errMsg.toLowerCase().includes('grace')) {
            setSubExpired(true);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (username, password) => {
    setSubExpired(false);
    const res = await api.post('/api/v1/auth/login', { username, password });
    const { token, refreshToken, ...userData } = res.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);

    if (userData.dealerId) {
      try {
        const settingsRes = await axios.get(`/api/v1/dealers/${userData.dealerId}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const lang = settingsRes.data?.language || 'English';
        setLanguageState(lang);
        localStorage.setItem('language', lang);
      } catch (err) {
        console.warn("Failed to fetch dealer settings language preference", err);
      }
    }

    // Redirect to dashboard
    if (userData.role === 'SUPER_ADMIN') {
      navigate('/super-admin');
    } else if (userData.role === 'DEALER_ADMIN') {
      navigate('/dealer-admin');
    } else {
      navigate('/staff');
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (e) {
      console.warn("Logout request failed, cleaning local state anyway", e);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setSubExpired(false);
    navigate('/login');
  };

  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, subExpired, setSubExpired, language, changeLanguage, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
