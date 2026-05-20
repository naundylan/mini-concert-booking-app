"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authService } from "@/lib/services/auth.service"

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const email = searchParams.get("email")
    const fullName = searchParams.get("fullName")
    const googleId = searchParams.get("googleId")

    authService
      .getMe()
      .then(() => {
        router.replace("/customer/events")
      })
      .catch(() => {
        const completeProfileParams = new URLSearchParams({
          email: email ?? "",
          fullName: fullName ?? "",
          googleId: googleId ?? "",
        })

        router.replace(`/auth/complete-profile?${completeProfileParams.toString()}`)
      })
  }, [router, searchParams])

  return <div className="flex justify-center p-10">Đang hoàn tất đăng nhập...</div>
}
