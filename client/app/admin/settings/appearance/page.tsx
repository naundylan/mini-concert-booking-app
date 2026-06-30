'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop, Check, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAppearancePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themeOptions = [
    {
      id: 'light',
      name: 'Chế độ Sáng',
      description: 'Giao diện sáng rực rỡ, thích hợp làm việc ban ngày.',
      icon: Sun,
      bgColor: 'bg-white text-slate-900 border-slate-200',
    },
    {
      id: 'dark',
      name: 'Chế độ Tối',
      description: 'Giao diện tối huyền bí, bảo vệ mắt khi dùng ban đêm.',
      icon: Moon,
      bgColor: 'bg-slate-950 text-slate-50 border-slate-800',
    },
    {
      id: 'system',
      name: 'Theo hệ thống',
      description: 'Tự động đồng bộ với thiết lập màu sắc của máy tính.',
      icon: Laptop,
      bgColor: 'bg-gradient-to-br from-white to-slate-900 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Giao diện ứng dụng</h1>
        <p className="mt-2 text-slate-600">
          Cá nhân hóa trải nghiệm màu sắc và chủ đề hiển thị của trang quản trị.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-lg">
              <Palette size={20} className="text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Chủ đề màu sắc</CardTitle>
              <CardDescription className="mt-1">
                Lựa chọn chế độ hiển thị phù hợp nhất với điều kiện ánh sáng xung quanh bạn.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;

              return (
                <Card
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`relative p-5 cursor-pointer rounded-xl border transition-all hover:shadow-md select-none flex flex-col gap-4 ${
                    isSelected 
                      ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Selection Check Circle */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${opt.bgColor}`}>
                    <Icon size={20} />
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">{opt.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Preview Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Xem trước giao diện bảng điều khiển</h3>
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 text-center">
              {/* Mock mini dashboard mockup */}
              <div className="flex gap-3 items-end h-16 w-48 justify-center">
                <div className="w-8 bg-indigo-200 h-6 rounded-t-md"></div>
                <div className="w-8 bg-indigo-600 h-14 rounded-t-md animate-pulse"></div>
                <div className="w-8 bg-indigo-200 h-10 rounded-t-md"></div>
                <div className="w-8 bg-indigo-300 h-8 rounded-t-md"></div>
              </div>
              <div className="text-xs text-slate-500 max-w-sm">
                Biểu đồ thống kê doanh thu và báo cáo sự kiện của trang quản trị sẽ tự động thay đổi màu sắc phù hợp với chủ đề đã chọn.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
