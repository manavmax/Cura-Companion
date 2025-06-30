import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Calendar,
  Clock,
  ArrowLeft,
  Video,
  Mic,
  Type,
  Eye
} from "lucide-react"
import { getChatSessions } from "@/api/chat"
import { toast } from "@/hooks/useToast"

interface ChatSessionSummary {
  id: string
  mode: string
  status: string
  sessionType: string
  startedAt: Date
  endedAt?: Date
  duration?: number
  messageCount: number
}

export function ChatHistory() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        console.log("Fetching chat session history...")
        const response = await getChatSessions(20) // Get last 20 sessions
        setSessions(response)
      } catch (error: any) {
        console.error("Error fetching chat sessions:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'voice':
        return <Mic className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      default:
        return <Type className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const viewSession = (sessionId: string) => {
    navigate(`/chat/${sessionId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading chat history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="rounded-2xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              Chat History
            </h1>
          </div>
          <p className="text-muted-foreground">
            View your past therapy sessions and conversations
          </p>
        </div>

        <Button
          onClick={() => navigate('/chat')}
          className="rounded-2xl"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Sessions List */}
      <Card className="glass border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Therapy Sessions ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">No therapy sessions yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first therapy session to begin your mental health journey
                </p>
                <Button
                  onClick={() => navigate('/chat')}
                  className="rounded-2xl"
                >
                  Start First Session
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 p-6">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-white/20 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                    onClick={() => viewSession(session.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        {getModeIcon(session.mode)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)} Session
                          </h3>
                          <Badge className={`rounded-full text-xs ${getStatusColor(session.status)}`}>
                            {session.status}
                          </Badge>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {session.mode}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.startedAt)}
                          </div>
                          {session.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(session.duration)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {session.messageCount} messages
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}