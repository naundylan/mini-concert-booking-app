"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home, HelpCircle } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Uncaught runtime error:", error)
  }, [error])

  return (
    <main className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden text-center">
      {/* Decorative background hazard lights */}
      <div
        className="absolute left-1/4 top-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-1/4 bottom-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl animate-pulse pointer-events-none"
        aria-hidden="true"
      />

      <div className="z-10 max-w-md w-full p-8 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl flex flex-col items-center">
        {/* Error icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>

        {/* 500 Status */}
        <h1 className="text-4xl font-extrabold text-rose-600 tracking-tight">
          Sự Cố Kỹ Thuật
        </h1>
        
        {/* Error Titles */}
        <h2 className="text-base font-bold text-slate-800 mt-4 mb-2">
          Sân khấu đang tạm dừng hoạt động!
        </h2>
        
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Đã xảy ra lỗi hệ thống bất ngờ ngoài kịch bản. Đội ngũ kỹ thuật đang tiến hành kiểm tra thiết bị sân khấu.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 h-10 rounded-full bg-gradient-to-r from-rose-500 to-rose-700 text-white text-sm font-semibold hover:from-rose-600 hover:to-rose-800 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all focus:outline-none"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử tải lại trang</span>
          </button>
          
          <Link
            href="/auth"
            className="flex-1 h-10 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all focus:outline-none"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Trang đăng nhập</span>
          </Link>
        </div>

        {/* Subtext info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Mã sự cố: {error.digest || "SYS-500-ERR"}</span>
        </div>
      </div>
    </main>
  )
}
