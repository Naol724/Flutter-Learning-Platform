import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { studentAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'
import ReactPlayer from 'react-player'
import {
  ArrowLeftIcon,
  PlayIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const WeekDetail = () => {
  const { weekId } = useParams()
  const [week, setWeek] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('instructions')
  const [videoProgress, setVideoProgress] = useState(0)
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionData, setSubmissionData] = useState({
    description: '',
    githubUrl: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadWeekDetails()
  }, [weekId])

  const loadWeekDetails = async () => {
    try {
      const response = await studentAPI.getWeekDetails(weekId)
      setWeek(response.data.week)
      
      // Set initial video progress
      if (response.data.week.progress?.[0]?.videoProgress) {
        setVideoProgress(response.data.week.progress[0].videoProgress)
      }
    } catch (error) {
      console.error('Failed to load week details:', error)
      toast.error('Failed to load week details')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoProgress = async (progress) => {
    const progressPercent = Math.round(progress.played * 100)
    setVideoProgress(progressPercent)

    // Update progress when video reaches 90% or completes
    if (progressPercent >= 90 && (!week.progress?.[0]?.videoWatched)) {
      try {
        await studentAPI.updateVideoProgress(weekId, {
          progress: progressPercent,
          completed: true
        })
        
        // Reload week data to get updated progress
        loadWeekDetails()
        toast.success('Video completed! Points awarded.')
      } catch (error) {
        console.error('Failed to update video progress:', error)
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      setSubmissionFile(file)
    }
  }

  const handleSubmissionChange = (e) => {
    const { name, value } = e.target
    setSubmissionData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitAssignment = async (e) => {
    e.preventDefault()
    
    if (!submissionFile && !submissionData.githubUrl.trim()) {
      toast.error('Please upload a file or provide a GitHub URL')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      if (submissionFile) {
        formData.append('assignment', submissionFile)
      }
      formData.append('description', submissionData.description)
      formData.append('githubUrl', submissionData.githubUrl)

      await studentAPI.submitAssignment(weekId, formData)
      
      toast.success('Assignment submitted successfully!')
      loadWeekDetails() // Reload to show updated submission status
      
      // Reset form
      setSubmissionFile(null)
      setSubmissionData({ description: '', githubUrl: '' })
      document.getElementById('assignment-file').value = ''
    } catch (error) {
      console.error('Failed to submit assignment:', error)
      toast.error(error.response?.data?.message || 'Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubmission = async (submissionId) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return
    }

    try {
      await studentAPI.deleteSubmission(submissionId)
      toast.success('Submission deleted successfully')
      loadWeekDetails() // Reload to show updated status
    } catch (error) {
      console.error('Failed to delete submission:', error)
      toast.error(error.response?.data?.message || 'Failed to delete submission')
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading week details..." />
      </Layout>
    )
  }

  if (!week) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Week not found</p>
          <Link to="/dashboard" className="btn btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  const progress = week.progress?.[0]
  const content = week.content
  const submissions = week.submissions || []
  const latestSubmission = submissions[0]

  const tabs = [
    { id: 'instructions', name: 'Instructions', icon: DocumentTextIcon },
    { id: 'video', name: 'Video', icon: PlayIcon },
    { id: 'assignment', name: 'Assignment', icon: CloudArrowUpIcon }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
            >
              <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                Week {week.weekNumber}: {week.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{week.description}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">Progress</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {progress?.points || 0}/100
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="flex items-center">
              <div className={`p-2 sm:p-3 rounded-lg mr-2 sm:mr-4 ${
                progress?.videoWatched ? 'bg-success-100' : 'bg-gray-100'
              }`}>
                <PlayIcon className={`w-4 h-4 sm:w-6 sm:h-6 ${
                  progress?.videoWatched ? 'text-success-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Video</p>
                <p className="text-sm sm:text-base font-semibold">
                  {progress?.videoWatched ? 'Completed' : 'Not Started'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {progress?.videoPoints || 0}/{week.videoPoints} points
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className={`p-2 sm:p-3 rounded-lg mr-2 sm:mr-4 ${
                progress?.assignmentSubmitted ? 'bg-success-100' : 'bg-gray-100'
              }`}>
                <DocumentTextIcon className={`w-4 h-4 sm:w-6 sm:h-6 ${
                  progress?.assignmentSubmitted ? 'text-success-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Assignment</p>
                <p className="text-sm sm:text-base font-semibold">
                  {progress?.assignmentSubmitted ? 'Submitted' : 'Pending'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {progress?.assignmentPoints || 0}/{week.assignmentPoints} points
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className={`p-2 sm:p-3 rounded-lg mr-2 sm:mr-4 ${
                progress?.completed ? 'bg-success-100' : 'bg-warning-100'
              }`}>
                <CheckCircleIcon className={`w-4 h-4 sm:w-6 sm:h-6 ${
                  progress?.completed ? 'text-success-600' : 'text-warning-600'
                }`} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Status</p>
                <p className="text-sm sm:text-base font-semibold">
                  {progress?.completed ? 'Completed' : 'In Progress'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Total: {progress?.points || 0}/100 points
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <ProgressBar 
              progress={progress?.points || 0} 
              color="primary"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 sm:space-x-8 px-2 sm:px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.slice(0, 3)}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-4">Week Instructions</h3>
                {content?.instructions ? (
                  <div className="whitespace-pre-wrap text-gray-700">
                    {content.instructions}
                  </div>
                ) : (
                  <p className="text-gray-500">No instructions available yet.</p>
                )}

                {content?.notes && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-2">Additional Notes</h4>
                    <div className="whitespace-pre-wrap text-gray-700">
                      {content.notes}
                    </div>
                  </div>
                )}

                {content?.resources && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-2">Resources</h4>
                    <ul className="space-y-2">
                      {(() => {
                        let resourcesArray = [];
                        try {
                          if (Array.isArray(content.resources)) {
                            resourcesArray = content.resources;
                          } else if (typeof content.resources === 'string') {
                            resourcesArray = JSON.parse(content.resources);
                          } else if (typeof content.resources === 'object') {
                            resourcesArray = Object.values(content.resources);
                          }
                        } catch (e) {
                          console.warn('Failed to parse resources:', e);
                          resourcesArray = [];
                        }
                        return resourcesArray.map((resource, index) => (
                          <li key={index}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 underline"
                            >
                              {resource.title}
                            </a>
                            {resource.type && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({resource.type})
                              </span>
                            )}
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Video Tab */}
            {activeTab === 'video' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Video Content</h3>
                
                {/* Debug information */}
                <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                  <h5 className="font-mono text-sm mb-2">Debug Info:</h5>
                  <p className="font-mono text-xs">video1Url: {content?.video1Url || 'null'}</p>
                  <p className="font-mono text-xs">video2Url: {content?.video2Url || 'null'}</p>
                  <p className="font-mono text-xs">videoUrl: {content?.videoUrl || 'null'}</p>
                  <p className="font-mono text-xs">video1Title: {content?.video1Title || 'null'}</p>
                  <p className="font-mono text-xs">video2Title: {content?.video2Title || 'null'}</p>
                </div>
                
                {/* Video 1 */}
                {content?.video1Url ? (
                  <div className="space-y-4 mb-8">
                    <h4 className="text-md font-medium text-gray-800">
                      {content.video1Title || 'Video 1'}
                    </h4>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <ReactPlayer
                        url={content.video1Url}
                        width="100%"
                        height="100%"
                        controls
                        onProgress={handleVideoProgress}
                        progressInterval={5000}
                        onError={(error) => {
                          console.error('ReactPlayer error:', error);
                          console.error('Video URL:', content.video1Url);
                        }}
                        config={{
                          youtube: {
                            playerVars: {
                              origin: window.location.origin,
                              enablejsapi: 1
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Duration: {content.video1Duration ? `${Math.round(content.video1Duration / 60)} minutes` : 'Unknown'}
                      </div>
                      <div>
                        Progress: {videoProgress}%
                      </div>
                    </div>
                  </div>
                ) : content?.videoUrl ? (
                  <div className="space-y-4 mb-8">
                    <h4 className="text-md font-medium text-gray-800">
                      Main Video
                    </h4>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <ReactPlayer
                        url={content.videoUrl}
                        width="100%"
                        height="100%"
                        controls
                        onProgress={handleVideoProgress}
                        progressInterval={5000}
                        onError={(error) => {
                          console.error('ReactPlayer error:', error);
                          console.error('Video URL:', content.videoUrl);
                        }}
                        config={{
                          youtube: {
                            playerVars: {
                              origin: window.location.origin,
                              enablejsapi: 1
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Duration: {content.videoDuration ? `${Math.round(content.videoDuration / 60)} minutes` : 'Unknown'}
                      </div>
                      <div>
                        Progress: {videoProgress}%
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Video 2 */}
                {content?.video2Url ? (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">
                      {content.video2Title || 'Video 2'}
                    </h4>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <ReactPlayer
                        url={content.video2Url}
                        width="100%"
                        height="100%"
                        controls
                        onProgress={handleVideoProgress}
                        progressInterval={5000}
                        onError={(error) => {
                          console.error('ReactPlayer error:', error);
                          console.error('Video URL:', content.video2Url);
                        }}
                        config={{
                          youtube: {
                            playerVars: {
                              origin: window.location.origin,
                              enablejsapi: 1
                            }
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Duration: {content.video2Duration ? `${Math.round(content.video2Duration / 60)} minutes` : 'Unknown'}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* No videos available */}
                {(!content?.video1Url && !content?.video2Url && !content?.videoUrl) && (
                  <p className="text-gray-500">No video content available yet.</p>
                )}

                {/* Video completion status */}
                {progress?.videoWatched && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4 mt-6">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-success-600 mr-2" />
                      <span className="text-success-800 font-medium">
                        Video completed! You earned {progress.videoPoints} points.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assignment Tab */}
            {activeTab === 'assignment' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Assignment</h3>
                  {content?.assignmentDescription ? (
                    <div className="whitespace-pre-wrap text-gray-700 mb-3 sm:mb-4">
                      {content.assignmentDescription}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-3 sm:mb-4">No assignment description available yet.</p>
                  )}

                  {content?.assignmentDeadline && (
                    <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-warning-600 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-warning-800">
                          Deadline: {format(new Date(content.assignmentDeadline), 'PPP p')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <>
                {/* Submission Status */}
                {latestSubmission && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h4 className="text-sm sm:text-base font-semibold">Latest Submission</h4>
                      <button
                        onClick={() => handleDeleteSubmission(latestSubmission.id)}
                        className="btn bg-red-500 hover:bg-red-600 text-white flex items-center text-xs px-2 py-1"
                      >
                        <TrashIcon className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p><strong>Submitted:</strong> {format(new Date(latestSubmission.submittedAt), 'PPP p')}</p>
                        <p><strong>Status:</strong> 
                          <span className={`ml-2 px-1 sm:px-2 py-0.5 rounded-full text-xs ${
                            latestSubmission.status === 'approved' 
                              ? 'bg-success-100 text-success-800'
                              : latestSubmission.status === 'reviewed'
                              ? 'bg-primary-100 text-primary-800'
                              : latestSubmission.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}>
                            {latestSubmission.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        {latestSubmission.score !== null && (
                          <p><strong>Score:</strong> {latestSubmission.score}/100</p>
                        )}
                        {latestSubmission.fileName && (
                          <p><strong>File:</strong> {latestSubmission.fileName}</p>
                        )}
                        {latestSubmission.githubUrl && (
                          <p>
                            <strong>GitHub:</strong>{' '}
                            <a 
                              href={latestSubmission.githubUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 underline"
                            >
                              View Repo
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                    {latestSubmission.description && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                        <p><strong>Description:</strong></p>
                        <p className="text-gray-700 mt-1 text-xs sm:text-sm">{latestSubmission.description}</p>
                      </div>
                    )}
                    {latestSubmission.feedback && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                        <p><strong>Feedback:</strong></p>
                        <p className="text-gray-700 mt-1 text-xs sm:text-sm">{latestSubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission Form */}
                <form onSubmit={handleSubmitAssignment} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="label">Assignment Description (Optional)</label>
                    <textarea
                      name="description"
                      value={submissionData.description}
                      onChange={handleSubmissionChange}
                      className="input h-20 sm:h-24 resize-none"
                      placeholder="Describe your submission, challenges faced, or any notes..."
                    />
                  </div>

                  <div>
                    <label className="label">GitHub Repository URL (Optional)</label>
                    <input
                      type="url"
                      name="githubUrl"
                      value={submissionData.githubUrl}
                      onChange={handleSubmissionChange}
                      className="input"
                      placeholder="https://github.com/username/repository"
                    />
                  </div>

                  <div>
                    <label className="label">Upload Assignment File</label>
                    <input
                      id="assignment-file"
                      type="file"
                      onChange={handleFileChange}
                      className="input"
                      accept=".pdf,.zip,.rar,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, ZIP, Images, Text, Word documents (Max: 50MB)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (!submissionFile && !submissionData.githubUrl.trim())}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" text="" />
                        <span className="ml-2">Submitting...</span>
                      </div>
                    ) : (
                      'Submit Assignment'
                    )}
                  </button>
                </form>
                </>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default WeekDetail