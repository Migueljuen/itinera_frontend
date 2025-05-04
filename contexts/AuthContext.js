// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


import axios from 'axios';
import jwtDecode from 'jwt-decode';
import API_URL from '../constants/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};
const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now(); // JWT exp is in seconds
    } catch (e) {
      return true; // Treat errors as expired
    }
  };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

 

  useEffect(() => {
    // Check if token exists in AsyncStorage on app load
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser && !isTokenExpired(storedToken)) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
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
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log(new Date(decoded.exp * 1000));
        const expiresAt = decoded.exp * 1000; // JWT exp is in seconds
        const timeout = expiresAt - Date.now();
  
        if (timeout > 0) {
          const timer = setTimeout(() => {
            logout(); // Auto logout when token expires
          }, timeout);
  
          return () => clearTimeout(timer); // Clean up on token/user change
        } else {
          logout(); // If token already expired somehow
        }
      } catch (err) {
        logout(); // Malformed token
      }
    }
  }, [token]);

  // Login function
const login = async (email, password) => {
  setError('');
  try {
    const response = await axios.post(`${API_URL}/api/login`, { email, password });

    const { token, user } = response.data;
   

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    
    const storedUser = await AsyncStorage.getItem('user');
 
    // Don't forget to return success if everything works
    return { success: true };
  } catch (error) {
    console.error('Actual error caught in login():', error);
    const errorMessage =
      error?.response?.data?.error || 'Login failed. Please try again.';
    setError(errorMessage);
    return { success: false, error: errorMessage };
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

  // Logout function
  const logout = async () => {
    try {
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