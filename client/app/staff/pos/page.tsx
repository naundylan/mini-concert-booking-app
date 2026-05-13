'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Minus, CreditCard, Banknote } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

const TICKET_TYPES = [
  { id: '1', name: 'General Admission', description: 'Standard entry to the event', price: 150 },
  { id: '2', name: 'VIP Backstage', description: 'Includes lounge access and meet & greet', price: 350 },
];

export default function POSPage() {
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { ...TICKET_TYPES[0], quantity: 0 },
    { ...TICKET_TYPES[1], quantity: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');

  const handleAddItem = (itemId: string) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.id === itemId && item.quantity > 0
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const totalTickets = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleIssueTickets = () => {
    if (!customerPhone || !customerName || totalTickets === 0) {
      alert('Please fill in customer info and select tickets');
      return;
    }
    console.log('[v0] Issue tickets:', {
      customerPhone,
      customerName,
      customerEmail,
      orderItems: orderItems.filter((item) => item.quantity > 0),
      total,
      paymentMethod,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Quick Sales</h1>
        <p className="text-sm text-slate-600 mt-1">Direct box office ticket issuance</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer & Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Card */}
          <Card className="bg-white border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Customer Details</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-xs font-medium text-slate-700 mb-2 block">
                    Phone Number (Required)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="text-sm bg-indigo-50 border-indigo-200"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-xs font-medium text-slate-700 mb-2 block">
                    Full Name (Required)
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="text-sm bg-indigo-50 border-indigo-200"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-xs font-medium text-slate-700 mb-2 block">
                  Email Address (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="text-sm bg-indigo-50 border-indigo-200"
                />
              </div>
            </div>
          </Card>

          {/* Order Summary Card */}
          <Card className="bg-white border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
              <Button variant="ghost" size="sm" className="text-indigo-600 text-xs">
                Clear All
              </Button>
            </div>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleAddItem(item.id)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="text-right min-w-16">
                      <p className="text-sm font-semibold text-slate-900">${item.price}</p>
                      {item.quantity > 0 && (
                        <p className="text-xs text-slate-600">${(item.price * item.quantity).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Taxes (8%)</span>
                <span className="font-medium text-slate-900">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Grand Total</span>
                <span className="text-indigo-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Payment & Status */}
        <div className="space-y-6">
          {/* Payment Methods Card */}
          <Card className="bg-white border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-indigo-600" />
              Payment Methods
            </h2>
            <div className="space-y-3">
              {/* Cash Option */}
              <div
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <Banknote size={24} className="text-indigo-600 mb-2" />
                <p className="font-medium text-slate-900">Pay by Cash</p>
                <p className="text-xs text-slate-600 mt-1">Confirm physical cash receipt</p>
              </div>

              {/* Transfer Option */}
              <div
                onClick={() => setPaymentMethod('transfer')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <CreditCard size={24} className="text-indigo-600 mb-2" />
                <p className="font-medium text-slate-900">Bank Transfer</p>
                <p className="text-xs text-slate-600 mt-1">Verify via terminal or app</p>
              </div>
            </div>
          </Card>

          {/* Issue Tickets Button */}
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 text-base"
            onClick={handleIssueTickets}
          >
            Issue Tickets →
          </Button>

          {/* Upcoming Event Card */}
          <Card className="bg-gradient-to-br from-indigo-900 to-indigo-800 border-0 p-4 text-white overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-xs font-semibold opacity-80 mb-1">Upcoming Highlight</p>
              <h3 className="text-base font-bold">Neon Pulse Festival 2024</h3>
            </div>
          </Card>

          {/* Terminal Info */}
          <div className="text-xs text-slate-600 space-y-1 border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-900">TERMINAL #01</p>
            <p>Staff: Alex Rivera</p>
          </div>
        </div>
      </div>
    </div>
  );
}
