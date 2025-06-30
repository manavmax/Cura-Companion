import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Heart,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Shield,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Star
} from "lucide-react"
import { getCrisisData, analyzeCrisisRisk, getCrisisHistory } from "@/api/crisis"
import { getEmergencyContacts } from "@/api/emergencyContacts"

interface CrisisData {
  riskLevel: "low" | "moderate" | "high" | "critical"
  riskScore: number
  factors: {
    moodTrends: {
      score: number
      trend: "improving" | "stable" | "declining"
      description: string
    }
    journalSentiment: {
      score: number
      sentiment: "positive" | "neutral" | "negative"
      description: string
    }
    behaviorPatterns: {
      score: number
      patterns: string[]
      description: string
    }
    socialEngagement: {
      score: number
      level: "high" | "moderate" | "low"
      description: string
    }
  }
  recommendations: string[]
  lastUpdated: string
}

interface CrisisEvent {
  _id: string
  timestamp: string
  riskLevel: string
  riskScore: number
  triggers: string[]
  actions: string[]
  resolved: boolean
  notes?: string
}

interface EmergencyContact {
  _id: string
  name: string
  relationship: string
  phone: string
  email?: string
  isPrimary: boolean
}

const riskLevelColors = {
  low: "bg-green-500/20 text-green-700 border-green-500/30",
  moderate: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  critical: "bg-red-500/20 text-red-700 border-red-500/30"
}

const riskLevelIcons = {
  low: CheckCircle,
  moderate: AlertCircle,
  high: AlertTriangle,
  critical: XCircle
}

