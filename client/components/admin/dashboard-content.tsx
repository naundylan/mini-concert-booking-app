'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Download, Loader2 } from 'lucide-react';
import { adminDashboardService, AdminDashboardStats } from '@/lib/services/admin-dashboard.service';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle
} from 'recharts';

// Mock data for the chart
const chartData = [
  { date: 'Mon', sales: 1200, highlight: false },
  { date: 'Tue', sales: 1900, highlight: false },
  { date: 'Wed', sales: 1500, highlight: false },
  { date: 'Thu', sales: 2100, highlight: false },
  { date: 'Fri', sales: 2500, highlight: true },
  { date: 'Sat', sales: 2000, highlight: false },
  { date: 'Sun', sales: 1800, highlight: false },
  { date: 'Mon', sales: 2300, highlight: false },
  { date: 'Tue', sales: 2600, highlight: false },
  { date: 'Wed', sales: 2100, highlight: false },
  { date: 'Thu', sales: 2400, highlight: false },
  { date: 'Fri', sales: 2800, highlight: false },
  { date: 'Sat', sales: 1500, highlight: false },
];

// Custom bar component for highlight effect
const CustomBar = (props: any) => {
  const { fill, x, y, width, height, payload } = props;
  const barColor = payload.highlight ? '#4f46e5' : '#e0e7ff';
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={barColor}
      radius={[4, 4, 0, 0]}
    />
  );
};

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon?: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change >= 0;
  return (
    <Card className="border-slate-200 rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mb-3">{value}</p>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp size={16} className="text-green-600" />
              ) : (
                <TrendingDown size={16} className="text-red-600" />
              )}
              <span
                className={`text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {isPositive ? '+' : ''}{change}% from last month
              </span>
            </div>
          </div>
          {icon && <div className="text-3xl ml-4">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

interface SystemStatusProps {
  name: string;
  status: 'HEALTHY' | 'WARNING' | 'DOWN';
  color: 'green' | 'yellow' | 'red';
}

function SystemStatus({ name, status, color }: SystemStatusProps) {
  const colorMap = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  };
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 border border-slate-200">
      <span className="text-sm font-medium text-slate-700">{name}</span>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${colorMap[color]}`}>
        {status}
      </span>
    </div>
  );
}

export default function DashboardContent() {
  const [timeRange, setTimeRange] = useState('30');
  const [viewMode, setViewMode] = useState('daily');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminDashboardService.getStats(Number(timeRange));
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats', err);
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Không thể tải số liệu thống kê.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const formatMoneyVND = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);

  // Group weekly sales if requested (just a simple client-side helper for UI demo)
  const displayChartData = useMemo(() => {
    if (!stats || !stats.chartData) return [];
    if (viewMode === 'daily') return stats.chartData;
    
    // Group by week
    const weeks: { [key: string]: number } = {};
    stats.chartData.forEach((point, index) => {
      const weekIndex = Math.floor(index / 7);
      const key = `T tuần ${weekIndex + 1}`;
      weeks[key] = (weeks[key] || 0) + point.sales;
    });

    const result = Object.entries(weeks).map(([date, sales]) => ({
      date,
      sales,
      highlight: false,
    }));

    // Highlight the highest week
    let maxVal = 0;
    let maxIdx = -1;
    result.forEach((w, i) => {
      if (w.sales > maxVal) {
        maxVal = w.sales;
        maxIdx = i;
      }
    });
    if (maxIdx !== -1 && maxVal > 0) {
      result[maxIdx].highlight = true;
    }
    return result;
  }, [stats, viewMode]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-2">
            Tổng quan
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Dashboard Thống kê</h1>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full bg-white border-slate-200 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Ngày qua</SelectItem>
              <SelectItem value="30">30 Ngày qua</SelectItem>
              <SelectItem value="90">90 Ngày qua</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={fetchStats}>
            Làm mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Đang tải báo cáo doanh thu...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            <StatCard
              title="Tổng doanh thu"
              value={stats ? formatMoneyVND(stats.totalRevenue) : '0 VND'}
              change={stats ? stats.totalRevenueChange : 0}
              icon="💰"
            />
            <StatCard
              title="Vé bán ra"
              value={stats ? stats.ticketsSold.toLocaleString('vi-VN') : '0'}
              change={stats ? stats.ticketsSoldChange : 0}
              icon="🎫"
            />
            <Card className="border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-600 mb-4">Hoạt động & Vận hành</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Sự kiện đang hoạt động:</span>
                    <span className="text-sm font-bold text-slate-900">{stats?.activeEventsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">Tỷ lệ soát vé (Check-in):</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {stats ? `${stats.checkInRate}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <Card className="border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Biểu đồ doanh thu vé</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Khối lượng doanh số thu về của các ngày trong chu kỳ
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'daily' ? 'default' : 'outline'}
                  onClick={() => setViewMode('daily')}
                  className="text-xs"
                >
                  Hàng ngày
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'weekly' ? 'default' : 'outline'}
                  onClick={() => setViewMode('weekly')}
                  className="text-xs"
                >
                  Hàng tuần
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={displayChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoneyVND(Number(value)), 'Doanh số']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#e0e7ff"
                    shape={<CustomBar />}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
