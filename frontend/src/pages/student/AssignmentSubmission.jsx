import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { studentAPI } from '../../services/api'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'

const AssignmentSubmission = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [week, setWeek] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [formData, setFormData] = useState({
    description: '',
    githubUrl: ''
  })

  useEffect(() => {
    loadWeekDetails()
    loadSubmissions()
  }, [weekId])

  const loadWeekDetails = async () => {
    try {
      setLoading(true)
      const response = await studentAPI.getWeekDetails(weekId)
      setWeek(response.data.week)
    } catch (error) {
      console.error('Failed to load week details:', error)
      toast.error('Failed to load week details')
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      const response = await studentAPI.getWeekDetails(weekId)
      setSubmissions(response.data.week.submissions || [])
    } catch (error) {
      console.error('Failed to load submissions:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      toast.error('Please provide a description')
      return
    }

    if (!formData.githubUrl.trim()) {
      toast.error('Please provide a GitHub URL')
      return
    }

    try {
      setSubmitting(true)
      await studentAPI.submitAssignment(weekId, formData)
      
      toast.success('Assignment submitted successfully!')
      setFormData({ description: '', githubUrl: '' })
      loadSubmissions()
    } catch (error) {
      console.error('Failed to submit assignment:', error)
      toast.error(error.response?.data?.message || 'Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDeleteSubmission = async (submissionId) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')
    
    if (!confirmed) {
      return
    }

    try {
      console.log('Attempting to delete submission:', submissionId); // Debug log
      
      const response = await studentAPI.deleteSubmission(submissionId)
      console.log('Delete response:', response); // Debug log
      
      toast.success('Submission deleted successfully!')
      loadSubmissions() // Reload submissions list
    } catch (error) {
      console.error('Failed to delete submission:', error)
      
      // Enhanced error handling
      let errorMessage = 'Failed to delete submission';
      
      if (error.response) {
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
        
        if (error.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          // Optionally redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this submission.';
        } else if (error.response.status === 404) {
          errorMessage = 'Submission not found or has already been deleted.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Cannot delete this submission.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  const content = week?.content

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/week/${weekId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Week {week?.weekNumber}
          </Link>
          
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            Assignment Submission - Week {week?.weekNumber}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{week?.title}</p>
        </div>

        {/* Assignment Details */}
        {content?.assignmentDescription && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center">
              <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Assignment Details
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="whitespace-pre-wrap text-sm sm:text-base text-gray-700">
                  {content.assignmentDescription}
                </div>
              </div>

              {content?.assignmentDeadline && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-warning-600 mr-2" />
                    <span className="text-warning-800 font-medium text-sm sm:text-base">
                      Deadline: {new Date(content.assignmentDeadline).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {content?.assignmentGradingCriteria && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Grading Criteria</h3>
                  <div className="whitespace-pre-wrap text-blue-700">
                    {content.assignmentGradingCriteria}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center">
            <CloudArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Submit Your Assignment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Assignment Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your approach, what you implemented, challenges faced, and how you solved them..."
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                GitHub Repository URL *
              </label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://github.com/username/repository"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex items-center text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Previous Submissions */}
        {submissions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center">
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Previous Submissions
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col space-y-2 mb-2 sm:mb-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Status: {submission.isOnTime ? 'On Time' : 'Late'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {submission.grade && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Grade: {submission.grade}%
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'approved' 
                          ? 'bg-success-100 text-success-800'
                          : submission.status === 'reviewed'
                          ? 'bg-primary-100 text-primary-800'
                          : submission.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {submission.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-600">
                      {submission.fileName && `File: ${submission.fileName}`}
                      {submission.feedback && ' • Feedback available'}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/week/${weekId}`}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        View
                      </Link>
                      {/* Only show delete button for submissions that are not reviewed/approved */}
                      {submission.status !== 'reviewed' && submission.status !== 'approved' && (
                        <button
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {submission.feedback && (
                    <div className="bg-blue-50 p-3 rounded-lg mt-2">
                      <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Instructor Feedback:</p>
                      <p className="text-xs sm:text-sm text-blue-700">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AssignmentSubmission