export function CrisisDetection() {
  const [crisisData, setCrisisData] = useState<CrisisData | null>(null)
  const [crisisHistory, setCrisisHistory] = useState<CrisisEvent[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchCrisisData = async () => {
      if (!user?._id) return

      setLoading(true)
      try {
        console.log("Fetching crisis detection data...")
        
        // Fetch current crisis data
        const crisisResponse = await getCrisisData(user._id)
        setCrisisData(crisisResponse.data)
        
        // Fetch crisis history
        const historyResponse = await getCrisisHistory(user._id)
        setCrisisHistory(historyResponse.history || [])
        
        // Fetch emergency contacts
        const contactsResponse = await getEmergencyContacts(user._id)
        setEmergencyContacts(contactsResponse.contacts || [])
        
        console.log("Crisis data loaded successfully")
      } catch (error: any) {
        console.error("Error fetching crisis data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load crisis detection data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCrisisData()
  }, [user, toast])

  const handleAnalyzeCrisis = async () => {
    if (!user?._id) return

    setAnalyzing(true)
    try {
      console.log("Analyzing crisis risk...")
      const response = await analyzeCrisisRisk(user._id)
      setCrisisData(response.data)
      toast({
        title: "Analysis Complete",
        description: "Crisis risk analysis has been updated",
      })
    } catch (error: any) {
      console.error("Error analyzing crisis risk:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to analyze crisis risk",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleContactEmergency = (contact: EmergencyContact) => {
    console.log(`Calling: ${contact.phone}`)
    window.open(`tel:${contact.phone}`)
    toast({
      title: "Emergency Contact",
      description: `Calling ${contact.name}...`,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded-2xl w-1/3"></div>
          <div className="grid grid-cols-1 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/20 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!crisisData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Crisis Data Available</h3>
          <p className="text-muted-foreground mb-4">
            We need more data to perform crisis detection analysis.
          </p>
          <Button onClick={handleAnalyzeCrisis} disabled={analyzing} className="rounded-2xl">
            {analyzing ? "Analyzing..." : "Start Analysis"}
          </Button>
        </div>
      </div>
    )
  }

  const RiskIcon = riskLevelIcons[crisisData.riskLevel]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Crisis Detection
          </h1>
          <p className="text-muted-foreground">
            AI-powered mental health crisis detection and prevention
          </p>
        </div>

        <Button
          onClick={handleAnalyzeCrisis}
          disabled={analyzing}
          className="rounded-2xl"
        >
          {analyzing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Analyzing...
            </div>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Analyze Now
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-2xl">Overview</TabsTrigger>
          <TabsTrigger value="factors" className="rounded-2xl">Risk Factors</TabsTrigger>
          <TabsTrigger value="history" className="rounded-2xl">History</TabsTrigger>
          <TabsTrigger value="emergency" className="rounded-2xl">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Risk Level */}
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RiskIcon className="h-5 w-5" />
                Current Risk Assessment
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(crisisData.lastUpdated).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Badge 
                    variant="outline" 
                    className={`${riskLevelColors[crisisData.riskLevel]} text-lg px-4 py-2 rounded-2xl capitalize`}
                  >
                    {crisisData.riskLevel} Risk
                  </Badge>
                  <div className="text-2xl font-bold">
                    Risk Score: {crisisData.riskScore}/100
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-2">Risk Level</div>
                  <Progress 
                    value={crisisData.riskScore} 
                    className="w-32 h-3 rounded-full"
                  />
                </div>
              </div>

              {crisisData.riskLevel === "high" || crisisData.riskLevel === "critical" ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    Immediate Attention Required
                  </div>
                  <p className="text-sm text-red-600 mb-3">
                    Your current risk level indicates you may need immediate support. Please consider reaching out to a mental health professional or emergency contact.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" className="rounded-2xl">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Crisis Hotline
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-2xl">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat Support
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Personalized suggestions based on your current risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {crisisData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood Trends */}
            <Card className="glass border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Mood Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <Badge variant="outline" className="rounded-full">
                    {crisisData.factors.moodTrends.score}/100
                  </Badge>
                </div>
                <Progress value={crisisData.factors.moodTrends.score} className="h-2 rounded-full" />
                <div className="flex items-center gap-2">
                  {crisisData.factors.moodTrends.trend === "improving" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : crisisData.factors.moodTrends.trend === "declining" ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Activity className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm capitalize">{crisisData.factors.moodTrends.trend}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {crisisData.factors.moodTrends.description}
                </p>
              </CardContent>
            </Card>

            {/* Journal Sentiment */}
            <Card className="glass border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Journal Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <Badge variant="outline" className="rounded-full">
                    {crisisData.factors.journalSentiment.score}/100
                  </Badge>
                </div>
                <Progress value={crisisData.factors.journalSentiment.score} className="h-2 rounded-full" />
                <div className="flex items-center gap-2">
                  <Heart className={`h-4 w-4 ${
                    crisisData.factors.journalSentiment.sentiment === "positive" ? "text-green-500" :
                    crisisData.factors.journalSentiment.sentiment === "negative" ? "text-red-500" :
                    "text-yellow-500"
                  }`} />
                  <span className="text-sm capitalize">{crisisData.factors.journalSentiment.sentiment}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {crisisData.factors.journalSentiment.description}
                </p>
              </CardContent>
            </Card>

            {/* Behavior Patterns */}
            <Card className="glass border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Behavior Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <Badge variant="outline" className="rounded-full">
                    {crisisData.factors.behaviorPatterns.score}/100
                  </Badge>
                </div>
                <Progress value={crisisData.factors.behaviorPatterns.score} className="h-2 rounded-full" />
                <div className="space-y-2">
                  {crisisData.factors.behaviorPatterns.patterns.map((pattern, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{pattern}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {crisisData.factors.behaviorPatterns.description}
                </p>
              </CardContent>
            </Card>

            {/* Social Engagement */}
            <Card className="glass border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Social Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <Badge variant="outline" className="rounded-full">
                    {crisisData.factors.socialEngagement.score}/100
                  </Badge>
                </div>
                <Progress value={crisisData.factors.socialEngagement.score} className="h-2 rounded-full" />
                <div className="flex items-center gap-2">
                  <Users className={`h-4 w-4 ${
                    crisisData.factors.socialEngagement.level === "high" ? "text-green-500" :
                    crisisData.factors.socialEngagement.level === "low" ? "text-red-500" :
                    "text-yellow-500"
                  }`} />
                  <span className="text-sm capitalize">{crisisData.factors.socialEngagement.level} Engagement</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {crisisData.factors.socialEngagement.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Crisis History
              </CardTitle>
              <CardDescription>
                Track your mental health risk patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {crisisHistory.length === 0 ? (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No crisis events recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {crisisHistory.map((event) => (
                    <div key={event._id} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                      <div className="flex-shrink-0">
                        <Badge 
                          variant="outline" 
                          className={`${riskLevelColors[event.riskLevel as keyof typeof riskLevelColors]} rounded-full`}
                        >
                          {event.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(event.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <strong>Risk Score:</strong> {event.riskScore}/100
                        </div>
                        {event.triggers.length > 0 && (
                          <div className="text-sm">
                            <strong>Triggers:</strong> {event.triggers.join(", ")}
                          </div>
                        )}
                        {event.actions.length > 0 && (
                          <div className="text-sm">
                            <strong>Actions Taken:</strong> {event.actions.join(", ")}
                          </div>
                        )}
                        {event.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {event.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {event.resolved ? (
                            <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30 rounded-full">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              Ongoing
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                Quick access to your emergency contacts during crisis situations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emergencyContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No emergency contacts configured</p>
                  <Button variant="outline" className="rounded-2xl">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Emergency Contact
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {emergencyContacts.map((contact) => (
                    <div key={contact._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{contact.name}</h3>
                            {contact.isPrimary && (
                              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 rounded-full">
                                <Star className="h-3 w-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                          <p className="text-sm">{contact.phone}</p>
                          {contact.email && (
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleContactEmergency(contact)}
                          className="rounded-2xl"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        {contact.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`mailto:${contact.email}`)}
                            className="rounded-2xl"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crisis Hotlines */}
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Crisis Hotlines
              </CardTitle>
              <CardDescription>
                24/7 professional crisis support services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div>
                    <h3 className="font-semibold">National Suicide Prevention Lifeline</h3>
                    <p className="text-sm text-muted-foreground">24/7 crisis support</p>
                    <p className="text-sm font-mono">988</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => window.open("tel:988")}
                    className="rounded-2xl"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div>
                    <h3 className="font-semibold">Crisis Text Line</h3>
                    <p className="text-sm text-muted-foreground">Text-based crisis support</p>
                    <p className="text-sm font-mono">Text HOME to 741741</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open("sms:741741?body=HOME")}
                    className="rounded-2xl"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Text Now
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div>
                    <h3 className="font-semibold">Emergency Services</h3>
                    <p className="text-sm text-muted-foreground">For immediate medical emergencies</p>
                    <p className="text-sm font-mono">911</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => window.open("tel:911")}
                    className="rounded-2xl"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call 911
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}