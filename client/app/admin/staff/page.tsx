'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Mock Data
const STAFF_DATA = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    username: 's.jenkins',
    avatar: 'SJ',
    password: 'initial_password',
    fullName: 'Sarah Jenkins',
    phone: '0123456789',
    status: 'ACTIVE',
    email: 'sarah.jenkins@kinetic.com',
  },
  {
    id: '2',
    name: 'Marcus Vance',
    username: 'm.vance',
    avatar: 'MV',
    password: 'initial_password',
    fullName: 'Marcus Vance',
    phone: '0987654321',
    status: 'ACTIVE',
    email: 'marcus.vance@kinetic.com',
  },
  {
    id: '3',
    name: 'Elena Torres',
    username: 'a.torres',
    avatar: 'ET',
    password: 'initial_password',
    fullName: 'Elena Torres',
    phone: '0111111111',
    status: 'INACTIVE',
    email: 'elena.torres@kinetic.com',
  },
  {
    id: '4',
    name: 'David Chen',
    username: 'd.chen',
    avatar: 'DC',
    password: 'initial_password',
    fullName: 'David Chen',
    phone: '0222222222',
    status: 'ACTIVE',
    email: 'david.chen@kinetic.com',
  },
]

type Staff = typeof STAFF_DATA[0]

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>(STAFF_DATA)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff)
    setShowEditDialog(true)
  }

  const handleCloseDialog = () => {
    setShowEditDialog(false)
    setSelectedStaff(null)
  }

  const handleSaveChanges = () => {
    // TODO: Call API to save staff changes
    if (selectedStaff) {
      console.log(`[v0] Save staff changes for ${selectedStaff.name}`, selectedStaff)
    }
    handleCloseDialog()
  }

  const getInitialsBgColor = (index: number) => {
    const colors = ['bg-indigo-100', 'bg-purple-100', 'bg-pink-100', 'bg-blue-100']
    return colors[index % colors.length]
  }

  const getStatusStyle = (status: string) => {
    if (status === 'ACTIVE') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Staff Management</h1>
          <p className="text-slate-600 text-sm mt-1">Manage access and roles for your team</p>
        </div>
        <Button
          className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto"
          onClick={() => console.log('Open Add Staff dialog')}
        >
          <span>+</span>
          Add New Staff
        </Button>
      </div>

      {/* Separator */}
      <div className="h-px bg-indigo-200"></div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staffList.map((staff, index) => (
          <div
            key={staff.id}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
          >
            {/* Avatar & Name */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-full ${getInitialsBgColor(
                  index
                )} flex items-center justify-center font-semibold text-sm text-indigo-700`}
              >
                {staff.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm truncate">
                  {staff.name}
                </h3>
                <p className="text-xs text-slate-500">@{staff.username}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <Badge
                className={`text-xs font-medium border ${getStatusStyle(
                  staff.status
                )} ${staff.status === 'ACTIVE' ? 'before:content-["●"] before:mr-1' : ''}`}
              >
                {staff.status}
              </Badge>
            </div>

            {/* Action Button */}
            <div className="pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs"
                onClick={() => handleEditStaff(staff)}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-medium text-slate-700">
                  Username
                </Label>
                <Input
                  id="username"
                  value={selectedStaff.username}
                  onChange={(e) =>
                    setSelectedStaff({ ...selectedStaff, username: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={selectedStaff.password}
                  onChange={(e) =>
                    setSelectedStaff({ ...selectedStaff, password: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-medium text-slate-700">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={selectedStaff.fullName}
                  onChange={(e) =>
                    setSelectedStaff({ ...selectedStaff, fullName: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium text-slate-700">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={selectedStaff.phone}
                  onChange={(e) =>
                    setSelectedStaff({ ...selectedStaff, phone: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-medium text-slate-700">
                  Status
                </Label>
                <select
                  id="status"
                  value={selectedStaff.status}
                  onChange={(e) =>
                    setSelectedStaff({ ...selectedStaff, status: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 gap-3">
            <Button variant="outline" onClick={handleCloseDialog} className="text-slate-700">
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
