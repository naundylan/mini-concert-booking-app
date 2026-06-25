'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Lock } from 'lucide-react'

// Zod validation schema
const eventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  location: z.string().min(1, 'Location is required'),
  bannerUrl: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  teasingTime: z.string().min(1, 'Teasing time is required'),
  openTime: z.string().min(1, 'Open time is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  status: z.string().optional(), // Thêm status vào schema để TypeScript không báo lỗi khi dùng setValue
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine((data) => new Date(data.teasingTime) <= new Date(data.openTime), {
  message: 'Teasing time must be before or equal to open time',
  path: ['teasingTime'],
}).refine((data) => new Date(data.openTime) <= new Date(data.startTime), {
  message: 'Open time must be before or equal to start time',
  path: ['openTime'],
});

type EventFormData = z.infer<typeof eventFormSchema>

interface EventFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<EventFormData>
  onSubmit: (data: EventFormData) => void
  onCancel: () => void
}

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Bản nháp', color: 'bg-slate-200 text-slate-800' },
  { value: 'ONSALE', label: 'Đang mở bán', color: 'bg-green-200 text-green-800' },
  { value: 'TEASING', label: 'Sắp mở bán', color: 'bg-yellow-200 text-yellow-800' },
  { value: 'CANCELED', label: 'Đã hủy', color: 'bg-red-200 text-red-800' },
]

export default function EventForm({ mode, initialData, onSubmit, onCancel }: EventFormProps) {
  const [bannerPreview, setBannerPreview] = useState(initialData?.bannerUrl || '')
  const isEditMode = mode === 'edit'
  const currentStatus = initialData?.status || 'DRAFT'
  const isOnsale = isEditMode && currentStatus === 'ONSALE'
  const isTeasing = isEditMode && currentStatus === 'TEASING'
  const isCanceled = isEditMode && currentStatus === 'CANCELED'
  const isDraft = isEditMode && currentStatus === 'DRAFT'
  const [statusValue, setStatusValue] = useState(initialData?.status || 'DRAFT')
  const formDefaultValues = {
    name: '',
    location: '',
    bannerUrl: '',
    teasingTime: '',
    openTime: '',
    startTime: '',
    endTime: '',
    status: 'DRAFT',
  }

  const getStatusOptions = () => {
    if (isDraft) return STATUS_OPTIONS // tất cả
    if (isTeasing) return STATUS_OPTIONS.filter(s => s.value === 'TEASING' || s.value === 'CANCELED')
    if (isOnsale) return STATUS_OPTIONS.filter(s => s.value === 'ONSALE' || s.value === 'CANCELED')
    return []
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: (initialData && {
      name: initialData.name || '',
      location: initialData.location || '',
      bannerUrl: initialData.bannerUrl || '',
      teasingTime: initialData.teasingTime || '',
      openTime: initialData.openTime || '',
      startTime: initialData.startTime || '',
      endTime: initialData.endTime || '',
      status: initialData.status || 'DRAFT',
    }) || formDefaultValues,
  })

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'teasingTime':
        return 'Thời gian giới thiệu (Teasing)'
      case 'openTime':
        return 'Thời gian mở bán'
      case 'startTime':
        return 'Thời gian bắt đầu sự kiện'
      case 'endTime':
        return 'Thời gian kết thúc sự kiện'
      default:
        return field
    }
  }

  // Update banner preview
  const handleBannerUrlChange = (url: string) => {
    setBannerPreview(url)
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit({ ...data, status: statusValue }))} className="space-y-6">
      
      {/* Thông báo nếu CANCELED */}
      {isCanceled && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Sự kiện đã bị hủy, không thể chỉnh sửa.</p>
        </div>
      )}

      {/* ONSALE alert */}
      {isOnsale && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-indigo-600 flex-shrink-0" />
          <p className="text-xs text-indigo-700">Sự kiện đang mở bán, chỉ có thể chọn hủy bỏ sự kiện.</p>
        </div>
      )}

      {/* Fields chỉ hiện khi không phải CANCELED và không phải ONSALE */}
      {!isCanceled && !isOnsale && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Thông tin chỉnh sửa
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-medium text-slate-700 mb-2 block">Tên sự kiện</Label>
                <Input {...register('name')} className="text-sm" placeholder="Tên sự kiện" />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700 mb-2 block">Địa điểm</Label>
                <Input {...register('location')} className="text-sm" placeholder="Địa điểm diễn ra" />
                {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location.message}</p>}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">Ảnh bìa (Banner URL)</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  {...register('bannerUrl')}
                  onBlur={(e) => setBannerPreview(e.target.value)}
                  className="text-sm"
                  placeholder="https://..."
                />
                {bannerPreview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" onError={() => setBannerPreview('')} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduling — chỉ hiện khi DRAFT hoặc Create */}
      {(!isEditMode || isDraft) && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Thời gian diễn ra</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['teasingTime', 'openTime', 'startTime', 'endTime'] as const).map((field) => (
              <div key={field}>
                <Label className="text-xs font-medium text-slate-700 mb-2 block capitalize">
                  {getFieldLabel(field)}
                </Label>
                <Input type="datetime-local" {...register(field)} className="text-sm" />
                {errors[field] && <p className="text-xs text-red-600 mt-1">{errors[field]?.message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status — chỉ hiện khi edit và không phải CANCELED */}
      {isEditMode && !isCanceled && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Trạng thái sự kiện</h3>
          <div className="flex gap-2 flex-wrap">
            {getStatusOptions().map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { setStatusValue(option.value); setValue('status', option.value) }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusValue === option.value
                    ? `${option.color} ring-2 ring-offset-2 ring-indigo-400`
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">Hủy</Button>
        {!isCanceled && (
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {isEditMode ? 'Lưu thay đổi' : 'Tạo sự kiện'}
          </Button>
        )}
      </div>
    </form>
  )

}
