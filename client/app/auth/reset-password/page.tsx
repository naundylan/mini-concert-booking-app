"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/services/auth.service"
import { toast } from "@/hooks/use-toast"
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

function ResetPasswordFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast({
        title: "Lỗi thiết lập",
        description: "Mã token khôi phục không tìm thấy hoặc không hợp lệ.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword({
        token,
        newPassword: data.newPassword,
      })
      toast({
        title: "Đổi mật khẩu thành công",
        description: "Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng về trang đăng nhập...",
      })
      setTimeout(() => {
        router.push("/auth")
      }, 2000)
    } catch (error: any) {
      console.error("Reset password failed:", error)
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi đặt lại mật khẩu."
      toast({
        title: "Đặt lại mật khẩu thất bại",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4 flex flex-col items-center">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-gray-800 mb-1">Mã xác thực không hợp lệ</h2>
        <p className="text-xs text-gray-400 max-w-[280px] mx-auto mb-6">
          Đường dẫn đặt lại mật khẩu này không hợp lệ hoặc thiếu mã bảo mật. Vui lòng kiểm tra lại liên kết từ email.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="w-full h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 transition"
        >
          Quay lại trang đăng nhập
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-indigo-500" />
        Đặt lại mật khẩu
      </h2>
      <p className="text-xs text-gray-400 mb-6">
        Thiết lập mật khẩu mới cho tài khoản của bạn. Mật khẩu mới cần dài tối thiểu 6 ký tự.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="newPassword" className="text-xs font-medium text-gray-600">
            Mật khẩu mới
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("newPassword")}
              className={cn(
                "w-full h-10 rounded-lg bg-gray-50/50 border pl-9 pr-10 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition",
                errors.newPassword ? "border-red-400" : "border-gray-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-500 mt-0.5">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-600">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={cn(
                "w-full h-10 rounded-lg bg-gray-50/50 border pl-9 pr-10 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition",
                errors.confirmPassword ? "border-red-400" : "border-gray-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm font-semibold hover:from-indigo-600 hover:to-indigo-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
        >
          {isLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative concert elements */}
      <div
        className="hidden md:block absolute right-[calc(50%-420px)] top-1/4 -translate-y-1/2 rounded-2xl overflow-hidden shadow-2xl w-32 h-44 opacity-20 pointer-events-none -rotate-12"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-800" />
      </div>

      <div className="text-center mb-6 z-10">
        <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">Mini Concert Booking</h1>
        <p className="text-xs font-semibold text-indigo-400 tracking-[0.2em] uppercase mt-1">
          Thiết lập mật khẩu
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-sm z-10 overflow-hidden border border-white/20 p-6">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-xs text-gray-400">Đang tải cấu hình xác thực...</p>
            </div>
          }
        >
          <ResetPasswordFormContent />
        </Suspense>
      </div>
    </main>
  )
}
