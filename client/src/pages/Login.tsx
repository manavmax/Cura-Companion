import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/hooks/useToast"
import { useAuth } from "@/contexts/AuthContext"
import { login } from "@/api/auth"

console.log('=== LOGIN PAGE MODULE LOADING ===');
console.log('login import:', typeof login);
console.log('login function:', login);

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  console.log('=== LOGIN COMPONENT RENDER ===');
  console.log('login function in component:', typeof login);
  console.log('setUser function:', typeof setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    console.log('=== LOGIN FORM SUBMIT ===');
    console.log('Form data:', data);
    console.log('login function before call:', typeof login);
    console.log('login function value:', login);
    
    setIsLoading(true)
    try {
      if (typeof login !== 'function') {
        console.error('LOGIN FUNCTION TYPE ERROR:', typeof login);
        throw new Error('login is not a function');
      }
      
      console.log('Calling login function...');
      const response = await login({
        email: data.email,
        password: data.password,
      })

      console.log('Login response:', response);

      if (response.success) {
        // Store tokens
        localStorage.setItem("accessToken", response.accessToken)
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken)
        }

        // Set user in context
        setUser(response.user)

        toast({
          title: "Success",
          description: response.message || "Login successful",
        })

        // Navigate to dashboard
        navigate("/")
      } else {
        throw new Error(response.message || "Login failed")
      }
    } catch (error: any) {
      console.error("Login error:", error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background p-4">
      <Card className="w-full max-w-md glass border-white/30">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">Cura</span>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue your mental health journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="rounded-2xl"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="rounded-2xl pr-10"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}