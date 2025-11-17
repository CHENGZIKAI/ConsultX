import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // TODO: Implement actual login logic
    try {
      // Placeholder for backend integration
      console.log('Login attempt:', { email, password })
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For now, just log success
      console.log('Login successful')

      // Redirect or update UI on successful login here
    } catch (err) {
      setError('Something went wrong. Try again when you\'re ready.')
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
              Welcome back
            </h1>
            <p className="text-gray-600 text-base">
              Sign in to continue your wellness journey
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-[#C46262] text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A90A0] focus:border-transparent transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4A90A0] focus:border-transparent transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#4A90A0] focus:ring-[#4A90A0] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-[#4A90A0] hover:text-[#3A7080] transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#4A90A0] hover:bg-[#3A7080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A90A0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-[#4A90A0] hover:text-[#3A7080] transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="#" className="text-[#4A90A0] hover:text-[#3A7080] transition-colors">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}