import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  MessageCircle,
  Heart,
  BookOpen,
  MapPin,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Target,
  Award,
  History
} from "lucide-react"
import { getDashboardData } from "@/api/dashboard"
import { saveMoodEntry } from "@/api/mood"
import { toast } from "@/hooks/useToast"

interface DashboardData {
  todayMood: number
  weeklyMoodTrend: number[]
  recentJournalEntries: number
  therapySessionsThisWeek: number
  currentStreak: number
  quickStats: {
    totalSessions: number
    journalEntries: number
    moodCheckins: number
  }
}

const moodIcons = {
  low: CloudRain,
  medium: Cloud,
  high: Sun
}

const getMoodIcon = (mood: number) => {
  if (mood <= 3) return moodIcons.low
  if (mood <= 7) return moodIcons.medium
  return moodIcons.high
}

const getMoodColor = (mood: number) => {
  if (mood <= 3) return "text-blue-500"
  if (mood <= 7) return "text-yellow-500"
  return "text-orange-500"
}

const getMoodGradient = (mood: number) => {
  if (mood <= 3) return "from-blue-500/20 to-blue-600/20"
  if (mood <= 7) return "from-yellow-500/20 to-yellow-600/20"
  return "from-orange-500/20 to-orange-600/20"
}

const getMoodLabel = (mood: number) => {
  if (mood <= 3) return "Stormy"
  if (mood <= 7) return "Cloudy"
  return "Sunny"
}

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [todayMood, setTodayMood] = useState([5])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (hasFetched.current) return
      hasFetched.current = true
      
      try {
        console.log("Fetching dashboard data...")
        const data = await getDashboardData() as DashboardData
        setDashboardData(data)
        setTodayMood([data.todayMood])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleMoodChange = (value: number[]) => {
    setTodayMood(value)
    console.log("Mood updated to:", value[0])
  }

  const handleSaveMood = async () => {
    try {
      await saveMoodEntry({
        date: new Date(),
        mood: todayMood[0],
        energy: 5, // default value, or you can add a slider for this
        anxiety: 5, // default value, or you can add a slider for this
        tags: []
      })
      toast({ title: "Mood Saved", description: "Your mood check-in has been saved!" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save mood." })
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gradient-to-r from-white/20 to-white/10 rounded-3xl w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gradient-to-br from-white/20 to-white/10 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const MoodIcon = getMoodIcon(todayMood[0])

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="space-y-4 slide-in-up">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-3xl bg-gradient-to-br from-primary/20 to-chart-2/20 floating-animation">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gradient">
              Welcome back to Cura
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              How are you feeling today? Let's check in with your wellness journey.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Mood Check-in */}
      <Card className="glass border-white/30 card-hover fade-in-scale overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${getMoodGradient(todayMood[0])} opacity-50`}></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-2xl bg-white/20">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            Today's Mood Check-in
          </CardTitle>
          <CardDescription className="text-base">
            How are you feeling on a scale from stormy to sunny?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 relative">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-6 w-full max-w-md">
              <div className="flex justify-center">
                <div className="p-6 rounded-full bg-white/20 backdrop-blur-sm">
                  <MoodIcon className={`h-20 w-20 ${getMoodColor(todayMood[0])}`} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <p className="text-3xl font-bold">{getMoodLabel(todayMood[0])}</p>
                  <Badge variant="secondary" className="rounded-full px-4 py-2 text-sm font-semibold">
                    {todayMood[0]}/10
                  </Badge>
                </div>
                <div className="px-6">
                  <Slider
                    value={todayMood}
                    onValueChange={handleMoodChange}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground px-6 font-medium">
                  <span>Stormy</span>
                  <span>Sunny</span>
                </div>
                <div className="flex justify-center mt-4">
                  <Button onClick={handleSaveMood} className="rounded-2xl px-8 py-2 font-semibold" variant="default">
                    Save Mood
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            to: "/chat",
            icon: MessageCircle,
            title: "Start Therapy Session",
            description: "Chat with your AI therapist",
            gradient: "from-blue-500/20 to-blue-600/20",
            iconBg: "bg-blue-500/20"
          },
          {
            to: "/journal",
            icon: BookOpen,
            title: "New Journal Entry",
            description: "Express your thoughts",
            gradient: "from-purple-500/20 to-purple-600/20",
            iconBg: "bg-purple-500/20"
          },
          {
            to: "/resources",
            icon: MapPin,
            title: "Find Resources",
            description: "Local mental health support",
            gradient: "from-green-500/20 to-green-600/20",
            iconBg: "bg-green-500/20"
          }
        ].map((item, index) => (
          <Link key={item.to} to={item.to} className="slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <Card className="glass border-white/30 card-hover cursor-pointer group overflow-hidden h-full">
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <CardContent className="p-8 relative">
                <div className="flex items-center gap-6">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${item.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        <Card className="glass border-white/30 hover:border-primary/30 transition-all duration-300 cursor-pointer group" onClick={() => navigate('/chat/history')}>
          <CardContent className="p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto group-hover:bg-primary/30 transition-colors">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Chat History</h3>
              <p className="text-sm text-muted-foreground">View past therapy sessions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Award,
              value: dashboardData.currentStreak,
              label: "Day Streak",
              gradient: "from-green-500/20 to-green-600/20",
              iconColor: "text-green-500"
            },
            {
              icon: MessageCircle,
              value: dashboardData.quickStats.totalSessions,
              label: "Total Sessions",
              gradient: "from-blue-500/20 to-blue-600/20",
              iconColor: "text-blue-500"
            },
            {
              icon: BookOpen,
              value: dashboardData.quickStats.journalEntries,
              label: "Journal Entries",
              gradient: "from-purple-500/20 to-purple-600/20",
              iconColor: "text-purple-500"
            },
            {
              icon: Heart,
              value: dashboardData.quickStats.moodCheckins,
              label: "Mood Check-ins",
              gradient: "from-orange-500/20 to-orange-600/20",
              iconColor: "text-orange-500"
            }
          ].map((stat, index) => (
            <Card key={stat.label} className="glass border-white/30 card-hover overflow-hidden slide-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`}></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20">
                    <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weekly Progress */}
      {dashboardData && (
        <Card className="glass border-white/30 card-hover fade-in-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-2xl bg-primary/20">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              This Week's Progress
            </CardTitle>
            <CardDescription className="text-base">
              Your wellness journey over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="font-semibold">Therapy Sessions</span>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold">
                  {dashboardData.therapySessionsThisWeek}/7
                </Badge>
              </div>
              <Progress value={(dashboardData.therapySessionsThisWeek / 7) * 100} className="h-3 rounded-full" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="font-semibold">Journal Entries</span>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold">
                  {dashboardData.recentJournalEntries}/7
                </Badge>
              </div>
              <Progress value={(dashboardData.recentJournalEntries / 7) * 100} className="h-3 rounded-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}