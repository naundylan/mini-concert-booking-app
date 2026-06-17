'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { authService } from '@/lib/services/auth.service'
import { normalizeRole } from '@/lib/auth-client'

function CompleteProfileInner() {
  const searchParams = useSearchParams()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const email = searchParams.get('email') ?? ''
  const fullName = searchParams.get('fullName') ?? ''
  const googleId = searchParams.get('googleId') ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await authService.completeOAuth2Phone({
        email,
        fullName,
        googleId,
        phone: phone.trim(),
      })

      const role = normalizeRole(response.role || response.userInfo?.role)

      if (role !== 'CUSTOMER') {
        setError('Tài khoản Google chỉ được dùng cho khách hàng.')
        return
      }

      window.location.href = '/customer/events'
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Hoàn thành hồ sơ
        </h2>
        <p className="text-center text-gray-600">
          Vui lòng nhập số điện thoại của bạn để hoàn tất đăng nhập.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại của bạn (ví dụ: 0909123456)"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-red-500' : 'focus:ring-blue-500'
              }`}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md disabled:opacity-50 transition-colors hover:bg-blue-700"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận và đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Bạn đã có tài khoản?{' '}
          <a href="/auth" className="text-blue-600 hover:underline">
            Đăng nhập tại đây
          </a>
        </p>
      </div>
    </div>
  )
}

export default function CompleteProfile() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10">Đang tải...</div>}>
      <CompleteProfileInner />
    </Suspense>
  )
}
