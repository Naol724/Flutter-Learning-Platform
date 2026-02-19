import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  UserGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewingSubmission, setReviewingSubmission] = useState(null)
  const [reviewData, setReviewData] = useState({
    score: '',
    feedback: '',
    status: 'reviewed'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard()
      setDashboardData(response.data)
    } catch (error) {
      console.error('Failed to load admin dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmission = (submission) => {
    setReviewingSubmission(submission)
    setReviewData({
      score: submission.score || '',
      feedback: submission.feedback || '',
      status: submission.status === 'submitted' ? 'reviewed' : submission.status
    })
  }

  const handleReviewChange = (e) => {
    const { name, value } = e.target
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const submitReview = async (e) => {
    e.preventDefault()
    
    // Different validation for quiz vs assignment
    if (reviewingSubmission.type === 'quiz') {
      if (!reviewData.score || reviewData.score < 0 || reviewData.score > reviewingSubmission.totalQuestions) {
        toast.error(`Please enter a valid score (0-${reviewingSubmission.totalQuestions})`)
        return
      }
    } else {
      if (!reviewData.score || reviewData.score < 0 || reviewData.score > 100) {
        toast.error('Please enter a valid score (0-100)')
        return
      }
    }

    setSubmitting(true)

    try {
      await adminAPI.reviewSubmission(reviewingSubmission.id, {
        score: parseInt(reviewData.score),
        feedback: reviewData.feedback,
        status: reviewData.status
      })

      toast.success('Submission reviewed successfully!')
      setReviewingSubmission(null)
      loadDashboard() // Reload dashboard to update stats
    } catch (error) {
      console.error('Failed to review submission:', error)
      toast.error('Failed to review submission')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </Layout>
    )
  }

  if (!dashboardData) {
    return (
      <Layout title="Admin Dashboard">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </Layout>
    )
  }

  const { stats, recentSubmissions, topStudents } = dashboardData

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-primary-100">
            Manage your Flutter Learning Platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.certificatesIssued}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Submissions</h2>
              <Link
                to="/admin/submissions"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {submission.user.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Week {submission.week.weekNumber}: {submission.week.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {submission.type === 'quiz' ? 'Quiz' : 'Assignment'} • {format(new Date(submission.submittedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                      {submission.type === 'quiz' && (
                        <p className="text-xs text-green-600">
                          Score: {submission.score}/{submission.totalQuestions}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.status === 'submitted' 
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-primary-100 text-primary-800'
                      }`}>
                        {submission.status}
                      </span>
                      <button
                        onClick={() => handleReviewSubmission(submission)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Review submission"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent submissions</p>
              </div>
            )}
          </div>

          {/* Top Students */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Top Students</h2>
              <Link
                to="/admin/students"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {topStudents.length > 0 ? (
              <div className="space-y-3">
                {topStudents.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">
                          Phase {student.currentPhase}, Week {student.currentWeek}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{student.totalPoints}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No students yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/submissions?status=submitted"
              className="flex items-center p-4 bg-warning-50 hover:bg-warning-100 rounded-lg transition-colors"
            >
              <ClockIcon className="w-8 h-8 text-warning-600 mr-3" />
              <div>
                <div className="font-medium text-warning-900">Review Submissions</div>
                <div className="text-sm text-warning-600">
                  {stats.pendingSubmissions} pending
                </div>
              </div>
            </Link>
            
            <Link
              to="/admin/students"
              className="flex items-center p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <UserGroupIcon className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <div className="font-medium text-primary-900">Manage Students</div>
                <div className="text-sm text-primary-600">
                  {stats.totalStudents} total students
                </div>
              </div>
            </Link>
            
            <Link
              to="/admin/course-map"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <AcademicCapIcon className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Course Content</div>
                <div className="text-sm text-gray-600">Manage weekly content</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Course Overview */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Course Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-3xl mb-2">🌱</div>
              <h3 className="font-semibold text-success-900">Phase 1: Foundation</h3>
              <p className="text-sm text-success-700">Weeks 1-8</p>
              <p className="text-xs text-success-600 mt-1">
                Dart basics & Flutter fundamentals
              </p>
            </div>
            
            <div className="text-center p-4 bg-warning-50 rounded-lg">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-semibold text-warning-900">Phase 2: Intermediate</h3>
              <p className="text-sm text-warning-700">Weeks 9-16</p>
              <p className="text-xs text-warning-600 mt-1">
                State management & APIs
              </p>
            </div>
            
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-primary-900">Phase 3: Advanced</h3>
              <p className="text-sm text-primary-700">Weeks 17-26</p>
              <p className="text-xs text-primary-600 mt-1">
                Testing, deployment & portfolio
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewingSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Review Submission
                </h3>
                <button
                  onClick={() => setReviewingSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Student:</strong> {reviewingSubmission.user.name}
                  </div>
                  <div>
                    <strong>Week:</strong> {reviewingSubmission.week.weekNumber} - {reviewingSubmission.week.title}
                  </div>
                  <div>
                    <strong>Submitted:</strong> {format(new Date(reviewingSubmission.submittedAt), 'PPP p')}
                  </div>
                  <div>
                    <strong>Type:</strong> {reviewingSubmission.type === 'quiz' ? 'Quiz' : 'Assignment'}
                  </div>
                </div>
                
                {reviewingSubmission.description && (
                  <div className="mt-3">
                    <strong>Description:</strong>
                    <p className="text-gray-700 mt-1">{reviewingSubmission.description}</p>
                  </div>
                )}
                
                {reviewingSubmission.githubUrl && (
                  <div className="mt-3">
                    <strong>GitHub URL:</strong>
                    <a
                      href={reviewingSubmission.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 ml-2"
                    >
                      {reviewingSubmission.githubUrl}
                    </a>
                  </div>
                )}
                
                {reviewingSubmission.type === 'quiz' && (
                  <div className="mt-3">
                    <strong>Quiz Results:</strong>
                    <p className="text-gray-700 mt-1">
                      Score: {reviewingSubmission.score}/{reviewingSubmission.totalQuestions} 
                      ({Math.round((reviewingSubmission.score / reviewingSubmission.totalQuestions) * 100)}%)
                    </p>
                  </div>
                )}
              </div>
              
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="label">
                    Score {reviewingSubmission.type === 'quiz' ? `(0-${reviewingSubmission.totalQuestions})` : '(0-100)'}
                  </label>
                  <input
                    type="number"
                    name="score"
                    min="0"
                    max={reviewingSubmission.type === 'quiz' ? reviewingSubmission.totalQuestions : 100}
                    required
                    className="input"
                    value={reviewData.score}
                    onChange={handleReviewChange}
                  />
                </div>
                
                <div>
                  <label className="label">Feedback</label>
                  <textarea
                    name="feedback"
                    rows="4"
                    className="input"
                    placeholder="Provide feedback to the student..."
                    value={reviewData.feedback}
                    onChange={handleReviewChange}
                  />
                </div>
                
                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    className="input"
                    value={reviewData.status}
                    onChange={handleReviewChange}
                  >
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setReviewingSubmission(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default AdminDashboard
