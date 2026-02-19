import { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
}

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        loading: false,
        error: null
      }
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        loading: false,
        error: null
      }
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        return
      }

      const response = await api.get('/auth/profile')
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_SUCCESS, 
        payload: { user: response.data.user } 
      })

    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt:', { email, password: '***' })
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      console.log('📡 Making API call to /auth/login...')
      const response = await api.post('/auth/login', { email, password })
      console.log('✅ API response received:', response.data)
      
      const { user, accessToken, refreshToken } = response.data

      // Store tokens
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      console.log('💾 Tokens stored in localStorage')

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user } })
      toast.success(`Welcome back, ${user.name}!`)
      console.log('🎉 Login successful for:', user.name)
      
      return { success: true, user }
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      const message = error.response?.data?.message || 'Login failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (name, email, password) => {
    try {
      console.log('📝 Registration attempt:', { name, email, password: '***' })
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await api.post('/auth/register', { name, email, password })
      
      // Registration successful - immediate login
      const { user, accessToken, refreshToken } = response.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user } })
      toast.success(`Welcome to Flutter Learning Platform, ${user.name}!`)
      
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear tokens and state regardless of API call success
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Logged out successfully')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData)
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: response.data.user })
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  const value = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
