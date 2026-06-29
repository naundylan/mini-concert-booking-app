"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldOff, ArrowLeft, LogOut, HelpCircle, Loader2 } from "lucide-react"
import { userService } from "@/lib/services/user.service"
import { authService } from "@/lib/services/auth.service"
import { getDefaultRouteByRole } from "@/lib/auth-client"
import { toast } from "@/hooks/use-toast"

export default function UnauthorizedPage() {
  const router = useRouter()
  const [redirectUrl, setRedirectUrl] = useState("/auth")
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const user = await userService.getProfile()
        if (user && user.role) {
          const defaultRoute = getDefaultRouteByRole(user.role)
          if (defaultRoute) {
            setRedirectUrl(defaultRoute)
          }
        }
      } catch (error) {
        // Not authenticated
        console.log("Not logged in on unauthorized page")
      } finally {
        setCheckingAuth(false)
      }
    }

    checkUserRole()
  }, [])

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast({
        title: "Đã đăng xuất",
        description: "Vui lòng đăng nhập bằng tài khoản có quyền truy cập.",
      })
    } catch (error) {
      console.error("Logout failed:", error)
      router.push("/auth")
    }
  }

  return (
    <main className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden text-center">
      {/* Decorative background hazard lights */}
      <div
        className="absolute left-1/3 top-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-1/3 bottom-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl animate-pulse pointer-events-none"
        aria-hidden="true"
      />

      <div className="z-10 max-w-md w-full p-8 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl flex flex-col items-center">
        {/* Shield icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldOff className="w-8 h-8" />
          </div>
        </div>

        {/* 403 Status */}
        <h1 className="text-4xl font-extrabold text-amber-600 tracking-tight">
          Từ Chối Truy Cập
        </h1>
        
        {/* Error Titles */}
        <h2 className="text-base font-bold text-slate-800 mt-4 mb-2">
          Khu vực hạn chế ra vào!
        </h2>
        
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Tài khoản của bạn không có đặc quyền truy cập vào đường dẫn này. Vui lòng quay lại hoặc đăng nhập bằng tài khoản quản trị thích hợp.
        </p>

        {/* Action Buttons */}
        {checkingAuth ? (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Đang kiểm tra thông tin tài khoản...</span>
          </div>
        ) : (
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(redirectUrl)}
              className="flex-1 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-600 hover:to-amber-700 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay về trang chính</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex-1 h-10 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all focus:outline-none"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Đăng nhập tài khoản khác</span>
            </button>
          </div>
        )}

        {/* Subtext info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Mã bảo mật: AUTH-403-FORBIDDEN</span>
        </div>
      </div>
    </main>
  )
}
