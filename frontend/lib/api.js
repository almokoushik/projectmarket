import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  assignRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateProfile: (data) => api.patch('/users/profile', data),
  getById: (id) => api.get(`/users/${id}`),
};

// Projects
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  assign: (id, problemSolverId) => api.patch(`/projects/${id}/assign`, { problemSolverId }),
};

// Requests
export const requestsAPI = {
  getForProject: (projectId) => api.get(`/requests/project/${projectId}`),
  getMine: () => api.get('/requests/mine'),
  create: (data) => api.post('/requests', data),
};

// Tasks
export const tasksAPI = {
  getForProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Submissions
export const submissionsAPI = {
  getForTask: (taskId) => api.get(`/submissions/task/${taskId}`),
  submit: (formData) => api.post('/submissions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (formData._onProgress) formData._onProgress(Math.round((e.loaded * 100) / e.total));
    }
  }),
  review: (id, data) => api.patch(`/submissions/${id}/review`, data),
};
