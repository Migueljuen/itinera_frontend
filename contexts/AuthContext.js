// contexts/AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Changed this line
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
    
    // Check if token has the basic JWT structure (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Token does not have 3 parts:', parts.length);
      return true;
    }
    
    try {
      const decoded = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();

      return isExpired;
    } catch (e) {
      console.log('Token decode error in isTokenExpired:', e);
      return true; // Treat errors as expired
    }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Logout function (defined first so it can be used in useEffect)
  const logout = useCallback(async () => {
    try {
      console.log('Logging out...');
      // Clear state
      setToken(null);
      setUser(null);
      
      // Clear storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear default headers
      delete axios.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      console.error('Logout error', error);
      return { success: false };
    }
  }, []);

  useEffect(() => {
    // Check if token exists in AsyncStorage on app load
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
     
            await logout(); // Clean up expired session
          }
          
      } catch (error) {
        console.error('Error loading auth data', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, [logout]);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
  
        const expiresAt = decoded.exp * 1000; // JWT exp is in seconds
        const timeout = expiresAt - Date.now();
  
        if (timeout > 0) {
          const timer = setTimeout(() => {
         
            logout(); // Auto logout when token expires
          }, timeout);
  
          return () => clearTimeout(timer); // Clean up on token/user change
        } else {
          console.log('Token already expired');
          logout(); // If token already expired somehow
        }
      } catch (err) {
        console.log('JWT decode error:', err);
        logout(); // Malformed token
      }
    }
  }, [token, logout]);

  // Login function
  const login = async (email, password) => {
    setError('');
    setLoading(true); // Set loading during login
    try {
      console.log('Attempting login...');
      const response = await axios.post(`${API_URL}/api/login`, { email, password });

      const { token, user } = response.data;
      
 
      // Store in AsyncStorage first
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Then update state
      setToken(token);
      setUser(user);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
  
      return { success: true, user };

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error?.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setError('');
    try {
      const response = await axios.post(`${API_URL}/users/register`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
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