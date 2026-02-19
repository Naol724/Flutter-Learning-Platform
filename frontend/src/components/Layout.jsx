import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        { name: 'Students', href: '/admin/students', icon: UserGroupIcon },
        { name: 'Submissions', href: '/admin/submissions', icon: DocumentTextIcon },
        { name: 'Course Map', href: '/admin/course-map', icon: AcademicCapIcon }
      ]
    } else {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Progress', href: '/progress', icon: ChartBarIcon },
        { name: 'Course Map', href: '/course-map', icon: AcademicCapIcon }
      ]
    }
  }

  const navigation = getNavigationItems()

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx(
      'flex flex-col h-full',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-3 sm:px-6 bg-primary-600">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold text-xs sm:text-sm sm:font-lg">F</span>
            </div>
          </div>
          <div className="ml-1 sm:ml-2 lg:ml-3">
            <h1 className="text-xs sm:text-sm lg:text-base font-bold text-white">Flutter Learn</h1>
            <p className="text-[10px] sm:text-xs text-primary-200">
              {user?.role === 'admin' ? 'Admin Panel' : 'Student Portal'}
            </p>
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:text-primary-200 p-1"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 sm:px-4 py-4 sm:py-6 bg-white border-r border-gray-200">
        <ul className="space-y-1 sm:space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={clsx(
                    'flex items-center px-2 py-2 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-2 sm:px-4 lg:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              {title && (
                <h1 className="ml-2 sm:ml-4 text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[100px] sm:max-w-none">
                  {title}
                </h1>
              )}
            </div>
            
            {/* User menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User info for desktop */}
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate max-w-[60px] sm:max-w-none">
                    {user?.name}
                  </p>
                  <p className="text-[9px] sm:text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Administrator' : 'Student'}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-medium">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* User info for mobile */}
              <div className="sm:hidden flex items-center">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Logout button - always visible */}
              <button
                onClick={handleLogout}
                className="flex items-center px-1 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="w-3 h-3 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline ml-1 sm:ml-2">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-2 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout