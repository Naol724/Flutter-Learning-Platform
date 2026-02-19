import clsx from 'clsx'

const ProgressBar = ({ 
  progress, 
  className = '', 
  showPercentage = true, 
  color = 'primary',
  size = 'md' 
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-red-500'
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const percentage = Math.min(100, Math.max(0, progress))

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('progress-bar', sizeClasses[size])}>
        <div 
          className={clsx('progress-fill', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

export default ProgressBar