import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  PlayIcon, 
  QuestionMarkCircleIcon, 
  ClipboardDocumentCheckIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

const ContentManager = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [week, setWeek] = useState(null)
  const [content, setContent] = useState({
    instructions: '',
    notes: '',
    videos: [], // Array of video objects
    multipleChoiceQuestions: [],
    assignmentDescription: '',
    assignmentDeadline: '',
    assignmentGradingCriteria: '',
    resources: [],
    isPublished: false
  })
  const [expandedSections, setExpandedSections] = useState({
    instructions: true,
    notes: true,
    videos: true,
    quiz: true,
    assignment: true
  })

  useEffect(() => {
    loadContent()
  }, [weekId])

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getWeekContent(weekId)
      
      if (response.data.content) {
        // Convert existing videos to array format
        const videos = []
        if (response.data.content.video1Url) {
          videos.push({
            id: 'video1',
            title: response.data.content.video1Title || 'Video 1',
            url: response.data.content.video1Url,
            duration: response.data.content.video1Duration || 0
          })
        }
        if (response.data.content.video2Url) {
          videos.push({
            id: 'video2',
            title: response.data.content.video2Title || 'Video 2',
            url: response.data.content.video2Url,
            duration: response.data.content.video2Duration || 0
          })
        }
        
        setContent({
          instructions: response.data.content.instructions || '',
          notes: response.data.content.notes || '',
          videos: videos,
          multipleChoiceQuestions: response.data.content.multipleChoiceQuestions || [],
          assignmentDescription: response.data.content.assignmentDescription || '',
          assignmentDeadline: response.data.content.assignmentDeadline ? 
            new Date(response.data.content.assignmentDeadline).toISOString().slice(0, 16) : '',
          assignmentGradingCriteria: response.data.content.assignmentGradingCriteria || '',
          resources: Array.isArray(response.data.content.resources) ? response.data.content.resources : 
            (typeof response.data.content.resources === 'string' ? JSON.parse(response.data.content.resources || '[]') : []),
          isPublished: response.data.content.isPublished || false
        })
        setWeek(response.data.content.week)
      }
    } catch (error) {
      console.error('Failed to load content:', error)
      toast.error('Failed to load week content')
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async () => {
    try {
      console.log('Saving content for week:', weekId)
      console.log('Content data:', content)
      setSaving(true)
      
      // Convert videos array back to individual video fields for backend compatibility
      const submissionData = {
        ...content,
        // Convert videos array to individual video fields
        video1Url: content.videos[0]?.url || '',
        video1Title: content.videos[0]?.title || '',
        video1Duration: content.videos[0]?.duration || 0,
        video2Url: content.videos[1]?.url || '',
        video2Title: content.videos[1]?.title || '',
        video2Duration: content.videos[1]?.duration || 0,
        // For additional videos beyond 2, we'll need to extend backend schema
        ...(content.videos.slice(2).reduce((acc, video, index) => {
          const videoNum = index + 3
          acc[`video${videoNum}Url`] = video.url
          acc[`video${videoNum}Title`] = video.title
          acc[`video${videoNum}Duration`] = video.duration
          return acc
        }, {}))
      }
      
      // Remove videos array from submission
      delete submissionData.videos
      
      const response = await adminAPI.upsertWeekContent(weekId, submissionData)
      console.log('Save response:', response.data)
      toast.success('Content saved successfully!')
    } catch (error) {
      console.error('Failed to save content:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      toast.error(error.response?.data?.message || 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  const deleteContent = async () => {
    if (!confirm('Are you sure you want to delete all content for this week? This action cannot be undone.')) {
      return
    }

    try {
      await adminAPI.deleteWeekContent(weekId)
      toast.success('Content deleted successfully!')
      navigate('/admin/weeks')
    } catch (error) {
      console.error('Failed to delete content:', error)
      toast.error('Failed to delete content')
    }
  }

  const addVideo = () => {
    const newVideo = {
      id: `video${Date.now()}`,
      title: `Video ${content.videos.length + 1}`,
      url: '',
      duration: 0
    }
    setContent(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo]
    }))
  }

  const removeVideo = (index) => {
    const updatedVideos = content.videos.filter((_, i) => i !== index)
    setContent(prev => ({
      ...prev,
      videos: updatedVideos
    }))
  }

  const updateVideo = (index, field, value) => {
    const updatedVideos = [...content.videos]
    updatedVideos[index] = {
      ...updatedVideos[index],
      [field]: value
    }
    setContent(prev => ({
      ...prev,
      videos: updatedVideos
    }))
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const addQuestion = () => {
    setContent(prev => ({
      ...prev,
      multipleChoiceQuestions: [
        ...(Array.isArray(prev.multipleChoiceQuestions) ? prev.multipleChoiceQuestions : []),
        {
          question: '',
          options: ['', '', '', '', ''],
          correctAnswer: 0,
          points: 1
        }
      ]
    }))
  }

  const updateQuestion = (index, field, value) => {
    setContent(prev => ({
      ...prev,
      multipleChoiceQuestions: (Array.isArray(prev.multipleChoiceQuestions) ? prev.multipleChoiceQuestions : []).map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const removeQuestion = (index) => {
    setContent(prev => ({
      ...prev,
      multipleChoiceQuestions: (Array.isArray(prev.multipleChoiceQuestions) ? prev.multipleChoiceQuestions : []).filter((_, i) => i !== index)
    }))
  }

  const addResource = () => {
    setContent(prev => ({
      ...prev,
      resources: [
        ...(Array.isArray(prev.resources) ? prev.resources : []),
        { title: '', url: '', type: 'documentation' }
      ]
    }))
  }

  const updateResource = (index, field, value) => {
    setContent(prev => ({
      ...prev,
      resources: (Array.isArray(prev.resources) ? prev.resources : []).map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }))
  }

  const removeResource = (index) => {
    setContent(prev => ({
      ...prev,
      resources: (Array.isArray(prev.resources) ? prev.resources : []).filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col space-y-3">
          {/* Back Button */}
          <div className="flex items-start">
            <button
              onClick={() => navigate('/admin/course-map')}
              className="flex items-center text-xs sm:text-base lg:text-lg text-gray-600 hover:text-gray-900 transition-colors font-medium px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 rounded-lg hover:bg-gray-100 min-h-[36px] lg:min-h-[44px]"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
              Back to Course Map
            </button>
          </div>
          
          {/* Title */}
          <div>
            <h1 className="text-sm sm:text-2xl font-bold text-gray-900">
              Week {week?.weekNumber}: {week?.title}
            </h1>
            <p className="text-gray-600 mt-1 text-[8px] sm:text-sm">Content Management</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={saveContent}
              disabled={saving}
              className="btn btn-primary flex items-center justify-center text-xs sm:text-base lg:text-lg px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] lg:min-h-[48px]"
            >
              <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setContent(prev => ({ ...prev, isPublished: !prev.isPublished }))
                setTimeout(saveContent, 100)
              }}
              className={`btn flex items-center justify-center text-xs sm:text-base lg:text-lg px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] lg:min-h-[48px] ${
                content.isPublished 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {content.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button
              onClick={deleteContent}
              className="btn btn-danger flex items-center justify-center text-xs sm:text-base lg:text-lg px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] lg:min-h-[48px]"
            >
              <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* 1. Instructions Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('instructions')}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center">
            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mr-2 sm:mr-3" />
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">1. Instructions</h2>
          </div>
          {expandedSections.instructions ? 
            <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" /> : 
            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          }
        </button>
        
        {expandedSections.instructions && (
          <div className="px-4 sm:px-6 pb-6">
            <p className="text-[10px] sm:text-sm text-gray-600 mb-3">
              Clear learning objectives and step-by-step guidance for students. 
              Use headings, bullet points, and examples for better understanding.
            </p>
            <textarea
              value={content.instructions}
              onChange={(e) => setContent(prev => ({ ...prev, instructions: e.target.value }))}
              className="w-full h-32 sm:h-48 p-2 sm:p-3 text-[10px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Provide clear instructions with headings, bullet points, and examples..."
            />
          </div>
        )}
      </div>

      {/* 2. Notes Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('notes')}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center">
            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mr-2 sm:mr-3" />
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">2. Learning Notes</h2>
          </div>
          {expandedSections.notes ? 
            <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" /> : 
            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          }
        </button>
        
        {expandedSections.notes && (
          <div className="px-4 sm:px-6 pb-6">
            <p className="text-[10px] sm:text-sm text-gray-600 mb-3">
              Detailed learning notes provided directly on website. No PDF uploads allowed; 
              content must be readable online. Use headings, bullet points, and examples for clarity.
            </p>
            <textarea
              value={content.notes}
              onChange={(e) => setContent(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full h-32 sm:h-48 p-2 sm:p-3 text-[10px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter detailed weekly notes with headings, bullet points, and examples..."
            />
          </div>
        )}
      </div>

      {/* 3. Video Lessons Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('videos')}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center">
            <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mr-2 sm:mr-3" />
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">3. Video Lessons</h2>
          </div>
          {expandedSections.videos ? 
            <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" /> : 
            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          }
        </button>
        
        {expandedSections.videos && (
          <div className="px-6 pb-6">
            <p className="text-[8px] sm:text-sm text-gray-600 mb-4">
              Add multiple videos for this week. Videos can be embedded (YouTube or hosted). 
              Each video should clearly relate to the weekly topic.
            </p>
            
            {/* Videos List */}
            {content.videos.map((video, index) => (
              <div key={video.id} className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[8px] sm:text-sm font-semibold text-gray-900">
                    {video.title}
                  </h3>
                  {content.videos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] sm:text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideo(index, 'title', e.target.value)}
                      className="w-full p-2 text-[8px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter video title..."
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] sm:text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      value={video.duration}
                      onChange={(e) => updateVideo(index, 'duration', parseInt(e.target.value) || 0)}
                      className="w-full p-2 text-[8px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter duration in seconds..."
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-[8px] sm:text-sm font-medium text-gray-700 mb-1">Video URL</label>
                  <input
                    type="url"
                    value={video.url}
                    onChange={(e) => updateVideo(index, 'url', e.target.value)}
                    className="w-full p-2 text-[8px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            ))}
            
            {/* Add Video Button */}
            <button
              type="button"
              onClick={addVideo}
              className="btn btn-secondary flex items-center justify-center text-xs sm:text-base lg:text-lg px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] lg:min-h-[48px] w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
              Add Video
            </button>
          </div>
        )}
      </div>

      {/* 4. Multiple Choice Questions Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('quiz')}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center">
            <QuestionMarkCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mr-2 sm:mr-3" />
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">4. Quiz Questions</h2>
          </div>
          {expandedSections.quiz ? 
            <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" /> : 
            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          }
        </button>
        
        {expandedSections.quiz && (
          <div className="px-6 pb-6">
            <p className="text-sm text-gray-600 mb-4">
              Interactive multiple-choice questions. Used to test understanding of weekly content.
            </p>
            
            <button
              onClick={addQuestion}
              className="btn btn-secondary flex items-center justify-center text-xs sm:text-base lg:text-lg px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] lg:min-h-[48px] w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
              Add Question
            </button>

            {Array.isArray(content.multipleChoiceQuestions) && content.multipleChoiceQuestions.map((question, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                  >
                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="2"
                      placeholder="Enter your question..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option {String.fromCharCode(65 + optIndex)}
                        </label>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...question.options]
                            newOptions[optIndex] = e.target.value
                            updateQuestion(index, 'options', newOptions)
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder={`Enter option ${String.fromCharCode(65 + optIndex)}...`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                      <select
                        value={question.correctAnswer}
                        onChange={(e) => updateQuestion(index, 'correctAnswer', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows="2"
                        placeholder="Explain why this answer is correct..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Assignment Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('assignment')}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center">
            <ClipboardDocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mr-2 sm:mr-3" />
            <h2 className="text-sm sm:text-lg font-semibold text-gray-900">5. Assignment</h2>
          </div>
          {expandedSections.assignment ? 
            <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" /> : 
            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          }
        </button>
        
        {expandedSections.assignment && (
          <div className="px-6 pb-6">
            <p className="text-[8px] sm:text-sm text-gray-600 mb-4">
              Practical task related to the week's lesson. Clear requirements and submission instructions. 
              Visible deadline and grading criteria.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-gray-700 mb-2">Assignment Description</label>
                <textarea
                  value={content.assignmentDescription}
                  onChange={(e) => setContent(prev => ({ ...prev, assignmentDescription: e.target.value }))}
                  className="w-full h-24 sm:h-32 p-2 sm:p-3 text-[8px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe the practical task students should complete..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] sm:text-sm font-medium text-gray-700 mb-2">Deadline</label>
                  <input
                    type="datetime-local"
                    value={content.assignmentDeadline}
                    onChange={(e) => setContent(prev => ({ ...prev, assignmentDeadline: e.target.value }))}
                    className="w-full p-2 text-[8px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[8px] sm:text-sm font-medium text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={content.isPublished}
                      onChange={(e) => setContent(prev => ({ ...prev, isPublished: e.target.checked }))}
                      className="mr-2"
                    />
                    Publish Content
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-[8px] sm:text-sm font-medium text-gray-700 mb-2">Grading Criteria</label>
                <textarea
                  value={content.assignmentGradingCriteria}
                  onChange={(e) => setContent(prev => ({ ...prev, assignmentGradingCriteria: e.target.value }))}
                  className="w-full h-20 sm:h-24 p-2 sm:p-3 text-[8px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Explain how assignments will be graded..."
                />
              </div>
              
              {/* Assignment Submission Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/admin/submissions')}
                  className="btn btn-primary flex items-center justify-center text-xs sm:text-base lg:text-lg px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] lg:min-h-[48px] w-full sm:w-auto"
                >
                  <ClipboardDocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                  View Assignment Submissions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resources Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 mb-4">6. Additional Resources</h2>
          
          <p className="text-[10px] sm:text-sm text-gray-600 mb-4">
            Optional supplementary materials like PDFs, links, or documents that enhance learning.
          </p>
          
          <button
            onClick={addResource}
            className="btn btn-secondary flex items-center justify-center text-xs sm:text-base lg:text-lg px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-3.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] lg:min-h-[48px] w-full sm:w-auto mb-4"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
            Add Resource
          </button>

          {Array.isArray(content.resources) && content.resources.map((resource, index) => (
            <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg mb-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => updateResource(index, e.target.value)}
                  className="w-full p-2 text-[10px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Resource title or URL..."
                />
              </div>
              <button
                onClick={() => removeResource(index)}
                className="ml-3 text-red-500 hover:text-red-700 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContentManager
