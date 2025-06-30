import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  Heart,
  TrendingUp,
  Calendar as CalendarIcon,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Smile,
  Meh,
  Frown,
  Save,
  BarChart3,
  Trash2,
  Eye
} from "lucide-react"
import { getMoodHistory, saveMoodEntry, getMoodAnalytics, getMoodEntry, deleteMoodEntry } from "@/api/mood"
import { useToast } from "@/hooks/useToast"
import api from '@/api/api'

interface MoodEntry {
  id: string
  date: Date
  mood: number
  energy: number
  anxiety: number
  note?: string
  tags: string[]
}

interface MoodAnalytics {
  averageMood: number
  moodTrend: "improving" | "stable" | "declining"
  weeklyData: { date: string; mood: number; energy: number; anxiety: number }[]
  commonTriggers: string[]
  insights: string[]
}

const moodLabels = {
  1: "Very Low",
  2: "Low",
  3: "Below Average",
  4: "Slightly Low",
  5: "Neutral",
  6: "Slightly Good",
  7: "Good",
  8: "Very Good",
  9: "Great",
  10: "Excellent"
}

const getMoodIcon = (mood: number) => {
  if (mood <= 3) return CloudRain
  if (mood <= 7) return Cloud
  return Sun
}

const getMoodColor = (mood: number) => {
  if (mood <= 3) return "text-blue-500"
  if (mood <= 7) return "text-yellow-500"
  return "text-orange-500"
}

const getEnergyIcon = (energy: number) => {
  if (energy <= 3) return Frown
  if (energy <= 7) return Meh
  return Smile
}

