import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { studentAPI, progressAPI } from '../../services/api'
import {
  AcademicCapIcon,
  LockClosedIcon,
  CheckCircleIcon,
  PlayIcon,
  BookOpenIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ClipboardDocumentListIcon,
  FolderOpenIcon,
  PlusIcon,
  CloudArrowUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CourseMap = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingProgress, setCheckingProgress] = useState(false)
  const [expandedWeeks, setExpandedWeeks] = useState(new Set())
  const [weekContent, setWeekContent] = useState({})
  const [studentNotes, setStudentNotes] = useState({})

  const toggleWeekExpansion = (weekId) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekId)) {
      newExpanded.delete(weekId)
    } else {
      newExpanded.add(weekId)
      // Load week content when expanding
      loadWeekContent(weekId)
    }
    setExpandedWeeks(newExpanded)
  }

  const loadWeekContent = async (weekId) => {
    try {
      const response = await studentAPI.getWeekDetails(weekId)
      setWeekContent(prev => ({
        ...prev,
        [weekId]: response.data.week
      }))
    } catch (error) {
      console.error('Failed to load week content:', error)
    }
  }

  const handleNoteUpload = async (weekId, event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('notesFile', file)
      
      await studentAPI.submitAssignment(weekId, formData)
      toast.success('Note file uploaded successfully')
      
      // Reload week content
      await loadWeekContent(weekId)
    } catch (error) {
      toast.error('Failed to upload note file')
    }
  }

  const handleNoteTextUpdate = async (weekId, text) => {
    try {
      await studentAPI.updateNotes(weekId, { notes: text })
      toast.success('Notes saved successfully')
      
      setStudentNotes(prev => ({
        ...prev,
        [weekId]: text
      }))
    } catch (error) {
      toast.error('Failed to save notes')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await studentAPI.getDashboard()
      setData(response.data)
    } catch (error) {
      console.error('Failed to load course map:', error)
      toast.error('Failed to load course map')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckUnlock = async () => {
    try {
      setCheckingProgress(true)
      const response = await progressAPI.checkUnlock()
      if (response.data?.message) {
        toast.success(response.data.message)
      }
      if (response.data?.needsApproval) {
        toast(
          `Phase completed with ${response.data.progressPercentage}%. Waiting for admin approval.`,
        )
      }
      await loadData()
    } catch (error) {
      console.error('Failed to check progress:', error)
      toast.error('Failed to check progress for unlocks')
    } finally {
      setCheckingProgress(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Course Map">
        <LoadingSpinner size="lg" text="Loading course map..." />
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout title="Course Map">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load course map</p>
        </div>
      </Layout>
    )
  }

  const { phases, stats } = data

  const getPhaseIcon = (phaseNumber) => {
    switch (phaseNumber) {
      case 1:
        return '🌱'
      case 2:
        return '🚀'
      case 3:
        return '🎯'
      default:
        return '📚'
    }
  }

  return (
    <Layout title="Phase 1 - Foundation">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Phase 1: Foundation</h1>
              <p className="text-green-100 mb-2">
                Flutter setup + Dart basics, widgets, layouts, forms, state management, packages, mini-projects
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  <span>Weeks 1-8</span>
                </div>
                <div className="flex items-center">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  <span>Current: Week {stats.currentWeek}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCheckUnlock}
              disabled={checkingProgress}
              className="btn bg-white text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingProgress ? 'Checking...' : 'Check Progress'}
            </button>
          </div>
        </div>

        {/* Phase 1 Weeks */}
        <div className="space-y-4">
          {phases
            .filter(phase => phase.number === 1)
            .map((phase) => (
              <div key={phase.id} className="card p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    🌱 Foundation Weeks (1-8)
                  </h2>
                  <p className="text-gray-600">
                    Master the fundamentals of Flutter and Dart programming
                  </p>
                </div>

                <div className="space-y-4">
                  {phase.weeks
                    .slice()
                    .sort((a, b) => a.weekNumber - b.weekNumber)
                    .map((week) => {
                      const progress = week.progress?.[0]
                      const isLockedWeek = progress?.isLocked ?? true
                      const canAccess = !isLockedWeek
                      const content = weekContent[week.id]
                      const isExpanded = expandedWeeks.has(week.id)

                      return (
                        <div
                          key={week.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Week Header */}
                          <div className="bg-gray-50 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => canAccess && toggleWeekExpansion(week.id)}
                                    className={`flex items-center text-left ${canAccess ? 'hover:text-green-600' : 'text-gray-400'} transition-colors`}
                                    disabled={!canAccess}
                                  >
                                    <span className={`font-bold text-lg ${canAccess ? 'text-gray-900' : 'text-gray-400'}`}>
                                      Week {week.weekNumber}: {week.title}
                                    </span>
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">
                      {phase.number === 2 ? '🚀' : '🎯'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-700">
                        Phase {phase.number}: {phase.title}
                      </h3>
                      <p className="text-gray-500">
                        Weeks {phase.startWeek}-{phase.endWeek} • Complete Phase 1 to unlock
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <LockClosedIcon className="w-5 h-5 mr-1" />
                    <span>Locked</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  )
}

export default CourseMap

