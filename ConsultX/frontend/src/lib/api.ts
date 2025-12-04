import type { MoodEntry } from '@/types/dashboard'

const API_BASE_URL = 'http://localhost:8000'

// User data from backend
export interface User {
  id: string
  name: string
  email: string
  joined_date: string
}

// Weather data from backend
export interface Weather {
  temperature: number
  description: string
  humidity: number
  location: string
}

// Session data from backend
export interface Session {
  id: string
  date: string
  duration: number
  notes: string
  type: 'therapy' | 'check-in' | 'emergency'
}

// API response wrappers
export interface UserResponse {
  user: User
}

export interface WeatherResponse {
  weather: Weather
}

export interface MoodEntriesResponse {
  mood_entries: MoodEntry[]
  user_id: string
}

export interface SessionsResponse {
  sessions: Session[]
}

/**
 * Fetch user profile data
 */
export async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`)
  }
  
  const data: UserResponse = await response.json()
  return data.user
}

/**
 * Fetch current weather data
 */
export async function fetchWeather(): Promise<Weather> {
  const response = await fetch(`${API_BASE_URL}/weather`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.statusText}`)
  }
  
  const data: WeatherResponse = await response.json()
  return data.weather
}

/**
 * Fetch mood entries for a user
 */
export async function fetchMoodEntries(userId: string): Promise<MoodEntry[]> {
  const response = await fetch(`${API_BASE_URL}/mood-entries?user_id=${userId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch mood entries: ${response.statusText}`)
  }
  
  const data: MoodEntriesResponse = await response.json()
  return data.mood_entries
}

/**
 * Fetch sessions for a user
 */
export async function fetchSessions(userId: string): Promise<Session[]> {
  const response = await fetch(`${API_BASE_URL}/sessions?user_id=${userId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`)
  }
  
  const data: SessionsResponse = await response.json()
  return data.sessions
}

/**
 * Add a new mood entry for a user
 */
export async function addMoodEntry(userId: string, date: string, mood: number): Promise<MoodEntry> {
  const response = await fetch(`${API_BASE_URL}/mood-entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, date, mood }),
  })

  if (!response.ok) {
    throw new Error(`Failed to add mood entry: ${response.statusText}`)
  }

  const data = await response.json()
  return { date: data.entry.date, mood: data.entry.mood }
}