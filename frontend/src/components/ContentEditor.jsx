import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { adminAPI } from '../services/api'

const ContentEditor = ({ isOpen, onClose, weekId, contentType, action = 'add' }) => {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && action === 'edit' && weekId && contentType) {
      loadContent()
    }
  }, [isOpen, action, weekId, contentType])

  const loadContent = async () => {
    try {
      const response = await adminAPI.getContentByType(weekId, contentType)
      setFormData(response.data || {})
    } catch (error) {
      console.error('Failed to load content:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (action === 'add') {
        await adminAPI.addContent(weekId, contentType, formData)
        toast.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} added successfully`)
      } else {
        await adminAPI.updateContent(weekId, contentType, formData)
        toast.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} updated successfully`)
      }
      onClose()
    } catch (error) {
      toast.error(`Failed to ${action} ${contentType}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  const renderFormFields = () => {
    switch (contentType) {
      case 'notes':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes Content
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your notes here..."
              />
            </div>
          </>
        )

      case 'video':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Duration (minutes)
              </label>
              <input
                type="number"
                name="videoDuration"
                value={formData.videoDuration || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="30"
              />
            </div>
          </>
        )

      case 'assignment':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Description
              </label>
              <textarea
                name="assignmentDescription"
                value={formData.assignmentDescription || ''}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the assignment requirements..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Deadline
              </label>
              <input
                type="datetime-local"
                name="assignmentDeadline"
                value={formData.assignmentDeadline || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </>
        )

      case 'project':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                name="resources"
                value={formData.resources || ''}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the project requirements, resources, and deliverables..."
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {action === 'add' ? 'Add' : 'Edit'} {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : (action === 'add' ? 'Add' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContentEditor
