import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Search,
  ExternalLink,
  Heart,
  Users,
  Building,
  AlertTriangle,
  MessageCircle,
  Navigation
} from "lucide-react"
import { getLocalResources, getCrisisResources, getOnlineResources } from "@/api/resources"
import { toast } from "@/hooks/useToast"

interface Resource {
  id: string
  name: string
  type: "therapist" | "clinic" | "support_group" | "crisis" | "online"
  address?: string
  phone: string
  website?: string
  description: string
  rating?: number
  hours?: string
  distance?: number
  specialties: string[]
  acceptsInsurance: boolean
  cost: "free" | "low" | "moderate" | "high"
}

const resourceIcons = {
  therapist: Users,
  clinic: Building,
  support_group: Heart,
  crisis: AlertTriangle,
  online: MessageCircle
}

const costColors = {
  free: "bg-green-500/20 text-green-700",
  low: "bg-blue-500/20 text-blue-700",
  moderate: "bg-yellow-500/20 text-yellow-700",
  high: "bg-red-500/20 text-red-700"
}

export function Resources() {
  const [localResources, setLocalResources] = useState<Resource[]>([])
  const [crisisResources, setCrisisResources] = useState<Resource[]>([])
  const [onlineResources, setOnlineResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [userCountry, setUserCountry] = useState<string | null>(null)

  useEffect(() => {
    const fetchResources = async (lat?: number, lng?: number) => {
      try {
        let countryCode: string | null = null
        if (lat && lng) {
          // Use OpenStreetMap Nominatim for reverse geocoding
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          const response = await fetch(url, { headers: { 'User-Agent': 'CuraCompanion/1.0' } })
          const data = await response.json()
          countryCode = data.address && data.address.country_code ? data.address.country_code.toUpperCase() : null
          setUserCountry(countryCode)
        }
        const [local, crisis, online] = await Promise.all([
          getLocalResources(lat, lng) as Promise<Resource[]>,
          getCrisisResources(lat, lng) as Promise<Resource[]>,
          getOnlineResources(countryCode) as Promise<Resource[]>
        ])
        setLocalResources(local)
        setCrisisResources(crisis)
        setOnlineResources(online)
      } catch (error) {
        console.error("Error fetching resources:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to detect your country or fetch resources."
        })
      } finally {
        setLoading(false)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchResources(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Location Denied",
            description: "Showing online resources only. Enable location for local results."
          })
          fetchResources()
        },
        { timeout: 5000 }
      )
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation."
      })
      fetchResources()
    }
  }, [])

  const filterResources = (resources: Resource[]) => {
    return resources.filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.specialties.some(specialty =>
                             specialty.toLowerCase().includes(searchTerm.toLowerCase())
                           )
      const matchesType = selectedType === "all" || resource.type === selectedType
      return matchesSearch && matchesType
    })
  }

  const handleCall = (phone: string) => {
    console.log("Calling:", phone)
    window.open(`tel:${phone}`)
  }

  const handleWebsite = (website: string) => {
    console.log("Opening website:", website)
    window.open(website, '_blank')
  }

  const handleDirections = (address: string) => {
    console.log("Getting directions to:", address)
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded-2xl w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-white/20 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
          <MapPin className="h-8 w-8 text-primary" />
          Mental Health Resources
        </h1>
        <p className="text-muted-foreground">
          Find local therapists, support groups, and crisis resources in your area
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="glass border-white/30">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search resources, specialties, or locations..."
              className="pl-10 rounded-2xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
              className="rounded-full"
            >
              All Resources
            </Button>
            <Button
              variant={selectedType === "therapist" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("therapist")}
              className="rounded-full"
            >
              Therapists
            </Button>
            <Button
              variant={selectedType === "clinic" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("clinic")}
              className="rounded-full"
            >
              Clinics
            </Button>
            <Button
              variant={selectedType === "support_group" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("support_group")}
              className="rounded-full"
            >
              Support Groups
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="local" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="local" className="rounded-2xl">Local Resources</TabsTrigger>
          <TabsTrigger value="crisis" className="rounded-2xl">Crisis Support</TabsTrigger>
          <TabsTrigger value="online" className="rounded-2xl">Online Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterResources(localResources).length === 0 ? (
              <div className="col-span-full text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No resources found matching your search." : "No local resources available."}
                </p>
              </div>
            ) : (
              filterResources(localResources).map((resource) => {
                const Icon = resourceIcons[resource.type]
                return (
                  <Card key={resource.id} className="glass border-white/30 hover:scale-105 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{resource.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {resource.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs">{resource.rating}</span>
                                </div>
                              )}
                              {resource.distance && (
                                <span className="text-xs">{resource.distance} miles away</span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={`rounded-full text-xs ${costColors[resource.cost]}`}>
                          {resource.cost}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{resource.description}</p>

                      {resource.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {resource.specialties.slice(0, 3).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs rounded-full">
                              {specialty}
                            </Badge>
                          ))}
                          {resource.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs rounded-full">
                              +{resource.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {resource.hours && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {resource.hours}
                        </div>
                      )}

                      {resource.acceptsInsurance && (
                        <Badge variant="secondary" className="rounded-full text-xs">
                          Accepts Insurance
                        </Badge>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCall(resource.phone)}
                          className="rounded-2xl flex-1"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        {resource.address && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDirections(resource.address!)}
                            className="rounded-2xl"
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        )}
                        {resource.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWebsite(resource.website!)}
                            className="rounded-2xl"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="crisis" className="space-y-6">
          <Card className="glass border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Emergency Crisis Support
              </CardTitle>
              <CardDescription>
                If you're in immediate danger or having thoughts of self-harm, please reach out immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crisisResources.length === 0 && (
                  <Button
                    variant="destructive"
                    className="rounded-2xl h-16"
                    disabled
                  >
                    <div className="text-center">
                      <Phone className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm font-semibold">No Crisis Helpline</div>
                      <div className="text-xs">Unavailable</div>
                    </div>
                  </Button>
                )}
                {crisisResources.slice(0, 2).map((helpline, idx) => (
                  <Button
                    key={helpline.id}
                    variant={idx === 0 ? "destructive" : "outline"}
                    onClick={() => handleCall(helpline.phone)}
                    className="rounded-2xl h-16"
                  >
                    <div className="text-center">
                      <Phone className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm font-semibold">{helpline.name}</div>
                      <div className="text-xs">{helpline.phone}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {crisisResources.map((resource) => {
              const Icon = resourceIcons[resource.type] || AlertTriangle;
              return (
                <Card key={resource.id} className="glass border-white/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/20">
                        {Icon && <Icon className="h-5 w-5 text-destructive" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <CardDescription>24/7 Crisis Support</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCall(resource.phone)}
                        className="rounded-2xl flex-1"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                      {resource.website && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWebsite(resource.website!)}
                          className="rounded-2xl"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="online" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterResources(onlineResources).length === 0 ? (
              <div className="col-span-full text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No online resources found matching your search." : "No online resources available."}
                </p>
              </div>
            ) : (
              filterResources(onlineResources).map((resource) => {
                const Icon = resourceIcons[resource.type]
                return (
                  <Card key={resource.id} className="glass border-white/30 hover:scale-105 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{resource.name}</CardTitle>
                            <CardDescription>Online Mental Health Platform</CardDescription>
                          </div>
                        </div>
                        <Badge className={`rounded-full text-xs ${costColors[resource.cost]}`}>
                          {resource.cost}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{resource.description}</p>

                      {resource.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {resource.specialties.slice(0, 3).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs rounded-full">
                              {specialty}
                            </Badge>
                          ))}
                          {resource.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs rounded-full">
                              +{resource.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {resource.website && (
                          <Button
                            size="sm"
                            onClick={() => handleWebsite(resource.website!)}
                            className="rounded-2xl flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </Button>
                        )}
                        {resource.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCall(resource.phone)}
                            className="rounded-2xl"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}