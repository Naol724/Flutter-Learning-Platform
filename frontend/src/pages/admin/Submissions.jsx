import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  AcademicCapIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const Submissions = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedStudents, setExpandedStudents] = useState(new Set())
  const [reviewingSubmission, setReviewingSubmission] = useState(null)
  const [reviewData, setReviewData] = useState({ score: '', feedback: '' })
  const [submitting, setSubmitting] = useState(false)
  const [viewingSubmission, setViewingSubmission] = useState(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const toggleStudentExpansion = (studentId) => {
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId)
    } else {
      newExpanded.add(studentId)
    }
    setExpandedStudents(newExpanded)
  }

  const handleViewSubmission = (submission) => {
    console.log('=== VIEW SUBMISSION DEBUG ===')
    console.log('Submission:', submission)
    console.log('Type:', submission.type)
    console.log('FilePath:', submission.filePath)
    console.log('FileName:', submission.fileName)
    console.log('GithubUrl:', submission.githubUrl)
    console.log('Description:', submission.description)
    
    // Open view modal
    setViewingSubmission(submission)
  }

  const handleDeleteSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await adminAPI.deleteSubmission(submissionId)
        toast.success('Submission deleted successfully')
        loadSubmissions() // Reload submissions
      } catch (error) {
        console.error('Delete submission error:', error)
        toast.error('Failed to delete submission')
      }
    }
  }

  const handleReviewSubmission = (submission) => {
    setReviewingSubmission(submission)
    setReviewData({
      score: submission.score || '',
      feedback: submission.feedback || ''
    })
  }

  const handleSubmitReview = async () => {
    if (!reviewData.score || reviewData.score < 0 || reviewData.score > 100) {
      toast.error('Please enter a valid score between 0 and 100')
      return
    }

    try {
      setSubmitting(true)
      await adminAPI.reviewSubmission(reviewingSubmission.id, {
        score: parseInt(reviewData.score),
        feedback: reviewData.feedback,
        status: 'reviewed'
      })
      toast.success('Submission reviewed successfully')
      setReviewingSubmission(null)
      setReviewData({ score: '', feedback: '' })
      loadSubmissions() // Reload submissions
    } catch (error) {
      console.error('Review submission error:', error)
      toast.error('Failed to review submission')
    } finally {
      setSubmitting(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check authentication
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      console.log('=== DEBUG: Token from localStorage ===')
      console.log('Token exists:', !!token)
      console.log('Token value (first 20 chars):', token?.substring(0, 20))
      
      console.log('=== DEBUG: Starting loadSubmissions ===')
      
      const response = await adminAPI.getSubmissions({
        page: 1,
        limit: 20
      })
      
      console.log('=== DEBUG: API Response ===')
      console.log('Response status:', response.status)
      console.log('Response data:', response.data)
      console.log('Submissions array:', response.data?.submissions)
      console.log('Submissions length:', response.data?.submissions?.length)
      
      setSubmissions(response.data.submissions || [])
    } catch (error) {
      console.error('=== DEBUG: Error in loadSubmissions ===')
      console.error('Error:', error)
      console.error('Error response:', error.response)
      console.error('Error status:', error.response?.status)
      console.error('Error data:', error.response?.data)
      
      setError(error.response?.data?.message || 'Failed to load submissions')
      toast.error(error.response?.data?.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const groupSubmissionsByStudent = () => {
    const grouped = {}
    submissions.forEach(submission => {
      const studentId = submission.user.id
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student: submission.user,
          submissions: []
        }
      }
      grouped[studentId].submissions.push(submission)
    })
    return Object.values(grouped)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-warning-100 text-warning-800'
      case 'reviewed': return 'bg-primary-100 text-primary-800'
      case 'approved': return 'bg-success-100 text-success-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type) => {
    return type === 'quiz' ? (
      <AcademicCapIcon className="w-4 h-4" />
    ) : (
      <DocumentTextIcon className="w-4 h-4" />
    )
  }

  const getTypeColor = (type) => {
    return type === 'quiz' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  return (
    <Layout title="Submissions">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-4 text-white">
          <h1 className="text-lg font-bold mb-1">Student Submissions</h1>
          <p className="text-primary-100 text-sm">Review and manage student assignments and quizzes</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-4 w-4 text-red-400" />
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-red-800">Error</h3>
                <div className="mt-1 text-xs text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="card">
            <div className="p-6">
              <LoadingSpinner size="md" text="Loading submissions..." />
            </div>
          </div>
        )}

        {/* Students with Submissions */}
        {!loading && !error && (
          <div className="card">
            <div className="p-4">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Student Submissions</h2>
              
              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {groupSubmissionsByStudent().map((studentGroup) => {
                    const isExpanded = expandedStudents.has(studentGroup.student.id)
                    const submissionCount = studentGroup.submissions.length
                    
                    return (
                      <div key={studentGroup.student.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Student Header */}
                        <div 
                          className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleStudentExpansion(studentGroup.student.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {studentGroup.student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">{studentGroup.student.name}</h3>
                                <p className="text-xs text-gray-500">{studentGroup.student.email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-600">
                                    {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center text-xs text-gray-500">
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-4 h-4 mr-1" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4 mr-1" />
                                )}
                                <span className="hidden sm:inline">
                                  {isExpanded ? 'Collapse' : 'Expand'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Student Submissions - Conditional */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 p-2 space-y-2">
                            {studentGroup.submissions
                              .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                              .map((submission) => (
                                <div key={submission.id} className="bg-white border border-gray-100 rounded-lg p-2">
                                  <div className="space-y-2">
                                    {/* Top Row - Type and Status */}
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTypeColor(submission.type)}`}>
                                          {getTypeIcon(submission.type)}
                                          <span className="ml-1">{submission.type}</span>
                                        </span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(submission.status)}`}>
                                          {submission.status}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-gray-600">
                                        Week {submission.week.weekNumber}: {submission.week.title}
                                      </span>
                                    </div>
                                    
                                    {/* Second Row - Date */}
                                    <div className="flex items-start">
                                      <div className="text-[10px] text-gray-500">
                                        <ClockIcon className="w-3 h-3 inline mr-1" />
                                        {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                                      </div>
                                    </div>
                                    
                                    {/* Third Row - Score */}
                                    <div className="flex items-center justify-between">
                                      <div className="text-[10px] font-medium text-gray-700">
                                        Score:
                                      </div>
                                      <div className="text-right">
                                        {submission.type === 'quiz' ? (
                                          <div className="text-xs font-medium text-gray-900">
                                            {submission.score}/{submission.totalQuestions}
                                            <span className="text-[10px] text-gray-500 ml-1">pts</span>
                                          </div>
                                        ) : (
                                          submission.score !== null ? (
                                            <div className="text-xs font-medium text-gray-900">
                                              {submission.score}/100
                                              <span className="text-[10px] text-gray-500 ml-1">pts</span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400 text-[10px]">Not graded</span>
                                          )
                                        )}
                                      </div>
                                    </div>

                                    {/* Fourth Row - Action Buttons */}
                                    <div className="flex items-center space-x-1 pt-1 border-t border-gray-50">
                                      <button 
                                        onClick={() => handleViewSubmission(submission)}
                                        className="flex items-center px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                      >
                                        <EyeIcon className="w-3 h-3 mr-1" />
                                        View
                                      </button>
                                      {submission.type === 'assignment' && (
                                        <button 
                                          onClick={() => handleReviewSubmission(submission)}
                                          className="flex items-center px-2 py-1 text-[10px] bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                        >
                                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                                          {submission.status === 'submitted' ? 'Review' : 'Re-review'}
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleDeleteSubmission(submission.id)}
                                        className="flex items-center px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                      >
                                        <TrashIcon className="w-3 h-3 mr-1" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DocumentTextIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No submissions found</h3>
                  <p className="text-xs text-gray-500">No submissions available at the moment</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="card">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Debug Information</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Submissions loaded: {submissions.length}</p>
              <p>Students: {groupSubmissionsByStudent().length}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
              <p>Error: {error || 'None'}</p>
            </div>
          </div>
        </div>

        {/* View Submission Modal */}
        {viewingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">View Submission</h3>
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Student Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Student Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{viewingSubmission.user.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{viewingSubmission.user.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Week:</span>
                      <p className="font-medium">Week {viewingSubmission.week.weekNumber}: {viewingSubmission.week.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <p className="font-medium">{format(new Date(viewingSubmission.submittedAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium capitalize">{viewingSubmission.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingSubmission.status)}`}>
                        {viewingSubmission.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignment Details */}
                {viewingSubmission.type === 'assignment' && (
                  <div className="space-y-3">
                    {viewingSubmission.description && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{viewingSubmission.description}</p>
                      </div>
                    )}
                    
                    {viewingSubmission.githubUrl && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">GitHub Repository</h4>
                        <a
                          href={viewingSubmission.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {viewingSubmission.githubUrl}
                        </a>
                      </div>
                    )}
                    
                    {viewingSubmission.filePath && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Uploaded File</h4>
                        <button
                          onClick={() => {
                            const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'
                            const fileUrl = `${apiBaseUrl}/uploads/assignments/${viewingSubmission.filePath}`
                            window.open(fileUrl, '_blank')
                          }}
                          className="btn btn-primary flex items-center"
                        >
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          Open File in New Tab
                        </button>
                        <p className="text-xs text-gray-500 mt-1">File: {viewingSubmission.fileName || viewingSubmission.filePath}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz Details */}
                {viewingSubmission.type === 'quiz' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Quiz Results</h4>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {viewingSubmission.score}/{viewingSubmission.totalQuestions}
                    </div>
                    <p className="text-gray-700">
                      Percentage: {Math.round((viewingSubmission.score / viewingSubmission.totalQuestions) * 100)}%
                    </p>
                  </div>
                )}

                {/* Score and Feedback */}
                {viewingSubmission.score !== null && viewingSubmission.type === 'assignment' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Grading</h4>
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {viewingSubmission.score}/100
                    </div>
                    {viewingSubmission.feedback && (
                      <div className="mt-3">
                        <span className="text-gray-600 font-medium">Feedback:</span>
                        <p className="text-gray-700 mt-1">{viewingSubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                {viewingSubmission.type === 'assignment' && (
                  <button
                    onClick={() => {
                      setViewingSubmission(null)
                      handleReviewSubmission(viewingSubmission)
                    }}
                    className="btn btn-primary"
                  >
                    {viewingSubmission.status === 'submitted' ? 'Review Submission' : 'Re-review Submission'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Review Submission</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {reviewingSubmission.user.name} - Week {reviewingSubmission.week.weekNumber}
                </p>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reviewData.score}
                    onChange={(e) => setReviewData(prev => ({ ...prev, score: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter score..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={reviewData.feedback}
                    onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="4"
                    placeholder="Provide feedback to the student..."
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setReviewingSubmission(null)
                    setReviewData({ score: '', feedback: '' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Submissions
