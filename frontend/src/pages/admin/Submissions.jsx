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
  const [viewingSubmission, setViewingSubmission] = useState(null)
  const [reviewingSubmission, setReviewingSubmission] = useState(null)
  const [reviewData, setReviewData] = useState({
    score: '',
    feedback: '',
    status: 'reviewed'
  })
  const [submitting, setSubmitting] = useState(false)

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
    setViewingSubmission(submission)
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
    
    const maxScore = reviewingSubmission.type === 'quiz' 
      ? reviewingSubmission.totalQuestions 
      : 100

    if (!reviewData.score || reviewData.score < 0 || reviewData.score > maxScore) {
      toast.error(`Please enter a valid score (0-${maxScore})`)
      return
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
      loadSubmissions()
    } catch (error) {
      console.error('Failed to review submission:', error)
      toast.error(error.response?.data?.message || 'Failed to review submission')
    } finally {
      setSubmitting(false)
    }
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
                                      <button 
                                        onClick={() => handleReviewSubmission(submission)}
                                        className="flex items-center px-2 py-1 text-[10px] bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                      >
                                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                                        Review
                                      </button>
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    View {viewingSubmission.type === 'quiz' ? 'Quiz' : 'Assignment'} Submission
                  </h3>
                  <button
                    onClick={() => setViewingSubmission(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Student Info */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Student Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div>
                        <strong>Name:</strong> {viewingSubmission.user.name}
                      </div>
                      <div>
                        <strong>Email:</strong> {viewingSubmission.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Submission Info */}
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">Submission Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-blue-800">
                      <div>
                        <strong>Week:</strong> {viewingSubmission.week.weekNumber} - {viewingSubmission.week.title}
                      </div>
                      <div>
                        <strong>Phase:</strong> {viewingSubmission.week.phase.number}
                      </div>
                      <div>
                        <strong>Submitted:</strong> {format(new Date(viewingSubmission.submittedAt), 'PPP p')}
                      </div>
                      <div>
                        <strong>Status:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingSubmission.status)}`}>
                          {viewingSubmission.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-semibold text-green-900 mb-2">Score</h4>
                    <div className="text-green-800 text-xs sm:text-sm">
                      {viewingSubmission.type === 'quiz' ? (
                        <div>
                          <strong>Quiz Score:</strong> {viewingSubmission.score}/{viewingSubmission.totalQuestions}
                          <span className="ml-2">
                            ({Math.round((viewingSubmission.score / viewingSubmission.totalQuestions) * 100)}%)
                          </span>
                        </div>
                      ) : (
                        viewingSubmission.score !== null ? (
                          <div>
                            <strong>Assignment Score:</strong> {viewingSubmission.score}/100
                          </div>
                        ) : (
                          <div className="text-gray-500">Not graded yet</div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Assignment specific details */}
                  {viewingSubmission.type === 'assignment' && (
                    <>
                      {viewingSubmission.description && (
                        <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-700 text-xs sm:text-sm whitespace-pre-wrap">{viewingSubmission.description}</p>
                        </div>
                      )}

                      {viewingSubmission.githubUrl && (
                        <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">GitHub Repository</h4>
                          <a
                            href={viewingSubmission.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800 underline text-xs sm:text-sm break-all"
                          >
                            {viewingSubmission.githubUrl}
                          </a>
                        </div>
                      )}

                      {viewingSubmission.fileName && (
                        <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Submitted File</h4>
                          <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                            <span className="text-xs sm:text-sm text-gray-700">{viewingSubmission.fileName}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Feedback */}
                  {viewingSubmission.feedback && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-xs sm:text-sm font-semibold text-yellow-900 mb-2">Instructor Feedback</h4>
                      <p className="text-yellow-800 text-xs sm:text-sm whitespace-pre-wrap">{viewingSubmission.feedback}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                    {viewingSubmission.githubUrl && (
                      <a
                        href={viewingSubmission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 py-2"
                      >
                        Open GitHub Repo
                      </a>
                    )}
                    <button
                      onClick={() => setViewingSubmission(null)}
                      className="btn btn-secondary text-xs sm:text-sm px-3 py-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewingSubmission && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Review {reviewingSubmission.type === 'quiz' ? 'Quiz' : 'Assignment'} Submission
                  </h3>
                  <button
                    onClick={() => setReviewingSubmission(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Submission Info */}
                <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <strong>Student:</strong> {reviewingSubmission.user.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {reviewingSubmission.user.email}
                    </div>
                    <div>
                      <strong>Week:</strong> {reviewingSubmission.week.weekNumber} - {reviewingSubmission.week.title}
                    </div>
                    <div>
                      <strong>Submitted:</strong> {format(new Date(reviewingSubmission.submittedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  {reviewingSubmission.description && (
                    <div className="mt-3">
                      <strong className="text-xs sm:text-sm">Description:</strong>
                      <p className="text-gray-700 mt-1 text-xs sm:text-sm">{reviewingSubmission.description}</p>
                    </div>
                  )}
                  
                  {reviewingSubmission.githubUrl && (
                    <div className="mt-3">
                      <strong className="text-xs sm:text-sm">GitHub URL:</strong>
                      <a
                        href={reviewingSubmission.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 ml-2 text-xs sm:text-sm break-all"
                      >
                        {reviewingSubmission.githubUrl}
                      </a>
                    </div>
                  )}
                  
                  {reviewingSubmission.type === 'quiz' && (
                    <div className="mt-3">
                      <strong className="text-xs sm:text-sm">Current Quiz Score:</strong>
                      <p className="text-gray-700 mt-1 text-xs sm:text-sm">
                        {reviewingSubmission.score}/{reviewingSubmission.totalQuestions} 
                        ({Math.round((reviewingSubmission.score / reviewingSubmission.totalQuestions) * 100)}%)
                      </p>
                    </div>
                  )}
                </div>

                {/* Review Form */}
                <form onSubmit={submitReview} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Score {reviewingSubmission.type === 'quiz' 
                        ? `(0-${reviewingSubmission.totalQuestions})` 
                        : '(0-100)'}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="score"
                      min="0"
                      max={reviewingSubmission.type === 'quiz' ? reviewingSubmission.totalQuestions : 100}
                      required
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={reviewData.score}
                      onChange={handleReviewChange}
                      placeholder="Enter score"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Feedback
                    </label>
                    <textarea
                      name="feedback"
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows="4"
                      placeholder="Provide feedback to student..."
                      value={reviewData.feedback}
                      onChange={handleReviewChange}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Status
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={reviewData.status}
                      onChange={handleReviewChange}
                      required
                    >
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setReviewingSubmission(null)}
                      className="btn btn-secondary text-xs sm:text-sm px-3 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-3 py-2"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Submissions
