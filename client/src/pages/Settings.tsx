import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Volume2,
  Moon,
  Sun,
  Smartphone,
  Save,
  Trash2,
  Download,
  Upload,
  UserPlus,
  Phone,
  Mail,
  Star,
  Edit,
  Plus
} from "lucide-react"
import { useTheme } from "@/components/ui/theme-provider"
import { getSettings, updateSettings, exportData, deleteAccount } from "@/api/settings"
import {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  setPrimaryEmergencyContact
} from "@/api/emergencyContacts"

interface UserSettings {
  profile: {
    name: string
    email: string
    timezone: string
    language: string
  }
  notifications: {
    dailyReminders: boolean
    moodCheckIns: boolean
    journalPrompts: boolean
    crisisAlerts: boolean
    emailNotifications: boolean
    pushNotifications: boolean
  }
  privacy: {
    dataSharing: boolean
    analytics: boolean
    crashReports: boolean
    locationServices: boolean
  }
  preferences: {
    theme: "light" | "dark" | "system"
    voiceEnabled: boolean
    videoEnabled: boolean
    autoSave: boolean
    reminderTime: string
    sessionLength: number
  }
}

interface EmergencyContact {
  _id?: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" }
]

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney"
]

export function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    notes: ''
  })
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user, setUser } = useAuth()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log("Fetching user settings...")
        const userSettings = await getSettings() as UserSettings
        setSettings(userSettings)
      } catch (error: any) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load settings",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  useEffect(() => {
    const fetchEmergencyContacts = async () => {
      if (!user?._id) return

      setContactsLoading(true)
      try {
        console.log("Fetching emergency contacts...")
        const response = await getEmergencyContacts(user._id)
        setEmergencyContacts(response.contacts || [])
      } catch (error: any) {
        console.error("Error fetching emergency contacts:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load emergency contacts",
          variant: "destructive"
        })
      } finally {
        setContactsLoading(false)
      }
    }

    fetchEmergencyContacts()
  }, [user, toast])

  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      console.log("Saving settings:", settings)
      const result = await updateSettings(settings)
      toast({
        title: "Success",
        description: result.message || "Settings updated successfully",
      })
      // Update AuthContext user with new name and email
      setUser(user ? {
        ...user,
        name: settings.profile.name,
        email: settings.profile.email
      } : user)
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddContact = async () => {
    if (!user?._id || !newContact.name || !newContact.relationship || !newContact.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      console.log("Adding emergency contact:", newContact)
      const response = await createEmergencyContact(user._id, newContact as Omit<EmergencyContact, '_id' | 'createdAt' | 'updatedAt'>)
      setEmergencyContacts((prev: any[]) => [...prev, response.contact])
      setNewContact({ name: '', relationship: '', phone: '', email: '', notes: '' })
      setShowAddContact(false)
      toast({
        title: "Success",
        description: "Emergency contact added successfully",
      })
    } catch (error: any) {
      console.error("Error adding emergency contact:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add emergency contact",
        variant: "destructive"
      })
    }
  }

  const handleSetPrimary = async (contactId: string) => {
    if (!user?._id) return

    try {
      console.log("Setting primary contact:", contactId)
      await setPrimaryEmergencyContact(user._id, contactId)
      setEmergencyContacts((prev: any[]) => prev.map((contact: any) => ({
        ...contact,
        isPrimary: contact._id === contactId
      })))
      toast({
        title: "Success",
        description: "Primary contact updated successfully",
      })
    } catch (error: any) {
      console.error("Error setting primary contact:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to set primary contact",
        variant: "destructive"
      })
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!user?._id) return

    if (!window.confirm("Are you sure you want to delete this emergency contact?")) {
      return
    }

    try {
      console.log("Deleting emergency contact:", contactId)
      await deleteEmergencyContact(user._id, contactId)
      setEmergencyContacts((prev: any[]) => prev.filter((contact: any) => contact._id !== contactId))
      toast({
        title: "Success",
        description: "Emergency contact deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting emergency contact:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete emergency contact",
        variant: "destructive"
      })
    }
  }

  const handleExportData = async () => {
    try {
      console.log("Exporting user data...")
      await exportData()
      toast({
        title: "Success",
        description: "Data export started successfully",
      })
    } catch (error: any) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to export data",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        console.log("Deleting user account...")
        const result = await deleteAccount()
        toast({
          title: "Success",
          description: (result as any).message || "Account deletion initiated",
        })
      } catch (error: any) {
        console.error("Error deleting account:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete account",
          variant: "destructive"
        })
      }
    }
  }

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    if (!settings) return
    setSettings(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    } : null)
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

  if (!settings) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your Cura experience and manage your preferences
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="rounded-2xl"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </div>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl">
          <TabsTrigger value="profile" className="rounded-2xl">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-2xl">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-2xl">Privacy</TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-2xl">Preferences</TabsTrigger>
          <TabsTrigger value="emergency" className="rounded-2xl">Emergency Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.profile.name}
                    onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                    className="rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.profile.language}
                    onValueChange={(value) => updateSetting('profile', 'language', value)}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.profile.timezone}
                    onValueChange={(value) => updateSetting('profile', 'timezone', value)}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how and when you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="daily-reminders">Daily Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded to check in with your mood</p>
                  </div>
                  <Switch
                    id="daily-reminders"
                    checked={settings.notifications.dailyReminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'dailyReminders', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mood-checkins">Mood Check-ins</Label>
                    <p className="text-sm text-muted-foreground">Reminders to track your mood</p>
                  </div>
                  <Switch
                    id="mood-checkins"
                    checked={settings.notifications.moodCheckIns}
                    onCheckedChange={(checked) => updateSetting('notifications', 'moodCheckIns', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="journal-prompts">Journal Prompts</Label>
                    <p className="text-sm text-muted-foreground">Daily writing prompts and inspiration</p>
                  </div>
                  <Switch
                    id="journal-prompts"
                    checked={settings.notifications.journalPrompts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'journalPrompts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="crisis-alerts">Crisis Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important safety notifications</p>
                  </div>
                  <Switch
                    id="crisis-alerts"
                    checked={settings.notifications.crisisAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'crisisAlerts', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'pushNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control how your data is used and shared
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="data-sharing">Data Sharing</Label>
                    <p className="text-sm text-muted-foreground">Share anonymized data to improve mental health research</p>
                  </div>
                  <Switch
                    id="data-sharing"
                    checked={settings.privacy.dataSharing}
                    onCheckedChange={(checked) => updateSetting('privacy', 'dataSharing', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <p className="text-sm text-muted-foreground">Help us improve the app with usage data</p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) => updateSetting('privacy', 'analytics', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="crash-reports">Crash Reports</Label>
                    <p className="text-sm text-muted-foreground">Automatically send crash reports to help fix bugs</p>
                  </div>
                  <Switch
                    id="crash-reports"
                    checked={settings.privacy.crashReports}
                    onCheckedChange={(checked) => updateSetting('privacy', 'crashReports', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="location-services">Location Services</Label>
                    <p className="text-sm text-muted-foreground">Use location to find nearby mental health resources</p>
                  </div>
                  <Switch
                    id="location-services"
                    checked={settings.privacy.locationServices}
                    onCheckedChange={(checked) => updateSetting('privacy', 'locationServices', checked)}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/20 space-y-4">
                <h3 className="font-semibold">Data Management</h3>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="rounded-2xl"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="rounded-2xl"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="glass border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                App Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience and interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="rounded-2xl"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="rounded-2xl"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="rounded-2xl"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="voice-enabled">Voice Features</Label>
                    <p className="text-sm text-muted-foreground">Enable voice therapy and voice journaling</p>
                  </div>
                  <Switch
                    id="voice-enabled"
                    checked={settings.preferences.voiceEnabled}
                    onCheckedChange={(checked) => updateSetting('preferences', 'voiceEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="video-enabled">Video Features</Label>
                    <p className="text-sm text-muted-foreground">Enable video therapy sessions</p>
                  </div>
                  <Switch
                    id="video-enabled"
                    checked={settings.preferences.videoEnabled}
                    onCheckedChange={(checked) => updateSetting('preferences', 'videoEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save">Auto-save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save journal entries and mood data</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.preferences.autoSave}
                    onCheckedChange={(checked) => updateSetting('preferences', 'autoSave', checked)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={settings.preferences.reminderTime}
                    onChange={(e) => updateSetting('preferences', 'reminderTime', e.target.value)}
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Default Session Length (minutes)</Label>
                  <div className="px-4">
                    <Slider
                      value={[settings.preferences.sessionLength]}
                      onValueChange={(value) => updateSetting('preferences', 'sessionLength', value[0])}
                      max={60}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>5 min</span>
                    <Badge variant="secondary" className="rounded-full">
                      {settings.preferences.sessionLength} minutes
                    </Badge>
                    <span>60 min</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <Card className="glass border-white/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Emergency Contacts
                  </CardTitle>
                  <CardDescription>
                    Manage your emergency contacts for crisis situations
                  </CardDescription>
                </div>
                <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                  <DialogTrigger asChild>
                    <Button className="rounded-2xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Emergency Contact</DialogTitle>
                      <DialogDescription>
                        Add a new emergency contact who can be reached during crisis situations.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Name *</Label>
                        <Input
                          id="contact-name"
                          value={newContact.name || ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                          className="rounded-2xl"
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-relationship">Relationship *</Label>
                        <Input
                          id="contact-relationship"
                          value={newContact.relationship || ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                          className="rounded-2xl"
                          placeholder="e.g., Family, Friend, Therapist"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone">Phone *</Label>
                        <Input
                          id="contact-phone"
                          value={newContact.phone || ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                          className="rounded-2xl"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Email</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={newContact.email || ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                          className="rounded-2xl"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-notes">Notes</Label>
                        <Input
                          id="contact-notes"
                          value={newContact.notes || ''}
                          onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                          className="rounded-2xl"
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddContact(false)}
                        className="rounded-2xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddContact}
                        className="rounded-2xl"
                      >
                        Add Contact
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {contactsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-white/20 rounded-2xl mb-2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                emergencyContacts.map((contact) => (
                  <div key={contact._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <span>{contact.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSetPrimary(contact._id || '')}
                      >
                        {contact.isPrimary ? (
                          <User className="h-4 w-4 text-primary" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteContact(contact._id || '')}
                      >
                        <Trash2 className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Emergency Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => { if (!open) setEditingContact(null) }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Emergency Contact</DialogTitle>
            <DialogDescription>
              Update the details for this emergency contact.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contact-name">Name *</Label>
                <Input
                  id="edit-contact-name"
                  value={editingContact.name}
                  onChange={e => setEditingContact({ ...editingContact, name: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Enter contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-relationship">Relationship *</Label>
                <Input
                  id="edit-contact-relationship"
                  value={editingContact.relationship}
                  onChange={e => setEditingContact({ ...editingContact, relationship: e.target.value })}
                  className="rounded-2xl"
                  placeholder="e.g., Family, Friend, Therapist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-phone">Phone *</Label>
                <Input
                  id="edit-contact-phone"
                  value={editingContact.phone}
                  onChange={e => setEditingContact({ ...editingContact, phone: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-email">Email</Label>
                <Input
                  id="edit-contact-email"
                  type="email"
                  value={editingContact.email || ''}
                  onChange={e => setEditingContact({ ...editingContact, email: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-notes">Notes</Label>
                <Input
                  id="edit-contact-notes"
                  value={editingContact.notes || ''}
                  onChange={e => setEditingContact({ ...editingContact, notes: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Additional notes"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingContact(null)}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!editingContact || !user) return;
                try {
                  const updated = await updateEmergencyContact(user._id, editingContact._id!, editingContact);
                  setEmergencyContacts((prev: any[]) => prev.map((c: any) => c._id === editingContact._id ? updated.contact : c));
                  setEditingContact(null);
                  toast({ title: "Contact updated", description: "Emergency contact updated successfully" });
                } catch (error: any) {
                  toast({ variant: "destructive", title: "Update failed", description: error.message || "Failed to update contact" });
                }
              }}
              className="rounded-2xl"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}