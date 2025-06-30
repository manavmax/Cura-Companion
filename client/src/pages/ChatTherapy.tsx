import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Sparkles,
  Heart,
  AlertTriangle
} from "lucide-react"
import {
  createChatSession,
  getChatHistory,
  sendMessage,
  startVoiceSession,
  startVideoSession,
  endChatSession
} from "@/api/chat"
import { toast } from "@/hooks/useToast"
import axios from "axios"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  type: "text" | "voice" | "crisis" | "video"
}

interface ChatSession {
  id: string
  messages: Message[]
  mode: "text" | "voice" | "video"
  isActive: boolean
  status: string
}

const suggestedPrompts = [
  "I'm feeling anxious today",
  "Can you help me with stress management?",
  "I'm having trouble sleeping",
  "I feel overwhelmed with work",
  "Can we talk about relationships?",
  "I need help with self-care"
]

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"; // Default voice

export function ChatTherapy() {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isVideoActive, setIsVideoActive] = useState(false)
  const [isCrisisMode, setIsCrisisMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasFetched = useRef(false)
  const [isListening, setIsListening] = useState(false)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const videoStreamRef = useRef<MediaStream | null>(null)
  const videoChunksRef = useRef<Blob[]>([])
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const videoRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    const initializeChat = async () => {
      if (hasFetched.current) return
      hasFetched.current = true

      try {
        console.log("Creating new chat session...")
        const response = await createChatSession({ mode: "text", sessionType: "therapy" })

        setSession({
          id: response.session.id,
          messages: [],
          mode: "text",
          isActive: true,
          status: response.session.status
        })

        toast({
          title: "Session Started",
          description: "Your therapy session has begun. How are you feeling today?"
        })
      } catch (error: any) {
        console.error("Error initializing chat:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || error?.msg || (typeof error === 'string' ? error : JSON.stringify(error))
        })
      }
    }

    initializeChat()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.messages])

  // Voice recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = 'en-US'
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setCurrentMessage((prev: string) => prev + transcript)
      setIsListening(false)
    }
    recognitionRef.current.onerror = () => setIsListening(false)
    recognitionRef.current.onend = () => setIsListening(false)
  }, [])

  // Start recording audio for ElevenLabs STT
  const handleStartListening = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast({ variant: "destructive", title: "Error", description: "Audio recording not supported in this browser." })
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      // Try preferred MIME types in order
      let recorder: MediaRecorder | null = null
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus'
      ]
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          recorder = new MediaRecorder(stream, { mimeType: type })
          break
        }
      }
      if (!recorder) {
        toast({ variant: "destructive", title: "Error", description: "No supported audio format found for recording." })
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
        return
      }
      mediaRecorderRef.current = recorder
      setAudioChunks([])
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) setAudioChunks((prev: Blob[]) => [...prev, e.data])
      }
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: recorder!.mimeType })
        if (audioBlob.size < 1000) {
          toast({ variant: "destructive", title: "Audio Error", description: "Recording was too short or invalid. Please try again." })
          setIsListening(false)
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
          return
        }
        let audioFile: File
        try {
          audioFile = new File([audioBlob], "input.webm", { type: recorder!.mimeType })
          const formData = new FormData()
          formData.append("audio", audioFile)
          try {
            // Send to backend for conversion and STT
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/voice/stt`, formData, {
              headers: {
                "Accept": "application/json"
              }
            })
            setCurrentMessage(response.data.text)
          } catch (err: any) {
            if (err?.response?.status === 422) {
              toast({
                variant: "destructive",
                title: "Voice format not supported by backend",
                description: "Falling back to browser speech recognition. Please use Chrome or Edge for best results."
              })
              if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                const recognition = new SpeechRecognition()
                recognition.continuous = false
                recognition.interimResults = false
                recognition.lang = 'en-US'
                recognition.onresult = (event: any) => {
                  const transcript = event.results[0][0].transcript
                  setCurrentMessage(transcript)
                }
                recognition.onerror = () => {
                  toast({
                    variant: "destructive",
                    title: "Browser STT Error",
                    description: "Voice recognition failed. Please try again or use a supported browser."
                  })
                }
                recognition.start()
              } else {
                toast({
                  variant: "destructive",
                  title: "No STT Available",
                  description: "Your browser does not support speech recognition."
                })
              }
            } else {
              toast({ variant: "destructive", title: "STT Error", description: err?.response?.data?.detail || err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) })
            }
          }
        } catch (err: any) {
          toast({ variant: "destructive", title: "Audio Error", description: err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) })
        }
        setIsListening(false)
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      }
      recorder.start()
      setIsListening(true)
      setTimeout(() => {
        if (recorder!.state === "recording") recorder!.stop()
      }, 10000) // Max 10s
    } catch (err: any) {
      toast({ variant: "destructive", title: "Mic Error", description: err.message })
      setIsListening(false)
    }
  }

  const handleStopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
    }
  }

  // ElevenLabs TTS for AI messages (auto-play in voice mode)
  const playTTS = async (text: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/voice/tts`,
        { text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.5 } },
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Accept": "audio/mpeg",
            "Content-Type": "application/json"
          },
          responseType: "blob"
        }
      )
      const audioUrl = URL.createObjectURL(response.data)
      const audio = new Audio(audioUrl)
      audio.play()
    } catch (err: any) {
      toast({ variant: "destructive", title: "TTS Error", description: err?.response?.data?.detail || err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) })
    }
  }

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || currentMessage.trim()
    if (!messageContent || isLoading || !session) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
      type: "text"
    }

    setSession((prev: ChatSession | null) => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null)

    setCurrentMessage("")
    setIsLoading(true)

    try {
      console.log("Sending message:", messageContent)
      const response = await sendMessage(messageContent, session.id)

      if (response.crisisAlertSent) {
        toast({
          variant: "destructive",
          title: "Crisis Alert Sent",
          description: "Your emergency contacts and helplines have been notified."
        })
      }

      if (response.isCrisis) {
        setIsCrisisMode(true)
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: "ai",
        timestamp: new Date(),
        type: response.isCrisis ? "crisis" : "text"
      }

      setSession((prev: ChatSession | null) => prev ? {
        ...prev,
        messages: [...prev.messages, aiMessage]
      } : null)
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || error?.msg || (typeof error === 'string' ? error : JSON.stringify(error))
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceToggle = async () => {
    try {
      if (!isVoiceActive) {
        console.log("Starting voice session...")
        const response = await startVoiceSession()
        setIsVoiceActive(true)
        setSession((prev: ChatSession | null) => prev ? { ...prev, mode: "voice", id: response.sessionId } : null)
        toast({
          title: "Voice Mode",
          description: "Voice therapy session started"
        })
      } else {
        setIsVoiceActive(false)
        setSession((prev: ChatSession | null) => prev ? { ...prev, mode: "text" } : null)
        toast({
          title: "Text Mode",
          description: "Switched back to text mode"
        })
      }
    } catch (error: any) {
      console.error("Error toggling voice:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || error?.msg || (typeof error === 'string' ? error : JSON.stringify(error))
      })
    }
  }

  const handleVideoToggle = async () => {
    try {
      if (!isVideoActive) {
        console.log("Starting video session...")
        const response = await startVideoSession()
        setIsVideoActive(true)
        setSession((prev: ChatSession | null) => prev ? { ...prev, mode: "video", id: response.sessionId } : null)
        toast({
          title: "Video Mode",
          description: "Video therapy session started"
        })
      } else {
        setIsVideoActive(false)
        setSession((prev: ChatSession | null) => prev ? { ...prev, mode: "text" } : null)
        toast({
          title: "Text Mode",
          description: "Switched back to text mode"
        })
      }
    } catch (error: any) {
      console.error("Error toggling video:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || error?.msg || (typeof error === 'string' ? error : JSON.stringify(error))
      })
    }
  }

  const handleEndSession = async () => {
    if (!session) return

    try {
      console.log("Ending chat session...")
      await endChatSession(session.id)
      setSession((prev: ChatSession | null) => prev ? { ...prev, isActive: false, status: "completed" } : null)
      toast({
        title: "Session Ended",
        description: "Your therapy session has been completed"
      })
    } catch (error: any) {
      console.error("Error ending session:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || error?.msg || (typeof error === 'string' ? error : JSON.stringify(error))
      })
    }
  }

  const handleCrisisSupport = () => {
    console.log("Activating crisis support...")
    setIsCrisisMode(true)
  }

  // After receiving AI message, auto-play TTS if in voice mode
  useEffect(() => {
    if (!session || session.mode !== "voice") return
    if (session.messages.length === 0) return
    const lastMsg = session.messages[session.messages.length - 1]
    if (lastMsg.sender === "ai" && lastMsg.type !== "crisis") {
      playTTS(lastMsg.content)
    }
  }, [session?.messages, session?.mode])

  // Start video recording
  const handleStartVideoRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast({ variant: "destructive", title: "Error", description: "Video recording not supported in this browser." })
      return
    }
    try {
      videoChunksRef.current = []
      setVideoBlob(null)
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null
        videoPreviewRef.current.src = ''
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      videoStreamRef.current = stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
      videoRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        setVideoBlob(blob)
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null
          videoPreviewRef.current.src = URL.createObjectURL(blob)
        }
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
        setIsRecordingVideo(false)
      }
      recorder.start()
      setIsRecordingVideo(true)
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop()
      }, 15000) // Max 15s
    } catch (err: any) {
      toast({ variant: "destructive", title: "Video Error", description: err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) })
      setIsRecordingVideo(false)
    }
  }

  const handleStopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state === "recording") {
      videoRecorderRef.current.stop()
    }
    setIsRecordingVideo(false)
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
    }
  }

  // Upload video to backend for processing
  const handleUploadVideo = async () => {
    if (!videoBlob) return
    const formData = new FormData()
    formData.append("video", videoBlob, "input.webm")
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/voice/video`, formData, {
        headers: { "Accept": "application/json" }
      })
      setCurrentMessage("")
      setSession((prev: ChatSession | null) => prev ? {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: Date.now().toString(),
            content: response.data.text,
            sender: "ai",
            timestamp: new Date(),
            type: "video"
          }
        ]
      } : null)
      if (response.data.audioUrl) {
        const audio = new Audio(response.data.audioUrl)
        audio.play()
      }
      toast({ title: "AI Reply", description: response.data.text })
    } catch (err: any) {
      let msg = err?.response?.data?.error || err?.message || (typeof err === 'string' ? err : JSON.stringify(err))
      if (typeof msg !== 'string') msg = JSON.stringify(msg)
      toast({ variant: "destructive", title: "Video Processing Error", description: msg })
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Connecting to your therapist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Chat Therapy
          </h1>
          <p className="text-muted-foreground">
            Your safe space for therapeutic conversations
          </p>
        </div>

        {/* Mode Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={session.mode === "voice" ? "default" : "outline"}
            size="sm"
            onClick={handleVoiceToggle}
            className="rounded-2xl"
            disabled={!session.isActive}
          >
            {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant={session.mode === "video" ? "default" : "outline"}
            size="sm"
            onClick={handleVideoToggle}
            className="rounded-2xl"
            disabled={!session.isActive}
          >
            {isVideoActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndSession}
            className="rounded-2xl"
            disabled={!session.isActive}
          >
            <PhoneOff className="h-4 w-4" />
            End Session
          </Button>
          {isCrisisMode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCrisisSupport}
              className="rounded-2xl"
            >
              <AlertTriangle className="h-4 w-4" />
              Crisis Support
            </Button>
          )}
        </div>
      </div>

      {/* Session Status */}
      <div className="flex items-center gap-2">
        <Badge variant={session.isActive ? "default" : "secondary"} className="rounded-full">
          {session.isActive ? "Active Session" : "Session Ended"}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)} Mode
        </Badge>
      </div>

      {/* Video Mode */}
      {session.mode === "video" && (
        <Card className="glass border-white/30">
          <CardContent className="p-0">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
              <div className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src="/ai-therapist.jpg" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    <Sparkles className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">Dr. Cura</h3>
                  <p className="text-sm text-muted-foreground">Your AI Therapist</p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  Video Session Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="glass border-white/30 h-[600px] flex flex-col">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Therapy Session
            {session.mode !== "text" && (
              <Badge variant="secondary" className="ml-auto rounded-full">
                {session.mode === "voice" ? "Voice Active" : "Video Active"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {session.messages.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Welcome to your therapy session</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      I'm here to listen and support you. How are you feeling today?
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage(prompt)}
                        className="rounded-full text-xs"
                        disabled={!session.isActive}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {session.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
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
                        <span className="text-xs font-medium">Crisis Support Mode</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass border-white/30 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">Typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Prompts */}
          {session.messages.length > 0 && session.isActive && (
            <div className="border-t border-white/20 p-4">
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.slice(3).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-full text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          {session.isActive && (
            <div className="border-t border-white/20 p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={
                    session.mode === "voice"
                      ? isListening
                        ? "Listening... Speak now."
                        : "Speak or type your message..."
                      : "Type your message..."
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 rounded-2xl"
                  disabled={isLoading}
                />
                {session.mode === "voice" && (
                  <Button
                    type="button"
                    onClick={isListening ? handleStopListening : handleStartListening}
                    className={`rounded-2xl ${isListening ? 'bg-primary text-white' : ''}`}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!currentMessage.trim() || isLoading}
                  className="rounded-2xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crisis Support Panel */}
      {isCrisisMode && (
        <Card className="glass border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Crisis Support Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              If you're in immediate danger or having thoughts of self-harm, please reach out for help immediately.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="destructive" className="rounded-2xl">
                <Phone className="h-4 w-4 mr-2" />
                Call 988 (Crisis Lifeline)
              </Button>
              <Button variant="outline" className="rounded-2xl">
                <MessageCircle className="h-4 w-4 mr-2" />
                Text Crisis Support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Mode */}
      {session.mode === "video" && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            {!isRecordingVideo && (
              <Button onClick={handleStartVideoRecording} disabled={isRecordingVideo}>
                Start Video Recording
              </Button>
            )}
            {isRecordingVideo && (
              <>
                <Button onClick={handleStopVideoRecording} variant="destructive">
                  Stop Recording
                </Button>
                <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded animate-pulse">Recording...</span>
              </>
            )}
            {videoBlob && !isRecordingVideo && (
              <Button onClick={handleUploadVideo}>
                Send Video to AI
              </Button>
            )}
          </div>
          {/* Live preview while recording */}
          <video
            ref={videoPreviewRef}
            controls={!isRecordingVideo && !!videoBlob}
            autoPlay={isRecordingVideo}
            muted={isRecordingVideo}
            className="w-full max-w-md rounded-xl border"
            style={{ display: isRecordingVideo || videoBlob ? 'block' : 'none' }}
          />
        </div>
      )}
    </div>
  )
}
