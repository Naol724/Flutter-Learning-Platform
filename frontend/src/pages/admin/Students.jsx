import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import Layout from '../../components/Layout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ProgressBar from '../../components/ProgressBar'
import {
  MagnifyingGlassIcon,
  UserIcon,
  TrophyIcon,
  AcademicCapIcon,
  UserPlusIcon,
  TrashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showStudentsList, setShowStudentsList] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [currentPage, searchTerm])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getStudents({
        page: currentPage,
        limit: 20,
        search: searchTerm
      })
      setStudents(response.data.students)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      const action = isActive ? 'enable' : 'disable'
      const confirmed = window.confirm(`Are you sure you want to ${action} this user?`)
      
      if (!confirmed) return
      
      await adminAPI.toggleUserStatus(userId, isActive)
      toast.success(`User ${action}d successfully`)
      loadStudents() // Reload students list
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      toast.error(error.response?.data?.message || 'Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)
      
      if (!confirmed) return
      
      await adminAPI.deleteUser(userId)
      toast.success('User deleted successfully')
      loadStudents() // Reload students list
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <Layout title="Students">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage and monitor student progress</p>
          </div>
        </div>

        {/* Search */}
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              className="input pl-8 sm:pl-10 text-sm sm:text-base"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Students List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Students List</h2>
              <button
                onClick={() => setShowStudentsList(!showStudentsList)}
                className="ml-4 p-1 rounded hover:bg-gray-100 transition-colors"
                title={showStudentsList ? "Collapse" : "Expand"}
              >
                {showStudentsList ? (
                  <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
          
          {showStudentsList && (
            <>
              {loading ? (
                <div className="p-8">
                  <LoadingSpinner size="lg" text="Loading students..." />
                </div>
              ) : students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Active
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs sm:text-sm font-medium">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-2 sm:ml-4">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                                  {student.name}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[100px] sm:max-w-none">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="w-20 sm:w-32">
                              <ProgressBar 
                                progress={student.progressPercentage} 
                                color="primary"
                                showPercentage={false}
                              />
                              <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                {student.completedWeeks}/{student.totalWeeks} weeks
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <AcademicCapIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1" />
                              <span className="text-xs sm:text-sm text-gray-900">
                                Phase {student.currentPhase}
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500">
                              Week {student.currentWeek}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mr-1" />
                              <span className="text-xs sm:text-sm font-medium text-gray-900">
                                {student.totalPoints}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-[10px] sm:text-xs text-gray-500">
                            {student.lastLoginAt 
                              ? format(new Date(student.lastLoginAt), 'MMM d, yyyy')
                              : 'Never'
                            }
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            {student.certificate ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-success-100 text-success-800">
                                ✅ Earned
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-800">
                                ⏳ In Progress
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleToggleUserStatus(student.id, !student.isActive)}
                                className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium ${
                                  student.isActive 
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                                title={student.isActive ? 'Disable user' : 'Enable user'}
                              >
                                {student.isActive ? (
                                  <>
                                    <LockClosedIcon className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Disable</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Enable</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleDeleteUser(student.id, student.name)}
                                className="inline-flex items-center px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                                title="Delete user"
                              >
                                <TrashIcon className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <UserIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No students found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Students
