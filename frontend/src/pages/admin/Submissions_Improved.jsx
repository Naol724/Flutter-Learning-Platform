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
  ClockIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const Submissions = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [reviewingSubmission, setReviewingSubmission] = useState(null)
  const [editingSubmission, setEditingSubmission] = useState(null)
  const [reviewData, setReviewData] = useState({
    score: '',
    feedback: '',
    status: 'reviewed'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [currentPage, statusFilter, typeFilter])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getSubmissions({
        page: currentPage,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter
      })
      setSubmissions(response.data.submissions)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to load submissions:', error)
      toast.error('Failed to load submissions')
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

  const handleEditSubmission = (submission) => {
    setEditingSubmission(submission)
    setReviewData({
      score: submission.score || '',
      feedback: submission.feedback || '',
      status: submission.status
    })
  }

  const handleDeleteSubmission = async (submission) => {
    if (!window.confirm(`Are you sure you want to delete this ${submission.type} submission from ${submission.user.name}?`)) {
      return
    }

    try {
      await adminAPI.deleteSubmission(submission.id)
      toast.success('Submission deleted successfully!')
      loadSubmissions()
    } catch (error) {
      console.error('Failed to delete submission:', error)
      toast.error('Failed to delete submission')
    }
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
      loadSubmissions()
    } catch (error) {
      console.error('Failed to review submission:', error)
      toast.error(error.response?.data?.message || 'Failed to review submission')
    } finally {
      setSubmitting(false)
    }
  }

  const updateSubmission = async (e) => {
    e.preventDefault()
    
    if (editingSubmission.type === 'quiz') {
      if (!reviewData.score || reviewData.score < 0 || reviewData.score > editingSubmission.totalQuestions) {
        toast.error(`Please enter a valid score (0-${editingSubmission.totalQuestions})`)
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
      await adminAPI.updateSubmission(editingSubmission.id, {
        score: parseInt(reviewData.score),
        feedback: reviewData.feedback,
        status: reviewData.status
      })
      toast.success('Submission updated successfully!')
      setEditingSubmission(null)
      loadSubmissions()
    } catch (error) {
      console.error('Failed to update submission:', error)
      toast.error('Failed to update submission')
    } finally {
      setSubmitting(false)
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Submissions</h1>
            <p className="text-gray-600">Review and manage student assignments and quizzes</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'submitted', label: 'Pending' },
                  { key: 'reviewed', label: 'Reviewed' },
                  { key: 'approved', label: 'Approved' },
                  { key: 'rejected', label: 'Rejected' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === filter.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Types' },
                  { key: 'assignment', label: 'Assignments' },
                  { key: 'quiz', label: 'Quizzes' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setTypeFilter(filter.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === filter.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="card">
          {loading ? (
            <div className="p-8">
              <LoadingSpinner size="lg" text="Loading submissions..." />
            </div>
          ) : submissions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {submission.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {submission.user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {submission.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(submission.type)}`}>
                              {getTypeIcon(submission.type)}
                              <span className="ml-1">{submission.type}</span>
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            Week {submission.week.weekNumber}: {submission.week.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            Phase {submission.week.phase.number}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(submission.submittedAt), 'h:mm a')}
                          </div>
                          {submission.isOnTime && (
                            <div className="text-xs text-success-600 flex items-center mt-1">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              On time
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.type === 'quiz' ? (
                            <div className="text-sm">
                              <span className="font-medium">{submission.score}/{submission.totalQuestions}</span>
                              <div className="text-xs text-gray-500">
                                {Math.round((submission.score / submission.totalQuestions) * 100)}%
                              </div>
                            </div>
                          ) : (
                            submission.score !== null ? (
                              <div className="text-sm">
                                <span className="font-medium">{submission.score}/100</span>
                                <div className="text-xs text-gray-500">
                                  {submission.score >= 80 ? 'Excellent' : submission.score >= 60 ? 'Good' : 'Needs Work'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Not graded</span>
                            )
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleReviewSubmission(submission)}
                              className="text-primary-600 hover:text-primary-900 p-1 rounded"
                              title="Review submission"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleEditSubmission(submission)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Edit submission"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteSubmission(submission)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete submission"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                            
                            {submission.filePath && (
                              <a
                                href={`/uploads/assignments/${submission.filePath.split('/').pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900 p-1 rounded"
                                title="View file"
                              >
                                <DocumentTextIcon className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} submissions
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {statusFilter === 'all' && typeFilter === 'all' 
                  ? 'No submissions yet' 
                  : `No ${statusFilter} ${typeFilter} submissions`
                }
              </p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {reviewingSubmission && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Review {reviewingSubmission.type} Submission
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
                      <strong>Type:</strong> <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(reviewingSubmission.type)}`}>
                        {getTypeIcon(reviewingSubmission.type)}
                        <span className="ml-1">{reviewingSubmission.type}</span>
                      </span>
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
                      className="input h-24 resize-none"
                      placeholder="Provide feedback to student..."
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
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingSubmission && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Edit {editingSubmission.type} Submission
                  </h3>
                  <button
                    onClick={() => setEditingSubmission(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={updateSubmission} className="space-y-4">
                  <div>
                    <label className="label">
                      Score {editingSubmission.type === 'quiz' ? `(0-${editingSubmission.totalQuestions})` : '(0-100)'}
                    </label>
                    <input
                      type="number"
                      name="score"
                      min="0"
                      max={editingSubmission.type === 'quiz' ? editingSubmission.totalQuestions : 100}
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
                      className="input h-24 resize-none"
                      placeholder="Update feedback..."
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
                      <option value="submitted">Submitted</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingSubmission(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Updating...' : 'Update Submission'}
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
