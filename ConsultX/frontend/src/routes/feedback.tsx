import { createFileRoute, Link } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionFeedback from "../components/sessionFeedback";
import type { SummaryMetrics } from "../components/sessionFeedback";

const queryClient = new QueryClient();

export const Route = createFileRoute("/feedback")({
  component: RouteComponent,
});

function RouteComponent() {
  // Mock metrics - in a real app these would come from state or server
  const metrics: SummaryMetrics = {
    primaryEmotion: "Calm",
    sentiment: "positive",
    userMessages: 12,
    aiConfidence: 87,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen bg-gray-50 py-8 px-4 flex justify-center">
        <div className="max-w-2xl w-full">
          <SessionFeedback metrics={metrics} />

          <div className="mt-6 flex gap-3 justify-end">
            <Link to="/chat" className="px-4 py-2 bg-blue-600 text-white rounded">Start New Session</Link>
            <button className="px-4 py-2 border rounded">Log Out</button>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default RouteComponent;
