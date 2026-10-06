import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getErrorMessage, setTokens, clearTokens, getAccessToken, getRefreshToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      // If this access token has expired, the api.js response interceptor
      // will transparently use the refresh token to get a new one and
      // retry this call automatically — no extra code needed here.
      const res = await authAPI.getMe();
      setUser(res.data.data.user);
    } catch (err) {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { user: loggedInUser, accessToken, refreshToken } = res.data.data;
      setTokens(accessToken, refreshToken);
      localStorage.setItem('spendwise_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err), errors: err.response?.data?.errors };
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    try {
      const res = await authAPI.register({ name, email, password, confirmPassword });
      const { user: newUser, accessToken, refreshToken } = res.data.data;
      setTokens(accessToken, refreshToken);
      localStorage.setItem('spendwise_user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err), errors: err.response?.data?.errors };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout({ refreshToken: getRefreshToken() });
    } catch (err) {
      // ignore network errors on logout — we clear local state regardless
    }
    clearTokens();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('spendwise_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};