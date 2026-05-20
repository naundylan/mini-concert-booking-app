'use client'

import dynamic from 'next/dynamic'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { eventService } from '@/lib/services/event.service'
import { layoutService } from '@/lib/services/layout.service'
import { Event, TicketClass } from '@/lib/types/event.type'
import { LayoutCell, LayoutData, LayoutStatus, SeatLayout } from '@/lib/types/layout.type'
import {
  Archive,
  Brush,
  Copy,
  Eraser,
  Loader2,
  MousePointer2,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Search,
  Send,
} from 'lucide-react'

const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), { ssr: false })
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), { ssr: false })
const Rect = dynamic(() => import('react-konva').then((mod) => mod.Rect), { ssr: false })
const Text = dynamic(() => import('react-konva').then((mod) => mod.Text), { ssr: false })
const Shape = dynamic(() => import('react-konva').then((mod) => mod.Shape), { ssr: false })

const CELL_SIZE = 30
const DEFAULT_WORKSPACE = 20
const MAX_HISTORY = 50

type Tool = 'paint' | 'erase' | 'pan'

type DraftState = {
  name: string
  description: string
  venueName: string
  workspaceRows: number
  workspaceCols: number
  cells: LayoutCell[]
}

type StageState = {
  x: number
  y: number
  scale: number
}

const defaultDraft = (): DraftState => ({
  name: 'New layout',
  description: '',
  venueName: '',
  workspaceRows: DEFAULT_WORKSPACE,
  workspaceCols: DEFAULT_WORKSPACE,
  cells: [],
})

const makeKey = (row: number, col: number) => `${row}:${col}`

const rowToLabel = (rowIndex: number) => {
  let label = ''
  let index = rowIndex
  do {
    label = String.fromCharCode(65 + (index % 26)) + label
    index = Math.floor(index / 26) - 1
  } while (index >= 0)
  return label
}

const calculateBounds = (cells: LayoutCell[]) => {
  if (cells.length === 0) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0, usedRows: 0, usedCols: 0 }
  }

  const rows = cells.map((cell) => cell.row)
  const cols = cells.map((cell) => cell.col)
  const minRow = Math.min(...rows)
  const maxRow = Math.max(...rows)
  const minCol = Math.min(...cols)
  const maxCol = Math.max(...cols)

  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
    usedRows: maxRow - minRow + 1,
    usedCols: maxCol - minCol + 1,
  }
}

const withPreviewLabels = (cells: LayoutCell[]) => {
  const bounds = calculateBounds(cells)
  return cells.map((cell) => {
    if (cell.customPreviewLabel) return cell
    const previewLabel = `${rowToLabel(cell.row - bounds.minRow)}${cell.col - bounds.minCol + 1}`
    return { ...cell, previewLabel }
  })
}

const toLayoutData = (draft: DraftState): LayoutData => {
  const cells = withPreviewLabels(draft.cells)
  return {
    workspaceRows: draft.workspaceRows,
    workspaceCols: draft.workspaceCols,
    usedBounds: calculateBounds(cells),
    cells,
  }
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || fallback
  }
  return fallback
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

const statusClass: Record<LayoutStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
}

