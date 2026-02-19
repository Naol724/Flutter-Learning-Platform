import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

// Components
import Login from './pages/Login'
import Register from './pages/Register'
import EmailVerification from './pages/EmailVerification'
import StudentDashboard from './pages/student/Dashboard'
import WeekDetail from './pages/student/WeekDetail'
import EnhancedWeekDetail from './pages/student/EnhancedWeekDetail'
import AssignmentSubmission from './pages/student/AssignmentSubmission'
import ProgressSummary from './pages/student/ProgressSummary'
import CourseMap from './pages/student/CourseMap'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminSubmissions from './pages/admin/Submissions'
import AdminContent from './pages/admin/Content'
import ContentManager from './pages/admin/ContentManager'
import AdminCourseMap from './pages/admin/CourseMap'
import LoadingSpinner from './components/LoadingSpinner'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/email-verification" 
            element={
              <EmailVerification />
            } 
          />

          {/* Student Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/week/:weekId" 
            element={
              <ProtectedRoute requiredRole="student">
                <EnhancedWeekDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/week/:weekId/submit-assignment" 
            element={
              <ProtectedRoute requiredRole="student">
                <AssignmentSubmission />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/week/:weekId/detail" 
            element={
              <ProtectedRoute requiredRole="student">
                <WeekDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/progress" 
            element={
              <ProtectedRoute requiredRole="student">
                <ProgressSummary />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course-map" 
            element={
              <ProtectedRoute requiredRole="student">
                <CourseMap />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/students" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminStudents />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/submissions" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSubmissions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/content/:weekId" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminContent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/content/weeks/:weekId/content" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ContentManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/course-map" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseMap />
              </ProtectedRoute>
            } 
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App