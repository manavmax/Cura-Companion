import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  MessageCircle,
  Heart,
  BookOpen,
  MapPin,
  Settings,
  Menu,
  LogOut,
  History
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { logout } from "@/api/auth"
import { toast } from "@/hooks/useToast"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chat Therapy", href: "/chat", icon: MessageCircle },
  { name: "Chat History", href: "/chat/history", icon: History },
  { name: "Mood Tracking", href: "/mood", icon: Heart },
  { name: "Journal", href: "/journal", icon: BookOpen },
  { name: "Resources", href: "/resources", icon: MapPin },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      navigate("/login")
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-gradient">Cura</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="grid gap-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || user?.email || "User"}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full rounded-2xl"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden fixed top-4 left-4 z-50 rounded-2xl"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block w-64">
        <SidebarContent />
      </div>
    </>
  )
}