interface Session {
  id: string
  date: string
  duration: number
  notes: string
  type: 'therapy' | 'check-in' | 'emergency'
}