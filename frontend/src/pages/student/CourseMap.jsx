import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'
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
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CourseMap = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingProgress, setCheckingProgress] = useState(false)
  const [expandedPhases, setExpandedPhases] = useState(new Set())

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
    setCheckingProgress(true)
    try {
      // Check and unlock progress
      const response = await progressAPI.checkUnlock()
      
      if (response.data?.message) {
        toast.success(response.data.message)
      }
      if (response.data?.needsApproval) {
        toast(
          `Phase completed with ${response.data.progressPercentage}%. Waiting for admin approval.`,
        )
      }
      
      // Reload dashboard data to show updated progress
      await loadData()
    } catch (error) {
      console.error('Progress check error:', error)
      toast.error('Failed to check progress')
    } finally {
      setCheckingProgress(false)
    }
  }

  const togglePhaseExpansion = (phaseId) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId)
      } else {
        newSet.add(phaseId)
      }
      return newSet
    })
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

  const getPhaseColor = (phaseNumber) => {
    switch (phaseNumber) {
      case 1: return 'success'
      case 2: return 'warning'
      case 3: return 'primary'
      default: return 'primary'
    }
  }

  // Check if a phase is unlocked based on user progress
  const isPhaseUnlocked = (phaseNumber) => {
    if (!data?.user) return false;
    
    // Phase 1 is always unlocked
    if (phaseNumber === 1) return true;
    
    // For other phases, check if user completed previous phases
    const userCurrentPhase = data.user.currentPhase;
    return phaseNumber <= userCurrentPhase;
  }

  // Get phase weeks based on phase number
  const getPhaseWeeks = (phaseNumber) => {
    if (!data?.phases) return [];
    
    const phase = data.phases.find(p => p.number === phaseNumber);
    return phase ? phase.weeks : [];
  }

  // Get phase progress percentage
  const getPhaseProgress = (phaseNumber) => {
    if (!data?.phases) return 0;
    
    const phase = data.phases.find(p => p.number === phaseNumber);
    if (!phase || !phase.weeks) return 0;
    
    const totalWeeks = phase.weeks.length;
    const completedWeeks = phase.weeks.filter(week => 
      week.progress && week.progress.length > 0 && week.progress[0].completed
    ).length;
    
    return totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
  }

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
    <Layout title="Course Map">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">Flutter Learning Course</h1>
              <p className="text-blue-100 text-xs sm:text-sm mb-2 sm:mb-4">
                Complete 26 weeks of Flutter development training
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center">
                  <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span>3 Phases</span>
                </div>
                <div className="flex items-center">
                  <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span>Current: Phase {stats?.currentPhase || 1}, Week {stats?.currentWeek || 1}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCheckUnlock}
              disabled={checkingProgress}
              className="btn bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2"
            >
              {checkingProgress ? 'Checking...' : 'Check Progress'}
            </button>
          </div>
        </div>

        {/* All Phases */}
        <div className="space-y-6">
          {data?.phases?.map((phase) => {
            const isUnlocked = isPhaseUnlocked(phase.number)
            const isExpanded = expandedPhases.has(phase.id)
            const phaseWeeks = getPhaseWeeks(phase.number)
            const progress = getPhaseProgress(phase.number)
            
            return (
              <div key={phase.id} className="card p-6">
                <div 
                  className="mb-4 sm:mb-6 cursor-pointer hover:bg-gray-50 p-2 sm:p-3 sm:p-6 rounded-lg transition-colors"
                  onClick={() => togglePhaseExpansion(phase.id)}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                      {getPhaseIcon(phase.number)} Phase {phase.number}: {phase.title}
                    </h2>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {isUnlocked ? (
                        <div className="flex items-center text-xs sm:text-sm text-green-600">
                          <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                          <span className="hidden sm:inline">Unlocked</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs sm:text-sm text-gray-400">
                          <LockClosedIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                          <span className="hidden sm:inline">Locked</span>
                        </div>
                      )}
                      <div className="ml-1 sm:ml-2">
                        {isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">
                    Weeks {phase.startWeek}-{phase.endWeek}
                  </p>
                  {isUnlocked && (
                    <div className="w-full bg-gray-200 rounded-full h-1 sm:h-2">
                      <div 
                        className="bg-blue-600 h-1 sm:h-2 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {isExpanded && isUnlocked && phaseWeeks.length > 0 ? (
                  <div className="space-y-4">
                    {phaseWeeks.map((week) => {
                      const progress = week.progress && week.progress.length > 0 ? week.progress[0] : null;

                      return (
                        <div key={week.id} className="card p-3 sm:p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-4">
                                Week {week.weekNumber}: {week.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 truncate">{week.description}</p>
                              
                              {progress && (
                                <div className="mb-3 sm:mb-4">
                                  <ProgressBar 
                                    progress={progress.points} 
                                    className="mb-2"
                                    color={getPhaseColor(phase.number)}
                                  />
                                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                                    <span>Progress: {progress.points}/100 points</span>
                                    <span>
                                      {progress.videoWatched ? '✅ Video' : '⏳ Video'} | 
                                      {progress.assignmentSubmitted ? ' ✅ Assignment' : ' ⏳ Assignment'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-0 sm:ml-6">
                              <Link
                                to={`/week/${week.id}`}
                                className="btn btn-primary flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                              >
                                <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Continue</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <LockClosedIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm">
                      {phase.number === 1 
                        ? "Start with Week 1 below" 
                        : `Complete Phase ${phase.number - 1} to unlock this phase`
                      }
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  )
}

export default CourseMap
