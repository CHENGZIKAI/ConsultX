import type { MoodEntry } from '@/types/dashboard'
import CalendarView from './components/CalendarView'
import WelcomeHeader from './components/WelcomeHeader'
import SessionHistory from './components/SessionHistory'
import MoodCheckIn from './components/MoodCheckIn'

import { useState } from 'react'

// Mock user data
const mockUser = {
  name: 'Alex',
}

// Mock weather data
const mockWeather = {
  temperature: 72,
  description: 'Sunny',
}

// Mock calendar data
const mockCalendarEvents: MoodEntry[] = [
  { date: '2025-11-21', mood: 5 },
  { date: '2025-11-20', mood: 4 },
  { date: '2025-11-19', mood: 3 },
  { date: '2025-11-18', mood: 5 },
  { date: '2025-11-17', mood: 3 },
  { date: '2025-11-16', mood: 4 },
  { date: '2025-11-15', mood: 2 },
  { date: '2025-11-14', mood: 2 },
]

const mockMoodHistory: MoodEntry[] = [
  //   { date: '2025-11-21', mood: 5 },
  { date: '2025-11-20', mood: 4 },
  { date: '2025-11-19', mood: 3 },
  { date: '2025-11-18', mood: 5 },
  { date: '2025-11-17', mood: 3 },
  { date: '2025-11-16', mood: 4 },
  { date: '2025-11-15', mood: 2 },
  { date: '2025-11-14', mood: 2 },
]

// Mock Sessions - would come from props or state in real app
const mockSessions: Session[] = [
  {
    id: '1',
    date: '2025-11-19',
    duration: 45,
    notes: 'Discussed stress management techniques',
    type: 'therapy',
  },
  {
    id: '2',
    date: '2025-11-17',
    duration: 30,
    notes: 'Practiced breathing exercises',
    type: 'therapy',
  },
  {
    id: '3',
    date: '2025-11-15',
    duration: 60,
    notes: 'Explored coping strategies for anxiety',
    type: 'therapy',
  },
]

const DashboardLayout = () => {

  return (
    <div className="h-screen bg-[#F6F4F2] overflow-hidden">
      <div className="max-w-7xl mx-auto p-6 flex flex-col h-full overflow-y-auto">
        {/* Welcome Header */}
        <WelcomeHeader user={mockUser} weather={mockWeather} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 grow h-4/5">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
              {/* Mood Check-In */}
              <div className='p-2'>
                <MoodCheckIn moodHistory={mockMoodHistory} />
              </div>
              {/* Session History */}
              <SessionHistory sessions={mockSessions} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="max-h-full bg-white rounded-xl shadow-sm p-2">
              <CalendarView calendarData={mockCalendarEvents} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
