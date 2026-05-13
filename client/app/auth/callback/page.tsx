"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { saveAuthSession } from "@/lib/auth-client"

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const accessToken = searchParams.get("accessToken")
    const refreshToken = searchParams.get("refreshToken")
    const email = searchParams.get("email")
    const fullName = searchParams.get("fullName")
    const googleId = searchParams.get("googleId")
    const role = searchParams.get("role") || "CUSTOMER"

    if (accessToken) {
      saveAuthSession({
        accessToken,
        refreshToken,
        role,
        fullName,
      })
      router.replace("/customer/events")
      return
    }

    const completeProfileParams = new URLSearchParams({
      email: email ?? "",
      fullName: fullName ?? "",
      googleId: googleId ?? "",
    })

    router.replace(`/auth/complete-profile?${completeProfileParams.toString()}`)
  }, [router, searchParams])

  return <div className="flex justify-center p-10">Đang hoàn tất đăng nhập...</div>
}
