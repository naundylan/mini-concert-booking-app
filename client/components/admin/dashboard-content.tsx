'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-2">
            Overview
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-white border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value="2.800.570.000 VND"
          change={14.5}
          icon="💰"
        />
        <StatCard
          title="Tickets Sold"
          value="1,200"
          change={8.2}
          icon="🎫"
        />
        <Card className="border-slate-200 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600 mb-4">System Health</p>
            <div className="space-y-3">
              <SystemStatus
                name="Kafka Stream"
                status="HEALTHY"
                color="green"
              />
              <SystemStatus
                name="Redis Cache"
                status="HEALTHY"
                color="green"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="border-slate-200 rounded-xl overflow-hidden">
        <CardHeader className="border-b border-slate-200 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Ticket Sales over Time</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Daily volume across all active events
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
              className="text-xs"
            >
              Daily
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => setViewMode('weekly')}
              className="text-xs"
            >
              Weekly
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: '3k', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
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
    </div>
  );
}