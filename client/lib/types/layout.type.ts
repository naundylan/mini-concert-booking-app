export type LayoutStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface LayoutCell {
  row: number
  col: number
  previewLabel?: string | null
  ticketClassKey: string
  customPreviewLabel?: boolean
}

export interface UsedBounds {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
  usedRows: number
  usedCols: number
}

export interface LayoutData {
  workspaceRows: number
  workspaceCols: number
  usedBounds?: UsedBounds | null
  cells: LayoutCell[]
}

export interface SeatLayout {
  id: string
  name: string
  description?: string | null
  venueName?: string | null
  status: LayoutStatus
  workspaceRows: number
  workspaceCols: number
  usedRows: number
  usedCols: number
  seatCount: number
  layoutData: LayoutData
  version: number
  createdAt?: string
  updatedAt?: string
}

export interface LayoutPayload {
  name?: string
  description?: string | null
  venueName?: string | null
  layoutData?: LayoutData
}

export interface LayoutPageMeta {
  page: number
  size: number
  total: number
  pages: number
  sort?: string
}

export interface LayoutPageResponse {
  data: SeatLayout[]
  meta: LayoutPageMeta
}

export interface LayoutApplyPayload {
  ticketClassMappings: Array<{
    ticketClassKey: string
    ticketClassId: string
  }>
}