class MoodErrorBoundaryClass extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('MoodTracking crashed:', error, errorInfo)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Something went wrong in Mood Tracking</h2>
          <p className="text-muted-foreground mb-4">Please reload the page or try again later.</p>
          <pre className="text-xs text-left mx-auto max-w-xl bg-red-50 p-4 rounded-2xl overflow-x-auto">{this.state.error.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export function MoodTracking() {
  const [currentMood, setCurrentMood] = React.useState([5])
  const [currentEnergy, setCurrentEnergy] = React.useState([5])
  const [currentAnxiety, setCurrentAnxiety] = React.useState([5])
  const [note, setNote] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [moodHistory, setMoodHistory] = React.useState<MoodEntry[]>([])
  const [analytics, setAnalytics] = React.useState<MoodAnalytics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [selectedMoodEntry, setSelectedMoodEntry] = React.useState<MoodEntry | null>(null)
  const [viewingMoodEntry, setViewingMoodEntry] = React.useState<MoodEntry | null>(null)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState('track')

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching mood data...")
        const [history, analyticsData] = await Promise.all([
          getMoodHistory() as Promise<MoodEntry[]>,
          getMoodAnalytics() as Promise<MoodAnalytics>
        ])
        setMoodHistory(history.map(entry => ({
          ...entry,
          date: entry.date instanceof Date ? entry.date : new Date(entry.date)
        })))
        setAnalytics(analyticsData)
      } catch (error) {
        console.error("Error fetching mood data:", error)
        toast({
          title: "Error",
          description: "Failed to load mood data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Poll for AI insight if analytics.insights is empty and Analytics tab is active
  React.useEffect(() => {
    if (activeTab !== 'analytics') return;
    if (!analytics || (Array.isArray(analytics.insights) && analytics.insights.length > 0)) return;
    let interval: NodeJS.Timeout;
    let cancelled = false;
    const pollInsight = async () => {
      try {
        const res = await api.get('/api/moods/ai-insight');
        if (res.data && res.data.insight) {
          setAnalytics((prev) => prev ? { ...prev, insights: [res.data.insight] } : prev);
          cancelled = true;
        }
      } catch (e) {
        // ignore
      }
    };
    interval = setInterval(() => {
      if (!cancelled) pollInsight();
    }, 5000);
    return () => clearInterval(interval);
  }, [analytics, activeTab]);

  const handleSaveMoodEntry = async () => {
    setSaving(true)
    try {
      const entry: Omit<MoodEntry, 'id'> = {
        date: selectedDate,
        mood: currentMood[0],
        energy: currentEnergy[0],
        anxiety: currentAnxiety[0],
        note: note.trim() || undefined,
        tags: []
      }

      console.log("Saving mood entry:", entry)
      await saveMoodEntry(entry)

      // Show success message
      toast({
        title: "Success",
        description: "Mood entry saved successfully!",
      })

      // Refresh data
      const [history, analyticsData] = await Promise.all([
        getMoodHistory() as Promise<MoodEntry[]>,
        getMoodAnalytics() as Promise<MoodAnalytics>
      ])
      setMoodHistory(history)
      setAnalytics(analyticsData)

      // Reset form
      setNote("")
    } catch (error) {
      console.error("Error saving mood entry:", error)
      toast({
        title: "Error",
        description: "Failed to save mood entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleViewMoodEntry = async (entryId: string) => {
    try {
      console.log("Viewing mood entry:", entryId)
      const entry = await getMoodEntry(entryId)
      setViewingMoodEntry(entry)
    } catch (error) {
      console.error("Error fetching mood entry:", error)
      toast({
        title: "Error",
        description: "Failed to load mood entry details. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMoodEntry = async (entryId: string) => {
    try {
      console.log("Deleting mood entry:", entryId)
      await deleteMoodEntry(entryId)

      toast({
        title: "Success",
        description: "Mood entry deleted successfully!",
      })

      // Refresh data
      const [history, analyticsData] = await Promise.all([
        getMoodHistory() as Promise<MoodEntry[]>,
        getMoodAnalytics() as Promise<MoodAnalytics>
      ])
      setMoodHistory(history)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Error deleting mood entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete mood entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const MoodIcon = getMoodIcon(currentMood[0])
  const EnergyIcon = getEnergyIcon(currentEnergy[0])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded-2xl w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white/20 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <MoodErrorBoundaryClass>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            Mood Tracking
          </h1>
          <p className="text-muted-foreground">
            Track your emotional well-being and discover patterns in your mental health journey
          </p>
        </div>

        <Tabs defaultValue="track" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 rounded-2xl">
            <TabsTrigger value="track" className="rounded-2xl">Track Mood</TabsTrigger>
            <TabsTrigger value="history" className="rounded-2xl">History</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-2xl">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="track" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Entry Form */}
              <Card className="glass border-white/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    How are you feeling?
                  </CardTitle>
                  <CardDescription>
                    Rate your current emotional state
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mood Slider */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Overall Mood</label>
                      <div className="flex items-center gap-2">
                        <MoodIcon className={`h-6 w-6 ${getMoodColor(currentMood[0])}`} />
                        <Badge variant="secondary" className="rounded-full">
                          {moodLabels[currentMood[0] as keyof typeof moodLabels]}
                        </Badge>
                      </div>
                    </div>
                    <Slider
                      value={currentMood}
                      onValueChange={setCurrentMood}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Very Low</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  {/* Energy Slider */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Energy Level</label>
                      <div className="flex items-center gap-2">
                        <EnergyIcon className="h-6 w-6 text-primary" />
                        <Badge variant="secondary" className="rounded-full">
                          {currentEnergy[0]}/10
                        </Badge>
                      </div>
                    </div>
                    <Slider
                      value={currentEnergy}
                      onValueChange={setCurrentEnergy}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Exhausted</span>
                      <span>Energized</span>
                    </div>
                  </div>

                  {/* Anxiety Slider */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Anxiety Level</label>
                      <Badge variant="secondary" className="rounded-full">
                        {currentAnxiety[0]}/10
                      </Badge>
                    </div>
                    <Slider
                      value={currentAnxiety}
                      onValueChange={setCurrentAnxiety}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Calm</span>
                      <span>Very Anxious</span>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What's on your mind? Any specific triggers or thoughts you'd like to record?"
                      className="rounded-2xl"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleSaveMoodEntry}
                    disabled={saving}
                    className="w-full rounded-2xl"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Mood Entry
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Calendar */}
              <Card className="glass border-white/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Select Date
                  </CardTitle>
                  <CardDescription>
                    Choose the date for your mood entry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-2xl border-0"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="glass border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Mood History
                </CardTitle>
                <CardDescription>
                  Your recent mood entries and patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moodHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No mood entries yet. Start tracking to see your history!</p>
                    </div>
                  ) : (
                    moodHistory.slice(0, 10).map((entry) => {
                      const EntryMoodIcon = getMoodIcon(entry.mood)
                      return (
                        <div key={entry.id} className="flex items-center gap-4 p-4 glass border-white/20 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <EntryMoodIcon className={`h-6 w-6 ${getMoodColor(entry.mood)}`} />
                            <div>
                              <p className="font-medium">
                                {entry.date.toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {moodLabels[entry.mood as keyof typeof moodLabels]}
                              </p>
                            </div>
                          </div>
                          <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Mood:</span>
                              <span className="ml-1 font-medium">{entry.mood}/10</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Energy:</span>
                              <span className="ml-1 font-medium">{entry.energy}/10</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Anxiety:</span>
                              <span className="ml-1 font-medium">{entry.anxiety}/10</span>
                            </div>
                          </div>
                          {entry.note && (
                            <div className="max-w-xs">
                              <p className="text-sm text-muted-foreground truncate">
                                {entry.note}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewMoodEntry(entry.id)}
                                  className="rounded-full"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-primary" />
                                    Mood Entry Details
                                  </DialogTitle>
                                  <DialogDescription>
                                    {viewingMoodEntry?.date.toLocaleDateString()}
                                  </DialogDescription>
                                </DialogHeader>
                                {viewingMoodEntry && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="text-center">
                                        <p className="text-2xl font-bold text-primary">{viewingMoodEntry.mood}/10</p>
                                        <p className="text-sm text-muted-foreground">Mood</p>
                                        <p className="text-xs">{moodLabels[viewingMoodEntry.mood as keyof typeof moodLabels]}</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-2xl font-bold text-primary">{viewingMoodEntry.energy}/10</p>
                                        <p className="text-sm text-muted-foreground">Energy</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-2xl font-bold text-primary">{viewingMoodEntry.anxiety}/10</p>
                                        <p className="text-sm text-muted-foreground">Anxiety</p>
                                      </div>
                                    </div>
                                    {viewingMoodEntry.note && (
                                      <div>
                                        <p className="text-sm font-medium mb-2">Notes:</p>
                                        <p className="text-sm text-muted-foreground p-3 glass border-white/20 rounded-2xl">
                                          {viewingMoodEntry.note}
                                        </p>
                                      </div>
                                    )}
                                    {viewingMoodEntry.tags.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium mb-2">Tags:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {viewingMoodEntry.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="rounded-full">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Mood Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this mood entry? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMoodEntry(entry.id)}
                                    className="rounded-2xl bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass border-white/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                          <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analytics.averageMood.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">Average Mood</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass border-white/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          analytics.moodTrend === 'improving' ? 'bg-green-500/20' :
                          analytics.moodTrend === 'declining' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                        }`}>
                          <TrendingUp className={`h-6 w-6 ${
                            analytics.moodTrend === 'improving' ? 'text-green-500' :
                            analytics.moodTrend === 'declining' ? 'text-red-500' : 'text-yellow-500'
                          }`} />
                        </div>
                        <div>
                          <p className="text-lg font-bold capitalize">{analytics.moodTrend}</p>
                          <p className="text-sm text-muted-foreground">Mood Trend</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass border-white/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
                          <BarChart3 className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analytics.weeklyData.length}</p>
                          <p className="text-sm text-muted-foreground">Entries This Week</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights */}
                <Card className="glass border-white/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Insights & Patterns
                    </CardTitle>
                    <CardDescription>
                      AI-generated insights based on your mood data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray(analytics.insights) && analytics.insights.length > 0 ? (
                      analytics.insights.map((insight, index) => (
                        <div key={index} className="p-4 glass border-white/20 rounded-2xl">
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No insights available yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Common Triggers */}
                {Array.isArray(analytics.commonTriggers) && analytics.commonTriggers.length > 0 && (
                  <Card className="glass border-white/30">
                    <CardHeader>
                      <CardTitle>Common Triggers</CardTitle>
                      <CardDescription>
                        Patterns identified from your mood entries
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analytics.commonTriggers.map((trigger, index) => (
                          <Badge key={index} variant="secondary" className="rounded-full">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MoodErrorBoundaryClass>
  )
}