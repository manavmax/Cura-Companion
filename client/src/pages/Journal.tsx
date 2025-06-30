import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Mic,
  MicOff,
  Save,
  Trash2,
  Calendar,
  Clock,
  FileText,
  Volume2,
  Sparkles,
  Plus
} from "lucide-react"
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, getWritingPrompts } from "@/api/journal"
import { toast } from "@/hooks/useToast"

interface JournalEntry {
  _id: string
  title: string
  content: string
  date: Date
  mood?: string
  tags: string[]
  type: "text" | "voice"
  audioUrl?: string
  wordCount: number
}

const moodOptions = [
  { value: 1, label: "Happy", color: "bg-yellow-100 text-yellow-800" },
  { value: 2, label: "Sad", color: "bg-blue-100 text-blue-800" },
  { value: 3, label: "Anxious", color: "bg-red-100 text-red-800" },
  { value: 4, label: "Calm", color: "bg-green-100 text-green-800" },
  { value: 5, label: "Excited", color: "bg-purple-100 text-purple-800" },
  { value: 6, label: "Neutral", color: "bg-gray-100 text-gray-800" }
]

export function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [prompts, setPrompts] = useState<string[]>([])
  const [currentEntry, setCurrentEntry] = useState({
    title: "",
    content: "",
    mood: undefined as number | undefined,
    tags: [] as string[],
    type: "text" as "text" | "voice"
  })
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState("")
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching journal data...")
        const [entriesData, promptsData] = await Promise.all([
          getJournalEntries(),
          getWritingPrompts()
        ])
        setEntries(entriesData)
        setPrompts(promptsData)
      } catch (error: any) {
        console.error("Error fetching journal data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        })
      }
    }

    fetchData()
  }, [])

  const handleSaveEntry = async () => {
    if (!currentEntry.content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please write something before saving"
      })
      return
    }

    setIsLoading(true)
    try {
      const entryData = {
        ...currentEntry,
        mood: typeof currentEntry.mood === 'number' ? currentEntry.mood : undefined,
        wordCount: currentEntry.content.split(' ').length
      }

      const response = await saveJournalEntry(entryData)
      
      if (response.success) {
        setEntries(prev => [response.entry, ...prev])
        setCurrentEntry({
          title: "",
          content: "",
          mood: undefined,
          tags: [],
          type: "text"
        })
        setSelectedPrompt("")
        
        toast({
          title: "Success",
          description: "Journal entry saved successfully"
        })
      }
      if (response.crisisAlertSent) {
        toast({
          variant: "destructive",
          title: "Crisis Alert Sent",
          description: "Your emergency contacts and helplines have been notified."
        })
      }
    } catch (error: any) {
      console.error("Error saving entry:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await deleteJournalEntry(entryId)
      
      if (response.success) {
        setEntries(prev => prev.filter(entry => entry._id !== entryId))
        toast({
          title: "Success",
          description: "Journal entry deleted successfully"
        })
      }
    } catch (error: any) {
      console.error("Error deleting entry:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  const handleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support speech recognition."
      })
      return
    }
    if (!isRecording) {
      setIsRecording(true)
      setCurrentEntry(prev => ({ ...prev, type: "voice" }))
      toast({ title: "Recording Started", description: "Speak your journal entry" })
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log('SpeechRecognition transcript:', transcript)
        if (transcript && transcript.trim()) {
          setCurrentEntry(prev => ({ ...prev, content: prev.content + (prev.content ? '\n' : '') + transcript }))
          toast({ title: "Recording Stopped", description: "Voice has been transcribed to text" })
        } else {
          toast({ variant: "destructive", title: "No Speech Detected", description: "No speech was recognized. Please try again." })
        }
        setIsRecording(false)
      }
      recognition.onerror = (event: any) => {
        toast({ variant: "destructive", title: "Speech Recognition Error", description: event.error })
        setIsRecording(false)
      }
      recognition.onend = () => {
        setIsRecording(false)
      }
      recognition.start()
    } else {
      setIsRecording(false)
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt)
    setCurrentEntry(prev => ({
      ...prev,
      title: prompt,
      content: prev.content + (prev.content ? "\n\n" : "") + prompt + "\n\n"
    }))
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMoodColor = (mood: number | undefined) => {
    const moodOption = moodOptions.find(option => option.value === mood)
    return moodOption?.color || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          Journal
        </h1>
        <p className="text-muted-foreground">
          Express your thoughts and track your mental health journey
        </p>
      </div>

      {/* Writing Prompts */}
      <Card className="glass border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Writing Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {prompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left h-auto p-3 rounded-2xl justify-start"
                onClick={() => handlePromptSelect(prompt)}
              >
                <span className="text-sm">{prompt}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Entry Form */}
      <Card className="glass border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            New Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title (Optional)</label>
            <Input
              value={currentEntry.title}
              onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Give your entry a title..."
              className="rounded-2xl"
            />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Content</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceRecording}
                className="rounded-2xl"
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? "Stop Recording" : "Record Voice"}
              </Button>
            </div>
            <Textarea
              value={currentEntry.content}
              onChange={(e) => setCurrentEntry(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write about your thoughts, feelings, or experiences..."
              className="min-h-[200px] rounded-2xl"
            />
            <div className="text-xs text-muted-foreground">
              Word count: {currentEntry.content.split(' ').filter(word => word.length > 0).length}
            </div>
          </div>

          {/* Mood Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mood (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((mood) => (
                <Button
                  key={mood.value}
                  variant={currentEntry.mood === mood.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentEntry(prev => ({ 
                    ...prev, 
                    mood: prev.mood === mood.value ? undefined : mood.value 
                  }))}
                  className="rounded-full"
                >
                  {mood.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveEntry}
            disabled={isLoading || !currentEntry.content.trim()}
            className="w-full rounded-2xl"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Journal Entries */}
      <Card className="glass border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Your Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">No journal entries yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start writing to track your thoughts and feelings
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 p-6">
                {entries.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 rounded-2xl border border-white/20 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        {entry.title && (
                          <h3 className="font-semibold">{entry.title}</h3>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {entry.wordCount} words
                          </div>
                          {entry.type === "voice" && (
                            <div className="flex items-center gap-1">
                              <Volume2 className="h-3 w-3" />
                              Voice
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry._id)}
                        className="rounded-2xl text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm mb-3 line-clamp-3">{entry.content}</p>

                    <div className="flex items-center gap-2">
                      {entry.mood && (
                        <Badge className={`rounded-full text-xs ${getMoodColor(entry.mood)}`}>
                          {moodOptions.find(option => option.value === entry.mood)?.label}
                        </Badge>
                      )}
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="rounded-full text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
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