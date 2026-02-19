import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'
import {
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  DocumentTextIcon,
  PlayIcon,
  LockClosedIcon,
  CheckCircleIcon,
  BookOpenIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  useEffect(() => {
    loadDashboard()
    loadSavedNotes()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await studentAPI.getDashboard()
      setDashboardData(response.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadSavedNotes = async () => {
    try {
      const response = await studentAPI.getStudentNotes()
      if (response.data && response.data.notes) {
        setNotes(response.data.notes)
      }
      if (response.data && response.data.files) {
        setUploadedFiles(response.data.files)
      }
    } catch (error) {
      console.error('Failed to load saved notes:', error)
      // Don't show error for notes loading as it's not critical
    }
  }

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return
    }
    
    try {
      await studentAPI.deleteSubmission(submissionId)
      toast.success('Submission deleted successfully')
      loadDashboard() // Reload to update the list
    } catch (error) {
      console.error('Failed to delete submission:', error)
      toast.error('Failed to delete submission')
    }
  }

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true)
      await studentAPI.saveStudentNotes(notes)
      toast.success('Notes saved successfully!')
    } catch (error) {
      console.error('Failed to save notes:', error)
      toast.error('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleFileUpload = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      await studentAPI.uploadStudentFiles(formData)
      toast.success('Files uploaded successfully!')
      
      // Reload uploaded files
      loadSavedNotes()
    } catch (error) {
      console.error('Failed to upload files:', error)
      toast.error('Failed to upload files')
    }
    
    // Reset file input
    event.target.value = ''
  }

  if (loading) {
    return (
      <Layout title="Dashboard">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </Layout>
    )
  }

  if (!dashboardData) {
    return (
      <Layout title="Dashboard">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </Layout>
    )
  }

  const { user, phases, currentWeek, overallProgress, completedWeeks, totalWeeks, recentSubmissions, certificate, stats } = dashboardData

  const getPhaseColor = (phaseNumber) => {
    switch (phaseNumber) {
      case 1: return 'success'
      case 2: return 'warning'
      case 3: return 'primary'
      default: return 'primary'
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

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-sm sm:text-base lg:text-xl font-bold mb-1 sm:mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-primary-100 text-[10px] sm:text-xs mb-2 sm:mb-4">
                Continue your Flutter learning journey
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 sm:space-x-6 text-xs sm:text-sm">
                <div className="flex items-center">
                  <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span>{stats.totalPoints} points</span>
                </div>
                <div className="flex items-center">
                  <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span>Phase {stats.currentPhase}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span>Week {stats.currentWeek}</span>
                </div>
              </div>
            </div>
            <div className="text-right mt-2 sm:mt-0">
              <div className="text-2xl sm:text-3xl font-bold mb-1">{overallProgress}%</div>
              <div className="text-primary-200 text-xs sm:text-sm">Overall Progress</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-primary-100 rounded-lg">
                <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-[10px] sm:text-xs text-gray-600">Current Phase</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{stats.currentPhase}</p>
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-success-100 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-success-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-[10px] sm:text-xs text-gray-600">Completed</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{completedWeeks}/{totalWeeks}</p>
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-warning-100 rounded-lg">
                <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-warning-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-[10px] sm:text-xs text-gray-600">Total Points</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">{stats.totalPoints}</p>
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-3 lg:ml-4">
                <p className="text-[10px] sm:text-xs text-gray-600">Certificate</p>
                <p className="text-sm sm:text-base font-bold text-gray-900">
                  {certificate ? '✅ Earned' : '⏳ In Progress'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Phases Overview */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Course Phases</h2>
            <div className="space-y-3 sm:space-y-4">
              {phases.map((phase) => {
                const completedPhaseWeeks = phase.weeks.filter(week => 
                  week.progress?.[0]?.completed
                ).length
                const totalPhaseWeeks = phase.weeks.length
                const phaseProgress = totalPhaseWeeks > 0 ? (completedPhaseWeeks / totalPhaseWeeks) * 100 : 0
                const isCurrentPhase = phase.number === stats.currentPhase
                const isCompleted = completedPhaseWeeks === totalPhaseWeeks
                const isLocked = phase.number > stats.currentPhase

                return (
                  <div 
                    key={phase.id}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      isCurrentPhase 
                        ? 'border-primary-300 bg-primary-50' 
                        : isCompleted
                        ? 'border-success-300 bg-success-50'
                        : isLocked
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="text-lg sm:text-xl mr-1 sm:mr-2 flex-shrink-0">{getPhaseIcon(phase.number)}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                            Phase {phase.number}: {phase.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                            Weeks {phase.startWeek}-{phase.endWeek}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center flex-shrink-0 ml-2">
                        {isLocked && <LockClosedIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1" />}
                        {isCompleted && <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-success-500 mr-1" />}
                        <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          {Math.round(phaseProgress)}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar 
                      progress={phaseProgress} 
                      color={getPhaseColor(phase.number)}
                      showPercentage={false}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {completedPhaseWeeks} of {totalPhaseWeeks} weeks completed
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Recent Submissions</h2>
            {recentSubmissions && recentSubmissions.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentSubmissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="flex flex-col space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                          Week {submission.week.weekNumber}: {submission.week.title}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-600">
                          Submitted {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          submission.status === 'approved' 
                            ? 'bg-success-100 text-success-800'
                            : submission.status === 'reviewed'
                            ? 'bg-primary-100 text-primary-800'
                            : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}>
                          {submission.status}
                        </div>
                        {submission.score !== null && (
                          <p className="text-xs font-medium text-gray-900">
                            {submission.score}/100
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`/week/${submission.week.id}`}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteSubmission(submission.id)}
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {recentSubmissions.length > 5 && (
                  <div className="text-center py-2 sm:py-3">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Showing 5 of {recentSubmissions.length} submissions
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <DocumentTextIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500">No submissions yet</p>
                <p className="text-xs sm:text-sm text-gray-400">Complete your first assignment to see it here</p>
              </div>
            )}
          </div>

          {/* Quick Notes Section */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Quick Notes</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2 sm:mb-3">
                  <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-1 sm:mr-2" />
                  <h3 className="text-xs sm:text-sm font-semibold text-blue-900">Study Notes</h3>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your study notes here..."
                  className="w-full px-2 sm:px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <div className="mt-2 sm:mt-3 flex items-center justify-between">
                  <span className="text-xs text-blue-600">Auto-saved notes</span>
                  <button 
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="text-xs bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2 sm:mb-3">
                  <CloudArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-1 sm:mr-2" />
                  <h3 className="text-xs sm:text-sm font-semibold text-green-900">Upload PDF/Files</h3>
                </div>
                <label className="flex items-center justify-center w-full px-2 sm:px-4 py-4 sm:py-6 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                  <div className="text-center">
                    <CloudArrowUpIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-1 sm:mb-2" />
                    <p className="text-[10px] sm:text-xs text-green-700">Click to upload PDF or files</p>
                    <p className="text-[9px] sm:text-xs text-green-600">PDF, DOC, DOCX, TXT (max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2 sm:mb-3">
                  <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-1 sm:mr-2" />
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-900">Recent Files</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-sm text-purple-700 text-center py-3 sm:py-4">
                    <DocumentTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300 mx-auto mb-1 sm:mb-2" />
                    <p>No files uploaded yet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Section */}
        {certificate && (
          <div className="card p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-yellow-200 rounded-lg">
                  <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-3">
                  <h3 className="text-xs sm:text-sm font-bold text-yellow-900">
                    🎉 Congratulations! You've earned your certificate!
                  </h3>
                  <p className="text-[9px] sm:text-xs text-yellow-700">
                    You've successfully completed the Flutter Learning Course
                  </p>
                </div>
              </div>
              <a
                href={`/certificates/${certificate.filePath.split('/').pop()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-yellow-600 text-white hover:bg-yellow-700 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2"
              >
                Download Certificate
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard