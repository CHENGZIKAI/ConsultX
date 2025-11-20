import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

// Types and Interfaces
type MoodLevel = 1 | 2 | 3 | 4 | 5

interface MoodEntry {
  date: string
  mood: MoodLevel
  note?: string
}

interface Session {
  id: string
  date: string
  duration: number
  notes: string
  type: 'therapy' | 'check-in' | 'emergency'
}

// Mock data
const mockUser = {
  name: 'Alex',
  timezone: 'PST'
}

const mockWeather = {
  condition: 'partly-cloudy',
  temperature: 72,
  description: 'Partly cloudy'
}

const mockMoodHistory: MoodEntry[] = [
  { date: '2025-11-20', mood: 4 },
  { date: '2025-11-19', mood: 3 },
  { date: '2025-11-18', mood: 5 },
  { date: '2025-11-17', mood: 3 },
  { date: '2025-11-16', mood: 4 },
  { date: '2025-11-15', mood: 2 },
  { date: '2025-11-14', mood: 2 },
]

const mockSessions: Session[] = [
  {
    id: '1',
    date: '2025-11-19',
    duration: 45,
    notes: 'Discussed stress management techniques',
    type: 'therapy'
  },
  {
    id: '2', 
    date: '2025-11-17',
    duration: 30,
    notes: 'Practiced breathing exercises',
    type: 'therapy'
  },
  {
    id: '3',
    date: '2025-11-15',
    duration: 60,
    notes: 'Explored coping strategies for anxiety',
    type: 'therapy'
  }
]

// Utility functions
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const getMoodEmoji = (mood: MoodLevel): string => {
  const emojiMap = {
    1: '😔',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😊'
  }
  return emojiMap[mood]
}

const getMoodLabel = (mood: MoodLevel): string => {
  const labelMap = {
    1: 'Very Low',
    2: 'Low', 
    3: 'Okay',
    4: 'Good',
    5: 'Great'
  }
  return labelMap[mood]
}

// Welcome Header Component
const WelcomeHeader = () => {
  const greeting = getTimeBasedGreeting()
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-1">
            {greeting}, {mockUser.name}
          </h1>
          <p className="text-gray-600">
            Welcome back to your wellness journey
          </p>
        </div>
        
        {/* Weather Widget */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.003 4.003 0 003 15z" />
            </svg>
            <span>{mockWeather.temperature}°F</span>
          </div>
          <span>{mockWeather.description}</span>
        </div>
      </div>
    </div>
  )
}

