import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  LockClosedIcon,
  DocumentTextIcon,
  BookOpenIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const AdminCourseMap = () => {
  const [phases, setPhases] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState(new Set())
  const [editingWeek, setEditingWeek] = useState(null)
  const [showWeekModal, setShowWeekModal] = useState(false)
  const [weekFormData, setWeekFormData] = useState({
    weekNumber: '',
    title: '',
    description: '',
    maxPoints: 100,
    videoPoints: 40,
    assignmentPoints: 60,
    phaseId: null
  })

  useEffect(() => {
    loadCourseStructure()
    loadStats()
  }, [])

  const loadCourseStructure = async () => {
    try {
      const response = await adminAPI.getCourseStructure()
      setPhases(response.data)
    } catch (error) {
      console.error('Failed to load course structure:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboard()
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const togglePhaseExpansion = (phaseId) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  const handleDeleteWeek = async (weekId, weekNumber) => {
    if (!confirm(`Are you sure you want to delete Week ${weekNumber}? This action cannot be undone.`)) {
      return
    }

    try {
      await adminAPI.deleteWeek(weekId)
      toast.success('Week deleted successfully')
      await loadCourseStructure()
    } catch (error) {
      console.error('Failed to delete week:', error)
      toast.error(error.response?.data?.message || 'Failed to delete week')
    }
  }

  const handleEditWeek = (week) => {
    setEditingWeek(week.id)
    setWeekFormData({
      weekNumber: week.weekNumber,
      title: week.title,
      description: week.description,
      maxPoints: week.maxPoints,
      videoPoints: week.videoPoints,
      assignmentPoints: week.assignmentPoints,
      phaseId: week.phaseId
    })
    setShowWeekModal(true)
  }

  const handleCreateWeek = (phaseId) => {
    setEditingWeek(null)
    setWeekFormData({
      weekNumber: '',
      title: '',
      description: '',
      maxPoints: 100,
      videoPoints: 40,
      assignmentPoints: 60,
      phaseId: phaseId
    })
    setShowWeekModal(true)
  }

  const handleSaveWeek = async () => {
    try {
      if (editingWeek) {
        await adminAPI.updateWeek(editingWeek, weekFormData)
        toast.success('Week updated successfully')
      } else {
        await adminAPI.createWeek(weekFormData)
        toast.success('Week created successfully')
      }
      setShowWeekModal(false)
      await loadCourseStructure()
    } catch (error) {
      console.error('Failed to save week:', error)
      toast.error(error.response?.data?.message || 'Failed to save week')
    }
  }

  const handleDeleteContent = async (weekId) => {
    if (!confirm('Are you sure you want to delete all content for this week? This action cannot be undone.')) {
      return
    }

    try {
      await adminAPI.deleteWeekContent(weekId)
      toast.success('Week content deleted successfully')
      await loadCourseStructure()
    } catch (error) {
      console.error('Failed to delete content:', error)
      toast.error(error.response?.data?.message || 'Failed to delete content')
    }
  }

  const getPhaseIcon = (phaseNumber) => {
    switch (phaseNumber) {
      case 1: return '🌱'
      case 2: return '🚀'
      case 3: return '🎯'
      default: return '📚'
    }
  }

  if (loading) {
    return (
      <Layout title="Course Map">
        <LoadingSpinner size="lg" text="Loading course structure..." />
      </Layout>
    )
  }

  if (!phases.length) {
    return (
      <Layout title="Course Map">
        <div className="text-center py-12">
          <p className="text-gray-500">No course structure found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Course Map">
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Course Map</h1>
              <p className="text-xs sm:text-sm text-gray-600">Manage your Flutter course structure</p>
            </div>
            {stats && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 sm:space-x-6 text-xs sm:text-sm mt-3 sm:mt-0">
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                  <div className="text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.totalSubmissions}</div>
                  <div className="text-gray-500">Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.avgProgress}%</div>
                  <div className="text-gray-500">Avg Progress</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-6">
          {phases.map((phase) => {
            const isExpanded = expandedPhases.has(phase.id)
            
            return (
              <div key={phase.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Phase Header */}
                <div
                  className="p-3 sm:p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePhaseExpansion(phase.id)}
                >
                  <div className="flex items-center flex-1">
                    <div className="text-2xl sm:text-3xl mr-2 sm:mr-3">{getPhaseIcon(phase.number)}</div>
                    <div>
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                        Phase {phase.number}: {phase.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Weeks {phase.startWeek}-{phase.endWeek}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <LockClosedIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Next phase unlocks only after admin approval</span>
                    </div>
                    <div className="ml-1 sm:ml-2">
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-3">
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCreateWeek(phase.id)
                        }}
                        className="btn btn-primary flex items-center text-sm"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Week
                      </button>
                    </div>
                    {(phase.weeks || [])
                      .slice()
                      .sort((a, b) => a.weekNumber - b.weekNumber)
                      .map((week) => (
                        <div
                          key={week.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Week Header */}
                          <div className="bg-gray-50 p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 sm:space-x-3">
                                  <span className="font-bold text-sm sm:text-base lg:text-lg text-gray-900">
                                    Week {week.weekNumber}: {week.title}
                                  </span>
                                  {week.content?.isPublished && (
                                    <span className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded-full bg-success-100 text-success-800">
                                      Published
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-0">
                                <Link
                                  to={`/admin/content/weeks/${week.id}/content`}
                                  className="btn btn-primary flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                                >
                                  <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  <span className="hidden sm:inline">Manage</span>
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditWeek(week)
                                  }}
                                  className="btn bg-yellow-500 hover:bg-yellow-600 text-white flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                                >
                                  <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteWeek(week.id, week.weekNumber)
                                  }}
                                  className="btn bg-red-500 hover:bg-red-600 text-white flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                                >
                                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mt-2">{week.description}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 sm:space-x-4 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                              <span>{week.maxPoints} pts total</span>
                              <span>{week.videoPoints} video pts</span>
                              <span>{week.assignmentPoints} assignment pts</span>
                            </div>
                          </div>

                          {/* Content Status - Always Visible */}
                          <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
                              {/* Instructions Status */}
                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 sm:p-3">
                                <div className="flex items-center mb-1 sm:mb-2">
                                  <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-1 sm:mr-2" />
                                  <h4 className="text-xs sm:text-sm font-semibold text-indigo-900">Instructions</h4>
                                </div>
                                <p className="text-[10px] sm:text-xs text-indigo-700">
                                  {week.content?.instructions ? 'Instructions added' : 'No instructions yet'}
                                </p>
                              </div>

                              {/* Weekly Notes Status */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                                <div className="flex items-center mb-1 sm:mb-2">
                                  <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-1 sm:mr-2" />
                                  <h4 className="text-xs sm:text-sm font-semibold text-blue-900">Weekly Notes</h4>
                                </div>
                                <p className="text-[10px] sm:text-xs text-blue-700">
                                  {week.content?.notes ? 'Notes added' : 'No notes yet'}
                                </p>
                              </div>

                              {/* Video Lessons Status */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                                <div className="flex items-center mb-1 sm:mb-2">
                                  <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-1 sm:mr-2" />
                                  <h4 className="text-xs sm:text-sm font-semibold text-green-900">Video Lessons</h4>
                                </div>
                                <p className="text-[10px] sm:text-xs text-green-700">
                                  {week.content?.video1Url || week.content?.video2Url ? 
                                    `${(week.content?.video1Url ? 1 : 0) + (week.content?.video2Url ? 1 : 0)} videos added` : 
                                    'No videos yet'
                                  }
                                </p>
                              </div>

                              {/* Quiz Status */}
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                                <div className="flex items-center mb-1 sm:mb-2">
                                  <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-1 sm:mr-2" />
                                  <h4 className="text-xs sm:text-sm font-semibold text-yellow-900">Quiz</h4>
                                </div>
                                <p className="text-[10px] sm:text-xs text-yellow-700">
                                  {week.content?.multipleChoiceQuestions && week.content.multipleChoiceQuestions.length > 0 ? 
                                    `${week.content.multipleChoiceQuestions.length} questions added` : 
                                    'No quiz yet'
                                  }
                                </p>
                              </div>

                              {/* Assignment Status */}
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3">
                                <div className="flex items-center mb-1 sm:mb-2">
                                  <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-1 sm:mr-2" />
                                  <h4 className="text-xs sm:text-sm font-semibold text-orange-900">Assignment</h4>
                                </div>
                                <p className="text-[10px] sm:text-xs text-orange-700">
                                  {week.content?.assignmentDescription ? 'Assignment added' : 'No assignment yet'}
                                </p>
                              </div>
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

        {/* Week Modal */}
        {showWeekModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingWeek ? 'Edit Week' : 'Create New Week'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Week Number
                  </label>
                  <input
                    type="number"
                    value={weekFormData.weekNumber}
                    onChange={(e) => setWeekFormData({ ...weekFormData, weekNumber: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={weekFormData.title}
                    onChange={(e) => setWeekFormData({ ...weekFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={weekFormData.description}
                    onChange={(e) => setWeekFormData({ ...weekFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Points
                    </label>
                    <input
                      type="number"
                      value={weekFormData.maxPoints}
                      onChange={(e) => setWeekFormData({ ...weekFormData, maxPoints: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Points
                    </label>
                    <input
                      type="number"
                      value={weekFormData.videoPoints}
                      onChange={(e) => setWeekFormData({ ...weekFormData, videoPoints: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignment Points
                    </label>
                    <input
                      type="number"
                      value={weekFormData.assignmentPoints}
                      onChange={(e) => setWeekFormData({ ...weekFormData, assignmentPoints: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowWeekModal(false)}
                  className="btn bg-gray-300 hover:bg-gray-400 text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWeek}
                  className="btn btn-primary"
                >
                  {editingWeek ? 'Update Week' : 'Create Week'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminCourseMap
