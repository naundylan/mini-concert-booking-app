'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { userService } from '@/lib/services/user.service';
import { User } from '@/lib/types/user.type';

export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFullName(data.fullName);
    } catch (err: any) {
      console.error('Failed to load profile', err);
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
        description: 'Thông tin hồ sơ cá nhân đã được cập nhật!',
      });
      fetchProfile();
    } catch (err: any) {
      console.error('Failed to update profile', err);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Thông tin cá nhân</h2>
        <p className="text-sm text-slate-600 mt-1">Cập nhật họ và tên của bạn hiển thị trên vé và hệ thống.</p>
      </div>

      <div className="h-px bg-slate-100"></div>

      <form onSubmit={handleSave} className="space-y-5 max-w-lg">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700">
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
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
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

        {/* Phone - Read-Only */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
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
          💡 <strong>Lưu ý bảo mật:</strong> Địa chỉ email và Số điện thoại là định danh chính của bạn. Chúng được giữ cố định để đảm bảo đồng bộ lịch sử mua vé tại quầy (POS) và tài khoản trực tuyến (Google OAuth2).
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
    </div>
  );
}
