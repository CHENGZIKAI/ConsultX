import { MessageCircleMore } from "lucide-react"
import { Link } from "@tanstack/react-router"

interface SessionHistoryProps {
  sessions: Session[]
}

//  Session History Component
const SessionHistory = ( {sessions} : SessionHistoryProps ) => {
  const getSessionTypeIcon = () => { return <MessageCircleMore /> }
  const getSessionTypeColor = () => { return 'text-[#4A90A0]'}
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
        <Link
        viewTransition
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
        {sessions.map((session) => (
          <div key={session.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#F6F4F2] hover:bg-[#E3E2F0] transition-colors">
            <div className={`p-2 rounded-lg bg-white ${getSessionTypeColor()}`}>
              {getSessionTypeIcon()}
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

export default SessionHistory;