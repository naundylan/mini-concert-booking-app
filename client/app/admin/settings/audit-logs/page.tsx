"use client"

import { useEffect, useState, useCallback } from "react"
import axiosClient from "@/lib/axios"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  AlertTriangle,
  Monitor,
  Calendar,
  User,
  Info
} from "lucide-react"

interface AuditLog {
  id: string
  userId?: string
  username?: string
  action: string
  entityName: string
  entityId?: string
  status: "SUCCESS" | "FAILED"
  message?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // Filters
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState("")
  const [action, setAction] = useState("")
  const [page, setPage] = useState(0)
  const [size] = useState(10)

  // Fetch function
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page,
        size
      }
      if (keyword.trim()) params.keyword = keyword.trim()
      if (status) params.status = status
      if (action) params.action = action

      const response = await axiosClient.get<{ data: { content: AuditLog[]; totalPages: number; totalElements: number } }>(
        "/admin/audit-logs",
        { params }
      )
      
      setLogs(response.data.data.content || [])
      setTotalPages(response.data.data.totalPages || 0)
      setTotalElements(response.data.data.totalElements || 0)
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error)
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách nhật ký hoạt động.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [page, size, keyword, status, action])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
    setPage(0) // Reset to first page when changing search keyword
  }

  const handleFilterChange = (type: "status" | "action", value: string) => {
    if (type === "status") setStatus(value)
    if (type === "action") setAction(value)
    setPage(0) // Reset to first page
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    } catch {
      return dateStr
    }
  }

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent) return "Không rõ thiết bị"
    if (userAgent.includes("Windows")) return "Windows PC"
    if (userAgent.includes("Macintosh")) return "MacBook / iMac"
    if (userAgent.includes("iPhone")) return "iPhone"
    if (userAgent.includes("Android")) return "Điện thoại Android"
    if (userAgent.includes("Linux")) return "Linux Client"
    return userAgent.split(" ")[0] || "Không rõ thiết bị"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Nhật ký hoạt động (Audit Logs)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lịch sử các thao tác nghiệp vụ, đăng nhập, bảo mật và thay đổi thông tin hệ thống của nhân viên và quản trị viên.
        </p>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản, email, tin nhắn hoạt động..."
              value={keyword}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition cursor-pointer text-slate-700"
            >
              <option value="">Tất cả hành động</option>
              <option value="LOGIN">Đăng nhập (LOGIN)</option>
              <option value="LOGOUT">Đăng xuất (LOGOUT)</option>
              <option value="CREATE">Tạo mới (CREATE)</option>
              <option value="UPDATE">Cập nhật (UPDATE)</option>
              <option value="DELETE">Xóa (DELETE)</option>
              <option value="CHANGE_PASSWORD">Đổi mật khẩu (CHANGE_PASSWORD)</option>
              <option value="FORGOT_PASSWORD">Yêu cầu khôi phục (FORGOT_PASSWORD)</option>
              <option value="RESET_PASSWORD">Đặt lại mật khẩu (RESET_PASSWORD)</option>
            </select>
            <Filter className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition cursor-pointer text-slate-700"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công (SUCCESS)</option>
              <option value="FAILED">Thất bại (FAILED)</option>
            </select>
            <Filter className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">
            Tổng số bản ghi tìm thấy: <span className="text-indigo-600 font-semibold">{totalElements}</span>
          </span>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-md font-medium transition active:scale-[0.98] disabled:opacity-55"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-[160px]">Thời gian</th>
                <th className="py-3.5 px-4 w-[140px]">Tài khoản</th>
                <th className="py-3.5 px-4 w-[130px]">Hành động</th>
                <th className="py-3.5 px-4 w-[110px]">Trạng thái</th>
                <th className="py-3.5 px-4 w-[200px]">IP / Thiết bị</th>
                <th className="py-3.5 px-4">Nội dung chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-xs">Đang tải nhật ký...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                      <span className="font-medium text-slate-600">Không tìm thấy bản ghi nào</span>
                      <span className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors group">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.username || "Hệ thống"}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border
                        ${log.action === 'LOGIN' || log.action === 'LOGOUT' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                        ${log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                        ${log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-100' : ''}
                        ${log.action === 'UPDATE' || log.action === 'CHANGE_PASSWORD' || log.action === 'RESET_PASSWORD' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                        ${log.action === 'FORGOT_PASSWORD' ? 'bg-purple-50 text-purple-700 border-purple-100' : ''}
                      `}>
                        <Activity className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border
                        ${log.status === 'SUCCESS' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'}
                      `}>
                        {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>

                    {/* IP & Device */}
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-700">{log.ipAddress || "0.0.0.0"}</p>
                        <p className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Monitor className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[170px]" title={log.userAgent}>
                            {parseUserAgent(log.userAgent)}
                          </span>
                        </p>
                      </div>
                    </td>

                    {/* Message detail */}
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium max-w-[300px]">
                      <div className="flex items-start gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2" title={log.message}>
                          {log.message || "Không có mô tả chi tiết"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Trang <span className="font-semibold text-slate-800">{page + 1}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0 || loading}
                className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-1.5 border border-slate-200 rounded-md bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
