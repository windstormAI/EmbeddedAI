/**
 * API Configuration and Utilities
 * Axios instance with interceptors for authentication and error handling
 */

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004/api/v1',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.metadata = {
      requestId: Date.now() + Math.random(),
      startTime: Date.now()
    };

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      requestId: config.metadata.requestId,
      data: config.data
    });

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;

    console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
      requestId: response.config.metadata.requestId,
      duration: `${duration}ms`,
      data: response.data
    });

    return response;
  },
  (error) => {
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : 'unknown';

    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      duration: `${duration}ms`,
      message: error.response?.data?.error || error.message,
      requestId: error.config?.metadata?.requestId
    });

    // Handle specific error types
    if (error.response?.status === 401) {
      // Token expired - clear local storage
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.warn('Access forbidden:', error.response.data.error);
    }

    if (error.response?.status >= 500) {
      // Server error - could implement retry logic here
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const apiHelpers = {
  // Generic GET request
  get: (url, params = {}) => api.get(url, { params }),

  // Generic POST request
  post: (url, data = {}) => api.post(url, data),

  // Generic PUT request
  put: (url, data = {}) => api.put(url, data),

  // Generic DELETE request
  delete: (url) => api.delete(url),

  // File upload helper
  uploadFile: (url, file, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
    });
  },

  // Batch requests helper
  batch: (requests) => {
    const promises = requests.map(request => {
      const { method, url, data, params } = request;
      return api[method.toLowerCase()](url, method === 'GET' ? { params } : data);
    });

    return Promise.allSettled(promises);
  }
};

export default api;