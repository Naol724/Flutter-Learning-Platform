import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  LockClosedIcon,
  DocumentTextIcon,
  BookOpenIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

const AdminCourseMap = () => {
  const [phases, setPhases] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState(new Set())

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Map</h1>
              <p className="text-gray-600">Manage your Flutter course structure</p>
            </div>
            {stats && (
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                  <div className="text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</div>
                  <div className="text-gray-500">Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</div>
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
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePhaseExpansion(phase.id)}
                >
                  <div className="flex items-center flex-1">
                    <div className="text-3xl mr-3">{getPhaseIcon(phase.number)}</div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Phase {phase.number}: {phase.title}
                      </h2>
                      <p className="text-gray-600">
                        Weeks {phase.startWeek}-{phase.endWeek}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <LockClosedIcon className="w-4 h-4 mr-1" />
                      <span>Next phase unlocks only after admin approval</span>
                    </div>
                    <div className="ml-2">
                      {isExpanded ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    {(phase.weeks || [])
                      .slice()
                      .sort((a, b) => a.weekNumber - b.weekNumber)
                      .map((week) => (
                        <div
                          key={week.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Week Header */}
                          <div className="bg-gray-50 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="font-bold text-lg text-gray-900">
                                    Week {week.weekNumber}: {week.title}
                                  </span>
                                  {week.content?.isPublished && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-success-100 text-success-800">
                                      Published
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Link
                                  to={`/admin/content/weeks/${week.id}/content`}
                                  className="btn btn-primary flex items-center text-sm"
                                >
                                  <EyeIcon className="w-4 h-4 mr-1" />
                                  Manage Content
                                </Link>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{week.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{week.maxPoints} pts total</span>
                              <span>{week.videoPoints} video pts</span>
                              <span>{week.assignmentPoints} assignment pts</span>
                            </div>
                          </div>

                          {/* Content Status */}
                          <div className="bg-white border-t border-gray-200 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                              {/* Instructions Status */}
                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <DocumentTextIcon className="w-5 h-5 text-indigo-600 mr-2" />
                                  <h4 className="font-semibold text-indigo-900">Instructions</h4>
                                </div>
                                <p className="text-xs text-indigo-700 mb-3">
                                  {week.content?.instructions ? 'Instructions added' : 'No instructions yet'}
                                </p>
                              </div>

                              {/* Weekly Notes Status */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <BookOpenIcon className="w-5 h-5 text-blue-600 mr-2" />
                                  <h4 className="font-semibold text-blue-900">Weekly Notes</h4>
                                </div>
                                <p className="text-xs text-blue-700 mb-3">
                                  {week.content?.notes ? 'Notes added' : 'No notes yet'}
                                </p>
                              </div>

                              {/* Video Lessons Status */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <VideoCameraIcon className="w-5 h-5 text-green-600 mr-2" />
                                  <h4 className="font-semibold text-green-900">Video Lessons</h4>
                                </div>
                                <p className="text-xs text-green-700 mb-3">
                                  {week.content?.video1Url || week.content?.video2Url ? 
                                    `${(week.content?.video1Url ? 1 : 0) + (week.content?.video2Url ? 1 : 0)} videos added` : 
                                    'No videos yet'
                                  }
                                </p>
                              </div>

                              {/* Quiz Status */}
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <AcademicCapIcon className="w-5 h-5 text-yellow-600 mr-2" />
                                  <h4 className="font-semibold text-yellow-900">Quiz</h4>
                                </div>
                                <p className="text-xs text-yellow-700 mb-3">
                                  {week.content?.multipleChoiceQuestions && week.content.multipleChoiceQuestions.length > 0 ? 
                                    `${week.content.multipleChoiceQuestions.length} questions added` : 
                                    'No quiz yet'
                                  }
                                </p>
                              </div>

                              {/* Assignment Status */}
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <ClipboardDocumentListIcon className="w-5 h-5 text-orange-600 mr-2" />
                                  <h4 className="font-semibold text-orange-900">Assignment</h4>
                                </div>
                                <p className="text-xs text-orange-700 mb-3">
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
      </div>
    </Layout>
  )
}

export default AdminCourseMap
