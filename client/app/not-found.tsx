"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Music, ArrowLeft, HelpCircle, Loader2 } from "lucide-react"
import { userService } from "@/lib/services/user.service"
import { getDefaultRouteByRole } from "@/lib/auth-client"

export default function NotFound() {
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
        // User not logged in or session expired, default redirect is /auth
        console.log("Not authenticated or session expired on 404 page")
      } finally {
        setCheckingAuth(false)
      }
    }

    checkUserRole()
  }, [])

  return (
    <main className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden text-center">
      {/* Decorative concert background lights */}
      <div
        className="absolute left-1/4 top-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-1/4 bottom-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"
        aria-hidden="true"
      />

      <div className="z-10 max-w-md w-full p-8 bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl flex flex-col items-center">
        {/* Concert ticket illustration */}
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Music className="w-8 h-8" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
            !
          </div>
        </div>

        {/* 404 Status */}
        <h1 className="text-6xl font-extrabold text-indigo-700 tracking-tight select-none">
          404
        </h1>
        
        {/* Error Titles */}
        <h2 className="text-xl font-bold text-slate-800 mt-4 mb-2">
          Hàng ghế không tồn tại!
        </h2>
        
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Đường dẫn hoặc trang sự kiện bạn đang tìm kiếm không tồn tại, đã bị hủy vé hoặc được di dời sang vị trí khác.
        </p>

        {/* Action Button */}
        {checkingAuth ? (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Đang kiểm tra phiên đăng nhập...</span>
          </div>
        ) : (
          <Link
            href={redirectUrl}
            className="w-full h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm font-semibold hover:from-indigo-600 hover:to-indigo-800 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {redirectUrl === "/auth" ? "Quay về trang Đăng nhập" : "Quay về Trang quản trị"}
            </span>
          </Link>
        )}

        {/* Subtext info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Nếu đây là sự cố hệ thống, vui lòng báo cáo cho kỹ thuật.</span>
        </div>
      </div>
    </main>
  )
}
