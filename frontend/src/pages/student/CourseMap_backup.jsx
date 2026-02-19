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
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Flutter Learning Course</h1>
              <p className="text-blue-100 mb-2">
                Complete 26 weeks of Flutter development training
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <AcademicCapIcon className="w-5 h-5 mr-2" />
                  <span>3 Phases</span>
                </div>
                <div className="flex items-center">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  <span>Current: Phase {stats?.currentPhase || 1}, Week {stats?.currentWeek || 1}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCheckUnlock}
              disabled={checkingProgress}
              className="btn bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingProgress ? 'Checking...' : 'Check Progress'}
            </button>
          </div>
        </div>

        {/* All Phases */}
        <div className="space-y-6">
          {data?.phases?.map((phase) => {
            const isUnlocked = isPhaseUnlocked(phase.number);
            const phaseWeeks = getPhaseWeeks(phase.number);
            const progress = getPhaseProgress(phase.number);
            
            return (
              <div key={phase.id} className="card p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {getPhaseIcon(phase.number)} Phase {phase.number}: {phase.title}
                    </h2>
                    {isUnlocked ? (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircleIcon className="w-5 h-5 mr-1" />
                        <span>Unlocked</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-400">
                        <LockClosedIcon className="w-5 h-5 mr-1" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">
                    Weeks {phase.startWeek}-{phase.endWeek}
                  </p>
                  {isUnlocked && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {isUnlocked && phaseWeeks.length > 0 ? (
                  <div className="space-y-4">
                    {phaseWeeks.map((week) => {
                      const isExpanded = expandedWeeks.has(week.id);
                      const content = weekContent[week.id];
                      const progress = week.progress && week.progress.length > 0 ? week.progress[0] : null;

                      return (
                        <div key={week.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Week {week.weekNumber}: {week.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>{week.maxPoints} pts total</span>
                                {progress && (
                                  <span className="text-green-600">
                                    {progress.points} pts earned
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {progress && progress.completed && (
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                              )}
                              <button
                                onClick={() => toggleWeekExpansion(week.id)}
                                className="btn btn-sm btn-primary"
                              >
                                {isExpanded ? 'Collapse' : 'Open Week'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && content && (
                            <div className="space-y-4 mt-4">
                              {/* Notes Section */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <BookOpenIcon className="w-5 h-5 text-blue-600 mr-2" />
                                  <h4 className="font-semibold text-blue-900">Notes</h4>
                                </div>
                                
                                {content.notes ? (
                                  <div className="space-y-2">
                                    <p className="text-xs text-blue-700 line-clamp-3">
                                      {content.notes.substring(0, 150)}...
                                    </p>
                                    <Link
                                      to={`/week/${week.id}`}
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                      Read More
                                    </Link>
                                  </div>
                                ) : (
                                  <p className="text-xs text-blue-700">No notes</p>
                                )}
                              </div>

                              {/* Video Lessons Section */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <VideoCameraIcon className="w-5 h-5 text-green-600 mr-2" />
                                  <h4 className="font-semibold text-green-900">Video Lessons</h4>
                                </div>
                                
                                <div className="space-y-2">
                                  {content?.video1Url && (
                                    <div className="text-xs text-green-700">
                                      <p className="font-medium">Video 1: {content.video1Title || 'Available'}</p>
                                      <p>Duration: {Math.floor((content.video1Duration || 0) / 60)} min</p>
                                    </div>
                                  )}
                                  {content?.video2Url && (
                                    <div className="text-xs text-green-700">
                                      <p className="font-medium">Video 2: {content.video2Title || 'Available'}</p>
                                      <p>Duration: {Math.floor((content.video2Duration || 0) / 60)} min</p>
                                    </div>
                                  )}
                                  {!content?.video1Url && !content?.video2Url && (
                                    <p className="text-xs text-green-700">No videos available</p>
                                  )}
                                  <Link
                                    to={`/week/${week.id}`}
                                    className="text-xs text-green-600 hover:text-green-800 flex items-center"
                                  >
                                    Watch Videos
                                  </Link>
                                </div>
                              </div>

                              {/* Quiz Section */}
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <AcademicCapIcon className="w-5 h-5 text-yellow-600 mr-2" />
                                  <h4 className="font-semibold text-yellow-900">Quiz</h4>
                                </div>
                                
                                {content?.multipleChoiceQuestions && content.multipleChoiceQuestions.length > 0 ? (
                                  <div className="space-y-2">
                                    <p className="text-xs text-yellow-700">
                                      {content.multipleChoiceQuestions.length} questions available
                                    </p>
                                    <Link
                                      to={`/week/${week.id}`}
                                      className="text-xs text-yellow-600 hover:text-yellow-800 flex items-center"
                                    >
                                      Take Quiz
                                    </Link>
                                  </div>
                                ) : (
                                  <p className="text-xs text-yellow-700">No quiz available</p>
                                )}
                              </div>

                              {/* Assignment Section */}
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <div className="flex items-center mb-2">
                                  <ClipboardDocumentListIcon className="w-5 h-5 text-orange-600 mr-2" />
                                  <h4 className="font-semibold text-orange-900">Assignment</h4>
                                </div>
                                
                                {content?.assignmentDescription ? (
                                  <div className="space-y-2">
                                    <p className="text-xs text-orange-700 line-clamp-3">
                                      {content.assignmentDescription.substring(0, 150)}...
                                    </p>
                                    {content.assignmentDeadline && (
                                      <p className="text-xs text-orange-600">
                                        Due: {new Date(content.assignmentDeadline).toLocaleDateString()}
                                      </p>
                                    )}
                                    <Link
                                      to={`/week/${week.id}`}
                                      className="text-xs text-orange-600 hover:text-orange-800 flex items-center"
                                    >
                                      View Assignment
                                    </Link>
                                  </div>
                                ) : (
                                  <p className="text-xs text-orange-700">No assignment</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <LockClosedIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>
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
