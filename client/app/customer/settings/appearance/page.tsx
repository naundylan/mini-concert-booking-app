'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';

export default function AppearanceSettingsPage() {
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Giao diện ứng dụng</h2>
        <p className="text-sm text-slate-600 mt-1">Cá nhân hóa trải nghiệm màu sắc và chủ đề hiển thị.</p>
      </div>

      <div className="h-px bg-slate-100"></div>

      <div className="space-y-5">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Chủ đề màu sắc</h3>
        
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
      </div>

      {/* Preview Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Xem trước vé và sơ đồ</h3>
        <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 text-center">
          {/* Mock mini layout grid */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                  i === 2 
                    ? 'bg-indigo-600 border-indigo-700 text-white animate-pulse' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                A{i}
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Sơ đồ ghế và thẻ vé của bạn sẽ thay đổi màu sắc hài hòa tùy theo chủ đề đã chọn.
          </div>
        </div>
      </div>
    </div>
  );
}
