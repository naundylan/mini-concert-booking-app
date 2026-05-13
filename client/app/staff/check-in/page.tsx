'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Flashlight, Camera, CheckCircle, AlertCircle, Search } from 'lucide-react';

interface ScanResult {
  id: string;
  status: 'success' | 'used' | 'invalid';
  customerName: string;
  orderId: string;
  checkInTime: string;
  seatLocation: string;
  row: string;
  col: string;
}

const MOCK_RECENT_SCANS: ScanResult[] = [
  {
    id: '1',
    status: 'success',
    customerName: 'Sarah Jenkins',
    orderId: 'ORD-8829-XJ',
    checkInTime: '19:42 PM',
    seatLocation: 'Sec A',
    row: '14',
    col: 'B2',
  },
];

export default function CheckInPage() {
  const [searchInput, setSearchInput] = useState('');
  const [recentScans, setRecentScans] = useState<ScanResult[]>(MOCK_RECENT_SCANS);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [useCameraFront, setUseCameraFront] = useState(false);

  const handleScan = (bookingId: string) => {
    // TODO: Process QR scan or manual search
    console.log('[v0] Processing scan:', bookingId);
  };

  const handleToggleFlash = () => {
    setIsFlashOn(!isFlashOn);
    console.log('[v0] Flash toggled:', !isFlashOn);
  };

  const handleSwitchCamera = () => {
    setUseCameraFront(!useCameraFront);
    console.log('[v0] Camera switched to:', useCameraFront ? 'back' : 'front');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">QR Scanner Check-in</h1>
        <p className="text-sm text-slate-600 mt-1">Scan tickets or search by Booking ID</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Scanner Area */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-slate-200 overflow-hidden">
            {/* Search Input */}
            <div className="p-6 border-b border-slate-200">
              <Label htmlFor="search-booking" className="text-xs font-medium text-slate-700 mb-2 block">
                Search by Booking ID or Phone
              </Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="search-booking"
                  type="text"
                  placeholder="e.g., ORD-8829-XJ or 0123456789"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            {/* QR Scanner Frame */}
            <div className="relative bg-slate-900 aspect-square flex items-center justify-center">
              <div className="absolute inset-8 border-2 border-indigo-500 rounded-xl opacity-50" />
              <div className="relative w-48 h-48 flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-indigo-500" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-indigo-500" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-indigo-500" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-indigo-500" />
                <p className="text-white text-center text-sm font-medium">Scan Ticket</p>
                <p className="text-slate-400 text-xs mt-2">Align QR code within the frame</p>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <Button
                variant={isFlashOn ? 'default' : 'outline'}
                size="sm"
                className={isFlashOn ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                onClick={handleToggleFlash}
              >
                <Flashlight size={16} className="mr-2" />
                {isFlashOn ? 'Flash On' : 'Toggle Flash'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchCamera}
              >
                <Camera size={16} className="mr-2" />
                Switch Camera
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Scan Results Panel */}
        <div>
          <Card className="bg-white border border-slate-200 h-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Recent Scan</h2>
            </div>

            {recentScans.length > 0 ? (
              <div className="p-6 space-y-4">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {scan.status === 'success' && (
                        <>
                          <CheckCircle size={20} className="text-green-500" />
                          <div>
                            <p className="text-sm font-semibold text-green-600">SUCCESS: Ticket Valid</p>
                            <p className="text-xs text-green-600">Access Granted</p>
                          </div>
                        </>
                      )}
                      {scan.status === 'used' && (
                        <>
                          <AlertCircle size={20} className="text-red-500" />
                          <div>
                            <p className="text-sm font-semibold text-red-600">ERROR: Ticket Used</p>
                            <p className="text-xs text-red-600">Access Denied</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">CUSTOMER NAME</p>
                        <p className="text-base font-semibold text-slate-900">{scan.customerName}</p>
                      </div>

                      {/* Order ID and Check-in Time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Order ID</p>
                          <p className="text-sm font-medium text-slate-900">{scan.orderId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Check-in Time</p>
                          <p className="text-sm font-medium text-slate-900">{scan.checkInTime}</p>
                        </div>
                      </div>

                      {/* Seat Location */}
                      <div className="pt-3">
                        <p className="text-xs text-slate-500 font-medium mb-2">Seat Location</p>
                        <div className="bg-indigo-600 text-white rounded-full px-4 py-3 text-center">
                          <p className="text-sm font-semibold">{scan.seatLocation}</p>
                          <p className="text-xs mt-1">
                            Row {scan.row} Col {scan.col}
                          </p>
                        </div>
                      </div>

                      {/* Admin Next Guest */}
                      <Button className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm mt-3">
                        Admin Next Guest
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">No recent scans</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
