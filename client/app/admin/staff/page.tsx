'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { userService } from '@/lib/services/user.service'
import { User } from '@/lib/types/user.type'
import { toast } from '@/hooks/use-toast'

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Add Staff dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newStaff, setNewStaff] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    email: '',
  })

  const fetchStaff = async () => {
    setIsLoading(true)
    try {
      const data = await userService.getAllStaff()
      setStaffList(data)
    } catch (err: any) {
      console.error('Failed to fetch staff:', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to load staff list.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const handleEditStaff = (staff: User) => {
    setSelectedStaff({ ...staff })
    setNewPassword('')
    setShowEditDialog(true)
  }

  const handleCloseDialog = () => {
    setShowEditDialog(false)
    setSelectedStaff(null)
    setNewPassword('')
  }

  const handleSaveChanges = async () => {
    if (!selectedStaff) return
    setIsSaving(true)
    try {
      const original = staffList.find((s) => s.id === selectedStaff.id)
      if (!original) {
        toast({
          title: 'Error',
          description: 'Staff member not found in list.',
          variant: 'destructive',
        })
        return
      }

      // 1. Update basic info if anything changed
      if (
        original.fullName !== selectedStaff.fullName ||
        original.username !== selectedStaff.username ||
        original.phone !== selectedStaff.phone ||
        original.email !== selectedStaff.email
      ) {
        await userService.updateStaff(selectedStaff.id, {
          fullName: selectedStaff.fullName,
          username: selectedStaff.username || '',
          phone: selectedStaff.phone || null,
          email: selectedStaff.email || null,
        })
      }

      // 2. Update status if changed
      if (original.status !== selectedStaff.status) {
        await userService.updateStaffStatus(selectedStaff.id, {
          status: selectedStaff.status as 'ACTIVE' | 'INACTIVE',
        })
      }

      // 3. Reset password if provided
      if (newPassword.trim()) {
        await userService.resetStaffPassword(selectedStaff.id, {
          newPassword: newPassword.trim(),
        })
      }

      toast({
        title: 'Success',
        description: 'Staff member updated successfully!',
      })
      await fetchStaff()
      handleCloseDialog()
    } catch (err: any) {
      console.error('Failed to update staff:', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update staff member.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddStaff = async () => {
    if (!newStaff.username || !newStaff.fullName || !newStaff.password) {
      toast({
        title: 'Validation Error',
        description: 'Username, Full Name, and Password are required.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await userService.createStaff({
        fullName: newStaff.fullName,
        username: newStaff.username,
        password: newStaff.password,
        phone: newStaff.phone || null,
        email: newStaff.email || null,
      })

      toast({
        title: 'Success',
        description: 'New staff member added successfully!',
      })

      // Reset form and close dialog
      setNewStaff({
        username: '',
        password: '',
        fullName: '',
        phone: '',
        email: '',
      })
      setShowAddDialog(false)
      await fetchStaff()
    } catch (err: any) {
      console.error('Failed to create staff:', err)
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to add staff member.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
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
          onClick={() => setShowAddDialog(true)}
        >
          <span>+</span>
          Add New Staff
        </Button>
      </div>

      {/* Separator */}
      <div className="h-px bg-indigo-200"></div>

      {/* Staff Grid or Loader */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-150 p-5 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-slate-200 rounded w-5/6" />
                <div className="h-3 bg-slate-200 rounded w-4/6" />
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="h-8 bg-slate-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No staff members found.</p>
        </div>
      ) : (
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
                  {getInitials(staff.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">
                    {staff.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">@{staff.username || 'no-username'}</p>
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

              {/* Contact Info */}
              <div className="space-y-1 mb-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-400">Email:</span>
                  <span className="truncate">{staff.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-400">Phone:</span>
                  <span>{staff.phone || '—'}</span>
                </div>
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
      )}

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-username" className="text-xs font-medium text-slate-700">
                Username *
              </Label>
              <Input
                id="add-username"
                placeholder="e.g. s.jenkins"
                value={newStaff.username}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, username: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password" className="text-xs font-medium text-slate-700">
                Password *
              </Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Enter temporary password"
                value={newStaff.password}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, password: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-fullName" className="text-xs font-medium text-slate-700">
                Full Name *
              </Label>
              <Input
                id="add-fullName"
                placeholder="e.g. Sarah Jenkins"
                value={newStaff.fullName}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, fullName: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email" className="text-xs font-medium text-slate-700">
                Email (Optional)
              </Label>
              <Input
                id="add-email"
                type="email"
                placeholder="e.g. sarah.jenkins@kinetic.com"
                value={newStaff.email}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, email: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone" className="text-xs font-medium text-slate-700">
                Phone (Optional)
              </Label>
              <Input
                id="add-phone"
                placeholder="e.g. 0123456789"
                value={newStaff.phone}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, phone: e.target.value })
                }
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="text-slate-700"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleAddStaff}
              disabled={isSaving}
            >
              {isSaving ? 'Adding...' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  value={selectedStaff.username || ''}
                  onChange={(e) =>
                    setSelectedStaff({ ...selectedStaff, username: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                  Reset Password (leave blank to keep current)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={selectedStaff.email || ''}
                  onChange={(e) =>
                    setSelectedStaff({ ...selectedStaff, email: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium text-slate-700">
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  value={selectedStaff.phone || ''}
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
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="text-slate-700"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

