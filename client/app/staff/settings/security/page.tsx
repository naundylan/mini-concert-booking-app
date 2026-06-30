'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { authService } from '@/lib/services/auth.service';
import { toast } from '@/hooks/use-toast';

// ============ Zod Schema ============
const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu phải dài tối thiểu 8 ký tự')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

// ============ Main Component ============
export default function StaffSecurityPage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      setIsSubmitting(true);
      setSuccessMessage('');

      await authService.changePassword({
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      setSuccessMessage('Đổi mật khẩu thành công! Hệ thống sẽ tự động đăng xuất sau 2 giây...');
      reset();

      setTimeout(() => {
        authService.logout();
      }, 2000);
    } catch (error: any) {
      console.error('Error updating staff password:', error);
      const errorMessage = error.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Bảo mật tài khoản</h1>
        <p className="mt-2 text-slate-600">
          Cập nhật mật khẩu định kỳ để bảo vệ quyền truy cập bán vé và soát vé của bạn.
        </p>
      </div>

      {/* Change Password Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-lg">
              <Lock size={20} className="text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Đổi mật khẩu</CardTitle>
              <CardDescription className="mt-1">
                Sử dụng mật khẩu mạnh kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Info Alert */}
          <Alert className="bg-indigo-50 border-indigo-200">
            <AlertCircle size={16} className="text-indigo-600" />
            <AlertTitle className="text-indigo-900">Yêu cầu về mật khẩu</AlertTitle>
            <AlertDescription className="text-indigo-800">
              Mật khẩu mới phải dài ít nhất 8 ký tự, bao gồm ít nhất một chữ số và một ký tự đặc biệt.
            </AlertDescription>
          </Alert>

          {/* Success Message */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle size={16} className="text-green-600" />
              <AlertDescription className="text-green-800 font-medium">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
            {/* Old Password */}
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Mật khẩu hiện tại *
              </label>
              <div className="relative">
                <input
                  {...register('oldPassword')}
                  type={showOldPassword ? 'text' : 'password'}
                  id="oldPassword"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 transition"
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.oldPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  {...register('newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 transition"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Nhập lại mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 text-sm shadow-sm"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
