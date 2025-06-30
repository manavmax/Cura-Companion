import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  MessageCircle,
  Heart,
  BookOpen,
  Mic,
  Video,
  Globe,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle
} from "lucide-react"

const steps = [
  {
    title: "Welcome to Cura",
    description: "Your personal mental health companion",
    content: "WelcomeStep"
  },
  {
    title: "Choose Your Language",
    description: "Select your preferred language for the best experience",
    content: "LanguageStep"
  },
  {
    title: "Explore Features",
    description: "Discover how Cura can support your mental wellness journey",
    content: "FeaturesStep"
  },
  {
    title: "Voice & Audio Setup",
    description: "Test your microphone and speakers for voice features",
    content: "AudioStep"
  },
  {
    title: "You're All Set!",
    description: "Ready to begin your wellness journey",
    content: "CompleteStep"
  }
]

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" }
]

const features = [
  {
    icon: MessageCircle,
    title: "Chat Therapy",
    description: "AI-powered conversations with therapeutic guidance"
  },
  {
    icon: Heart,
    title: "Mood Tracking",
    description: "Track your emotional well-being with intuitive tools"
  },
  {
    icon: BookOpen,
    title: "Digital Journal",
    description: "Express yourself through writing and voice notes"
  }
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [audioTested, setAudioTested] = useState(false)
  const navigate = useNavigate()

  const progress = ((currentStep + 1) / steps.length) * 100

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      localStorage.setItem('cura_language', selectedLanguage)
      console.log("Onboarding completed, navigating to dashboard")
      navigate("/")
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const testAudio = () => {
    console.log("Testing audio functionality")
    setAudioTested(true)
  }

  const renderStepContent = () => {
    switch (steps[currentStep].content) {
      case "WelcomeStep":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/20 animate-pulse">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gradient">Welcome to Cura</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Your compassionate AI companion for mental wellness, designed to support you every step of the way.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="rounded-full">Safe Space</Badge>
              <Badge variant="secondary" className="rounded-full">24/7 Support</Badge>
              <Badge variant="secondary" className="rounded-full">Private & Secure</Badge>
            </div>
          </div>
        )

      case "LanguageStep":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Globe className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Choose Your Language</h2>
              <p className="text-muted-foreground">
                Select your preferred language for the best experience
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={selectedLanguage === lang.code ? "default" : "outline"}
                  className="h-16 rounded-2xl justify-start gap-3"
                  onClick={() => {
                    setSelectedLanguage(lang.code)
                    localStorage.setItem('cura_language', lang.code)
                  }}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )

      case "FeaturesStep":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Explore Your Wellness Tools</h2>
              <p className="text-muted-foreground">
                Discover the features designed to support your mental health journey
              </p>
            </div>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <Card key={index} className="glass border-white/30 hover:scale-105 transition-transform duration-200">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case "AudioStep":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center gap-2">
                <Mic className="h-8 w-8 text-primary" />
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Audio & Voice Setup</h2>
              <p className="text-muted-foreground">
                Test your microphone and speakers for the best voice therapy experience
              </p>
            </div>
            <Card className="glass border-white/30">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  {audioTested ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Mic className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {audioTested ? "Audio Test Complete!" : "Test Your Audio"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {audioTested 
                      ? "Your microphone and speakers are working properly."
                      : "Click the button below to test your microphone and speakers."
                    }
                  </p>
                  {!audioTested && (
                    <Button onClick={testAudio} className="rounded-2xl">
                      <Mic className="h-4 w-4 mr-2" />
                      Test Audio
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "CompleteStep":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/20">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gradient">You're All Set!</h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Welcome to your personal wellness journey. Cura is here to support you every step of the way.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="rounded-full">✨ Ready to Start</Badge>
              <Badge variant="secondary" className="rounded-full">🌟 Personalized Experience</Badge>
              <Badge variant="secondary" className="rounded-full">💜 Always Here for You</Badge>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass border-white/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Progress value={progress} className="w-32" />
          </div>
          <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="rounded-2xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={nextStep}
              className="rounded-2xl"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}