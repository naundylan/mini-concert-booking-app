'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { authService } from '@/lib/services/auth.service'
import { normalizeRole } from '@/lib/auth-client'

// Regex validate SĐT Việt Nam: 10 chữ số, bắt đầu bằng 0
const PHONE_REGEX = /^(0[3|5|7|8|9])\d{8}$/

function CompleteProfileInner() {
  const searchParams = useSearchParams()
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const email = searchParams.get('email') ?? ''
  const fullName = searchParams.get('fullName') ?? ''
  const googleId = searchParams.get('googleId') ?? ''

  const validatePhone = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) return 'Vui lòng nhập số điện thoại.'
    if (!/^\d+$/.test(trimmed)) return 'Số điện thoại chỉ được chứa chữ số.'
    if (trimmed.length !== 10) return 'Số điện thoại phải có đúng 10 chữ số.'
    if (!PHONE_REGEX.test(trimmed))
      return 'Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam (ví dụ: 0909123456).'
    return null
  }

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    if (phoneError) {
      // Xóa lỗi ngay khi người dùng bắt đầu sửa
      setPhoneError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const phoneValidationError = validatePhone(phone)
    if (phoneValidationError) {
      setPhoneError(phoneValidationError)
      return
    }

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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email (chỉ đọc) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Họ và tên (chỉ đọc) */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Số điện thoại với validate */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setPhoneError(validatePhone(phone))}
              placeholder="Ví dụ: 0909123456"
              maxLength={10}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition ${
                phoneError
                  ? 'border-red-400 focus:ring-red-400 bg-red-50'
                  : 'border-gray-300 focus:ring-indigo-400'
              }`}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span>⚠</span> {phoneError}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Nhập số điện thoại Việt Nam 10 chữ số (đầu 03x, 05x, 07x, 08x, 09x).
            </p>
          </div>

          {/* Lỗi từ server */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-md disabled:opacity-50 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Xác nhận và đăng nhập'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <a href="/auth" className="text-indigo-600 hover:underline">
            Đăng nhập bằng tài khoản khác
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
