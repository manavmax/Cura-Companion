import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageCircle,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Bot,
  AlertTriangle
} from "lucide-react"
import { getChatSession } from "@/api/chat"
import { toast } from "@/hooks/useToast"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type: "text" | "voice" | "crisis"
}

interface ChatSessionData {
  id: string
  mode: string
  status: string
  sessionType: string
  startedAt: Date
  endedAt?: Date
  duration?: number
  messages: Message[]
}

export function ChatSessionView() {
  const [session, setSession] = useState<ChatSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        navigate('/chat/history')
        return
      }

      try {
        console.log("Fetching chat session:", sessionId)
        const response = await getChatSession(sessionId)
        setSession(response)
      } catch (error: any) {
        console.error("Error fetching chat session:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        })
        navigate('/chat/history')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, navigate])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="font-semibold">Session not found</h3>
        <Button onClick={() => navigate('/chat/history')} className="rounded-2xl">
          Back to History
        </Button>
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
              onClick={() => navigate('/chat/history')}
              className="rounded-2xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-primary" />
              Therapy Session
            </h1>
          </div>
          <p className="text-muted-foreground">
            {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)} session from {formatDate(session.startedAt)}
          </p>
        </div>
      </div>

      {/* Session Info */}
      <Card className="glass border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Session Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={`rounded-full ${
                session.status === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {session.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mode</p>
              <Badge variant="outline" className="rounded-full">
                {session.mode}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {session.duration ? formatDuration(session.duration) : 'In progress'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Messages</p>
              <p className="font-medium">{session.messages.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="glass border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Conversation History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] p-6">
            <div className="space-y-4">
              {session.messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages in this session</p>
                </div>
              ) : (
                session.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                          {message.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.type === "crisis"
                            ? "bg-destructive/10 border border-destructive/20 text-destructive-foreground"
                            : "glass border-white/30"
                        }`}
                      >
                        {message.sender === "ai" && message.type === "crisis" && (
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-medium">Crisis Support</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}