"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/services/auth.service"
import { getDefaultRouteByRole, normalizeRole } from "@/lib/auth-client"
import { toast } from "@/hooks/use-toast"

const staffLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

type StaffLoginForm = z.infer<typeof staffLoginSchema>

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

type Tab = "staff" | "customer"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>("staff")
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffLoginForm>({
    resolver: zodResolver(staffLoginSchema),
  })

  const onSubmit = async (data: StaffLoginForm) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      const role = response.role || response.userInfo?.role || ''
      const normalizedRole = normalizeRole(role)
      const redirectUrl = getDefaultRouteByRole(role)

      if (!redirectUrl || normalizedRole === 'CUSTOMER') {
        toast({
          title: "Lỗi phân quyền",
          description: "Tài khoản này không có quyền truy cập cổng Admin/Staff.",
          variant: "destructive",
        })
        return
      }

      window.location.href = redirectUrl
    } catch (error: any) {
      console.error("Login failed:", error)
      const errorMessage = error.response?.data?.message || "Đăng nhập thất bại!"
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const oauthUrl = authService.getOAuthUrl("google")
    window.location.href = oauthUrl
  }

  return (
    <main className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div
        className="hidden md:block absolute right-[calc(50%-320px)] top-1/2 -translate-y-1/2 translate-x-[260px] rotate-6 rounded-2xl overflow-hidden shadow-2xl w-36 h-48 opacity-80 pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex flex-col justify-end p-3">
          <div className="w-full h-24 mb-2 flex items-center justify-center">
            <svg viewBox="0 0 80 60" className="w-full h-full opacity-60" aria-hidden="true">
              {[...Array(7)].map((_, i) => (
                <line
                  key={i}
                  x1="40"
                  y1="0"
                  x2={5 + i * 12}
                  y2="60"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                />
              ))}
            </svg>
          </div>
          <p className="text-white text-[10px] font-semibold leading-tight">Metropolis Symphony</p>
          <p className="text-gray-400 text-[8px] uppercase tracking-widest">Curated Preview</p>
        </div>
      </div>

      <div className="text-center mb-6 z-10">
        <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">Mini Concert Booking</h1>
        <p className="text-xs font-semibold text-indigo-400 tracking-[0.2em] uppercase mt-1">
          Sign In
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm z-10 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("staff")}
            className={cn(
              "flex-1 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none",
              activeTab === "staff"
                ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
                : "text-gray-400 hover:text-gray-600"
            )}
            aria-selected={activeTab === "staff"}
            role="tab"
          >
            Admin &amp; Staff
          </button>
          <button
            onClick={() => setActiveTab("customer")}
            className={cn(
              "flex-1 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none",
              activeTab === "customer"
                ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
                : "text-gray-400 hover:text-gray-600"
            )}
            aria-selected={activeTab === "customer"}
            role="tab"
          >
            Customer
          </button>
        </div>

        <div className="p-6">
          {activeTab === "staff" && (
            <div role="tabpanel">
              <h2 className="text-base font-semibold text-gray-800 mb-0.5">Internal Access</h2>
              <p className="text-xs text-gray-400 mb-5">
                Enter your credentials to manage concerts, bookings, and more.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="username" className="text-xs font-medium text-gray-600">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    {...register("username")}
                    className={cn(
                      "w-full h-9 rounded-lg bg-gray-50 border px-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition",
                      errors.username ? "border-red-400" : "border-gray-200"
                    )}
                  />
                  {errors.username && (
                    <p className="text-xs text-red-500">{errors.username.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-medium text-gray-600">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium focus:outline-none"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className={cn(
                      "w-full h-9 rounded-lg bg-gray-50 border px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition",
                      errors.password ? "border-red-400" : "border-gray-200"
                    )}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 w-full h-9 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm font-semibold hover:from-indigo-600 hover:to-indigo-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "customer" && (
            <div role="tabpanel" className="flex flex-col items-center py-4 gap-4">
              <p className="text-xs text-gray-400 text-center">
                Sign in with your Google account to browse and book tickets.
              </p>
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-2.5 w-full h-9 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 justify-center"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 text-center z-10">
        <p className="text-xs text-gray-400">
          {"Don't have an account? "}
          <button
            onClick={() => setActiveTab("customer")}
            className="text-indigo-500 font-semibold hover:text-indigo-700 transition-colors focus:outline-none"
          >
            Apply for Access
          </button>
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <button className="text-[11px] text-gray-400 hover:text-gray-500 transition-colors focus:outline-none">
            Privacy Policy
          </button>
          <button className="text-[11px] text-gray-400 hover:text-gray-500 transition-colors focus:outline-none">
            Terms of Service
          </button>
          <button className="text-[11px] text-gray-400 hover:text-gray-500 flex items-center gap-1 transition-colors focus:outline-none">
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            Support
          </button>
        </div>
      </div>
    </main>
  )
}
