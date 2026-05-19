import axios from 'axios';
import useAuthStore from '@/store/authStore';
import demoAdapter from './demoAdapter';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');
const USE_DEMO_ADAPTER = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  adapter: USE_DEMO_ADAPTER ? demoAdapter : undefined,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ============================================================
// AUTH
// ============================================================
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/password', data),
};


// ============================================================
// GOAL SHEETS
// ============================================================
export const goalSheetService = {
  getAll: () => api.get('/goal-sheets'),
  getCurrent: () => api.get('/goal-sheets/current'),
  getById: (id) => api.get(`/goal-sheets/${id}`),
  create: () => api.post('/goal-sheets'),
  submit: (id) => api.post(`/goal-sheets/${id}/submit`),
};

// ============================================================
// GOALS
// ============================================================
export const goalService = {
  getBySheet: (sheetId) => api.get('/goals', { params: { sheetId } }),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// ============================================================
// CHECK-INS
// ============================================================
export const checkInService = {
  getByGoal: (goalId) => api.get(`/check-ins/${goalId}`),
  create: (data) => api.post('/check-ins', data),
  update: (id, data) => api.put(`/check-ins/${id}`, data),
};

// ============================================================
// MASTER DATA
// ============================================================
export const masterService = {
  getThrustAreas: () => api.get('/master/thrust-areas'),
  getQuarters: () => api.get('/master/quarters'),
  getCurrentQuarter: () => api.get('/master/current-quarter'),
  getNotifications: () => api.get('/master/notifications'),
  markNotificationRead: (id) => api.put(`/master/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/master/notifications/read-all'),
};

// ============================================================
// MANAGER (placeholder — not connected yet)
// ============================================================
export const managerService = {
  getTeamGoalSheets: () => api.get('/manager/team-goals'),
  updateGoalForReview: (id, data) => api.put(`/manager/goals/${id}`, data),
  approveGoalSheet: (id) => api.post(`/manager/goal-sheets/${id}/approve`),
  rejectGoalSheet: (id, reason) => api.post(`/manager/goal-sheets/${id}/reject`, { reason }),
  returnForRework: (id, comments) => api.post(`/manager/goal-sheets/${id}/rework`, { comments }),
  sendMessage: (id, message) => api.post(`/manager/goal-sheets/${id}/message`, { message }),
  addCheckInComment: (id, managerComment) => api.put(`/manager/check-ins/${id}/comment`, { managerComment }),
};

// ============================================================
// ADMIN (placeholder — not connected yet)
// ============================================================
export const adminService = {
  getDepartmentStats: () => api.get('/admin/department-stats'),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getEscalations: () => api.get('/admin/escalations'),
  getLockedSheets: () => api.get('/admin/locked-sheets'),
  unlockGoalSheet: (id) => api.post(`/admin/goal-sheets/${id}/unlock`),
  getSharedGoals: () => api.get('/admin/shared-goals'),
  pushSharedGoal: (data) => api.post('/admin/shared-goals', data),
  exportReport: (type, format) => api.get(`/admin/reports/${type}`, { params: { format }, responseType: 'blob' }),
};

// ============================================================
// ORGANIZATIONAL INTELLIGENCE
// ============================================================
export const orgIntelligenceService = {
  getDashboard: () => api.get('/org-intelligence/dashboard'),
  cascadeGoal: (data) => api.post('/org-intelligence/cascade-goal', data),
};

export default api;
