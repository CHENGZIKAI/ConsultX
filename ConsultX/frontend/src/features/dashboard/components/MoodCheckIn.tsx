import { useState } from 'react'
import type { MoodEntry, MoodLevel } from '@/types/dashboard'

import { getMoodEmoji, getMoodLabel } from '../utils'

const MoodCheckin = ({ moodHistory } : { moodHistory: MoodEntry[] }) => {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const todayEntry = moodHistory.find(entry => entry.date === new Date().toISOString().split('T')[0])
  
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
      <div className="p-6 bg-white rounded-xl shadow-sm relative">
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
    <div className="p-6 bg-white rounded-xl shadow-sm relative">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Daily Check-in</h3>
      <p className="text-gray-600 mb-6">How are you feeling today?</p>
      
      <div className="grid grid-cols-5 gap-3">
        {([1, 2, 3, 4, 5] as MoodLevel[]).map((mood) => (
          <button
            key={mood}
            onClick={() => handleMoodSelect(mood)}
            disabled={isSubmitting}
            className={`p-2 rounded-xl border-2 transition-all duration-200 ${
              'border-gray-200 hover:border-[#70A8A2] hover:bg-[#F6F4F2]'
            } disabled:opacity-50`}
          >
            <div className="align-center justify-center flex relative px-2 text-2xl">{getMoodEmoji(mood)}</div>
            {/* <div className="text-xs text-gray-600">{getMoodLabel(mood)}</div> */}
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

export default MoodCheckin;