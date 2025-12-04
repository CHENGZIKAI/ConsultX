import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signupUser } from '@/lib/api'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username) {
      newErrors.username = 'Username is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsLoading(true)
    try {
      await signupUser({ name: formData.username, password: formData.password })
      // You can redirect or show a success message here
      // For now, just log success
      console.log('Signup successful')
      navigate({ to: '/login' })
      
    } catch (err: any) {
      setErrors({ general: err?.message || 'Something went wrong. Try again when you\'re ready.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F4F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-gray-600 text-base">
              Begin your wellness journey today
            </p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-[#C46262] text-sm">{errors.general}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username */}
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-md border ${errors.username ? 'border-[#C46262]' : 'border-gray-300'} bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A90A0] focus:border-transparent transition-colors`}
                  placeholder="Username"
                />
                {errors.username && <p className="mt-1 text-sm text-[#C46262]">{errors.username}</p>}
              </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-md border ${errors.password ? 'border-[#C46262]' : 'border-gray-300'} bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A90A0] focus:border-transparent transition-colors`}
                placeholder="Create a password"
              />
              {errors.password && <p className="mt-1 text-sm text-[#C46262]">{errors.password}</p>}
              <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-md border ${errors.confirmPassword ? 'border-[#C46262]' : 'border-gray-300'} bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A90A0] focus:border-transparent transition-colors`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-[#C46262]">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#4A90A0] hover:bg-[#3A7080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A90A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-[#4A90A0] hover:text-[#3A7080] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Support Link */}
        {/* <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="#" className="text-[#4A90A0] hover:text-[#3A7080] transition-colors">
              Contact support
            </a>
          </p>
        </div> */}
      </div>
    </div>
  )
}