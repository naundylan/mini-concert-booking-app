'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Loader2, Save, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { userService } from '@/lib/services/user.service';
import { User } from '@/lib/types/user.type';

export default function StaffProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFullName(data.fullName || '');
    } catch (err: any) {
      console.error('Failed to load staff profile', err);
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Không thể tải thông tin cá nhân.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Họ và tên không được để trống.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await userService.updateProfile({ fullName: fullName.trim() });
      toast({
        title: 'Thành công',
        description: 'Thông tin cá nhân đã được cập nhật!',
      });
      fetchProfile();
    } catch (err: any) {
      console.error('Failed to update staff profile', err);
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Không thể cập nhật thông tin.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Thông tin cá nhân</h1>
        <p className="mt-2 text-slate-600">
          Xem thông tin đăng nhập và cập nhật họ tên hiển thị trên vé và hệ thống của bạn.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-lg">
              <UserIcon size={20} className="text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Chi tiết tài khoản</CardTitle>
              <CardDescription className="mt-1">
                Quản lý các thông tin cá nhân và định danh nhân viên của bạn.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-5 max-w-lg">
            {/* Tên đăng nhập (Username) - Read-Only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                  Tên đăng nhập
                </Label>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Lock size={10} /> Không thể sửa
                </span>
              </div>
              <div className="relative">
                <Input
                  id="username"
                  value={profile?.username || 'Chưa thiết lập'}
                  readOnly
                  className="text-sm border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed pr-8"
                />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            {/* Họ và tên */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
                Họ và tên *
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
                className="text-sm border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Email - Read-Only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Địa chỉ Email
                </Label>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Lock size={10} /> Không thể sửa
                </span>
              </div>
              <div className="relative">
                <Input
                  id="email"
                  value={profile?.email || 'Chưa cung cấp'}
                  readOnly
                  className="text-sm border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed pr-8"
                />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            {/* Số điện thoại - Read-Only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                  Số điện thoại
                </Label>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Lock size={10} /> Không thể sửa
                </span>
              </div>
              <div className="relative">
                <Input
                  id="phone"
                  value={profile?.phone || 'Chưa cung cấp'}
                  readOnly
                  className="text-sm border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed pr-8"
                />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>

            {/* Security Warning Notice */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-800 leading-relaxed shadow-sm">
              💡 <strong>Lưu ý bảo mật:</strong> Các thông tin định danh như Tên đăng nhập, Email và Số điện thoại được giữ cố định để phục vụ công tác đối soát giao dịch và bán vé tại quầy (POS). Nếu cần thay đổi, vui lòng liên hệ Quản trị viên (Admin).
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-2 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