// Today's Mood Check-in Component (Combined)
const TodaysMoodCheckin = () => {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const todayEntry = mockMoodHistory.find(entry => entry.date === new Date().toISOString().split('T')[0])
  
  const handleMoodSelect = async (mood: MoodLevel) => {
    setSelectedMood(mood)
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setIsSubmitting(false)
    // In real app, would update the mood history and refresh the component
    console.log('Mood saved:', mood)
  }
  
  // Show current mood if already logged (or just selected)
  if (todayEntry || selectedMood) {
    const displayMood = selectedMood || todayEntry!.mood
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Today's Mood</h3>
          {todayEntry && (
            <button 
              onClick={() => setSelectedMood(null)}
              className="text-xs text-[#4A90A0] hover:text-[#70A8A2] transition-colors"
            >
              Update
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#D8EFE8] rounded-full flex items-center justify-center text-2xl">
            {getMoodEmoji(displayMood)}
          </div>
          <div>
            <p className="text-xl font-medium text-gray-900">
              {getMoodLabel(displayMood)}
            </p>
            <p className="text-sm text-gray-600">
              {selectedMood && !todayEntry ? 'Just logged' : 'Logged earlier today'}
            </p>
          </div>
        </div>
        
        {selectedMood && !todayEntry && (
          <div className="mt-4 p-3 bg-[#D8EFE8] rounded-lg">
            <div className="flex items-center gap-2 text-sm text-[#4A90A0]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Mood saved successfully!</span>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Show check-in interface if no mood logged today
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Daily Check-in</h3>
      <p className="text-gray-600 mb-6">How are you feeling today?</p>
      
      <div className="grid grid-cols-5 gap-3">
        {([1, 2, 3, 4, 5] as MoodLevel[]).map((mood) => (
          <button
            key={mood}
            onClick={() => handleMoodSelect(mood)}
            disabled={isSubmitting}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              'border-gray-200 hover:border-[#70A8A2] hover:bg-[#F6F4F2]'
            } disabled:opacity-50`}
          >
            <div className="text-2xl mb-1">{getMoodEmoji(mood)}</div>
            <div className="text-xs text-gray-600">{getMoodLabel(mood)}</div>
          </button>
        ))}
      </div>
      
      {isSubmitting && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-[#4A90A0] border-t-transparent rounded-full animate-spin"></div>
            Saving your mood...
          </div>
        </div>
      )}
    </div>
  )
}

// Mood Trends Chart Component
const MoodTrendsChart = () => {
  const last7Days = mockMoodHistory.slice(0, 7).reverse()
  
  // Generate SVG path for the line chart
  const generatePath = () => {
    if (last7Days.length === 0) return ''
    
    const chartWidth = 280
    const chartHeight = 80
    const pointSpacing = chartWidth / (last7Days.length - 1)
    
    let path = ''
    
    last7Days.forEach((entry, index) => {
      const x = index * pointSpacing
      const y = chartHeight - ((entry.mood - 1) / 4) * chartHeight // Scale 1-5 to chart height
      
      if (index === 0) {
        path += `M ${x} ${y}`
      } else {
        path += ` L ${x} ${y}`
      }
    })
    
    return path
  }
  
  const chartPath = generatePath()
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mood Trends</h3>
      
      <div className="space-y-4">
        {/* Line Chart */}
        <div className="relative h-20">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 280 80" 
            className="overflow-visible"
          >
            {/* Background grid lines */}
            <defs>
              <pattern id="grid" width="56" height="20" patternUnits="userSpaceOnUse">
                <path d="M 56 0 L 0 0 0 20" fill="none" stroke="#F3F4F6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Mood level reference lines */}
            {[1, 2, 3, 4, 5].map(level => {
              const y = 80 - ((level - 1) / 4) * 80
              return (
                <line
                  key={level}
                  x1="0"
                  y1={y}
                  x2="280"
                  y2={y}
                  stroke="#D8EFE8"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )
            })}
            
            {/* Main trend line */}
            {chartPath && (
              <path
                d={chartPath}
                fill="none"
                stroke="#4A90A0"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Data points */}
            {last7Days.map((entry, index) => {
              const x = index * (280 / (last7Days.length - 1))
              const y = 80 - ((entry.mood - 1) / 4) * 80
              
              return (
                <g key={entry.date}>
                  {/* Background circle for emoji */}
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="white"
                    stroke="#4A90A0"
                    strokeWidth="2"
                  />
                  {/* Mood emoji */}
                  <text
                    x={x}
                    y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="20"
                    className="pointer-events-none"
                  >
                    {getMoodEmoji(entry.mood)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        
        {/* Date labels */}
        <div className="flex justify-between text-xs text-gray-500 px-1">
          {last7Days.map((entry) => (
            <span key={entry.date} className="text-center">
              {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
          ))}
        </div>
        
        {/* Mood scale reference */}
        <div className="flex justify-between items-center text-xs text-gray-400 mt-2 px-1">
          <span>😔 Very Low</span>
          <span>😊 Great</span>
        </div>
      </div>
    </div>
  )
}

// Calendar View Component
const CalendarView = () => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = Sunday
  
  // Create array of all dates in month
  const days = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }
  
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' })
  
  const hasMoodEntry = (day: number): boolean => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    return mockMoodHistory.some(entry => entry.date === dateStr)
  }
  
  const isToday = (day: number): boolean => {
    return day === currentDate.getDate() && 
           currentMonth === currentDate.getMonth() && 
           currentYear === currentDate.getFullYear()
  }
  
  const getConsecutiveDays = (): number => {
    let consecutive = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      
      const hasEntry = mockMoodHistory.some(entry => entry.date === dateStr)
      if (hasEntry) {
        consecutive++
      } else {
        break
      }
    }
    
    return consecutive
  }
  
  const streak = getConsecutiveDays()
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Check-in Calendar</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 bg-[#6BAF7A] rounded-full"></div>
          <span className="text-gray-600">Mood logged</span>
        </div>
      </div>
      
      {/* Streak Counter */}
      <div className="mb-4 p-3 bg-[#F6F4F2] rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#E7C45B]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-gray-900">{streak} day streak</span>
          </div>
          {streak > 0 && (
            <span className="text-xs text-[#6BAF7A]">Keep it up! 🎉</span>
          )}
        </div>
      </div>
      
      {/* Month header */}
      <div className="text-center mb-4">
        <h4 className="text-base font-medium text-gray-900">{monthName} {currentYear}</h4>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(dayName => (
          <div key={dayName} className="text-center text-xs font-medium text-gray-500 py-2">
            {dayName}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {day && (
              <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Green circle for days with mood entries */}
                {hasMoodEntry(day) && (
                  <div className="absolute inset-0 w-8 h-8 bg-[#6BAF7A] rounded-full opacity-20"></div>
                )}
                {hasMoodEntry(day) && (
                  <div className="absolute inset-0 w-8 h-8 border-2 border-[#6BAF7A] rounded-full"></div>
                )}
                
                {/* Today indicator */}
                {isToday(day) && (
                  <div className="absolute inset-0 w-8 h-8 bg-[#4A90A0] rounded-full opacity-20"></div>
                )}
                
                {/* Day number */}
                <span className={`relative text-sm font-medium ${
                  isToday(day) 
                    ? 'text-[#4A90A0] font-bold' 
                    : hasMoodEntry(day)
                      ? 'text-[#6BAF7A] font-semibold'
                      : 'text-gray-700'
                }`}>
                  {day}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-[#4A90A0] rounded-full"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-[#6BAF7A] rounded-full bg-[#6BAF7A] bg-opacity-20"></div>
          <span>Mood logged</span>
        </div>
      </div>
    </div>
  )
}

// Session History Component
const SessionHistory = () => {
  const getSessionTypeIcon = (type: Session['type']) => {
    switch (type) {
      case 'therapy':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      case 'check-in':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'emergency':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
    }
  }
  
  const getSessionTypeColor = (type: Session['type']) => {
    switch (type) {
      case 'therapy': return 'text-[#4A90A0]'
      case 'check-in': return 'text-[#6BAF7A]' 
      case 'emergency': return 'text-[#C46262]'
    }
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
        <Link
          to="/chat-new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90A0] text-white rounded-lg text-sm font-medium hover:bg-[#70A8A2] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Session
        </Link>
      </div>
      
      <div className="space-y-3">
        {mockSessions.map((session) => (
          <div key={session.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F4F2] hover:bg-[#E3E2F0] transition-colors">
            <div className={`p-2 rounded-lg bg-white ${getSessionTypeColor(session.type)}`}>
              {getSessionTypeIcon(session.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {session.type} Session
                </p>
                <span className="text-xs text-gray-500">
                  {new Date(session.date).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                {session.notes}
              </p>
              
              <p className="text-xs text-gray-500">
                Duration: {session.duration} minutes
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Dashboard Component
function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F6F4F2] overflow-hidden">
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Header */}
        <WelcomeHeader />
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Combined Mood Check-in */}
            <TodaysMoodCheckin />
            
            {/* Session History */}
            <SessionHistory />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <MoodTrendsChart />
            <CalendarView />
          </div>
        </div>
      </div>
    </div>
  )
}