export default function LayoutsPage() {
  const [layouts, setLayouts] = useState<SeatLayout[]>([])
  const [meta, setMeta] = useState({ page: 0, size: 12, total: 0, pages: 1 })
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<LayoutStatus | ''>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedLayout, setSelectedLayout] = useState<SeatLayout | null>(null)
  const [draft, setDraft] = useState<DraftState>(defaultDraft)
  const [tool, setTool] = useState<Tool>('paint')
  const [ticketClasses, setTicketClasses] = useState([
    { key: 'vip', name: 'VIP', color: '#8b5cf6' },
    { key: 'standard', name: 'Standard', color: '#2563eb' },
  ])
  const [selectedKey, setSelectedKey] = useState('vip')
  const [history, setHistory] = useState<DraftState[]>([defaultDraft()])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isPainting, setIsPainting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [stageState, setStageState] = useState<StageState>({ x: 24, y: 24, scale: 1 })
  const [viewport, setViewport] = useState({ width: 900, height: 560 })
  const [applyLayout, setApplyLayout] = useState<SeatLayout | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [eventTicketClasses, setEventTicketClasses] = useState<TicketClass[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const canvasWrapRef = useRef<HTMLDivElement>(null)

  const readOnly = selectedLayout?.status === 'PUBLISHED' || selectedLayout?.status === 'ARCHIVED'

  const cellMap = useMemo(() => {
    const map = new Map<string, LayoutCell>()
    withPreviewLabels(draft.cells).forEach((cell) => map.set(makeKey(cell.row, cell.col), cell))
    return map
  }, [draft.cells])

  const bounds = useMemo(() => calculateBounds(draft.cells), [draft.cells])
  const ticketClassByKey = useMemo(
    () => new Map(ticketClasses.map((ticketClass) => [ticketClass.key, ticketClass])),
    [ticketClasses]
  )
  const usedTicketKeys = useMemo(
    () => Array.from(new Set(draft.cells.map((cell) => cell.ticketClassKey))).sort(),
    [draft.cells]
  )
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
  )
  const missingMappings = useMemo(
    () => usedTicketKeys.filter((key) => !mappings[key]),
    [mappings, usedTicketKeys]
  )

  const visibleCells = useMemo(() => {
    const buffer = CELL_SIZE * 3
    return withPreviewLabels(draft.cells).filter((cell) => {
      const x = cell.col * CELL_SIZE * stageState.scale + stageState.x
      const y = cell.row * CELL_SIZE * stageState.scale + stageState.y
      const size = CELL_SIZE * stageState.scale
      return (
        x + size > -buffer &&
        x < viewport.width + buffer &&
        y + size > -buffer &&
        y < viewport.height + buffer
      )
    })
  }, [draft.cells, stageState, viewport])

  const fetchLayouts = async (page = meta.page) => {
    setLoading(true)
    try {
      const response = await layoutService.search({
        page,
        size: meta.size,
        keyword: keyword.trim(),
        status: statusFilter,
      })
      setLayouts(response.data)
      setMeta({
        page: response.meta.page,
        size: response.meta.size,
        total: response.meta.total,
        pages: Math.max(1, response.meta.pages),
      })
    } catch (error) {
      toast({ title: 'Error', description: getErrorMessage(error, 'Không tải được layouts'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLayouts(0)
  }, [statusFilter])

  useEffect(() => {
    const updateViewport = () => {
      if (!canvasWrapRef.current) return
      setViewport({
        width: canvasWrapRef.current.clientWidth,
        height: Math.max(520, canvasWrapRef.current.clientHeight),
      })
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!hasUnsavedChanges) return
      localStorage.setItem(
        selectedLayout ? `layout-draft:${selectedLayout.id}` : 'layout-draft:new',
        JSON.stringify({ ...draft, updatedAt: Date.now() })
      )
    }, 30_000)
    return () => window.clearInterval(id)
  }, [draft, hasUnsavedChanges, selectedLayout])

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!selectedLayout || selectedLayout.status !== 'DRAFT' || !hasUnsavedChanges) return
    const id = window.setTimeout(() => {
      saveLayout(false)
    }, 3000)
    return () => window.clearTimeout(id)
  }, [draft, selectedLayout?.id, selectedLayout?.status, hasUnsavedChanges])

  const pushHistory = (nextDraft: DraftState) => {
    const nextHistory = history.slice(0, historyIndex + 1)
    nextHistory.push(nextDraft)
    const trimmed = nextHistory.slice(-MAX_HISTORY)
    setHistory(trimmed)
    setHistoryIndex(trimmed.length - 1)
  }

  const setDraftWithHistory = (nextDraft: DraftState, push = true) => {
    setDraft(nextDraft)
    setHasUnsavedChanges(true)
    if (push) pushHistory(nextDraft)
  }

  const undo = () => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    setHistoryIndex(nextIndex)
    setDraft(history[nextIndex])
    setHasUnsavedChanges(true)
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    setHistoryIndex(nextIndex)
    setDraft(history[nextIndex])
    setHasUnsavedChanges(true)
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      }
      if ((event.ctrlKey && event.key.toLowerCase() === 'y') || (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z')) {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [history, historyIndex])

  const openLayout = (layout: SeatLayout) => {
    const nextDraft = {
      name: layout.name,
      description: layout.description || '',
      venueName: layout.venueName || '',
      workspaceRows: layout.workspaceRows || DEFAULT_WORKSPACE,
      workspaceCols: layout.workspaceCols || DEFAULT_WORKSPACE,
      cells: layout.layoutData?.cells || [],
    }
    const localDraft = localStorage.getItem(`layout-draft:${layout.id}`)
    if (layout.status === 'DRAFT' && localDraft && window.confirm('Có bản nháp local. Khôi phục bản nháp này?')) {
      const parsed = JSON.parse(localDraft) as DraftState
      setDraft(parsed)
      setHistory([parsed])
    } else {
      setDraft(nextDraft)
      setHistory([nextDraft])
    }
    setSelectedLayout(layout)
    setHistoryIndex(0)
    setHasUnsavedChanges(false)
    setStageState({ x: 24, y: 24, scale: 1 })
  }

  const newLayout = () => {
    const localDraft = localStorage.getItem('layout-draft:new')
    const nextDraft = localDraft && window.confirm('Có bản nháp local chưa lưu. Khôi phục?')
      ? JSON.parse(localDraft)
      : defaultDraft()
    setSelectedLayout(null)
    setDraft(nextDraft)
    setHistory([nextDraft])
    setHistoryIndex(0)
    setHasUnsavedChanges(false)
  }

  const paintCell = (row: number, col: number) => {
    if (readOnly || tool === 'pan') return
    if (row < 0 || col < 0 || row >= draft.workspaceRows || col >= draft.workspaceCols) return
    const key = makeKey(row, col)
    const nextCells = new Map(draft.cells.map((cell) => [makeKey(cell.row, cell.col), cell]))
    if (tool === 'erase') {
      nextCells.delete(key)
    } else {
      nextCells.set(key, { row, col, ticketClassKey: selectedKey, customPreviewLabel: false })
    }
    setDraft({ ...draft, cells: Array.from(nextCells.values()) })
    setHasUnsavedChanges(true)
  }

  const commitPaint = () => {
    pushHistory(draft)
    setIsPainting(false)
  }

  const pointerToCell = (stage: any) => {
    const pointer = stage.getPointerPosition()
    if (!pointer) return null
    const x = (pointer.x - stageState.x) / stageState.scale
    const y = (pointer.y - stageState.y) / stageState.scale
    return { row: Math.floor(y / CELL_SIZE), col: Math.floor(x / CELL_SIZE) }
  }

  const expand = (direction: 'top' | 'right' | 'bottom' | 'left', amount = 5) => {
    if (readOnly) return
    const nextDraft = { ...draft, cells: [...draft.cells] }
    if (direction === 'right') nextDraft.workspaceCols += amount
    if (direction === 'bottom') nextDraft.workspaceRows += amount
    if (direction === 'left') {
      nextDraft.workspaceCols += amount
      nextDraft.cells = nextDraft.cells.map((cell) => ({ ...cell, col: cell.col + amount }))
    }
    if (direction === 'top') {
      nextDraft.workspaceRows += amount
      nextDraft.cells = nextDraft.cells.map((cell) => ({ ...cell, row: cell.row + amount }))
    }
    setDraftWithHistory(nextDraft)
  }

  const saveLayout = async (showToast = true) => {
    setSaving(true)
    try {
      const payload = {
        name: draft.name.trim() || 'Untitled layout',
        description: draft.description || null,
        venueName: draft.venueName || null,
        layoutData: toLayoutData(draft),
      }
      const saved = selectedLayout
        ? await layoutService.update(selectedLayout.id, payload)
        : await layoutService.create({ ...payload, name: payload.name, layoutData: payload.layoutData })
      const previousDraftKey = selectedLayout ? `layout-draft:${selectedLayout.id}` : 'layout-draft:new'
      setSelectedLayout(saved)
      setHasUnsavedChanges(false)
      localStorage.removeItem(previousDraftKey)
      localStorage.removeItem(`layout-draft:${saved.id}`)
      await fetchLayouts(meta.page)
      if (showToast) toast({ title: 'Saved', description: 'Layout draft saved.' })
    } catch (error) {
      if (showToast) {
        toast({ title: 'Error', description: getErrorMessage(error, 'Không lưu được layout'), variant: 'destructive' })
      }
    } finally {
      setSaving(false)
    }
  }

  const publishLayout = async () => {
    if (!selectedLayout) return
    try {
      const published = await layoutService.publish(selectedLayout.id)
      setSelectedLayout(published)
      await fetchLayouts(meta.page)
      toast({ title: 'Published', description: 'Layout is now read-only.' })
    } catch (error) {
      toast({ title: 'Error', description: getErrorMessage(error, 'Không publish được layout'), variant: 'destructive' })
    }
  }

  const cloneLayout = async (layout: SeatLayout) => {
    try {
      const clone = await layoutService.clone(layout.id)
      await fetchLayouts(0)
      openLayout(clone)
      toast({ title: 'Cloned', description: 'Created editable draft copy.' })
    } catch (error) {
      toast({ title: 'Error', description: getErrorMessage(error, 'Không clone được layout'), variant: 'destructive' })
    }
  }

  const archiveLayout = async (layout: SeatLayout) => {
    if (!window.confirm('Archive layout này?')) return
    try {
      await layoutService.archive(layout.id)
      if (selectedLayout?.id === layout.id) setSelectedLayout(null)
      await fetchLayouts(0)
      toast({ title: 'Archived', description: 'Layout archived.' })
    } catch (error) {
      toast({ title: 'Error', description: getErrorMessage(error, 'Không archive được layout'), variant: 'destructive' })
    }
  }

  const openApply = async (layout: SeatLayout) => {
    setApplyLayout(layout)
    setSelectedEventId('')
    setEventTicketClasses([])
    setMappings({})
    try {
      const response = await eventService.getAll()
      setEvents(response.data.filter((event) => event.status === 'DRAFT'))
    } catch (error) {
      toast({ title: 'Error', description: 'Không tải được danh sách event', variant: 'destructive' })
    }
  }

  const loadEventClasses = async (eventId: string) => {
    setSelectedEventId(eventId)
    setMappings({})
    if (!eventId) return
    try {
      const response = await eventService.adminGetTicketClasses(eventId)
      setEventTicketClasses(response.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Không tải được ticket classes', variant: 'destructive' })
    }
  }

  const submitApply = async () => {
    if (!applyLayout || !selectedEventId) return
    try {
      const created = await layoutService.apply(selectedEventId, applyLayout.id, {
        ticketClassMappings: usedTicketKeys.map((key) => ({
          ticketClassKey: key,
          ticketClassId: mappings[key],
        })),
      })
      setApplyLayout(null)
      toast({ title: 'Applied', description: `Created ${created.createdCount} seats.` })
    } catch (error) {
      toast({ title: 'Error', description: getErrorMessage(error, 'Không apply được layout'), variant: 'destructive' })
    }
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    fetchLayouts(0)
  }

  return (
    <div className="grid h-[calc(100vh-2rem)] grid-cols-[320px_1fr] gap-5">
      <aside className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-950">Layouts</h1>
              <p className="text-xs text-slate-500">Reusable seat grid templates</p>
            </div>
            <Button size="sm" onClick={newLayout} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus size={15} />
              New
            </Button>
          </div>
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search layout..."
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as LayoutStatus | '')}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </form>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-2">
              {layouts.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => openLayout(layout)}
                  className={`w-full rounded-lg border p-3 text-left transition hover:bg-slate-50 ${
                    selectedLayout?.id === layout.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-950">{layout.name}</p>
                    <Badge className={statusClass[layout.status]}>{layout.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{layout.venueName || 'No venue'}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    {layout.seatCount} seats · {layout.usedRows}x{layout.usedCols} used
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 p-3 text-xs text-slate-500">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 0}
            onClick={() => fetchLayouts(meta.page - 1)}
          >
            Prev
          </Button>
          <span>
            {meta.page + 1}/{meta.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.pages - 1}
            onClick={() => fetchLayouts(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="grid min-w-[360px] flex-1 grid-cols-3 gap-3">
            <Input
              value={draft.name}
              onChange={(event) => setDraftWithHistory({ ...draft, name: event.target.value }, false)}
              disabled={readOnly}
              placeholder="Layout name"
            />
            <Input
              value={draft.venueName}
              onChange={(event) => setDraftWithHistory({ ...draft, venueName: event.target.value }, false)}
              disabled={readOnly}
              placeholder="Venue name"
            />
            <Input
              value={draft.description}
              onChange={(event) => setDraftWithHistory({ ...draft, description: event.target.value }, false)}
              disabled={readOnly}
              placeholder="Description"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0 || readOnly}>
              <RotateCcw size={15} />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1 || readOnly}>
              <RotateCw size={15} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => saveLayout(true)} disabled={saving || readOnly}>
              <Save size={15} className="mr-2" />
              Save
            </Button>
            {selectedLayout && selectedLayout.status === 'DRAFT' && (
              <Button size="sm" onClick={publishLayout} className="bg-emerald-600 text-white hover:bg-emerald-700">
                Publish
              </Button>
            )}
            {selectedLayout && (
              <>
                <Button variant="outline" size="sm" onClick={() => cloneLayout(selectedLayout)}>
                  <Copy size={15} className="mr-2" />
                  Clone
                </Button>
                <Button variant="outline" size="sm" onClick={() => openApply(selectedLayout)} disabled={selectedLayout.status !== 'PUBLISHED'}>
                  <Send size={15} className="mr-2" />
                  Apply
                </Button>
                <Button variant="outline" size="sm" onClick={() => archiveLayout(selectedLayout)}>
                  <Archive size={15} />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <Button variant={tool === 'paint' ? 'default' : 'outline'} size="sm" onClick={() => setTool('paint')} disabled={readOnly}>
            <Brush size={15} className="mr-2" />
            Paint
          </Button>
          <Button variant={tool === 'erase' ? 'default' : 'outline'} size="sm" onClick={() => setTool('erase')} disabled={readOnly}>
            <Eraser size={15} className="mr-2" />
            Erase
          </Button>
          <Button variant={tool === 'pan' ? 'default' : 'outline'} size="sm" onClick={() => setTool('pan')}>
            <MousePointer2 size={15} className="mr-2" />
            Pan
          </Button>
          <div className="mx-2 h-6 w-px bg-slate-200" />
          {ticketClasses.map((ticketClass) => (
            <button
              key={ticketClass.key}
              onClick={() => {
                setSelectedKey(ticketClass.key)
                setTool('paint')
              }}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                selectedKey === ticketClass.key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
              }`}
            >
              <span className="h-3 w-3 rounded" style={{ backgroundColor: ticketClass.color }} />
              {ticketClass.name}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const key = window.prompt('Ticket class key, ví dụ svip')?.trim()
              if (!key) return
              const name = window.prompt('Tên hiển thị', key.toUpperCase())?.trim() || key
              const color = window.prompt('Màu hex', '#16a34a')?.trim() || '#16a34a'
              setTicketClasses((current) => [...current, { key, name, color }])
              setSelectedKey(key)
            }}
            disabled={readOnly}
          >
            <Plus size={15} className="mr-2" />
            Class
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => expand('top')} disabled={readOnly}>
              + Top
            </Button>
            <Button variant="outline" size="sm" onClick={() => expand('bottom')} disabled={readOnly}>
              + Bottom
            </Button>
            <Button variant="outline" size="sm" onClick={() => expand('left')} disabled={readOnly}>
              + Left
            </Button>
            <Button variant="outline" size="sm" onClick={() => expand('right')} disabled={readOnly}>
              + Right
            </Button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          Workspace is only the drawing area. Expanding it does not create seats; only painted cells are saved and
          converted to event seats when you apply a published layout.
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_240px]">
          <div ref={canvasWrapRef} className="min-h-0 bg-slate-950">
            <Stage
              width={viewport.width}
              height={viewport.height}
              x={stageState.x}
              y={stageState.y}
              scaleX={stageState.scale}
              scaleY={stageState.scale}
              draggable={tool === 'pan'}
              onDragEnd={(event: any) => setStageState((current) => ({ ...current, x: event.target.x(), y: event.target.y() }))}
              onWheel={(event: any) => {
                event.evt.preventDefault()
                const scaleBy = 1.05
                const nextScale = event.evt.deltaY > 0 ? stageState.scale / scaleBy : stageState.scale * scaleBy
                setStageState((current) => ({ ...current, scale: Math.min(2.5, Math.max(0.35, nextScale)) }))
              }}
              onMouseDown={(event: any) => {
                if (tool === 'pan') return
                const cell = pointerToCell(event.target.getStage())
                if (!cell) return
                setIsPainting(true)
                paintCell(cell.row, cell.col)
              }}
              onMouseMove={(event: any) => {
                if (!isPainting || tool === 'pan') return
                const cell = pointerToCell(event.target.getStage())
                if (!cell) return
                paintCell(cell.row, cell.col)
              }}
              onMouseUp={commitPaint}
              onMouseLeave={() => {
                if (isPainting) commitPaint()
              }}
            >
              <Layer>
                <Shape
                  sceneFunc={(context: any, shape: any) => {
                    context.beginPath()
                    context.strokeStyle = '#334155'
                    context.lineWidth = 0.5
                    for (let row = 0; row <= draft.workspaceRows; row++) {
                      context.moveTo(0, row * CELL_SIZE)
                      context.lineTo(draft.workspaceCols * CELL_SIZE, row * CELL_SIZE)
                    }
                    for (let col = 0; col <= draft.workspaceCols; col++) {
                      context.moveTo(col * CELL_SIZE, 0)
                      context.lineTo(col * CELL_SIZE, draft.workspaceRows * CELL_SIZE)
                    }
                    context.strokeShape(shape)
                  }}
                />
                {visibleCells.map((cell) => {
                  const ticketClass = ticketClassByKey.get(cell.ticketClassKey)
                  return (
                    <Rect
                      key={makeKey(cell.row, cell.col)}
                      x={cell.col * CELL_SIZE + 2}
                      y={cell.row * CELL_SIZE + 2}
                      width={CELL_SIZE - 4}
                      height={CELL_SIZE - 4}
                      fill={ticketClass?.color || '#64748b'}
                      cornerRadius={4}
                      opacity={0.95}
                    />
                  )
                })}
                {visibleCells.map((cell) => (
                  <Text
                    key={`${makeKey(cell.row, cell.col)}-label`}
                    x={cell.col * CELL_SIZE}
                    y={cell.row * CELL_SIZE + 9}
                    width={CELL_SIZE}
                    align="center"
                    text={cell.previewLabel || ''}
                    fontSize={9}
                    fill="#ffffff"
                    listening={false}
                  />
                ))}
              </Layer>
            </Stage>
          </div>

          <aside className="border-l border-slate-200 p-4 text-sm">
            <h3 className="mb-3 font-semibold text-slate-950">Layout Stats</h3>
            <div className="space-y-2 text-slate-600">
              <p>Workspace: {draft.workspaceRows} x {draft.workspaceCols}</p>
              <p>Used bounds: {bounds.usedRows} x {bounds.usedCols}</p>
              <p>Painted seats: {draft.cells.length}</p>
              <p>Rendered cells: {visibleCells.length}</p>
              <p>Zoom: {(stageState.scale * 100).toFixed(0)}%</p>
              <p className="rounded-md bg-slate-50 p-2 text-xs">
                Preview labels are temporary. Official labels are recomputed by the backend when this layout is applied
                to an event.
              </p>
              {readOnly && (
                <div className="rounded-md bg-amber-50 p-3 text-amber-800">
                  <p className="font-semibold">Read-only layout</p>
                  <p className="mt-1 text-xs">Clone this layout to edit painted cells.</p>
                  {selectedLayout && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => cloneLayout(selectedLayout)}
                    >
                      <Copy size={14} className="mr-2" />
                      Clone to edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={!!applyLayout} onOpenChange={(open) => !open && setApplyLayout(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply layout to event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
              Map each layout key on the left to a real ticket class of the selected DRAFT event. Extra mappings are
              ignored; missing keys block apply.
            </div>
            <select
              value={selectedEventId}
              onChange={(event) => loadEventClasses(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
            >
              <option value="">Select DRAFT event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            {selectedEvent && (
              <p className="text-xs text-slate-500">
                Selected event: <span className="font-medium text-slate-700">{selectedEvent.name}</span>
              </p>
            )}
            {selectedEventId && eventTicketClasses.length === 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Event này chưa có ticket class. Hãy tạo ticket class trong Events trước khi apply layout.
              </div>
            )}
            {usedTicketKeys.map((key) => (
              <div key={key} className="grid grid-cols-[140px_1fr] items-center gap-3 rounded-md border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-800">{key}</p>
                  <p className="text-xs text-slate-500">layout key</p>
                </div>
                <select
                  value={mappings[key] || ''}
                  onChange={(event) => setMappings((current) => ({ ...current, [key]: event.target.value }))}
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="">Ticket class</option>
                  {eventTicketClasses.map((ticketClass) => (
                    <option key={ticketClass.id} value={ticketClass.id}>
                      {ticketClass.name} - {formatMoney(Number(ticketClass.price))}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {missingMappings.length > 0 && (
              <p className="text-xs text-red-600">Missing mappings: {missingMappings.join(', ')}</p>
            )}
            <Button
              onClick={submitApply}
              disabled={!selectedEventId || eventTicketClasses.length === 0 || missingMappings.length > 0}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Apply layout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
