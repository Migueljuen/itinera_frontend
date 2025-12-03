// contexts/AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner-native'; // ← NEW
import API_URL from '../constants/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') {
    console.log('Invalid token type:', typeof token);
    return true;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.log('Token does not have 3 parts:', parts.length);
    return true;
  }

  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    console.log('Token decode error in isTokenExpired:', e);
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Logout
  const logout = useCallback(async (showToast = false) => {
    try {
      setToken(null);
      setUser(null);

      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      delete axios.defaults.headers.common['Authorization'];

      if (showToast) {
        toast.info("Logged out. You have been successfully logged out.");
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error', error);
      toast.error("Logout failed. Could not log out properly.");
      return { success: false };
    }
  }, []);

  // Load stored auth
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser && !isTokenExpired(storedToken)) {
          const parsedUser = JSON.parse(storedUser);

          setToken(storedToken);
          setUser(parsedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          await logout(false);
        }
      } catch (error) {
        console.error('Error loading auth data', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, [logout]);

  // Auto logout when token expires
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const expiresAt = decoded.exp * 1000;
        const timeout = expiresAt - Date.now();

        if (timeout > 0) {
          const timer = setTimeout(() => {
            toast.warning("Session expired. Please log in again.");
            logout(false);
          }, timeout);

          return () => clearTimeout(timer);
        } else {
          logout(false);
        }
      } catch (err) {
        console.log('JWT decode error:', err);
        logout(false);
      }
    }
  }, [token, logout]);

  // Login
  const login = async (email, password) => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/login`, { email, password });

      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true, user };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid email or password';
        } else if (error.response.status === 401) {
          errorMessage = 'Invalid credentials';
        } else if (error.response.status === 404) {
          errorMessage = 'User not found';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.response.data?.error || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    setError('');
    try {
      const response = await axios.post(`${API_URL}/users/register`, userData);

      toast.success(response.data.message || 'Registration successful!');

      return { success: true, message: response.data.message };
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);

      toast.error(errorMessage);

      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
