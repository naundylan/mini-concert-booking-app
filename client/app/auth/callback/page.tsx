// app/auth/callback/page.tsx
"use client"
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken"); // Tên param từ Backend
    const refreshToken = searchParams.get("refreshToken");
    const email = searchParams.get("email");
    const fullName = searchParams.get("fullName");
    const googleId = searchParams.get("googleId");
    const hasPhone = searchParams.get("hasPhone") === "true";

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      router.push("/admin/dashboard")
    } else {
      // Nếu không có accessToken, chuyển đến trang nhập phone
      // Chuyển hướngkèm thông tin user từ OAuth để pre-fill form
      router.push(`/auth/complete-profile?email=${email}&fullName=${encodeURIComponent(fullName ?? '')}&googleId=${googleId}`);
    }
  }, [searchParams]);

  return <div className="flex justify-center p-10">Đang hoàn tất đăng nhập...</div>;
}