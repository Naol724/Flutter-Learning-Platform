import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PlayIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const Content = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const [week, setWeek] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contentData, setContentData] = useState({
    instructions: '',
    videos: [], // Array of video objects
    notes: '',
    assignmentDescription: '',
    assignmentDeadline: '',
    resources: [],
    isPublished: true
  })
  const [notesFile, setNotesFile] = useState(null)

  useEffect(() => {
    loadWeekContent()
  }, [weekId])

  const loadWeekContent = async () => {
    try {
      const response = await adminAPI.getWeek(weekId)
      const fetchedWeek = response.data.week

      setWeek(fetchedWeek)

      const content = fetchedWeek.content || {}
      
      // Convert existing videos to array format
      const videos = []
      if (content.video1Url) {
        videos.push({
          id: 'video1',
          url: content.video1Url,
          duration: content.video1Duration || '',
          title: content.video1Title || 'Video 1'
        })
      }
      if (content.video2Url) {
        videos.push({
          id: 'video2',
          url: content.video2Url,
          duration: content.video2Duration || '',
          title: content.video2Title || 'Video 2'
        })
      }
      
      setContentData({
        instructions: content.instructions || '',
        videos: videos,
        notes: content.notes || '',
        assignmentDescription: content.assignmentDescription || '',
        assignmentDeadline: content.assignmentDeadline
          ? content.assignmentDeadline.substring(0, 16)
          : '',
        resources: content.resources || [],
        isPublished: content.isPublished !== false
      })
    } catch (error) {
      console.error('Failed to load week content:', error)
      toast.error(error.response?.data?.message || 'Failed to load week content')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setContentData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleVideoChange = (index, field, value) => {
    const updatedVideos = [...contentData.videos]
    updatedVideos[index] = {
      ...updatedVideos[index],
      [field]: value
    }
    setContentData(prev => ({
      ...prev,
      videos: updatedVideos
    }))
  }

  const addVideo = () => {
    const newVideo = {
      id: `video${Date.now()}`,
      url: '',
      duration: '',
      title: `Video ${contentData.videos.length + 1}`
    }
    setContentData(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo]
    }))
  }

  const removeVideo = (index) => {
    const updatedVideos = contentData.videos.filter((_, i) => i !== index)
    setContentData(prev => ({
      ...prev,
      videos: updatedVideos
    }))
  }

  const handleFileChange = (e) => {
    setNotesFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Convert videos array back to individual video fields for backend
      const videoData = {}
      contentData.videos.forEach((video, index) => {
        if (index === 0) {
          videoData.video1Url = video.url
          videoData.video1Duration = video.duration
          videoData.video1Title = video.title
        } else if (index === 1) {
          videoData.video2Url = video.url
          videoData.video2Duration = video.duration
          videoData.video2Title = video.title
        } else {
          // For additional videos, we'll need to extend the backend schema
          videoData[`video${index + 1}Url`] = video.url
          videoData[`video${index + 1}Duration`] = video.duration
          videoData[`video${index + 1}Title`] = video.title
        }
      })

      const submissionData = {
        ...contentData,
        ...videoData,
        // Remove videos array as we've converted it to individual fields
        videos: undefined
      }

      await adminAPI.updateWeekContent(weekId, submissionData)
      toast.success('Week content updated successfully!')
    } catch (error) {
      console.error('Failed to update week content:', error)
      toast.error(error.response?.data?.message || 'Failed to update week content')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Manage Content">
        <LoadingSpinner size="lg" text="Loading week content..." />
      </Layout>
    )
  }

  if (!week) {
    return (
      <Layout title="Manage Content">
        <div className="text-center py-12">
          <p className="text-gray-500">Week not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Manage Content - Week ${week.weekNumber}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-[10px] sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Back
          </button>
        </div>

        {/* Week Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-3 sm:p-6 text-white">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">
            Week {week.weekNumber}: {week.title}
          </h1>
          <p className="text-primary-100 text-xs sm:text-sm">{week.description}</p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="card p-2 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">
              <DocumentTextIcon className="w-3 h-3 sm:w-6 sm:h-6 inline mr-1 sm:mr-2" />
              Instructions
            </h2>
            
            <div className="space-y-2 sm:space-y-4">
              <div>
                <label className="label text-[10px] sm:text-sm">Instructions</label>
                <textarea
                  name="instructions"
                  className="input h-16 sm:h-24 resize-none text-[10px] sm:text-sm"
                  placeholder="Provide instructions for this week..."
                  value={contentData.instructions}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">
              <PlayIcon className="w-3 h-3 sm:w-6 sm:h-6 inline mr-1 sm:mr-2" />
              Video Content
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              {contentData.videos.map((video, index) => (
                <div key={video.id} className="border border-gray-200 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900">
                      {video.title}
                    </h3>
                    {contentData.videos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="label text-[10px] sm:text-sm">Video Title</label>
                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) => handleVideoChange(index, 'title', e.target.value)}
                        className="input text-[10px] sm:text-sm"
                        placeholder="Enter video title"
                      />
                    </div>
                    
                    <div>
                      <label className="label text-[10px] sm:text-sm">Video URL</label>
                      <input
                        type="url"
                        value={video.url}
                        onChange={(e) => handleVideoChange(index, 'url', e.target.value)}
                        className="input text-[10px] sm:text-sm"
                        placeholder="https://example.com/video"
                      />
                    </div>
                    
                    <div>
                      <label className="label text-[10px] sm:text-sm">Video Duration (minutes)</label>
                      <input
                        type="number"
                        value={video.duration}
                        onChange={(e) => handleVideoChange(index, 'duration', e.target.value)}
                        className="input text-[10px] sm:text-sm"
                        placeholder="45"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addVideo}
                className="btn btn-secondary text-[10px] sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 w-full sm:w-auto"
              >
                <CloudArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add Video
              </button>
            </div>
          </div>

          <div className="card p-2 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">
              <CloudArrowUpIcon className="w-3 h-3 sm:w-6 sm:h-6 inline mr-1 sm:mr-2" />
              Notes & Resources
            </h2>
            
            <div className="space-y-2 sm:space-y-4">
              <div>
                <label className="label text-[10px] sm:text-sm">Notes</label>
                <textarea
                  name="notes"
                  className="input h-16 sm:h-24 resize-none text-[10px] sm:text-sm"
                  placeholder="Additional notes for students..."
                  value={contentData.notes}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="label text-[10px] sm:text-sm">Upload Notes File (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-[10px] sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-4 file:px-1 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Assignment</h2>
            
            <div className="space-y-2 sm:space-y-4">
              <div>
                <label className="label text-[10px] sm:text-sm">Assignment Description</label>
                <textarea
                  name="assignmentDescription"
                  className="input h-16 sm:h-32 resize-none text-[10px] sm:text-sm"
                  placeholder="Describe assignment requirements..."
                  value={contentData.assignmentDescription}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="label text-[10px] sm:text-sm">Assignment Deadline</label>
                <input
                  type="datetime-local"
                  name="assignmentDeadline"
                  className="input text-[10px] sm:text-sm"
                  value={contentData.assignmentDeadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="card p-2 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-4">Publishing</h2>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={contentData.isPublished}
                onChange={handleInputChange}
                className="h-3 w-3 sm:h-5 sm:w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublished" className="ml-2 block text-[10px] sm:text-sm text-gray-900">
                Publish this week (students can access)
              </label>
            </div>
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-end sm:space-y-0 sm:space-x-3">
            <Link
              to="/admin"
              className="btn btn-secondary text-[10px] sm:text-sm px-2 sm:px-4 py-1.5 sm:py-3 w-full sm:w-auto"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-sm px-2 sm:px-4 py-1.5 sm:py-3 w-full sm:w-auto"
            >
              {saving ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" text="" />
                  <span className="ml-2">Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default Content