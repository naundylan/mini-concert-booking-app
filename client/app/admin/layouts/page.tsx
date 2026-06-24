'use client'

import { type CSSProperties, type FormEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Rect, Shape, Stage, Text } from 'react-konva'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { eventService } from '@/lib/services/event.service'
import { layoutService } from '@/lib/services/layout.service'
import { type Event, type TicketClass } from '@/lib/types/event.type'
import {
  type LayoutCell,
  type LayoutData,
  type LayoutDecoration,
  type LayoutStatus,
  type LayoutTemplateType,
  type SeatLayout,
} from '@/lib/types/layout.type'
import {
  Archive,
  Brush,
  ChevronDown,
  Copy,
  Eraser,
  Info,
  Loader2,
  Maximize2,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Square,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

const CELL_SIZE = 30
const WORKSPACE_BLOCK_SIZE = 50
const DEFAULT_WORKSPACE = WORKSPACE_BLOCK_SIZE
const MAX_HISTORY = 50
const STANDARD_CLASS = { key: 'standard', name: 'Standard', color: '#2563eb' }
const SEAT_COUNT_PRESETS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
]
const CLASS_COLORS = ['#4f46e5', '#16a34a', '#eab308', '#dc2626', '#0891b2', '#9333ea', '#ea580c']

const TEMPLATE_OPTIONS: Array<{ value: LayoutTemplateType; label: string; description: string }> = [
  {
    value: 'HALL_RECTANGLE',
    label: 'Hall rectangle',
    description: 'One rectangular seating area with simple aisles and a stage at the top.',
  },
  {
    value: 'STADIUM_ELLIPSE',
    label: 'Stadium ellipse',
    description: 'Large elliptical bowl layout, available for 500 seats and above.',
  },
  {
    value: 'COUNTDOWN_CROSS',
    label: 'Countdown cross',
    description: 'Four audience zones around a central stage.',
  },
]

type Tool = 'paint' | 'erase' | 'pan'
type DrawMode = 'line' | 'rectangle'

type CellCoord = {
  row: number
  col: number
}

type DraftState = {
  name: string
  description: string
  venueName: string
  templateType?: LayoutTemplateType | null
  workspaceRows: number
  workspaceCols: number
  cells: LayoutCell[]
  decorations: LayoutDecoration[]
}

type StageState = {
  x: number
  y: number
  scale: number
}

type TemplateClass = {
  key: string
  name: string
  color: string
}

type MissingTicketClassForm = {
  name: string
  colorCode: string
  price: string
}

type GeneratedTemplate = {
  workspaceRows: number
  workspaceCols: number
  cells: LayoutCell[]
  decorations: LayoutDecoration[]
}

const defaultDraft = (): DraftState => ({
  name: 'New layout',
  description: '',
  venueName: '',
  templateType: null,
  workspaceRows: DEFAULT_WORKSPACE,
  workspaceCols: DEFAULT_WORKSPACE,
  cells: [],
  decorations: [],
})

const classesFromCells = (cells: LayoutCell[]) => {
  const keys = Array.from(new Set(cells.map((cell) => cell.ticketClassKey))).sort()
  return keys.map((key, index) => ({
    key,
    name: key === STANDARD_CLASS.key ? STANDARD_CLASS.name : key.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    color: key === STANDARD_CLASS.key ? STANDARD_CLASS.color : CLASS_COLORS[index % CLASS_COLORS.length],
  }))
}

