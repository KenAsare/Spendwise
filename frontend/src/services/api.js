import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Token storage helpers ----
export const getAccessToken = () => localStorage.getItem('spendwise_access_token');
export const getRefreshToken = () => localStorage.getItem('spendwise_refresh_token');

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('spendwise_access_token', accessToken);
  if (refreshToken) localStorage.setItem('spendwise_refresh_token', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('spendwise_access_token');
  localStorage.removeItem('spendwise_refresh_token');
  localStorage.removeItem('spendwise_user');
};

// Attach the current access token to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// When several requests 401 at the same moment, only one refresh call should
// fire; the rest wait for it and then retry with the new token.
let isRefreshing = false;
let waitingRequests = [];

const notifyWaitingRequests = (newAccessToken) => {
  waitingRequests.forEach((cb) => cb(newAccessToken));
  waitingRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        if (!window.location.pathname.includes('/login')) window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the in-flight refresh finishes
        return new Promise((resolve) => {
          waitingRequests.push((newAccessToken) => {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use a plain axios call here (not `api`) so this request doesn't
        // get caught by these same interceptors and loop forever.
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        setTokens(accessToken, newRefreshToken);
        isRefreshing = false;
        notifyWaitingRequests(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        waitingRequests = [];
        clearTokens();
        if (!window.location.pathname.includes('/login')) window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return 'Something went wrong. Please try again.';
};

// ---- Auth ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: () => api.post('/auth/resend-verification'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  updateSettings: (data) => api.put('/auth/settings', data),
  deleteAccount: (data) => api.delete('/auth/account', { data }),
};

// ---- Income ----
export const incomeAPI = {
  getAll: (params) => api.get('/income', { params }),
  getOne: (id) => api.get(`/income/${id}`),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  remove: (id) => api.delete(`/income/${id}`),
};

// ---- Expenses ----
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
};

// ---- Budgets ----
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getOne: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  remove: (id) => api.delete(`/budgets/${id}`),
};

// ---- Dashboard ----
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ---- Recurring Transactions ----
export const recurringAPI = {
  getAll: () => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  remove: (id) => api.delete(`/recurring/${id}`),
};

// ---- Savings Goals ----
export const savingsGoalAPI = {
  getAll: () => api.get('/savings-goals'),
  create: (data) => api.post('/savings-goals', data),
  update: (id, data) => api.put(`/savings-goals/${id}`, data),
  remove: (id) => api.delete(`/savings-goals/${id}`),
  contribute: (id, amount) => api.post(`/savings-goals/${id}/contribute`, { amount }),
  withdraw: (id, amount) => api.post(`/savings-goals/${id}/withdraw`, { amount }),
};

// ---- Reports ----
export const reportAPI = {
  getMonthly: (params) => api.get('/reports', { params }),
  getIncome: (params) => api.get('/reports/income', { params }),
  getExpenses: (params) => api.get('/reports/expenses', { params }),
  getBudgets: (params) => api.get('/reports/budgets', { params }),
};

export default api;