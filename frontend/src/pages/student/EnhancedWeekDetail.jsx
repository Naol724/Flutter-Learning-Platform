import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  PlayIcon, 
  DocumentTextIcon, 
  QuestionMarkCircleIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import ReactPlayer from 'react-player'
import { studentAPI, quizAPI } from '../../services/api'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'

const EnhancedWeekDetail = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)
  const [week, setWeek] = useState(null)
  const [activeTab, setActiveTab] = useState('instructions')
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [expandedQuestions, setExpandedQuestions] = useState({})

  useEffect(() => {
    loadWeekDetails()
    loadQuizResults()
  }, [weekId])

  const loadWeekDetails = async () => {
    try {
      setLoading(true)
      const response = await studentAPI.getWeekDetails(weekId)
      setWeek(response.data.week)
    } catch (error) {
      console.error('Failed to load week details:', error)
      toast.error('Failed to load week details')
    } finally {
      setLoading(false)
    }
  }

  const loadQuizResults = async () => {
    try {
      const response = await quizAPI.getQuizResults(weekId)
      if (response.data.submission) {
        setQuizAnswers(response.data.submission.answers)
      }
    } catch (error) {
      // Quiz not submitted yet, that's okay
    }
  }

  const handleQuizSubmit = async () => {
    try {
      console.log('=== QUIZ SUBMISSION DEBUG ===')
      console.log('Week ID:', weekId)
      console.log('Week data:', week)
      console.log('Content:', week?.content)
      console.log('Quiz answers:', quizAnswers)
      console.log('Quiz answers type:', typeof quizAnswers)
      console.log('Quiz answers keys:', Object.keys(quizAnswers))
      console.log('Quiz answers values:', Object.values(quizAnswers))
      
      // Get questions from content
      const questions = week?.content?.multipleChoiceQuestions || [];
      console.log('Questions:', questions)
      console.log('Questions length:', questions.length)
      
      // Check if quiz has questions
      if (questions.length === 0) {
        toast.error('No quiz questions available for this week');
        return;
      }
      
      // Validate that all questions are answered
      const answeredCount = Object.keys(quizAnswers).length;
      console.log('Answered count:', answeredCount)
      console.log('Required count:', questions.length)
      
      if (answeredCount !== questions.length) {
        toast.error(`Please answer all questions before submitting (${answeredCount}/${questions.length} answered)`);
        return;
      }
      
      // Validate that no answers are undefined
      const unansweredQuestions = questions.filter((_, index) => quizAnswers[index] === undefined);
      if (unansweredQuestions.length > 0) {
        toast.error(`Please answer all questions before submitting (${unansweredQuestions.length} remaining)`);
        return;
      }
      
      console.log('All validations passed, submitting quiz...')
      setSubmittingQuiz(true)
      const response = await quizAPI.submitQuiz(weekId, quizAnswers)
      
      toast.success(`Quiz submitted! Score: ${response.data.score}/${response.data.totalQuestions}`)
      setQuizResults(response.data)
      setQuizSubmitted(true)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      toast.error(error.response?.data?.message || 'Failed to submit quiz')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const handleAnswerChange = (questionIndex, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const toggleQuestionExpansion = (questionIndex) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }))
  }

  const tabs = [
    { id: 'instructions', name: 'Instructions', icon: DocumentTextIcon },
    { id: 'notes', name: 'Weekly Notes', icon: DocumentTextIcon },
    { id: 'videos', name: 'Video Lessons', icon: PlayIcon },
    { id: 'quiz', name: 'Quiz', icon: QuestionMarkCircleIcon },
    { id: 'assignment', name: 'Assignment', icon: ClipboardDocumentCheckIcon }
  ]

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" text="Loading week details..." />
      </Layout>
    )
  }

  if (!week) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Week not found</p>
          <Link to="/dashboard" className="btn btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  const content = week.content
  const progress = week.progress?.[0]

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-secondary flex items-center text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 w-full sm:w-auto justify-center"
              >
                <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Back
              </button>
              <div className="text-center sm:text-left">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
                  Week {week.weekNumber}: {week.title}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{week.description}</p>
              </div>
            </div>
            
            <div className="text-center sm:text-right">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Progress</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {progress?.points || 0}/100
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 sm:space-x-8 px-2 sm:px-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">{tab.name}</span>
                  <span className="xs:hidden text-[10px]">{tab.name.slice(0, 3)}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            {/* Instructions Tab */}
            {activeTab === 'instructions' && (
              <div className="prose max-w-none">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Week Instructions</h3>
                {content?.instructions ? (
                  <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
                    {content.instructions}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm">No instructions available yet.</p>
                )}
              </div>
            )}

            {/* Weekly Notes Tab */}
            {activeTab === 'notes' && (
              <div className="prose max-w-none">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Weekly Learning Notes</h3>
                {content?.notes ? (
                  <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
                    {content.notes}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm">No notes available yet.</p>
                )}
              </div>
            )}

            {/* Video Lessons Tab */}
            {activeTab === 'videos' && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Video Lessons</h3>
                
                {/* Video 1 */}
                {content?.video1Url && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                      {content.video1Title || 'Video Lesson 1'}
                    </h4>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-2 sm:mb-3">
                      <ReactPlayer
                        url={content.video1Url}
                        width="100%"
                        height="100%"
                        controls
                      />
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Duration: {content.video1Duration ? `${Math.round(content.video1Duration / 60)} minutes` : 'Unknown'}
                    </div>
                  </div>
                )}

                {/* Video 2 */}
                {content?.video2Url && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                      {content.video2Title || 'Video Lesson 2'}
                    </h4>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-2 sm:mb-3">
                      <ReactPlayer
                        url={content.video2Url}
                        width="100%"
                        height="100%"
                        controls
                      />
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Duration: {content.video2Duration ? `${Math.round(content.video2Duration / 60)} minutes` : 'Unknown'}
                    </div>
                  </div>
                )}

                {!content?.video1Url && !content?.video2Url && (
                  <p className="text-gray-500 text-xs sm:text-sm">No video lessons available yet.</p>
                )}
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">Multiple Choice Questions</h3>
                  <button
                    onClick={() => {
                      const allExpanded = content?.multipleChoiceQuestions?.reduce((acc, _, index) => {
                        acc[index] = !expandedQuestions[index];
                        return acc;
                      }, {});
                      setExpandedQuestions(allExpanded);
                    }}
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    {Object.values(expandedQuestions).every(Boolean) ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>
                
                {quizSubmitted ? (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-success-800 mb-2 text-sm sm:text-base">Quiz Results</h4>
                    <div className="text-success-700">
                      <p className="text-base sm:text-lg font-semibold">
                        Score: {quizResults.score}/{quizResults.totalQuestions}
                      </p>
                      <p className="text-xs sm:text-sm">
                        Percentage: {Math.round((quizResults.score / quizResults.totalQuestions) * 100)}%
                      </p>
                      <p className="text-[10px] sm:text-xs mt-2">
                        Submitted: {new Date(quizResults.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {content?.multipleChoiceQuestions && content.multipleChoiceQuestions.length > 0 ? (
                      <>
                        {content.multipleChoiceQuestions.map((question, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                            {/* Question Header - Always Visible */}
                            <button
                              onClick={() => toggleQuestionExpansion(index)}
                              className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  quizAnswers[index] !== undefined 
                                    ? 'border-success-500 bg-success-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {quizAnswers[index] !== undefined && (
                                    <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  Q{index + 1}: {question.question.length > 50 ? question.question.substring(0, 50) + '...' : question.question}
                                </span>
                              </div>
                              <svg 
                                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                                  expandedQuestions[index] ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {/* Question Content - Expandable */}
                            {expandedQuestions[index] && (
                              <div className="px-3 pb-3 sm:px-4 sm:pb-4 border-t border-gray-200">
                                <div className="pt-3">
                                  <h4 className="font-semibold text-gray-900 mb-2 text-xs sm:text-sm">
                                    {question.question}
                                  </h4>
                                  <div className="space-y-1 sm:space-y-2">
                                    {question.options.map((option, optIndex) => (
                                      <label key={optIndex} className="flex items-start sm:items-center space-x-2 sm:space-x-3 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors">
                                        <input
                                          type="radio"
                                          name={`question-${index}`}
                                          value={optIndex}
                                          checked={quizAnswers[index] === optIndex}
                                          onChange={() => handleAnswerChange(index, optIndex)}
                                          disabled={quizSubmitted}
                                          className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600 mt-0.5 sm:mt-0 flex-shrink-0"
                                        />
                                        <span className="text-xs sm:text-sm text-gray-700 leading-tight">
                                          {String.fromCharCode(65 + optIndex)}. {option}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                  
                                  {question.explanation && (
                                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded text-xs sm:text-sm text-blue-700">
                                      <strong className="font-semibold">Explanation:</strong> {question.explanation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="mt-4 sm:mt-6">
                          <button
                            onClick={handleQuizSubmit}
                            disabled={submittingQuiz || !week?.content?.multipleChoiceQuestions || Object.keys(quizAnswers).length !== week?.content?.multipleChoiceQuestions?.length}
                            className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 w-full sm:w-auto"
                          >
                            <AcademicCapIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                          </button>
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-2">
                            Please answer all questions before submitting. 
                            {week?.content?.multipleChoiceQuestions && 
                              ` (${Object.keys(quizAnswers).length}/${week?.content?.multipleChoiceQuestions.length} answered)`
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">No quiz questions available yet.</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Assignment Tab */}
            {activeTab === 'assignment' && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Assignment</h3>
                
                {content?.assignmentDescription ? (
                  <>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                      <div className="whitespace-pre-wrap text-gray-700 text-xs sm:text-sm">
                        {content.assignmentDescription}
                      </div>
                    </div>

                    {content?.assignmentDeadline && (
                      <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-warning-600 mr-2" />
                          <span className="text-warning-800 font-medium text-xs sm:text-sm">
                            Deadline: {new Date(content.assignmentDeadline).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {content?.assignmentGradingCriteria && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                        <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Grading Criteria</h4>
                        <div className="whitespace-pre-wrap text-blue-700 text-xs sm:text-sm">
                          {content.assignmentGradingCriteria}
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <Link
                        to={`/week/${weekId}/submit-assignment`}
                        className="btn btn-primary text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 w-full sm:w-auto"
                      >
                        Submit Assignment
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm">No assignment available yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EnhancedWeekDetail