const roundUpToBlock = (value: number) =>
  Math.max(WORKSPACE_BLOCK_SIZE, Math.ceil(value / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE)

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
    templateType: draft.templateType ?? null,
    usedBounds: calculateBounds(cells),
    cells,
    decorations: draft.decorations || [],
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

const formatTicketClassName = (key: string) =>
  key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => (part.length <= 4 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ')

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const createStandardCell = (row: number, col: number): LayoutCell => ({
  row,
  col,
  ticketClassKey: STANDARD_CLASS.key,
  customPreviewLabel: false,
})

const makeStageDecoration = (
  templateType: LayoutTemplateType,
  row: number,
  col: number,
  rowSpan: number,
  colSpan: number,
  shape: LayoutDecoration['shape'] = 'rect'
): LayoutDecoration => ({
  id: `${templateType.toLowerCase()}-stage`,
  type: 'stage',
  label: templateType === 'COUNTDOWN_CROSS' ? 'Center stage' : 'Stage / Screen',
  row,
  col,
  rowSpan,
  colSpan,
  shape,
})

const takeUniqueCells = (candidates: CellCoord[], seatCount: number) => {
  const seen = new Set<string>()
  const cells: LayoutCell[] = []
  for (const candidate of candidates) {
    const key = makeKey(candidate.row, candidate.col)
    if (seen.has(key)) continue
    seen.add(key)
    cells.push(createStandardCell(candidate.row, candidate.col))
    if (cells.length === seatCount) break
  }
  return cells
}

const generateHallRectangle = (seatCount: number): GeneratedTemplate => {
  const sectionCount = seatCount >= 800 ? 3 : seatCount >= 300 ? 2 : 1
  const aisleWidth = 2
  const paddingTop = 8
  const paddingLeft = 6
  const seatsPerRowTarget = Math.ceil(Math.sqrt(seatCount * 1.6))
  const sectionWidth = Math.max(8, Math.ceil(seatsPerRowTarget / sectionCount))
  const seatsPerRow = sectionCount * sectionWidth
  const visualCols = seatsPerRow + (sectionCount - 1) * aisleWidth
  const rows = Math.ceil(seatCount / seatsPerRow)
  const stageWidth = Math.min(Math.max(12, Math.floor(visualCols * 0.45)), visualCols)
  const stageCol = paddingLeft + Math.floor((visualCols - stageWidth) / 2)
  const candidates: CellCoord[] = []

  for (let row = 0; row < rows && candidates.length < seatCount; row += 1) {
    for (let section = 0; section < sectionCount && candidates.length < seatCount; section += 1) {
      const sectionStartCol = paddingLeft + section * (sectionWidth + aisleWidth)
      for (let seatInSection = 0; seatInSection < sectionWidth && candidates.length < seatCount; seatInSection += 1) {
        candidates.push({ row: paddingTop + row, col: sectionStartCol + seatInSection })
      }
    }
  }

  const workspaceRows = roundUpToBlock(paddingTop + rows + 6)
  const workspaceCols = roundUpToBlock(paddingLeft * 2 + visualCols)
  return {
    workspaceRows,
    workspaceCols,
    cells: candidates.map((cell) => createStandardCell(cell.row, cell.col)),
    decorations: [makeStageDecoration('HALL_RECTANGLE', 2, stageCol, 3, stageWidth)],
  }
}

const generateStadiumEllipse = (seatCount: number): GeneratedTemplate => {
  let radiusRow = Math.max(22, Math.ceil(Math.sqrt(seatCount) * 0.9))
  let radiusCol = Math.max(34, Math.ceil(Math.sqrt(seatCount) * 1.45))
  const padding = 8
  let candidates: Array<CellCoord & { score: number; angleScore: number }> = []

  while (candidates.length < seatCount) {
    candidates = []
    const centerRow = padding + radiusRow
    const centerCol = padding + radiusCol
    const stageRowSpan = Math.max(6, Math.floor(radiusRow * 0.34))
    const stageColSpan = Math.max(12, Math.floor(radiusCol * 0.42))
    const stageRow = centerRow - Math.floor(stageRowSpan / 2)
    const stageCol = centerCol - Math.floor(stageColSpan / 2)
    const innerRadiusRow = Math.max(stageRowSpan / 2 + 2, radiusRow * 0.34)
    const innerRadiusCol = Math.max(stageColSpan / 2 + 2, radiusCol * 0.34)

    for (let row = centerRow - radiusRow; row <= centerRow + radiusRow; row += 1) {
      for (let col = centerCol - radiusCol; col <= centerCol + radiusCol; col += 1) {
        const normalizedRow = (row - centerRow) / radiusRow
        const normalizedCol = (col - centerCol) / radiusCol
        const inEllipse = normalizedRow * normalizedRow + normalizedCol * normalizedCol <= 1
        const innerNormalizedRow = (row - centerRow) / innerRadiusRow
        const innerNormalizedCol = (col - centerCol) / innerRadiusCol
        const inInnerVoid = innerNormalizedRow * innerNormalizedRow + innerNormalizedCol * innerNormalizedCol <= 1
        const inStage =
          row >= stageRow &&
          row < stageRow + stageRowSpan &&
          col >= stageCol &&
          col < stageCol + stageColSpan
        if (inEllipse && !inInnerVoid && !inStage) {
          candidates.push({
            row,
            col,
            score: normalizedRow * normalizedRow + normalizedCol * normalizedCol,
            angleScore: Math.atan2(normalizedRow, normalizedCol),
          })
        }
      }
    }

    if (candidates.length < seatCount) {
      radiusRow += 3
      radiusCol += 5
    }
  }

  const centerRow = padding + radiusRow
  const centerCol = padding + radiusCol
  const stageRowSpan = Math.max(6, Math.floor(radiusRow * 0.34))
  const stageColSpan = Math.max(12, Math.floor(radiusCol * 0.42))
  const stageRow = centerRow - Math.floor(stageRowSpan / 2)
  const stageCol = centerCol - Math.floor(stageColSpan / 2)
  const workspaceRows = roundUpToBlock(centerRow + radiusRow + padding)
  const workspaceCols = roundUpToBlock(centerCol + radiusCol + padding)
  candidates.sort((left, right) => left.score - right.score || left.angleScore - right.angleScore)

  return {
    workspaceRows,
    workspaceCols,
    cells: takeUniqueCells(candidates, seatCount),
    decorations: [
      makeStageDecoration('STADIUM_ELLIPSE', stageRow, stageCol, stageRowSpan, stageColSpan, 'ellipse'),
    ],
  }
}

const generateCountdownCross = (seatCount: number): GeneratedTemplate => {
  const perArm = Math.floor(seatCount / 4)
  const remainder = seatCount % 4
  const armCounts = {
    top: perArm + (remainder > 0 ? 1 : 0),
    right: perArm + (remainder > 1 ? 1 : 0),
    bottom: perArm + (remainder > 2 ? 1 : 0),
    left: perArm,
  }
  const maxArmCount = Math.max(armCounts.top, armCounts.right, armCounts.bottom, armCounts.left)
  const armWidth = Math.max(8, Math.ceil(Math.sqrt(seatCount) * 0.35))
  const maxArmLength = Math.ceil(maxArmCount / armWidth)
  const stageSpan = Math.max(6, Math.ceil(Math.sqrt(seatCount) * 0.16))
  const padding = 8
  const centerRow = padding + maxArmLength + Math.floor(stageSpan / 2)
  const centerCol = padding + maxArmLength + Math.floor(stageSpan / 2)
  const stageRow = centerRow - Math.floor(stageSpan / 2)
  const stageCol = centerCol - Math.floor(stageSpan / 2)
  const offsetStart = -Math.floor((armWidth - 1) / 2)
  const candidates: CellCoord[] = []
  const usedCells = new Set<string>()

  const generateArm = (count: number, direction: 'top' | 'right' | 'bottom' | 'left') => {
    let generated = 0
    for (let distance = 1; generated < count; distance += 1) {
      for (let offsetIndex = 0; offsetIndex < armWidth && generated < count; offsetIndex += 1) {
        const offset = offsetStart + offsetIndex
        let cell: CellCoord
        if (direction === 'top') {
          cell = { row: stageRow - distance, col: centerCol + offset }
        } else if (direction === 'right') {
          cell = { row: centerRow + offset, col: stageCol + stageSpan - 1 + distance }
        } else if (direction === 'bottom') {
          cell = { row: stageRow + stageSpan - 1 + distance, col: centerCol + offset }
        } else {
          cell = { row: centerRow + offset, col: stageCol - distance }
        }
        const key = makeKey(cell.row, cell.col)
        if (!usedCells.has(key)) {
          usedCells.add(key)
          candidates.push(cell)
          generated += 1
        }
      }
    }
  }

  generateArm(armCounts.top, 'top')
  generateArm(armCounts.right, 'right')
  generateArm(armCounts.bottom, 'bottom')
  generateArm(armCounts.left, 'left')

  const workspaceRows = roundUpToBlock(centerRow + maxArmLength + padding)
  const workspaceCols = roundUpToBlock(centerCol + maxArmLength + padding)
  return {
    workspaceRows,
    workspaceCols,
    cells: takeUniqueCells(candidates, seatCount),
    decorations: [
      makeStageDecoration(
        'COUNTDOWN_CROSS',
        stageRow,
        stageCol,
        stageSpan,
        stageSpan,
        'ellipse'
      ),
    ],
  }
}

const generateTemplateLayout = (templateType: LayoutTemplateType, seatCount: number): GeneratedTemplate => {
  if (seatCount < 100 || seatCount > 5000) {
    throw new Error('Template seat count must be between 100 and 5000')
  }
  const safeSeatCount = seatCount
  if (templateType === 'STADIUM_ELLIPSE' && safeSeatCount < 500) {
    throw new Error('Sân vận động ellipse không phù hợp quy mô nhỏ')
  }
  if (templateType === 'HALL_RECTANGLE') return generateHallRectangle(safeSeatCount)
  if (templateType === 'STADIUM_ELLIPSE') return generateStadiumEllipse(safeSeatCount)
  return generateCountdownCross(safeSeatCount)
}

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
  const [drawMode, setDrawMode] = useState<DrawMode>('rectangle')
  const [ticketClasses, setTicketClasses] = useState<TemplateClass[]>([STANDARD_CLASS])
  const [selectedKey, setSelectedKey] = useState(STANDARD_CLASS.key)
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [classForm, setClassForm] = useState<TemplateClass>({ key: '', name: '', color: '#2563eb' })
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateForm, setTemplateForm] = useState<{ templateType: LayoutTemplateType; seatCount: number }>({
    templateType: 'HALL_RECTANGLE',
    seatCount: 500,
  })
  const [history, setHistory] = useState<DraftState[]>([defaultDraft()])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isPainting, setIsPainting] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [stageState, setStageState] = useState<StageState>({ x: 24, y: 24, scale: 1 })
  const [viewport, setViewport] = useState({ width: 900, height: 560 })
  const [applyLayout, setApplyLayout] = useState<SeatLayout | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [eventTicketClasses, setEventTicketClasses] = useState<TicketClass[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [missingClassForms, setMissingClassForms] = useState<Record<string, MissingTicketClassForm>>({})
  const [creatingTicketClassKey, setCreatingTicketClassKey] = useState<string | null>(null)
  const [dragStartCell, setDragStartCell] = useState<CellCoord | null>(null)
  const [dragEndCell, setDragEndCell] = useState<CellCoord | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<SeatLayout | null>(null)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [layoutListWidth, setLayoutListWidth] = useState(340)
  const [isResizingList, setIsResizingList] = useState(false)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const toolboxRef = useRef<HTMLDivElement>(null)
  const dragPointerRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const autoPanFrameRef = useRef<number | null>(null)
  const stageStateRef = useRef<StageState>(stageState)

  const readOnly = selectedLayout?.status === 'PUBLISHED' || selectedLayout?.status === 'ARCHIVED'

  useEffect(() => {
    stageStateRef.current = stageState
  }, [stageState])

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
  const getCellsForDrag = (start: CellCoord, end: CellCoord, mode: DrawMode) => {
    const safeStart = start
    const safeEnd = end
    const cells: CellCoord[] = []

    if (mode === 'line') {
      const rowDelta = Math.abs(safeEnd.row - safeStart.row)
      const colDelta = Math.abs(safeEnd.col - safeStart.col)
      if (colDelta >= rowDelta) {
        const minCol = Math.min(safeStart.col, safeEnd.col)
        const maxCol = Math.max(safeStart.col, safeEnd.col)
        for (let col = minCol; col <= maxCol; col += 1) cells.push({ row: safeStart.row, col })
      } else {
        const minRow = Math.min(safeStart.row, safeEnd.row)
        const maxRow = Math.max(safeStart.row, safeEnd.row)
        for (let row = minRow; row <= maxRow; row += 1) cells.push({ row, col: safeStart.col })
      }
      return cells
    }

    const minRow = Math.min(safeStart.row, safeEnd.row)
    const maxRow = Math.max(safeStart.row, safeEnd.row)
    const minCol = Math.min(safeStart.col, safeEnd.col)
    const maxCol = Math.max(safeStart.col, safeEnd.col)
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        cells.push({ row, col })
      }
    }
    return cells
  }

  const previewCells = useMemo(() => {
    if (!isPainting || !dragStartCell || !dragEndCell || tool === 'pan') return []
    return getCellsForDrag(dragStartCell, dragEndCell, drawMode)
  }, [dragStartCell, dragEndCell, drawMode, isPainting, tool, draft.workspaceRows, draft.workspaceCols])

  const previewBounds = useMemo(() => {
    if (previewCells.length === 0) return null
    const rows = previewCells.map((cell) => cell.row)
    const cols = previewCells.map((cell) => cell.col)
    const minRow = Math.min(...rows)
    const maxRow = Math.max(...rows)
    const minCol = Math.min(...cols)
    const maxCol = Math.max(...cols)
    return { minRow, maxRow, minCol, maxCol }
  }, [previewCells])

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
    const handler = (event: MouseEvent) => {
      if (!toolboxRef.current) return
      if (!toolboxRef.current.contains(event.target as Node)) setToolboxOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!isResizingList) return
    const handleMove = (event: MouseEvent) => {
      setLayoutListWidth((current) => clamp(current + event.movementX, 260, 520))
    }
    const handleUp = () => setIsResizingList(false)
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isResizingList])

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

  const cancelDrag = () => {
    setIsPainting(false)
    setIsPanning(false)
    setDragStartCell(null)
    setDragEndCell(null)
    dragPointerRef.current = null
    if (autoPanFrameRef.current !== null) {
      window.cancelAnimationFrame(autoPanFrameRef.current)
      autoPanFrameRef.current = null
    }
  }

  const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
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
      if ((event.ctrlKey || event.shiftKey) && !event.altKey && !event.metaKey && !isTypingTarget(event.target)) {
        const key = event.key.toLowerCase()
        if (key === 'v') {
          event.preventDefault()
          cancelDrag()
          setTool('paint')
        }
        if (key === 'f') {
          event.preventDefault()
          cancelDrag()
          setTool('erase')
        }
        if (key === 'b') {
          event.preventDefault()
          cancelDrag()
          setTool('pan')
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [history, historyIndex])

  useEffect(() => {
    setIsPanning(false)
  }, [tool])

  const openLayout = (layout: SeatLayout) => {
    const nextDraft = {
      name: layout.name,
      description: layout.description || '',
      venueName: layout.venueName || '',
      templateType: layout.layoutData?.templateType || null,
      workspaceRows: layout.workspaceRows || DEFAULT_WORKSPACE,
      workspaceCols: layout.workspaceCols || DEFAULT_WORKSPACE,
      cells: layout.layoutData?.cells || [],
      decorations: layout.layoutData?.decorations || [],
    }
    const localDraft = localStorage.getItem(`layout-draft:${layout.id}`)
    if (layout.status === 'DRAFT' && localDraft && window.confirm('Có bản nháp local. Khôi phục bản nháp này?')) {
      const parsed = { ...defaultDraft(), ...(JSON.parse(localDraft) as DraftState) }
      parsed.decorations = parsed.decorations || []
      parsed.templateType = parsed.templateType || null
      setDraft(parsed)
      setHistory([parsed])
      const restoredClasses = classesFromCells(parsed.cells)
      setTicketClasses(restoredClasses)
      setSelectedKey(restoredClasses[0]?.key || '')
    } else {
      setDraft(nextDraft)
      setHistory([nextDraft])
      const restoredClasses = classesFromCells(nextDraft.cells)
      setTicketClasses(restoredClasses)
      setSelectedKey(restoredClasses[0]?.key || '')
    }
    setSelectedLayout(layout)
    setHistoryIndex(0)
    setHasUnsavedChanges(false)
    setStageState({ x: 24, y: 24, scale: 1 })
  }

  const newLayout = () => {
    const localDraft = localStorage.getItem('layout-draft:new')
    const nextDraft = localDraft && window.confirm('Có bản nháp local chưa lưu. Khôi phục?')
      ? { ...defaultDraft(), ...(JSON.parse(localDraft) as DraftState) }
      : defaultDraft()
    nextDraft.decorations = nextDraft.decorations || []
    nextDraft.templateType = nextDraft.templateType || null
    setSelectedLayout(null)
    setDraft(nextDraft)
    setHistory([nextDraft])
    setHistoryIndex(0)
    const restoredClasses = classesFromCells(nextDraft.cells)
    if (restoredClasses.length === 0) {
      setTicketClasses([STANDARD_CLASS])
      setSelectedKey(STANDARD_CLASS.key)
    } else {
      setTicketClasses(restoredClasses)
      setSelectedKey(restoredClasses[0].key)
    }
    setHasUnsavedChanges(false)
  }

  const applyTemplateGeneration = () => {
    if (readOnly) return
    try {
      const generated = generateTemplateLayout(templateForm.templateType, templateForm.seatCount)
      const nextDraft: DraftState = {
        ...draft,
        templateType: templateForm.templateType,
        workspaceRows: generated.workspaceRows,
        workspaceCols: generated.workspaceCols,
        cells: generated.cells,
        decorations: generated.decorations,
      }
      setDraftWithHistory(nextDraft)
      setTicketClasses((current) => {
        if (current.some((ticketClass) => ticketClass.key === STANDARD_CLASS.key)) return current
        return [STANDARD_CLASS, ...current]
      })
      setSelectedKey(STANDARD_CLASS.key)
      setTool('paint')
      setTemplateDialogOpen(false)
      setStageState({ x: 24, y: 24, scale: 1 })
      toast({ title: 'Generated', description: `Generated ${generated.cells.length} standard seats.` })
    } catch (error) {
      toast({ title: 'Invalid template', description: error instanceof Error ? error.message : 'Cannot generate template', variant: 'destructive' })
    }
  }

  const applyCells = (cells: CellCoord[]) => {
    if (readOnly || tool === 'pan') return draft
    if (tool === 'paint' && !selectedKey) return draft
    const { draft: expandedDraft, cells: normalizedCells } = expandDraftToIncludeCells(draft, cells)
    const nextCells = new Map(expandedDraft.cells.map((cell) => [makeKey(cell.row, cell.col), cell]))
    normalizedCells.forEach((cell) => {
      const key = makeKey(cell.row, cell.col)
      if (tool === 'erase') {
        nextCells.delete(key)
      } else {
        nextCells.set(key, { row: cell.row, col: cell.col, ticketClassKey: selectedKey, customPreviewLabel: false })
      }
    })
    const nextDraft = { ...expandedDraft, cells: Array.from(nextCells.values()) }
    return tool === 'erase' ? trimEmptyWorkspaceBlocks(nextDraft) : nextDraft
  }

  const commitPaint = () => {
    if (dragStartCell && dragEndCell && tool !== 'pan') {
      const changedCells = getCellsForDrag(dragStartCell, dragEndCell, drawMode)
      const nextDraft = applyCells(changedCells)
      if (nextDraft !== draft) {
        setDraft(nextDraft)
        setHasUnsavedChanges(true)
        pushHistory(nextDraft)
      }
    }
    setIsPainting(false)
    setDragStartCell(null)
    setDragEndCell(null)
    dragPointerRef.current = null
    if (autoPanFrameRef.current !== null) {
      window.cancelAnimationFrame(autoPanFrameRef.current)
      autoPanFrameRef.current = null
    }
  }

  const clientPointToCell = (clientX: number, clientY: number, state = stageStateRef.current) => {
    const rect = canvasWrapRef.current?.getBoundingClientRect()
    if (!rect) return null
    const x = (clientX - rect.left - state.x) / state.scale
    const y = (clientY - rect.top - state.y) / state.scale
    return { row: Math.floor(y / CELL_SIZE), col: Math.floor(x / CELL_SIZE) }
  }

  const updateDragPointer = (clientX: number, clientY: number) => {
    dragPointerRef.current = { clientX, clientY }
    const cell = clientPointToCell(clientX, clientY)
    if (!cell) return
    setDragEndCell(ensureWorkspaceForCell(cell))
  }

  const getAutoPanVelocity = () => {
    const pointer = dragPointerRef.current
    const rect = canvasWrapRef.current?.getBoundingClientRect()
    if (!pointer || !rect) return { x: 0, y: 0 }
    const threshold = 48
    const maxSpeed = 18
    const minSpeed = 4
    const leftDistance = pointer.clientX - rect.left
    const rightDistance = rect.right - pointer.clientX
    const topDistance = pointer.clientY - rect.top
    const bottomDistance = rect.bottom - pointer.clientY
    const speedFor = (distance: number) =>
      distance < threshold ? minSpeed + ((threshold - Math.max(0, distance)) / threshold) * (maxSpeed - minSpeed) : 0

    return {
      x: speedFor(leftDistance) - speedFor(rightDistance),
      y: speedFor(topDistance) - speedFor(bottomDistance),
    }
  }

  useEffect(() => {
    if (!isPainting || tool === 'pan') return

    const handleMouseMove = (event: MouseEvent) => {
      updateDragPointer(event.clientX, event.clientY)
    }

    const handleMouseUp = () => {
      commitPaint()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPainting, tool, stageState, draft, dragStartCell, dragEndCell, drawMode, selectedKey, readOnly])

  useEffect(() => {
    if (!isPainting || tool === 'pan') return

    const tick = () => {
      const velocity = getAutoPanVelocity()
      const pointer = dragPointerRef.current

      if ((velocity.x !== 0 || velocity.y !== 0) && pointer) {
        const current = stageStateRef.current
        const nextStage = { ...current, x: current.x + velocity.x, y: current.y + velocity.y }
        stageStateRef.current = nextStage
        setStageState(nextStage)
        const nextCell = clientPointToCell(pointer.clientX, pointer.clientY, nextStage)
        if (nextCell) setDragEndCell(ensureWorkspaceForCell(nextCell))
      }

      autoPanFrameRef.current = window.requestAnimationFrame(tick)
    }

    autoPanFrameRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (autoPanFrameRef.current !== null) {
        window.cancelAnimationFrame(autoPanFrameRef.current)
        autoPanFrameRef.current = null
      }
    }
  }, [isPainting, tool, draft, stageState, selectedKey, readOnly])

  const trimEmptyWorkspaceBlocks = (nextDraft: DraftState) => {
    if (nextDraft.cells.length === 0) {
      return { ...nextDraft, workspaceRows: WORKSPACE_BLOCK_SIZE, workspaceCols: WORKSPACE_BLOCK_SIZE }
    }
    const nextBounds = calculateBounds(nextDraft.cells)
    const removeTop = Math.floor(nextBounds.minRow / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE
    const removeLeft = Math.floor(nextBounds.minCol / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE
    const shiftedCells = nextDraft.cells.map((cell) => ({
      ...cell,
      row: cell.row - removeTop,
      col: cell.col - removeLeft,
    }))
    const shiftedBounds = calculateBounds(shiftedCells)
    const workspaceRows = roundUpToBlock(shiftedBounds.maxRow + 1)
    const workspaceCols = roundUpToBlock(shiftedBounds.maxCol + 1)
    if (removeTop > 0 || removeLeft > 0) {
      setStageState((current) => ({
        ...current,
        x: current.x + removeLeft * CELL_SIZE * current.scale,
        y: current.y + removeTop * CELL_SIZE * current.scale,
      }))
    }
    return { ...nextDraft, workspaceRows, workspaceCols, cells: shiftedCells }
  }

  const expandDraftToIncludeCells = (baseDraft: DraftState, targetCells: CellCoord[]) => {
    if (targetCells.length === 0) return { draft: baseDraft, cells: targetCells }
    const minRow = Math.min(...targetCells.map((cell) => cell.row), 0)
    const minCol = Math.min(...targetCells.map((cell) => cell.col), 0)
    const maxRow = Math.max(...targetCells.map((cell) => cell.row), baseDraft.workspaceRows - 1)
    const maxCol = Math.max(...targetCells.map((cell) => cell.col), baseDraft.workspaceCols - 1)
    const addTop = minRow < 0 ? Math.ceil(Math.abs(minRow) / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE : 0
    const addLeft = minCol < 0 ? Math.ceil(Math.abs(minCol) / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE : 0
    const adjustedMaxRow = maxRow + addTop
    const adjustedMaxCol = maxCol + addLeft
    const workspaceRows = roundUpToBlock(adjustedMaxRow + 1)
    const workspaceCols = roundUpToBlock(adjustedMaxCol + 1)
    const shouldShift = addTop > 0 || addLeft > 0

    if (shouldShift) {
      setStageState((current) => ({
        ...current,
        x: current.x - addLeft * CELL_SIZE * current.scale,
        y: current.y - addTop * CELL_SIZE * current.scale,
      }))
    }

    return {
      draft: {
        ...baseDraft,
        workspaceRows,
        workspaceCols,
        cells: baseDraft.cells.map((cell) => ({ ...cell, row: cell.row + addTop, col: cell.col + addLeft })),
      },
      cells: targetCells.map((cell) => ({ row: cell.row + addTop, col: cell.col + addLeft })),
    }
  }

  const ensureWorkspaceForCell = (cell: CellCoord) => {
    let addTop = 0
    let addLeft = 0
    let addBottom = 0
    let addRight = 0

    if (cell.row < 0) addTop = Math.ceil(Math.abs(cell.row) / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE
    if (cell.col < 0) addLeft = Math.ceil(Math.abs(cell.col) / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE

    const adjustedRow = cell.row + addTop
    const adjustedCol = cell.col + addLeft
    if (adjustedRow >= draft.workspaceRows) {
      addBottom = Math.ceil((adjustedRow - draft.workspaceRows + 1) / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE
    }
    if (adjustedCol >= draft.workspaceCols) {
      addRight = Math.ceil((adjustedCol - draft.workspaceCols + 1) / WORKSPACE_BLOCK_SIZE) * WORKSPACE_BLOCK_SIZE
    }

    if (addTop || addLeft || addBottom || addRight) {
      const nextDraft = {
        ...draft,
        workspaceRows: draft.workspaceRows + addTop + addBottom,
        workspaceCols: draft.workspaceCols + addLeft + addRight,
        cells: draft.cells.map((paintedCell) => ({
          ...paintedCell,
          row: paintedCell.row + addTop,
          col: paintedCell.col + addLeft,
        })),
      }
      setDraft(nextDraft)
      setHasUnsavedChanges(true)
      if (addTop || addLeft) {
        setDragStartCell((current) => current && ({ row: current.row + addTop, col: current.col + addLeft }))
        setDragEndCell((current) => current && ({ row: current.row + addTop, col: current.col + addLeft }))
        setStageState((current) => ({
          ...current,
          x: current.x - addLeft * CELL_SIZE * current.scale,
          y: current.y - addTop * CELL_SIZE * current.scale,
        }))
      }
    }

    return { row: adjustedRow, col: adjustedCol }
  }

  const resetView = () => setStageState({ x: 24, y: 24, scale: 1 })

  const zoomBy = (factor: number) => {
    setStageState((current) => ({ ...current, scale: Math.min(2.5, Math.max(0.35, current.scale * factor)) }))
  }

  const zoomAtPointer = (stage: any, deltaY: number) => {
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const scaleBy = 1.06
    const oldScale = stageState.scale
    const nextScale = Math.min(2.5, Math.max(0.35, deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy))
    const mousePointTo = {
      x: (pointer.x - stageState.x) / oldScale,
      y: (pointer.y - stageState.y) / oldScale,
    }
    setStageState({
      scale: nextScale,
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale,
    })
  }

  const fitToSeats = () => {
    if (draft.cells.length === 0) {
      resetView()
      return
    }
    const padding = 96
    const scaleX = (viewport.width - padding) / Math.max(bounds.usedCols * CELL_SIZE, CELL_SIZE)
    const scaleY = (viewport.height - padding) / Math.max(bounds.usedRows * CELL_SIZE, CELL_SIZE)
    const nextScale = Math.min(2.2, Math.max(0.45, Math.min(scaleX, scaleY)))
    const contentWidth = bounds.usedCols * CELL_SIZE * nextScale
    const contentHeight = bounds.usedRows * CELL_SIZE * nextScale
    setStageState({
      scale: nextScale,
      x: (viewport.width - contentWidth) / 2 - bounds.minCol * CELL_SIZE * nextScale,
      y: (viewport.height - contentHeight) / 2 - bounds.minRow * CELL_SIZE * nextScale,
    })
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
    try {
      await layoutService.archive(layout.id)
      if (selectedLayout?.id === layout.id) setSelectedLayout(null)
      setArchiveTarget(null)
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
    setMissingClassForms({})
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
    setMissingClassForms({})
    if (!eventId) {
      setEventTicketClasses([])
      return
    }
    try {
      const response = await eventService.adminGetTicketClasses(eventId)
      const existingClasses = response.data
      const classesByName = new Map(existingClasses.map((ticketClass) => [ticketClass.name.trim().toLowerCase(), ticketClass]))
      const nextMappings: Record<string, string> = {}
      const nextMissingForms: Record<string, MissingTicketClassForm> = {}

      usedTicketKeys.forEach((key) => {
        const formattedName = formatTicketClassName(key)
        const existingClass = classesByName.get(formattedName.toLowerCase())
        if (existingClass) {
          nextMappings[key] = existingClass.id
          return
        }
        const templateClass = ticketClassByKey.get(key)
        nextMissingForms[key] = {
          name: formattedName,
          colorCode: templateClass?.color || '#4f46e5',
          price: '',
        }
      })

      setEventTicketClasses(existingClasses)
      setMappings(nextMappings)
      setMissingClassForms(nextMissingForms)
    } catch (error) {
      toast({ title: 'Error', description: 'Không tải được ticket classes', variant: 'destructive' })
    }
  }

  const createAndMapTicketClass = async (key: string) => {
    if (!selectedEventId) return
    const form = missingClassForms[key]
    if (!form?.name.trim() || !form.price || Number(form.price) < 0) {
      toast({ title: 'Missing data', description: 'Enter ticket class name and valid price.', variant: 'destructive' })
      return
    }

    try {
      setCreatingTicketClassKey(key)
      const created = await eventService.adminCreateTicketClass(selectedEventId, {
        name: form.name.trim(),
        colorCode: form.colorCode || null,
        price: Number(form.price),
      })
      setEventTicketClasses((current) => [...current, created.data])
      setMappings((current) => ({ ...current, [key]: created.data.id }))
      setMissingClassForms((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
      toast({ title: 'Created', description: `${created.data.name} created and mapped.` })
    } catch (error) {
      toast({ title: 'Error', description: getErrorMessage(error, 'KhÃ´ng táº¡o Ä‘Æ°á»£c ticket class'), variant: 'destructive' })
    } finally {
      setCreatingTicketClassKey(null)
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

  const submitTemplateClass = (event: FormEvent) => {
    event.preventDefault()
    const key = classForm.key.trim().toLowerCase()
    const name = classForm.name.trim()
    const color = classForm.color.trim() || '#2563eb'
    if (!key || !name) {
      toast({ title: 'Missing data', description: 'Nhập đủ key và tên class.', variant: 'destructive' })
      return
    }
    if (!/^[a-z0-9_-]+$/.test(key)) {
      toast({ title: 'Invalid key', description: 'Key chỉ nên dùng chữ thường, số, dấu gạch ngang hoặc gạch dưới.', variant: 'destructive' })
      return
    }
    if (ticketClasses.some((ticketClass) => ticketClass.key === key)) {
      toast({ title: 'Duplicate key', description: 'Template class key đã tồn tại.', variant: 'destructive' })
      return
    }
    setTicketClasses((current) => [...current, { key, name, color }])
    setSelectedKey(key)
    setTool('paint')
    setClassDialogOpen(false)
    setClassForm({ key: '', name: '', color: '#2563eb' })
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault()
    fetchLayouts(0)
  }

  return (
    <div
      className="grid min-h-[calc(100vh-5.5rem)] grid-cols-1 gap-4 bg-slate-100 p-1 xl:h-[calc(100vh-6rem)] xl:grid-cols-[minmax(260px,var(--layout-list-width))_8px_minmax(0,1fr)] xl:gap-0"
      style={{ '--layout-list-width': `${layoutListWidth}px` } as CSSProperties}
    >
      <aside className="flex max-h-[420px] min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm xl:max-h-none">
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
          ) : layouts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <p className="font-medium text-slate-800">No layouts yet</p>
              <p className="mt-1 text-xs text-slate-500">Create a reusable layout template to start drawing seats.</p>
              <Button size="sm" onClick={newLayout} className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700">
                <Plus size={15} className="mr-2" />
                New layout
              </Button>
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
                    {layout.seatCount} seats - {layout.usedRows}x{layout.usedCols} used
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

      <div
        className="hidden cursor-col-resize items-stretch justify-center xl:flex"
        onMouseDown={() => setIsResizingList(true)}
        title="Resize layout list"
      >
        <div className="my-3 w-px rounded-full bg-slate-300 transition-colors hover:bg-indigo-400" />
      </div>

      <main className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
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
          <div className="flex flex-wrap gap-2">
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
                <Button variant="outline" size="sm" onClick={() => setArchiveTarget(selectedLayout)}>
                  <Archive size={15} className="mr-2" />
                  Archive
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <div ref={toolboxRef} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setToolboxOpen((current) => !current)}
                className="gap-2"
              >
                <SlidersHorizontal size={15} />
                Tools
                <ChevronDown size={14} className={toolboxOpen ? 'rotate-180 transition' : 'transition'} />
              </Button>
              {toolboxOpen && (
                <div className="absolute left-0 top-11 z-30 w-[min(680px,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="grid gap-4 md:grid-cols-2">
                    <section>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tools</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={tool === 'paint' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            cancelDrag()
                            setTool('paint')
                          }}
                          disabled={readOnly}
                        >
                          <Brush size={15} className="mr-2" />
                          Paint
                        </Button>
                        <Button
                          variant={tool === 'erase' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            cancelDrag()
                            setTool('erase')
                          }}
                          disabled={readOnly}
                        >
                          <Eraser size={15} className="mr-2" />
                          Erase
                        </Button>
                        <Button
                          variant={tool === 'pan' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            cancelDrag()
                            setTool('pan')
                          }}
                        >
                          <MousePointer2 size={15} className="mr-2" />
                          Pan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTemplateDialogOpen(true)}
                          disabled={readOnly}
                        >
                          <Wand2 size={15} className="mr-2" />
                          Generate template
                        </Button>
                      </div>
                    </section>
                    <section>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Draw mode</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant={drawMode === 'line' ? 'default' : 'outline'} size="sm" onClick={() => setDrawMode('line')} disabled={readOnly}>
                          <Minus size={14} className="mr-2" />
                          Line
                        </Button>
                        <Button variant={drawMode === 'rectangle' ? 'default' : 'outline'} size="sm" onClick={() => setDrawMode('rectangle')} disabled={readOnly}>
                          <Square size={14} className="mr-2" />
                          Rect
                        </Button>
                      </div>
                    </section>
                    <section>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Classes</p>
                      <div className="flex flex-wrap gap-2">
                        {ticketClasses.map((ticketClass) => (
                          <button
                            key={ticketClass.key}
                            onClick={() => {
                              if (readOnly) return
                              setSelectedKey(ticketClass.key)
                              setTool('paint')
                            }}
                            disabled={readOnly}
                            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                              selectedKey === ticketClass.key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                            }`}
                          >
                            <span className="h-3 w-3 rounded" style={{ backgroundColor: ticketClass.color }} />
                            {ticketClass.name}
                          </button>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setClassDialogOpen(true)} disabled={readOnly}>
                          <Plus size={15} className="mr-2" />
                          Class
                        </Button>
                      </div>
                    </section>
                    <section>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace</p>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        Workspace grows automatically in 50 x 50 blocks when drawing crosses an edge. Empty outer
                        blocks are removed after erasing their seats.
                      </div>
                    </section>
                  </div>
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <p>Only painted cells become seats. Thick dark borders separate each 50 x 50 workspace block.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge className="bg-slate-100 text-slate-700">{tool}</Badge>
              <Badge className="bg-slate-100 text-slate-700">{drawMode}</Badge>
              <span>{draft.workspaceRows} x {draft.workspaceCols}</span>
              <span>{draft.cells.length} seats</span>
              <span>{(stageState.scale * 100).toFixed(0)}%</span>
              <Badge className={selectedLayout ? statusClass[selectedLayout.status] : statusClass.DRAFT}>
                {selectedLayout?.status || 'DRAFT'}
              </Badge>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => zoomBy(1.15)}>
                <ZoomIn size={14} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => zoomBy(1 / 1.15)}>
                <ZoomOut size={14} />
              </Button>
              <Button variant="outline" size="sm" onClick={fitToSeats}>
                <Maximize2 size={14} className="mr-2" />
                Fit
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100">
          <div className="min-h-0 overflow-x-auto p-3 sm:p-4">
            <div className="min-w-[720px]">
            <div ref={canvasWrapRef} className="h-[calc(100vh-12.5rem)] min-h-[580px] overflow-hidden rounded-xl border border-slate-300 bg-slate-300 shadow-sm">
              <Stage
              width={viewport.width}
              height={viewport.height}
              x={stageState.x}
              y={stageState.y}
              scaleX={stageState.scale}
              scaleY={stageState.scale}
              draggable={tool === 'pan'}
              onDragStart={() => setIsPanning(true)}
              onDragEnd={(event: any) => {
                setIsPanning(false)
                setStageState((current) => ({ ...current, x: event.target.x(), y: event.target.y() }))
              }}
              style={{
                cursor:
                  tool === 'pan'
                    ? isPanning
                      ? 'grabbing'
                      : 'grab'
                    : tool === 'paint'
                    ? 'crosshair'
                    : tool === 'erase'
                    ? 'cell'
                    : 'default',
              }}
              onWheel={(event: any) => {
                event.evt.preventDefault()
                zoomAtPointer(event.target.getStage(), event.evt.deltaY)
              }}
              onMouseDown={(event: any) => {
                if (tool === 'pan' || readOnly) return
                if (tool === 'paint' && !selectedKey) return
                const cell = clientPointToCell(event.evt.clientX, event.evt.clientY)
                if (!cell) return
                const ensuredCell = ensureWorkspaceForCell(cell)
                dragPointerRef.current = { clientX: event.evt.clientX, clientY: event.evt.clientY }
                setIsPainting(true)
                setDragStartCell(ensuredCell)
                setDragEndCell(ensuredCell)
              }}
              onMouseMove={(event: any) => {
                if (!isPainting || tool === 'pan') return
                updateDragPointer(event.evt.clientX, event.evt.clientY)
              }}
            >
              <Layer>
                <Rect
                  x={0}
                  y={0}
                  width={draft.workspaceCols * CELL_SIZE}
                  height={draft.workspaceRows * CELL_SIZE}
                  fill="#cbd5e1"
                  listening={false}
                />
                <Shape
                  sceneFunc={(context: any, shape: any) => {
                    const canvasContext = context._context
                    canvasContext.save()
                    context.beginPath()
                    canvasContext.strokeStyle = '#f8fafc'
                    canvasContext.lineWidth = 1
                    canvasContext.globalAlpha = 0.95
                    for (let row = 0; row <= draft.workspaceRows; row++) {
                      context.moveTo(0, row * CELL_SIZE)
                      context.lineTo(draft.workspaceCols * CELL_SIZE, row * CELL_SIZE)
                    }
                    for (let col = 0; col <= draft.workspaceCols; col++) {
                      context.moveTo(col * CELL_SIZE, 0)
                      context.lineTo(col * CELL_SIZE, draft.workspaceRows * CELL_SIZE)
                    }
                    canvasContext.stroke()
                    context.beginPath()
                    canvasContext.strokeStyle = '#0f172a'
                    canvasContext.lineWidth = 2
                    canvasContext.globalAlpha = 0.85
                    for (let row = 0; row <= draft.workspaceRows; row += WORKSPACE_BLOCK_SIZE) {
                      context.moveTo(0, row * CELL_SIZE)
                      context.lineTo(draft.workspaceCols * CELL_SIZE, row * CELL_SIZE)
                    }
                    for (let col = 0; col <= draft.workspaceCols; col += WORKSPACE_BLOCK_SIZE) {
                      context.moveTo(col * CELL_SIZE, 0)
                      context.lineTo(col * CELL_SIZE, draft.workspaceRows * CELL_SIZE)
                    }
                    canvasContext.stroke()
                    canvasContext.restore()
                  }}
                  listening={false}
                />
                {(draft.decorations || []).map((decoration) => {
                  const x = decoration.col * CELL_SIZE
                  const y = decoration.row * CELL_SIZE
                  const width = decoration.colSpan * CELL_SIZE
                  const height = decoration.rowSpan * CELL_SIZE
                  return (
                    <Fragment key={decoration.id}>
                      <Rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="#111827"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        cornerRadius={decoration.shape === 'ellipse' ? Math.min(width, height) / 2 : 8}
                        opacity={0.88}
                        listening={false}
                      />
                      <Text
                        x={x}
                        y={y + Math.max(4, height / 2 - 8)}
                        width={width}
                        align="center"
                        text={decoration.label}
                        fontSize={12}
                        fontStyle="bold"
                        fill="#f8fafc"
                        listening={false}
                      />
                    </Fragment>
                  )
                })}
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
                {previewBounds && (
                  <Rect
                    x={previewBounds.minCol * CELL_SIZE + 1}
                    y={previewBounds.minRow * CELL_SIZE + 1}
                    width={(previewBounds.maxCol - previewBounds.minCol + 1) * CELL_SIZE - 2}
                    height={(previewBounds.maxRow - previewBounds.minRow + 1) * CELL_SIZE - 2}
                    fill={tool === 'erase' ? '#f97316' : ticketClassByKey.get(selectedKey)?.color || '#4f46e5'}
                    opacity={0.18}
                    stroke={tool === 'erase' ? '#ea580c' : '#4f46e5'}
                    strokeWidth={1}
                    dash={[5, 4]}
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
            </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive layout?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Archive will lock this reusable layout template and move it to ARCHIVED. It does not delete seats already
              applied to events.
            </p>
            {archiveTarget && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{archiveTarget.name}</p>
                <p className="mt-1 text-xs">{archiveTarget.seatCount} seats - {archiveTarget.status}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setArchiveTarget(null)}>
                Cancel
              </Button>
              <Button
                className="bg-amber-600 text-white hover:bg-amber-700"
                onClick={() => archiveTarget && archiveLayout(archiveTarget)}
              >
                <Archive size={15} className="mr-2" />
                Archive
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate from template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {draft.cells.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Generate will replace current seats and existing stage/screen decorations. Use undo if you need to go
                back after generating.
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Template type</label>
              <select
                value={templateForm.templateType}
                onChange={(event) => {
                  const templateType = event.target.value as LayoutTemplateType
                  setTemplateForm((current) => ({
                    templateType,
                    seatCount: templateType === 'STADIUM_ELLIPSE' && current.seatCount < 500 ? 500 : current.seatCount,
                  }))
                }}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
              >
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {TEMPLATE_OPTIONS.find((option) => option.value === templateForm.templateType)?.description}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Seat count preset</label>
              <select
                value={templateForm.seatCount}
                onChange={(event) => setTemplateForm((current) => ({ ...current, seatCount: Number(event.target.value) }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
              >
                {SEAT_COUNT_PRESETS.map((preset) => (
                  <option
                    key={preset}
                    value={preset}
                    disabled={templateForm.templateType === 'STADIUM_ELLIPSE' && preset < 500}
                  >
                    {preset.toLocaleString('vi-VN')} seats
                    {templateForm.templateType === 'STADIUM_ELLIPSE' && preset < 500 ? ' - unavailable for ellipse' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Need an exact odd number? Choose the nearest preset, then paint or erase seats manually.
              </p>
              {templateForm.templateType === 'STADIUM_ELLIPSE' && templateForm.seatCount < 500 && (
                <p className="mt-1 text-xs text-red-600">Sân vận động ellipse không phù hợp quy mô nhỏ.</p>
              )}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Generated seats use the <span className="font-semibold text-slate-900">standard</span> template class.
              You can rename or repaint classes after generation.
            </div>
            <Button
              onClick={applyTemplateGeneration}
              disabled={templateForm.templateType === 'STADIUM_ELLIPSE' && templateForm.seatCount < 500}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Wand2 size={15} className="mr-2" />
              Generate layout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add template class</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitTemplateClass}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Template key</label>
              <Input
                value={classForm.key}
                onChange={(event) => setClassForm((current) => ({ ...current, key: event.target.value }))}
                placeholder="vip, standard, balcony"
              />
              <p className="mt-1 text-xs text-slate-500">
                Key nay se duoc map sang ticket class that cua tung event khi apply layout.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Display name</label>
              <Input
                value={classForm.name}
                onChange={(event) => setClassForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="VIP zone"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={classForm.color}
                  onChange={(event) => setClassForm((current) => ({ ...current, color: event.target.value }))}
                  className="h-10 w-16 p-1"
                />
                <Input
                  value={classForm.color}
                  onChange={(event) => setClassForm((current) => ({ ...current, color: event.target.value }))}
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
              Add template class
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!applyLayout} onOpenChange={(open) => !open && setApplyLayout(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl">
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
              <div key={key} className="rounded-md border border-slate-200 p-3">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[140px_1fr]">
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
                {!mappings[key] && missingClassForms[key] && (
                  <div className="mt-3 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 p-3">
                    <p className="mb-2 text-xs font-medium text-indigo-800">
                      Chưa có ticket class phù hợp. Tạo mới và map cho key này.
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_72px_120px_auto]">
                      <Input
                        value={missingClassForms[key].name}
                        onChange={(event) =>
                          setMissingClassForms((current) => ({
                            ...current,
                            [key]: { ...current[key], name: event.target.value },
                          }))
                        }
                        placeholder="Ticket class name"
                      />
                      <Input
                        type="color"
                        value={missingClassForms[key].colorCode}
                        onChange={(event) =>
                          setMissingClassForms((current) => ({
                            ...current,
                            [key]: { ...current[key], colorCode: event.target.value },
                          }))
                        }
                        className="h-10 p-1"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={missingClassForms[key].price}
                        onChange={(event) =>
                          setMissingClassForms((current) => ({
                            ...current,
                            [key]: { ...current[key], price: event.target.value },
                          }))
                        }
                        placeholder="Price"
                      />
                      <Button
                        size="sm"
                        onClick={() => createAndMapTicketClass(key)}
                        disabled={creatingTicketClassKey === key}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        {creatingTicketClassKey === key && <Loader2 size={14} className="mr-2 animate-spin" />}
                        Create & Map
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {missingMappings.length > 0 && (
              <p className="text-xs text-red-600">Missing mappings: {missingMappings.join(', ')}</p>
            )}
            <Button
              onClick={submitApply}
              disabled={!selectedEventId || missingMappings.length > 0}
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
