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
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Your Learning Progress</h1>
              <p className="text-primary-100 mb-4">
                Track your journey through the Flutter course
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold">{overallStats.completedWeeks}</div>
                  <div className="text-primary-200">Weeks Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{overallStats.totalWeeks}</div>
                  <div className="text-primary-200">Total Weeks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{overallStats.earnedPoints}</div>
                  <div className="text-primary-200">Points Earned</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{overallProgress}%</div>
                  <div className="text-primary-200">Overall Progress</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <TrophyIcon className="w-24 h-24 text-primary-200" />
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
          <h2 className="text-2xl font-bold text-gray-900">Phase Progress</h2>
          
          {progressSummary.map((phase, index) => (
            <div key={phase.phase.id} className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className={`p-4 rounded-xl mr-4 ${getPhaseColorClass(phase.phase.number)} border-2`}>
                    <span className="text-3xl">{getPhaseIcon(phase.phase.number)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Phase {phase.phase.number}: {phase.phase.title}
                    </h3>
                    <p className="text-gray-600">
                      {phase.completedWeeks} of {phase.totalWeeks} weeks completed
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center mb-2">
                    {phase.isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6 text-success-500 mr-2" />
                    ) : (
                      <div className="w-6 h-6 mr-2" />
                    )}
                    <span className="text-2xl font-bold text-gray-900">
                      {phase.progressPercentage}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {phase.earnedPoints}/{phase.totalPossiblePoints} points
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <ProgressBar 
                  progress={phase.progressPercentage} 
                  color={phase.phase.number === 1 ? 'success' : phase.phase.number === 2 ? 'warning' : 'primary'}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    phase.isCompleted 
                      ? 'bg-success-100 text-success-800'
                      : phase.progressPercentage > 0
                      ? 'bg-warning-100 text-warning-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {phase.isCompleted ? 'Completed' : phase.progressPercentage > 0 ? 'In Progress' : 'Not Started'}
                  </span>
                  
                  {phase.progressPercentage >= 80 && !phase.isCompleted && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Awaiting Admin Approval
                    </span>
                  )}
                </div>
                
                <div className="text-gray-600">
                  Required: {phase.phase.number === 1 ? 80 : phase.phase.number === 2 ? 80 : 80}% to complete
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/dashboard"
              className="flex items-center p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <PlayIcon className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <div className="font-medium text-primary-900">Continue Learning</div>
                <div className="text-sm text-primary-600">Go to your dashboard</div>
              </div>
            </Link>
            
            <button
              onClick={handleViewCertificate}
              disabled={!isCourseCompleted}
              className={`flex items-center p-4 rounded-lg transition-colors ${
                isCourseCompleted 
                  ? 'bg-success-50 hover:bg-success-100 text-success-700' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <TrophyIcon className={`w-8 h-8 mr-3 ${
                isCourseCompleted ? 'text-success-600' : 'text-gray-400'
              }`} />
              <div>
                <div className={`font-medium ${
                  isCourseCompleted ? 'text-success-900' : 'text-gray-900'
                }`}>View Certificate</div>
                <div className={`text-sm ${
                  isCourseCompleted ? 'text-success-600' : 'text-gray-600'
                }`}>
                  {isCourseCompleted 
                    ? 'Download your certificate' 
                    : 'Complete all phases to earn'
                  }
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
