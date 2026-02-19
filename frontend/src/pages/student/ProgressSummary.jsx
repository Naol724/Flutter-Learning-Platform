import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'
import {
  CheckCircleIcon,
  LockClosedIcon,
  PlayIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const ProgressSummary = () => {
  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgressSummary()
  }, [])

  const loadProgressSummary = async () => {
    try {
      const response = await studentAPI.getProgressSummary()
      setProgressData(response.data)
    } catch (error) {
      console.error('Failed to load progress summary:', error)
      toast.error('Failed to load progress summary')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCertificate = async () => {
    try {
      const response = await studentAPI.getCertificate()
      if (response.data && response.data.certificateUrl) {
        // Create download link
        const link = document.createElement('a')
        link.href = response.data.certificateUrl
        link.download = 'flutter-certificate.pdf'
        link.click()
        toast.success('Certificate downloaded successfully!')
      } else {
        toast.error('Certificate not available. Complete all phases to earn your certificate.')
      }
    } catch (error) {
      console.error('Failed to download certificate:', error)
      toast.error('Failed to download certificate')
    }
  }

  if (loading) {
    return (
      <Layout title="Progress Summary">
        <LoadingSpinner size="lg" text="Loading your progress..." />
      </Layout>
    )
  }

  if (!progressData) {
    return (
      <Layout title="Progress Summary">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load progress data</p>
        </div>
      </Layout>
    )
  }

  const { progressSummary } = progressData

  const getPhaseIcon = (phaseNumber) => {
    switch (phaseNumber) {
      case 1: return '🌱'
      case 2: return '🚀'
      case 3: return '🎯'
      default: return '📚'
    }
  }

  const getPhaseColorClass = (phaseNumber) => {
    switch (phaseNumber) {
      case 1: return 'phase-foundation'
      case 2: return 'phase-intermediate'
      case 3: return 'phase-advanced'
      default: return 'phase-foundation'
    }
  }

  const overallStats = progressSummary.reduce(
    (acc, phase) => ({
      totalWeeks: acc.totalWeeks + phase.totalWeeks,
      completedWeeks: acc.completedWeeks + phase.completedWeeks,
      totalPoints: acc.totalPoints + phase.totalPossiblePoints,
      earnedPoints: acc.earnedPoints + phase.earnedPoints
    }),
    { totalWeeks: 0, completedWeeks: 0, totalPoints: 0, earnedPoints: 0 }
  )

  const overallProgress = overallStats.totalPoints > 0 
    ? Math.round((overallStats.earnedPoints / overallStats.totalPoints) * 100) 
    : 0

  const isCourseCompleted = progressSummary.every(p => p.isCompleted)

  return (
    <Layout title="Progress Summary">
      <div className="space-y-6">
        {/* Overall Progress Card */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">Your Learning Progress</h1>
              <p className="text-primary-100 text-xs sm:text-sm mb-2 sm:mb-4">
                Track your journey through the Flutter course
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">{overallStats.completedWeeks}</div>
                  <div className="text-primary-200 text-[10px] sm:text-xs">Weeks Completed</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">{overallStats.totalWeeks}</div>
                  <div className="text-primary-200 text-[10px] sm:text-xs">Total Weeks</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">{overallStats.earnedPoints}</div>
                  <div className="text-primary-200 text-[10px] sm:text-xs">Points Earned</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold">{overallProgress}%</div>
                  <div className="text-primary-200 text-[10px] sm:text-xs">Overall Progress</div>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <TrophyIcon className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-primary-200" />
            </div>
          </div>
          
          <div className="mt-6">
            <ProgressBar 
              progress={overallProgress} 
              color="warning"
              className="bg-primary-400"
            />
          </div>
        </div>

        {/* Phase Progress */}
        <div className="space-y-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Phase Progress</h2>
          
          {progressSummary.map((phase, index) => (
            <div key={phase.phase.id} className="card p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`p-2 sm:p-3 lg:p-4 rounded-xl flex-shrink-0 ${getPhaseColorClass(phase.phase.number)} border-2`}>
                    <span className="text-lg sm:text-xl lg:text-3xl">{getPhaseIcon(phase.phase.number)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base lg:text-xl font-bold text-gray-900 truncate">
                      Phase {phase.phase.number}: {phase.phase.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {phase.completedWeeks} of {phase.totalWeeks} weeks completed
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {phase.isCompleted ? (
                        <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-success-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2" />
                      )}
                      <span className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900">
                        {phase.progressPercentage}%
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {phase.earnedPoints}/{phase.totalPossiblePoints} points
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <ProgressBar 
                  progress={phase.progressPercentage} 
                  color={phase.phase.number === 1 ? 'success' : phase.phase.number === 2 ? 'warning' : 'primary'}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                    phase.isCompleted 
                      ? 'bg-success-100 text-success-800'
                      : phase.progressPercentage > 0
                      ? 'bg-warning-100 text-warning-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {phase.isCompleted ? 'Completed' : phase.progressPercentage > 0 ? 'In Progress' : 'Not Started'}
                  </span>
                  
                  {phase.progressPercentage >= 80 && !phase.isCompleted && (
                    <span className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800">
                      Awaiting Admin Approval
                    </span>
                  )}
                </div>
                
                <div className="text-[10px] sm:text-xs text-gray-600">
                  Required: {phase.phase.number === 1 ? 80 : phase.phase.number === 2 ? 80 : 80}% to complete
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card p-3 sm:p-4 lg:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Link
              to="/dashboard"
              className="flex items-center p-3 sm:p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <PlayIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mr-2 sm:mr-3" />
              <div>
                <div className="font-medium text-primary-900 text-sm sm:text-base">Continue Learning</div>
                <div className="text-xs sm:text-sm text-primary-600">Go to your dashboard</div>
              </div>
            </Link>
            
            <button
              onClick={handleViewCertificate}
              disabled={!isCourseCompleted}
              className={`flex items-center p-3 sm:p-4 rounded-lg transition-colors ${
                isCourseCompleted 
                  ? 'bg-success-50 hover:bg-success-100 text-success-700' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <TrophyIcon className={`w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 ${
                isCourseCompleted ? 'text-success-600' : 'text-gray-400'
              }`} />
              <div>
                <div className="font-medium text-sm sm:text-base">
                  {isCourseCompleted ? 'Download Certificate' : 'Certificate Locked'}
                </div>
                <div className="text-xs sm:text-sm">
                  {isCourseCompleted ? 'Get your certificate' : 'Complete course to unlock'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ProgressSummary
