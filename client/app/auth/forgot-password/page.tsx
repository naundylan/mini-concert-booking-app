"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/services/auth.service"
import { toast } from "@/hooks/use-toast"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email.").email("Email không hợp lệ."),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data)
      setSubmittedEmail(data.email)
      setIsSent(true)
      toast({
        title: "Yêu cầu đã gửi",
        description: "Vui lòng kiểm tra hộp thư email của bạn.",
      })
    } catch (error: any) {
      console.error("Forgot password failed:", error)
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại."
      toast({
        title: "Lỗi gửi yêu cầu",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative concert elements */}
      <div
        className="hidden md:block absolute left-[calc(50%-420px)] top-1/3 -translate-y-1/2 rounded-2xl overflow-hidden shadow-2xl w-32 h-44 opacity-20 pointer-events-none rotate-12"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-800" />
      </div>

      <div className="text-center mb-6 z-10">
        <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">Mini Concert Booking</h1>
        <p className="text-xs font-semibold text-indigo-400 tracking-[0.2em] uppercase mt-1">
          Khôi phục tài khoản
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-sm z-10 overflow-hidden border border-white/20 p-6">
        {!isSent ? (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
              Quên mật khẩu?
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Nhập email liên kết với tài khoản quản trị/nhân viên của bạn. Chúng tôi sẽ gửi hướng dẫn thiết lập lại mật khẩu qua email.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-xs font-medium text-gray-600">
                  Địa chỉ Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    {...register("email")}
                    className={cn(
                      "w-full h-10 rounded-lg bg-gray-50/50 border pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition",
                      errors.email ? "border-red-400" : "border-gray-200"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm font-semibold hover:from-indigo-600 hover:to-indigo-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
              >
                {isLoading ? "Đang gửi yêu cầu..." : "Gửi liên kết khôi phục"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-center">
              <Link
                href="/auth"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại đăng nhập</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Kiểm tra email của bạn</h2>
            <p className="text-xs text-gray-400 max-w-[280px] mx-auto mb-6">
              Chúng tôi đã gửi email hướng dẫn khôi phục mật khẩu đến địa chỉ <strong className="text-gray-700 font-semibold">{submittedEmail}</strong>. Vui lòng kiểm tra hộp thư đến (và thư rác nếu không tìm thấy).
            </p>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => setIsSent(false)}
                className="w-full h-9 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all focus:outline-none"
              >
                Thử lại bằng email khác
              </button>

              <Link
                href="/auth"
                className="w-full h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center transition-all focus:outline-none"
              >
                Về trang đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
