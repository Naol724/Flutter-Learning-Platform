import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    return Promise.reject(error)
  }
)

export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getWeekDetails: (weekId) => api.get(`/student/week/${weekId}`),
  submitAssignment: (weekId, data) => {
    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('githubUrl', data.githubUrl);
    return api.post(`/student/week/${weekId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateVideoProgress: (weekId, data) => api.put(`/student/week/${weekId}/video-progress`, data),
  getProgressSummary: () => api.get('/student/progress-summary'),
  getCertificate: () => api.get('/student/certificate'),
  // New notes functionality
  updateNotes: (weekId, data) => api.put(`/student/week/${weekId}/notes`, data),
  getNotes: (weekId) => api.get(`/student/week/${weekId}/notes`),
  uploadNotesFile: (weekId, formData) => api.post(`/student/week/${weekId}/notes/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Dashboard notes functionality
  getStudentNotes: () => api.get('/student/notes'),
  saveStudentNotes: (notes) => api.post('/student/notes', { notes }),
  uploadStudentFiles: (formData) => api.post('/student/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteSubmission: (submissionId) => api.delete(`/student/submission/${submissionId}`)
}

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getCourseStructure: () => api.get('/admin/course-structure'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getStudentDetails: (studentId) => api.get(`/admin/students/${studentId}`),
  getSubmissions: (params) => api.get('/admin/submissions', { params }),
  reviewSubmission: (submissionId, data) => api.put(`/admin/submissions/${submissionId}/review`, data),
  updateSubmission: (submissionId, data) => api.put(`/admin/submissions/${submissionId}`, data),
  deleteSubmission: (submissionId) => api.delete(`/admin/submissions/${submissionId}`),
  getWeek: (weekId) => api.get(`/admin/week/${weekId}`),
  getWeekContent: (weekId) => api.get(`/admin/content/weeks/${weekId}/content`),
  upsertWeekContent: (weekId, data) => api.put(`/admin/content/weeks/${weekId}/content`, data),
  deleteWeekContent: (weekId) => api.delete(`/admin/content/weeks/${weekId}/content`),
  updateWeekContent: (weekId, formData) => api.put(`/admin/week/${weekId}/content`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createWeek: (data) => api.post('/admin/week', data),
  deleteWeek: (weekId) => api.delete(`/admin/week/${weekId}`),
  updateWeek: (weekId, data) => api.put(`/admin/week/${weekId}`, data),
  getStudentsProgress: () => api.get('/admin/students/progress'),
  exportData: () => api.get('/admin/export'),
  getNotifications: () => api.get('/admin/notifications'),
  sendNotification: (data) => api.post('/admin/notifications', data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getAnalytics: () => api.get('/admin/analytics'),
  getReports: () => api.get('/admin/reports'),
  generateReport: (type) => api.get(`/admin/reports/${type}/generate`)
}

export const quizAPI = {
  getQuiz: (weekId) => api.get(`/quiz/weeks/${weekId}`),
  submitQuiz: (weekId, answers) => api.post(`/quiz/weeks/${weekId}/submit`, answers),
  getQuizResults: (weekId) => api.get(`/quiz/weeks/${weekId}/results`)
}

export const progressAPI = {
  checkUnlock: () => api.post('/progress/check-unlock'),
  getPhaseProgress: (phaseId) => api.get(`/progress/phase/${phaseId}`)
}

export default api
