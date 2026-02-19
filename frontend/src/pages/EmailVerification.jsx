import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const EmailVerification = () => {
  const [searchParams] = useSearchParams()
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  
  const { verifyOTP, sendEmailVerification } = useAuth()
  const navigate = useNavigate()
  
  const email = searchParams.get('email') || ''

  useEffect(() => {
    if (!email) {
      navigate('/register')
    }
  }, [email, navigate])

  const handleVerify = async (e) => {
    e.preventDefault()
    
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage('Please enter a 6-digit verification code')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const result = await verifyOTP(email, verificationCode)
      
      if (result.success) {
        setMessage('Account verified successfully! Redirecting to dashboard...')
        setMessageType('success')
        
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } else {
        setMessage(result.message || 'Verification failed')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Verification failed. Please try again.')
      setMessageType('error')
    }
    
    setIsLoading(false)
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setMessage('')

    try {
      const result = await sendEmailVerification(email)
      
      if (result.success) {
        setMessage('New verification code sent to your email')
        setMessageType('success')
      } else {
        setMessage(result.message || 'Failed to resend code')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Failed to resend code. Please try again.')
      setMessageType('error')
    }
    
    setIsResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit verification code to your email address
          </p>
          {email && (
            <p className="mt-1 text-center text-sm font-medium text-primary-600">
              {email}
            </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
              6-Digit Verification Code
            </label>
            <div className="mt-1">
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-center text-lg font-mono tracking-widest"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setVerificationCode(value);
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Enter the 6-digit code sent to your email. Code expires in 10 minutes.
            </p>
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend verification code'}
            </button>

            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmailVerification
